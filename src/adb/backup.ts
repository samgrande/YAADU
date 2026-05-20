/**
 * Module 4: Media Backup Engine (adb 0.0.19)
 *
 * sync.write() in 0.0.19 requires: file: ReadableStream<Consumable<Uint8Array>>
 * sync.read()  returns: ReadableStream<Uint8Array>
 *
 * We use the Consumable wrapper from @yume-chan/stream-extra for writes.
 */

import type { Adb } from "@yume-chan/adb";
import { LinuxFileType, type AdbSyncEntry } from "@yume-chan/adb";
import { formatBytes } from "./helpers.js";

export interface BackupEntry {
  name:     string;
  fullPath: string;
  size:     bigint;
}

export interface BackupProgress {
  phase:      "scanning" | "downloading" | "done" | "error";
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

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif",  webp: "image/webp", heic: "image/heic",
    heif: "image/heif", mp4: "video/mp4", mov: "video/quicktime",
    mkv: "video/x-matroska", avi: "video/x-msvideo",
    "3gp": "video/3gpp",
  };
  return map[ext] ?? "application/octet-stream";
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function backupMediaFiles(
  adb: Adb,
  files: BackupEntry[],
  onProgress: (p: BackupProgress) => void,
  signal?: AbortSignal
): Promise<SavedFile[]> {
  const saved: SavedFile[] = [];

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) break;
    const entry = files[i];

    onProgress({
      phase: "downloading", current: i + 1, total: files.length,
      fileName: entry.name,
      message: `Downloading ${entry.name} (${formatBytes(entry.size)})…`,
      savedFiles: [...saved],
    });

    let sync;
    try {
      sync = await adb.sync();
      // sync.read() returns ReadableStream<Uint8Array> in 0.0.19
      const stream = sync.read(entry.fullPath) as unknown as ReadableStream<Uint8Array>;
      const bytes  = await readStreamToBuffer(stream);
      await sync.dispose();
      sync = undefined;

      // Copy to a plain ArrayBuffer (avoids SharedArrayBuffer incompatibility with Blob)
      const plain = new ArrayBuffer(bytes.length);
      new Uint8Array(plain).set(bytes);
      const blob = new Blob([plain], { type: guessMimeType(entry.name) });
      triggerBrowserDownload(blob, entry.name);

      saved.push({ name: entry.name, size: entry.size, status: "ok", message: "Saved" });
    } catch (err) {
      try { await sync?.dispose(); } catch { /* ignore */ }
      saved.push({ name: entry.name, size: entry.size, status: "error", message: String(err) });
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  onProgress({
    phase: "done", current: files.length, total: files.length,
    fileName: "", message: `Backup complete. ${saved.filter(s => s.status === "ok").length}/${files.length} files saved.`,
    savedFiles: saved,
  });

  return saved;
}
