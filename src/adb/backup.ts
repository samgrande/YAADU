import type { Adb } from "@yume-chan/adb";
import { LinuxFileType } from "@yume-chan/adb";
import type { AdbSyncEntry } from "@yume-chan/adb";
import { formatBytes } from "./helpers.js";
import type { ZipWriter, BlobWriter } from "@zip.js/zip.js";

export type MediaCategory = "photo" | "video" | "audio" | "other";

export interface BackupEntry {
  name:     string;
  fullPath: string;
  size:     bigint;
  group:    string;
  category: MediaCategory;
}

export interface BackupProgress {
  phase:      "scanning" | "downloading" | "done" | "error";
  current:    number;
  total:      number;
  fileName:   string;
  message:    string;
  savedFiles: SavedFile[];
  bytesDone?: number;
  bytesTotal?: number;
}

export interface SavedFile {
  name:    string;
  size:    bigint;
  status:  "ok" | "error";
  message: string;
}

export const MEDIA_FOLDERS = [
  { path: "/sdcard/DCIM/Camera",             label: "Camera" },
  { path: "/sdcard/DCIM",                    label: "DCIM" },
  { path: "/sdcard/Pictures/Screenshots",    label: "Screenshots" },
  { path: "/sdcard/Pictures",                label: "Pictures" },
  { path: "/sdcard/Movies",                  label: "Movies" },
  { path: "/sdcard/Music",                   label: "Music" },
  { path: "/sdcard/Download",                label: "Download" },
];

const PHOTO_EXTS = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "heic", "heif"];
const VIDEO_EXTS = ["mp4", "mov", "mkv", "avi", "3gp", "webm", "m4v"];
const AUDIO_EXTS = ["mp3", "aac", "wav", "flac", "ogg", "m4a", "wma"];

function detectCategory(name: string): MediaCategory {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  if (PHOTO_EXTS.includes(ext)) return "photo";
  return "other";
}

export async function listMediaFiles(
  adb: Adb,
  remotePath = "/sdcard/DCIM/Camera"
): Promise<BackupEntry[]> {
  const sync = await adb.sync();
  try {
    const entries: AdbSyncEntry[] = await sync.readdir(remotePath);
    return entries
      .filter((e) => e.type === LinuxFileType.File)
      .map((e) => ({
        name:     e.name,
        fullPath: `${remotePath}/${e.name}`,
        size:     e.size,
        group:    remotePath.split("/").pop() ?? "Unknown",
        category: detectCategory(e.name),
      }));
  } finally {
    await sync.dispose();
  }
}

export async function scanMediaFolders(adb: Adb): Promise<BackupEntry[]> {
  const results: BackupEntry[] = [];
  const sync = await adb.sync();
  try {
    for (const folder of MEDIA_FOLDERS) {
      try {
        const dirExists = await sync.isDirectory(folder.path);
        if (!dirExists) continue;
        const entries = await sync.readdir(folder.path);
        for (const e of entries) {
          if (e.type !== LinuxFileType.File) continue;
          results.push({
            name: e.name,
            fullPath: `${folder.path}/${e.name}`,
            size: e.size,
            group: folder.label,
            category: detectCategory(e.name),
          });
        }
      } catch {
        // skip folders that can't be read
      }
    }
  } finally {
    await sync.dispose();
  }
  return results;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function sanitizeDeviceName(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-.]/g, "");
}

export async function checkWhatsAppDir(adb: Adb): Promise<boolean> {
  const sync = await adb.sync();
  try {
    return await sync.isDirectory("/sdcard/Android/media/com.whatsapp/WhatsApp/Media");
  } catch {
    return false;
  } finally {
    await sync.dispose();
  }
}

async function walkDir(sync: Awaited<ReturnType<Adb["sync"]>>, dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await sync.readdir(dir);
  for (const entry of entries) {
    if (entry.type === LinuxFileType.File) {
      results.push(`${dir}/${entry.name}`);
    } else if (entry.type === LinuxFileType.Directory && entry.name !== "." && entry.name !== "..") {
      const sub = await walkDir(sync, `${dir}/${entry.name}`);
      results.push(...sub);
    }
  }
  return results;
}

