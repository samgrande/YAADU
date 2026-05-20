import type { Adb } from "@yume-chan/adb";
import {
  listMediaFiles,
  backupMediaFiles,
  type BackupEntry,
  type BackupProgress,
} from "../../adb/backup.js";
import { formatBytes } from "../../adb/helpers.js";
import { toast } from "../toast.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isVideo = ["mp4", "mov", "mkv", "avi", "3gp"].includes(ext);
  if (isVideo) {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
  }
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}

function logLine(msg: string, kind: "ok" | "err" | "info"): string {
  return `<div class="log-${kind}">${msg}</div>`;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function renderBackupPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");
  let files: BackupEntry[] = [];
  let abortController: AbortController | null = null;
  let isRunning = false;

  panel.innerHTML = `
    <div class="card">
      <div class="card-header" style="align-items: center;">
        <div class="card-title">
          <svg class="ct-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
          Media Backup — DCIM/Camera
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <md-outlined-button id="btn-scan">
            <svg slot="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Scan
          </md-outlined-button>
          <md-filled-button id="btn-backup" disabled>
            <svg slot="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>
            Backup All
          </md-filled-button>
          <md-filled-button id="btn-cancel" style="display:none; --md-filled-button-container-color: var(--md-sys-color-error); --md-filled-button-label-text-color: var(--md-sys-color-on-error);">
            Cancel
          </md-filled-button>
        </div>
      </div>

      <div class="card-body">
        <!-- Summary bar -->
        <div class="backup-summary" id="backup-summary" style="margin-bottom:16px; font-size:13px; color:var(--text-muted);">
          <span>Scan your device to list files available for backup.</span>
        </div>

        <!-- Progress bar -->
        <div class="apk-progress" id="backup-progress" style="display:none; flex-direction:column; gap:8px; margin-bottom:16px;">
          <div class="apk-progress-label" style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted);">
            <span id="backup-progress-msg">Starting…</span>
            <span id="backup-progress-pct">0%</span>
          </div>
          <md-linear-progress id="backup-progress-fill" value="0" style="width:100%;"></md-linear-progress>
        </div>

        <!-- File list -->
        <div class="backup-file-list card" id="backup-file-list" style="display:none;margin-bottom:16px;max-height:260px; overflow-y:auto;"></div>

        <!-- Log output -->
        <div class="backup-log" id="backup-log" style="display:none">
          <div class="log-info">Ready. Click "Scan" to discover files.</div>
        </div>
      </div>
    </div>
  `;

  const scanBtn     = panel.querySelector<any>("#btn-scan")!;
  const backupBtn   = panel.querySelector<any>("#btn-backup")!;
  const cancelBtn   = panel.querySelector<any>("#btn-cancel")!;
  const summaryEl   = panel.querySelector<HTMLElement>("#backup-summary")!;
  const progressEl  = panel.querySelector<HTMLElement>("#backup-progress")!;
  const progressMsg = panel.querySelector<HTMLElement>("#backup-progress-msg")!;
  const progressPct = panel.querySelector<HTMLElement>("#backup-progress-pct")!;
  const progressFill = panel.querySelector<any>("#backup-progress-fill")!;
  const fileListEl  = panel.querySelector<HTMLElement>("#backup-file-list")!;
  const logEl       = panel.querySelector<HTMLElement>("#backup-log")!;

  function addLog(msg: string, kind: "ok" | "err" | "info"): void {
    logEl.style.display = "block";
    logEl.innerHTML += logLine(msg, kind);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderFileList(): void {
    if (files.length === 0) { fileListEl.style.display = "none"; return; }
    fileListEl.style.display = "block";
    fileListEl.innerHTML = files.map((f) => `
      <div class="backup-file-item" data-file="${f.name}">
        ${fileIcon(f.name)}
        <span class="backup-file-name">${f.name}</span>
        <span class="backup-file-size">${formatBytes(f.size)}</span>
        <span class="backup-file-status" id="fstatus-${f.name.replace(/[^a-zA-Z0-9]/g, "_")}">
          <span class="badge badge-cyan">Queued</span>
        </span>
      </div>
    `).join("");
  }

  function setFileStatus(name: string, html: string): void {
    const id = `fstatus-${name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const el = fileListEl.querySelector<HTMLElement>(`#${id}`);
    if (el) el.innerHTML = html;
  }

  // ── Scan ─────────────────────────────────────────────────────────────
  async function scanFiles(): Promise<void> {
    scanBtn.disabled = true;
    backupBtn.disabled = true;
    logEl.innerHTML = "";
    logEl.style.display = "block";
    fileListEl.style.display = "none";

    addLog("Scanning /sdcard/DCIM/Camera…", "info");
    summaryEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <svg class="spinner-stroke" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
        </svg>
        Scanning…
      </div>
    `;

    try {
      files = await listMediaFiles(adb);

      const totalSize = files.reduce((s, f) => s + f.size, 0n);
      summaryEl.innerHTML = `
        <strong>${files.length}</strong> files found ·
        <strong>${formatBytes(totalSize)}</strong> total
      `;

      renderFileList();
      backupBtn.disabled = files.length === 0;
      addLog(`Found ${files.length} file(s).`, "ok");
    } catch (err) {
      toast(`Scan failed: ${String(err)}`, "error");
      addLog(`Scan error: ${String(err)}`, "err");
      summaryEl.innerHTML = `<span style="color:var(--red)">Scan failed.</span>`;
    } finally {
      scanBtn.disabled = false;
    }
  }

  // ── Backup ───────────────────────────────────────────────────────────
  async function startBackup(): Promise<void> {
    if (isRunning || files.length === 0) return;

    isRunning = true;
    abortController = new AbortController();
    backupBtn.style.display = "none";
    cancelBtn.style.display = "";
    progressEl.style.display = "flex";

    logEl.innerHTML = "";
    addLog(`Starting backup of ${files.length} file(s)…`, "info");

    // Reset statuses
    files.forEach((f) => {
      setFileStatus(f.name, `<span class="badge badge-cyan">Queued</span>`);
    });

    const onProgress = (p: BackupProgress) => {
      progressMsg.textContent = p.message;
      const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
      progressPct.textContent = `${pct}%`;
      if (progressFill) {
        progressFill.value = pct / 100;
      }

      if (p.phase === "downloading" && p.fileName) {
        setFileStatus(p.fileName, `<span class="badge badge-amber">Downloading</span>`);
      }

      p.savedFiles.forEach((f) => {
        if (f.status === "ok") {
          setFileStatus(f.name, `<span class="badge badge-green">Saved</span>`);
          addLog(`✓ ${f.name} (${formatBytes(f.size)})`, "ok");
        } else if (f.status === "error") {
          setFileStatus(f.name, `<span class="badge badge-red">Error</span>`);
          addLog(`✗ ${f.name}: ${f.message}`, "err");
        }
      });
    };

    try {
      await backupMediaFiles(adb, files, onProgress, abortController.signal);
      addLog("Backup complete.", "info");
    } catch (err) {
      toast(`Backup error: ${String(err)}`, "error");
      addLog(`Error: ${String(err)}`, "err");
    } finally {
      isRunning = false;
      abortController = null;
      backupBtn.style.display = "";
      cancelBtn.style.display = "none";
    }
  }

  scanBtn.addEventListener("click", scanFiles);
  backupBtn.addEventListener("click", startBackup);
  cancelBtn.addEventListener("click", () => {
    abortController?.abort();
    addLog("Backup cancelled by user.", "info");
    cancelBtn.style.display = "none";
    backupBtn.style.display = "";
  });

  return panel;
}
