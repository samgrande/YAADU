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
import { fetchAppName, fetchAppIconUrl } from "./app-names.js";
import { categorizeApp } from "./app-categories.js";

export interface AppEntry {
  packageName: string;
  disabled:    boolean;
  systemApp?:  boolean;
  label?:      string;
  category?:   string;
}

export interface AppOpResult {
  success: boolean;
  message: string;
}

export async function getRunningApps(adb: Adb): Promise<string[]> {
  try {
    const [psOut, pkgsOut] = await Promise.all([
      shellFull(adb, "ps -A | grep com"),
      shell(adb, "pm list packages -3"),
    ]);

    const installed = new Set<string>();
    for (const line of pkgsOut.trim().split("\n")) {
      const pkg = line.trim().replace("package:", "");
      if (pkg) installed.add(pkg);
    }

    const packages = new Set<string>();
    const lines = psOut.stdout.trim().split("\n");
    for (const line of lines) {
      const name = line.trim().split(/\s+/).pop() ?? "";
      if (!name) continue;

      // Strip colon suffix first (e.g. com.android.chrome:privileged_process0)
      let pkg = name.split(":")[0];

      // Progressively strip trailing dot-segments to find a match
      // e.g. com.google.android.gms.persistent → com.google.android.gms
      while (pkg) {
        if (installed.has(pkg)) {
          packages.add(pkg);
          break;
        }
        const idx = pkg.lastIndexOf(".");
        if (idx === -1) break; // No more dots to strip
        pkg = pkg.slice(0, idx);
      }
    }
    return [...packages];
  } catch {
    return [];
  }
}

export async function fetchAppLabel(adb: Adb, packageName: string): Promise<string | null> {
  return fetchAppName(adb, packageName);
}

export async function fetchAppIcon(packageName: string): Promise<string | null> {
  return fetchAppIconUrl(packageName);
}

function parsePmList(raw: string): string[] {
  return (raw ?? "").split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("package:"))
    .map((l) => l.replace("package:", "").trim());
}

export async function listUserApps(adb: Adb): Promise<AppEntry[]> {
  const raw = await shell(adb, "pm list packages -3");
  return parsePmList(raw).map((packageName) => ({
    packageName, disabled: false, category: categorizeApp(packageName, false) ?? undefined,
  }));
}

export async function listAllApps(adb: Adb): Promise<AppEntry[]> {
  const [allRaw, userRaw] = await Promise.all([
    shell(adb, "pm list packages"),
    shell(adb, "pm list packages -3"),
  ]);
  const allPkgs   = parsePmList(allRaw);
  const userPkgs  = new Set(parsePmList(userRaw));
  return allPkgs.map((packageName) => {
    const systemApp = !userPkgs.has(packageName);
    return {
      packageName,
      disabled: false,
      systemApp,
      category: categorizeApp(packageName, systemApp) ?? undefined,
    };
  });
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
    if (!success && combined.includes("delete_failed_internal_error")) {
      return { success: false, message: "This is a system app and cannot be deleted" };
    }
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

export async function pullApk(adb: Adb, pkg: string): Promise<AppOpResult> {
  try {
    const out = await shell(adb, `pm path ${pkg}`);
    const match = out.match(/package:(.+)/);
    if (!match) return { success: false, message: `Could not find APK path for ${pkg}` };
    const apkPath = match[1].trim();

    const sync = await adb.sync();
    try {
      const stream = sync.read(apkPath) as unknown as ReadableStream<Uint8Array>;
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
      const buf = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) { buf.set(c, offset); offset += c.length; }

      const blob = new Blob([buf], { type: "application/vnd.android.package-archive" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pkg.split(".").pop() ?? pkg}.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      return { success: true, message: `Exported ${pkg}` };
    } finally {
      await sync.dispose();
    }
  } catch (err) {
    return { success: false, message: `Export failed: ${String(err)}` };
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