export async function downloadSingleFile(adb: Adb, entry: BackupEntry): Promise<void> {
  const sync = await adb.sync();
  try {
    // Try streaming directly to disk via File System Access API
    try {
      const fileHandle = await window.showSaveFilePicker({ suggestedName: entry.name });
      const writable = await fileHandle.createWritable();
      const stream = sync.read(entry.fullPath) as unknown as ReadableStream<Uint8Array>;
      await stream.pipeTo(writable);
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    // Fallback: read to buffer and trigger browser download
    const stream = sync.read(entry.fullPath) as unknown as ReadableStream<Uint8Array>;
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) { out.set(c, offset); offset += c.length; }
    triggerBrowserDownload(new Blob([out], { type: "application/octet-stream" }), entry.name);
  } finally {
    await sync.dispose();
  }
}

// ── Streaming helpers ────────────────────────────────────────────────────

let _zipModules: Promise<{ ZipWriter: typeof ZipWriter; BlobWriter: typeof BlobWriter }> | null = null;

function getZipModules(): Promise<{ ZipWriter: typeof ZipWriter; BlobWriter: typeof BlobWriter }> {
  if (!_zipModules) {
    _zipModules = import("@zip.js/zip.js").then((m) => ({
      ZipWriter: m.ZipWriter,
      BlobWriter: m.BlobWriter,
    }));
  }
  return _zipModules;
}

function createByteCounterStream(onBytes: (done: number) => void): TransformStream<Uint8Array, Uint8Array> {
  let bytesDone = 0;
  return new TransformStream({
    transform(chunk, controller) {
      bytesDone += chunk.length;
      onBytes(bytesDone);
      controller.enqueue(chunk);
    },
  });
}

async function streamFileToZip(
  zipWriter: ZipWriter<unknown>,
  sync: Awaited<ReturnType<Adb["sync"]>>,
  fullPath: string,
  name: string,
  onBytes?: (done: number) => void,
): Promise<void> {
  const adbStream = sync.read(fullPath) as unknown as ReadableStream<Uint8Array>;
  if (onBytes) {
    await zipWriter.add(name, adbStream.pipeThrough(createByteCounterStream(onBytes)));
  } else {
    await zipWriter.add(name, adbStream);
  }
}

async function createZipOutput(
  deviceName: string,
  label: string,
  writable?: WritableStream<Uint8Array>,
): Promise<{
  zipWriter: ZipWriter<unknown>;
  finalize: () => Promise<void>;
  cancel: () => Promise<void>;
}> {
  const safeName = sanitizeDeviceName(deviceName);
  const filename = `${safeName}_${label}.zip`;
  const { ZipWriter: ZW, BlobWriter: BW } = await getZipModules();

  if (writable) {
    const zipWriter = new ZW(writable);
    return {
      zipWriter,
      finalize: async () => {
        await zipWriter.close();
        await writable.close();
      },
      cancel: async () => {
        try { await zipWriter.close(); } catch { /* ignore */ }
        try { await writable.abort(); } catch { /* ignore */ }
      },
    };
  }

  const blobWriter = new BW("application/zip");
  const zipWriter = new ZW(blobWriter);
  return {
    zipWriter,
    finalize: async () => {
      await zipWriter.close();
      const blob = await blobWriter.getData();
      triggerBrowserDownload(blob, filename);
    },
    cancel: async () => {
      try { await zipWriter.close(); } catch { /* ignore */ }
    },
  };
}

// ── Backup functions ─────────────────────────────────────────────────────

