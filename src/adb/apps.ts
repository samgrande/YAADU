/**
 * Module 3: App Management (adb 0.0.19)
 *
 * Uses adb.subprocess.spawnAndWait / spawnAndWaitLegacy.
 * APK install: push via sync.write() with Consumable-wrapped stream, then pm install.
 * sync.write().file must be ReadableStream<Consumable<Uint8Array>> in 0.0.19.
 */

import type { Adb } from "@yume-chan/adb";
import { Consumable } from "@yume-chan/stream-extra";
import { shell, shellFull } from "./helpers.js";

export interface AppEntry {
  packageName: string;
  disabled:    boolean;
  label?:      string;
}

export interface AppOpResult {
  success: boolean;
  message: string;
}

// ── App Label Extraction ──────────────────────────────────────────────────

const labelCache = new Map<string, string>();

function parseAaptLabel(output: string): string | null {
  const m = output.match(/application-label:\s*'([^']+)'/);
  return m ? m[1] : null;
}

function parseDumpsysLabel(output: string): string | null {
  // Try various formats across Android versions
  const m = output.match(/label=([^\s\}]+)/);
  return m ? m[1] : null;
}

export async function fetchAppLabel(adb: Adb, packageName: string): Promise<string | null> {
  const cached = labelCache.get(packageName);
  if (cached) return cached;

  try {
    // 1. Get APK path
    const pathOut = await shell(adb, `pm path ${packageName}`);
    const match = pathOut.match(/package:(.+)/);
    if (!match) return null;
    const apkPath = match[1].trim();

    // 2. Try aapt first
    for (const bin of ["aapt", "aapt-arm-pie", "/data/local/tmp/aapt-arm-pie"]) {
      const out = await shellFull(adb, `${bin} dump badging "${apkPath}" 2>/dev/null`).catch(() => ({ stdout: "", stderr: "" }));
      const label = parseAaptLabel(out.stdout || out.stderr);
      if (label) {
        labelCache.set(packageName, label);
        return label;
      }
    }

    // 3. Fallback: parse dumpsys package
    const dumpOut = await shell(adb, `dumpsys package ${packageName}`);
    const label = parseDumpsysLabel(dumpOut);
    if (label) {
      labelCache.set(packageName, label);
      return label;
    }

    return null;
  } catch {
    return null;
  }
}

export async function listUserApps(adb: Adb): Promise<AppEntry[]> {
  const raw = await shell(adb, "pm list packages -3");
  if (!raw) return [];
  return raw.split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("package:"))
    .map((l) => ({ packageName: l.replace("package:", "").trim(), disabled: false }));
}

export async function mergeDisabledState(adb: Adb, entries: AppEntry[]): Promise<AppEntry[]> {
  const raw = await shell(adb, "pm list packages -d");
  const disabledSet = new Set(
    raw.split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("package:"))
      .map((l) => l.replace("package:", "").trim())
  );
  return entries.map((e) => ({ ...e, disabled: disabledSet.has(e.packageName) }));
}

export async function forceStop(adb: Adb, pkg: string): Promise<AppOpResult> {
  try {
    await shell(adb, `am force-stop ${pkg}`);
    return { success: true, message: `Force-stopped ${pkg}` };
  } catch (err) {
    return { success: false, message: `Force-stop failed: ${String(err)}` };
  }
}

export async function clearAppData(adb: Adb, pkg: string): Promise<AppOpResult> {
  try {
    const out = await shell(adb, `pm clear ${pkg}`);
    const success = out.toLowerCase().includes("success");
    return { success, message: success ? `Data cleared for ${pkg}` : `pm clear returned: ${out}` };
  } catch (err) {
    return { success: false, message: `Clear failed: ${String(err)}` };
  }
}

export async function uninstallApp(adb: Adb, pkg: string): Promise<AppOpResult> {
  try {
    const result = await shellFull(adb, `pm uninstall ${pkg}`);
    const combined = (result.stdout + result.stderr).toLowerCase();
    const success = combined.includes("success");
    return {
      success,
      message: success ? `Uninstalled ${pkg}` : `pm uninstall: ${result.stdout || result.stderr}`,
    };
  } catch (err) {
    return { success: false, message: `Uninstall failed: ${String(err)}` };
  }
}

export async function disableApp(adb: Adb, pkg: string): Promise<AppOpResult> {
  try {
    const out = await shell(adb, `pm disable-user --user 0 ${pkg}`);
    const success = out.toLowerCase().includes("disabled");
    return { success, message: success ? `Disabled ${pkg}` : `pm disable: ${out}` };
  } catch (err) {
    return { success: false, message: `Disable failed: ${String(err)}` };
  }
}

export async function enableApp(adb: Adb, pkg: string): Promise<AppOpResult> {
  try {
    const out = await shell(adb, `pm enable ${pkg}`);
    const success = out.toLowerCase().includes("enabled");
    return { success, message: success ? `Enabled ${pkg}` : `pm enable: ${out}` };
  } catch (err) {
    return { success: false, message: `Enable failed: ${String(err)}` };
  }
}

export interface InstallProgress {
  phase:   "pushing" | "installing" | "done" | "error";
  percent: number;
  message: string;
}

/**
 * Installs an APK by:
 * 1. Pushing to /data/local/tmp/ via AdbSync.write() with Consumable-wrapped stream
 * 2. Running pm install -r
 */
export async function installApk(
  adb: Adb,
  file: File,
  onProgress: (p: InstallProgress) => void
): Promise<AppOpResult> {
  const remotePath = `/data/local/tmp/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  onProgress({ phase: "pushing", percent: 0, message: `Pushing ${file.name}…` });

  let sync;
  try {
    sync = await adb.sync();
    const totalSize = file.size;
    let transferred = 0;

    // 0.0.19 requires ReadableStream<Consumable<Uint8Array>>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileStream = new ReadableStream<Consumable<Uint8Array>>({
      async start(controller) {
        const buffer = await file.arrayBuffer();
        const chunk  = new Uint8Array(buffer);
        const CHUNK  = 64 * 1024;
        for (let offset = 0; offset < chunk.length; offset += CHUNK) {
          const slice = chunk.subarray(offset, offset + CHUNK);
          controller.enqueue(new Consumable(slice));
          transferred += slice.length;
          onProgress({
            phase: "pushing",
            percent: Math.min(88, Math.round((transferred / totalSize) * 88)),
            message: `Pushing… ${Math.round((transferred / totalSize) * 100)}%`,
          });
        }
        controller.close();
      },
    });

    await sync.write({
      filename: remotePath,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      file: fileStream as any,
      mode: 0o644,
    });

    await sync.dispose();
    sync = undefined;
  } catch (err) {
    try { await sync?.dispose(); } catch { /* ignore */ }
    return { success: false, message: `Push failed: ${String(err)}` };
  }

  onProgress({ phase: "installing", percent: 92, message: "Running pm install…" });
  try {
    const result  = await shellFull(adb, `pm install -r "${remotePath}"`);
    const combined = (result.stdout + result.stderr).toLowerCase();
    const success  = combined.includes("success");

    await shell(adb, `rm -f "${remotePath}"`).catch(() => {});

    if (success) {
      onProgress({ phase: "done", percent: 100, message: `Installed ${file.name}!` });
      return { success: true, message: `Installed ${file.name}` };
    } else {
      const errMsg = result.stdout || result.stderr || "Unknown error";
      onProgress({ phase: "error", percent: 0, message: `Install failed: ${errMsg}` });
      return { success: false, message: `pm install: ${errMsg}` };
    }
  } catch (err) {
    return { success: false, message: `Install command failed: ${String(err)}` };
  }
}
