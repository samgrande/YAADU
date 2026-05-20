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
          <svg class="ct-icon" width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.99992 28C3.26659 28 2.63903 27.7391 2.11725 27.2173C1.59547 26.6955 1.33414 26.0675 1.33325 25.3333V9.33332C1.33325 8.95555 1.46125 8.6391 1.71725 8.38399C1.97325 8.12888 2.2897 8.00088 2.66659 7.99999C3.04347 7.9991 3.36036 8.1271 3.61725 8.38399C3.87414 8.64088 4.0017 8.95732 3.99992 9.33332V25.3333H25.3333C25.711 25.3333 26.0279 25.4613 26.2839 25.7173C26.5399 25.9733 26.6675 26.2898 26.6666 26.6667C26.6657 27.0435 26.5377 27.3604 26.2826 27.6173C26.0275 27.8742 25.711 28.0018 25.3333 28H3.99992ZM9.33325 22.6667C8.59992 22.6667 7.97236 22.4058 7.45059 21.884C6.92881 21.3622 6.66747 20.7342 6.66659 20V5.33332C6.66659 4.59999 6.92792 3.97243 7.45059 3.45066C7.97325 2.92888 8.60081 2.66755 9.33325 2.66666H14.8999C15.2555 2.66666 15.5946 2.73332 15.9173 2.86666C16.2399 2.99999 16.523 3.18888 16.7666 3.43332L18.6666 5.33332H27.9999C28.7333 5.33332 29.3613 5.59466 29.8839 6.11732C30.4066 6.63999 30.6675 7.26755 30.6666 7.99999V20C30.6666 20.7333 30.4057 21.3613 29.8839 21.884C29.3621 22.4067 28.7341 22.6675 27.9999 22.6667H9.33325ZM17.6666 15.3333L16.1333 13.3333C15.9999 13.1555 15.8221 13.0667 15.5999 13.0667C15.3777 13.0667 15.1999 13.1555 15.0666 13.3333L12.8333 16.2667C12.6555 16.4889 12.6275 16.7222 12.7493 16.9667C12.871 17.2111 13.0768 17.3333 13.3666 17.3333H23.9666C24.2555 17.3333 24.4608 17.2111 24.5826 16.9667C24.7044 16.7222 24.6768 16.4889 24.4999 16.2667L21.2666 12.0333C21.1333 11.8555 20.9555 11.7667 20.7333 11.7667C20.511 11.7667 20.3333 11.8555 20.1999 12.0333L17.6666 15.3333Z" fill="currentColor"/></svg>
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
