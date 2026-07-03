import type { Adb } from "@yume-chan/adb";
import { LinuxFileType, type AdbSyncEntry } from "@yume-chan/adb";
import { formatBytes } from "./helpers.js";
import JSZip from "jszip";

export interface BackupEntry {
  name:     string;
  fullPath: string;
  size:     bigint;
}

export interface BackupProgress {
  phase:      "scanning" | "downloading" | "zipping" | "done" | "error";
  current:    number;
  total:      number;
  fileName:   string;
  message:    string;
  savedFiles: SavedFile[];
}

export interface SavedFile {
  name:    string;
  size:    bigint;
  status:  "ok" | "error";
  message: string;
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
      }));
  } finally {
    await sync.dispose();
  }
}

async function readStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
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
  return out;
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

export async function downloadSingleFile(adb: Adb, entry: BackupEntry): Promise<void> {
  const sync = await adb.sync();
  try {
    const stream = sync.read(entry.fullPath) as unknown as ReadableStream<Uint8Array>;
    const bytes  = await readStreamToBuffer(stream);
    const plain  = new ArrayBuffer(bytes.length);
    new Uint8Array(plain).set(bytes);
    const blob = new Blob([plain], { type: "application/octet-stream" });
    triggerBrowserDownload(blob, entry.name);
  } finally {
    await sync.dispose();
  }
}

export async function backupMediaFiles(
  adb: Adb,
  files: BackupEntry[],
  onProgress: (p: BackupProgress) => void,
  signal?: AbortSignal,
  deviceName?: string
): Promise<SavedFile[]> {
  const saved: SavedFile[] = [];
  const downloaded: ArrayBuffer[] = [];
  let sync;
  try {
    sync = await adb.sync();
    for (let i = 0; i < files.length; i++) {
      if (signal?.aborted) break;
      const entry = files[i];

      onProgress({
        phase: "downloading", current: i + 1, total: files.length,
        fileName: entry.name,
        message: `Downloading ${entry.name} (${formatBytes(entry.size)})…`,
        savedFiles: [...saved],
      });

      try {
        const stream = sync.read(entry.fullPath) as unknown as ReadableStream<Uint8Array>;
        const bytes  = await readStreamToBuffer(stream);
        const plain  = new ArrayBuffer(bytes.length);
        new Uint8Array(plain).set(bytes);
        downloaded.push(plain);
        saved.push({ name: entry.name, size: entry.size, status: "ok", message: "Downloaded" });
      } catch (err) {
        downloaded.push(new ArrayBuffer(0));
        saved.push({ name: entry.name, size: entry.size, status: "error", message: String(err) });
      }

      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    try { await sync?.dispose(); } catch { /* ignore */ }
  }

  onProgress({
    phase: "zipping", current: 0, total: saved.length,
    fileName: "", message: "Creating zip archive…",
    savedFiles: [...saved],
  });

  const zip = new JSZip();
  for (let i = 0; i < saved.length; i++) {
    if (signal?.aborted) break;
    if (saved[i].status === "ok") {
      zip.file(saved[i].name, downloaded[i]);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const safeName = deviceName ? sanitizeDeviceName(deviceName) : "device";
  triggerBrowserDownload(zipBlob, `${safeName}_media_backup.zip`);

  onProgress({
    phase: "done", current: files.length, total: files.length,
    fileName: "", message: `Backup complete. ${saved.filter(s => s.status === "ok").length}/${files.length} files saved.`,
    savedFiles: [...saved],
  });

  return saved;
}