export async function backupMediaFiles(
  adb: Adb,
  files: BackupEntry[],
  onProgress: (p: BackupProgress) => void,
  signal?: AbortSignal,
  deviceName?: string,
  writable?: WritableStream<Uint8Array>,
): Promise<SavedFile[]> {
  const saved: SavedFile[] = [];
  let sync;
  let output: Awaited<ReturnType<typeof createZipOutput>> | null = null;

  try {
    sync = await adb.sync();
    output = await createZipOutput(deviceName ?? "device", "media_backup", writable);

    for (let i = 0; i < files.length; i++) {
      if (signal?.aborted) break;
      const entry = files[i];
      const totalBytes = Number(entry.size);

      const emitProgress = (bytesDone: number) => {
        onProgress({
          phase: "downloading",
          current: i + 1,
          total: files.length,
          fileName: entry.name,
          message:
            totalBytes > 0
              ? `Streaming ${entry.name} (${formatBytes(BigInt(bytesDone))}/${formatBytes(entry.size)})`
              : `Streaming ${entry.name}`,
          savedFiles: [...saved],
          bytesDone,
          bytesTotal: totalBytes,
        });
      };

      emitProgress(0);

      try {
        await streamFileToZip(output.zipWriter, sync, entry.fullPath, entry.name, emitProgress);
        saved.push({ name: entry.name, size: entry.size, status: "ok", message: "Downloaded" });
      } catch (err) {
        saved.push({ name: entry.name, size: entry.size, status: "error", message: String(err) });
      }

      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    try { await sync?.dispose(); } catch { /* ignore */ }
  }

  if (signal?.aborted) {
    await output?.cancel();
    return saved;
  }

  if (output) {
    await output.finalize();
  }

  onProgress({
    phase: "done",
    current: files.length,
    total: files.length,
    fileName: "",
    message: `Backup complete. ${saved.filter((s) => s.status === "ok").length}/${files.length} files saved.`,
    savedFiles: [...saved],
  });

  return saved;
}

export async function backupWhatsApp(
  adb: Adb,
  onProgress: (p: BackupProgress) => void,
  signal?: AbortSignal,
  deviceName?: string,
  writable?: WritableStream<Uint8Array>,
): Promise<SavedFile[]> {
  const saved: SavedFile[] = [];
  let sync;
  let totalFiles = 0;
  const basePath = "/sdcard/Android/media/com.whatsapp";
  let output: Awaited<ReturnType<typeof createZipOutput>> | null = null;

  try {
    sync = await adb.sync();

    onProgress({
      phase: "scanning",
      current: 0,
      total: 0,
      fileName: "",
      message: "Scanning WhatsApp files…",
      savedFiles: [],
    });

    const allFiles = await walkDir(sync, basePath);
    totalFiles = allFiles.length;
    if (signal?.aborted) return saved;

    output = await createZipOutput(deviceName ?? "device", "whatsapp_media_backup", writable);

    for (let i = 0; i < totalFiles; i++) {
      if (signal?.aborted) break;
      const fullPath = allFiles[i];
      const relativePath = fullPath.slice(basePath.length + 1);

      onProgress({
        phase: "downloading",
        current: i + 1,
        total: totalFiles,
        fileName: relativePath,
        message: `Streaming WhatsApp/${relativePath}`,
        savedFiles: [...saved],
      });

      try {
        await streamFileToZip(output.zipWriter, sync, fullPath, `com.whatsapp/${relativePath}`);
        saved.push({ name: relativePath, size: BigInt(0), status: "ok", message: "Downloaded" });
      } catch (err) {
        saved.push({ name: relativePath, size: BigInt(0), status: "error", message: String(err) });
      }

      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    try { await sync?.dispose(); } catch { /* ignore */ }
  }

  if (signal?.aborted) {
    await output?.cancel();
    return saved;
  }

  if (output) {
    await output.finalize();
  }

  onProgress({
    phase: "done",
    current: totalFiles,
    total: totalFiles,
    fileName: "",
    message: `WhatsApp backup complete. ${saved.filter((s) => s.status === "ok").length}/${totalFiles} files saved.`,
    savedFiles: [...saved],
  });

  return saved;
}
