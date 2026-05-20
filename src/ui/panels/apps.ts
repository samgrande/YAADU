import type { Adb } from "@yume-chan/adb";
import {
  listUserApps, mergeDisabledState,
  forceStop, clearAppData, uninstallApp,
  disableApp, enableApp, installApk,
  type AppEntry, type InstallProgress,
} from "../../adb/apps.js";
import { toast } from "../toast.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function shortPkg(pkg: string): string {
  const parts = pkg.split(".");
  return parts.slice(-2).join(".");
}

function pkgInitial(pkg: string): string {
  const parts = pkg.split(".");
  return (parts[parts.length - 1]?.[0] ?? "?").toUpperCase();
}

// ── App Row ────────────────────────────────────────────────────────────────

function createAppRow(entry: AppEntry, _onRemove: (pkg: string) => void): HTMLElement {
  const row = document.createElement("div");
  row.className = `app-row${entry.disabled ? " disabled-app" : ""}`;
  row.dataset["pkg"] = entry.packageName;

  row.innerHTML = `
    <div class="app-icon-placeholder">${pkgInitial(entry.packageName)}</div>
    <div class="app-info">
      <div class="app-pkg">${entry.packageName}</div>
      <div class="app-pkg-short">${shortPkg(entry.packageName)}${entry.disabled ? ' <span class="badge badge-amber" style="font-size:9px;padding:1px 6px;margin-left:6px;">DISABLED</span>' : ""}</div>
    </div>
    <div class="app-actions">
      <md-outlined-button class="btn-sm" data-action="stop" title="Force Stop" style="--md-outlined-button-label-text-color: var(--md-sys-color-on-surface-variant); --md-outlined-button-outline-color: var(--md-sys-color-outline-variant);">
        <svg slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
        Stop
      </md-outlined-button>
      <md-outlined-button class="btn-sm" data-action="clear" title="Clear Data" style="--md-outlined-button-label-text-color: var(--md-sys-color-primary); --md-outlined-button-outline-color: var(--md-sys-color-primary);">
        <svg slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        Clear
      </md-outlined-button>
      <md-outlined-button class="btn-sm" data-action="uninstall" title="Uninstall" style="--md-outlined-button-label-text-color: var(--md-sys-color-error); --md-outlined-button-outline-color: var(--md-sys-color-error);">
        <svg slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        Uninstall
      </md-outlined-button>
      <md-outlined-button class="btn-sm" data-action="toggle-disable" title="${entry.disabled ? "Enable" : "Disable"}" style="--md-outlined-button-label-text-color: var(--md-sys-color-secondary); --md-outlined-button-outline-color: var(--md-sys-color-secondary);">
        ${entry.disabled
          ? `<svg slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Enable`
          : `<svg slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Disable`
        }
      </md-outlined-button>
    </div>
  `;

  return row;
}

// ── APK Installer ──────────────────────────────────────────────────────────

function createApkInstaller(adb: Adb, onInstalled: () => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "apk-wrapper";
  wrap.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <svg class="ct-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          APK Sideloader
        </div>
      </div>
      <div class="card-body">
        <input type="file" id="apk-file-input" accept=".apk" style="display:none"/>
        <div class="apk-drop-zone" id="apk-drop-zone">
          <div class="apk-drop-title">Drop APK here or click to browse</div>
          <div class="apk-drop-sub">Supports Android APK files · Will push to /data/local/tmp then install</div>
        </div>
        <div class="apk-progress" id="apk-progress" style="display:none; flex-direction:column; gap:8px; padding-top:16px;">
          <div class="apk-progress-label" style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted);">
            <span id="apk-progress-msg">Installing…</span>
            <span id="apk-progress-pct">0%</span>
          </div>
          <md-linear-progress id="apk-progress-fill" value="0" style="width:100%;"></md-linear-progress>
        </div>
      </div>
    </div>
  `;

  const dropZone = wrap.querySelector<HTMLElement>("#apk-drop-zone")!;
  const fileInput = wrap.querySelector<HTMLInputElement>("#apk-file-input")!;
  const progressEl = wrap.querySelector<HTMLElement>("#apk-progress")!;
  const progressMsg = wrap.querySelector<HTMLElement>("#apk-progress-msg")!;
  const progressPct = wrap.querySelector<HTMLElement>("#apk-progress-pct")!;
  const progressFill = wrap.querySelector<any>("#apk-progress-fill")!;

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".apk")) {
      toast("Please select a valid .apk file", "error"); return;
    }
    progressEl.style.display = "flex";
    dropZone.style.pointerEvents = "none";

    const onProgress = (p: InstallProgress) => {
      progressMsg.textContent = p.message;
      progressPct.textContent = `${p.percent}%`;
      if (progressFill) {
        progressFill.value = p.percent / 100;
      }
    };

    const result = await installApk(adb, file, onProgress);
    dropZone.style.pointerEvents = "";

    if (result.success) {
      toast(result.message, "success", { duration: 4000 });
      setTimeout(() => {
        progressEl.style.display = "none";
        onInstalled();
      }, 1500);
    } else {
      toast(result.message, "error", { duration: 6000 });
      progressEl.style.display = "none";
    }
  };

  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) handleFile(file);
    fileInput.value = "";
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault(); dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault(); dropZone.classList.remove("drag-over");
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });

  return wrap;
}

// ── Main Panel ─────────────────────────────────────────────────────────────

export function renderAppsPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");
  let apps: AppEntry[] = [];

  const refreshIcon = `<svg slot="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

  panel.innerHTML = `
    <div class="card apps-list-card">
      <div class="card-header" style="align-items: center;">
        <div class="card-title">
          <svg class="ct-icon" width="16" height="16" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.2125 7.75194L15.9 2.10937C15.6245 1.95712 15.3148 1.87726 15 1.87726C14.6852 1.87726 14.3755 1.95712 14.1 2.10937L3.7875 7.75429C3.49299 7.91543 3.24715 8.15268 3.07565 8.44127C2.90414 8.72986 2.81326 9.05921 2.8125 9.39491V20.6027C2.81326 20.9384 2.90414 21.2678 3.07565 21.5564C3.24715 21.845 3.49299 22.0822 3.7875 22.2433L14.1 27.8883C14.3755 28.0405 14.6852 28.1204 15 28.1204C15.3148 28.1204 15.6245 28.0405 15.9 27.8883L26.2125 22.2433C26.507 22.0822 26.7528 21.845 26.9244 21.5564C27.0959 21.2678 27.1867 20.9384 27.1875 20.6027V9.39608C27.1874 9.05978 27.0968 8.7297 26.9252 8.44044C26.7537 8.15117 26.5075 7.91337 26.2125 7.75194ZM15 3.74999L24.416 8.90624L20.9262 10.8152L11.5102 5.65897L15 3.74999ZM15 14.0625L5.58398 8.90624L9.55781 6.73007L18.9738 11.8863L15 14.0625ZM25.3125 20.6074L15.9375 25.7391V15.6832L19.6875 13.6312V17.8125C19.6875 18.0611 19.7863 18.2996 19.9621 18.4754C20.1379 18.6512 20.3764 18.75 20.625 18.75C20.8736 18.75 21.1121 18.6512 21.2879 18.4754C21.4637 18.2996 21.5625 18.0611 21.5625 17.8125V12.6047L25.3125 10.5527V20.6027V20.6074Z" fill="currentColor"/>
</svg>
          Installed Apps
        </div>
        <md-outlined-button id="btn-refresh-apps">
          ${refreshIcon}
          Reload
        </md-outlined-button>
      </div>
      <div class="apps-toolbar" style="display:flex; align-items:center; gap:16px; padding:14px 20px;">
        <md-outlined-text-field id="apps-search" label="Filter packages…" placeholder="Search by name…" style="flex:1;"></md-outlined-text-field>
        <span class="apps-count" id="apps-count" style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-muted);">— apps</span>
      </div>
      <div class="card-body no-pad">
        <div class="apps-grid" id="apps-grid">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>Click Reload to list installed apps</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // APK installer
  const installerEl = createApkInstaller(adb, () => loadApps());
  panel.appendChild(installerEl);

  const grid     = panel.querySelector<HTMLElement>("#apps-grid")!;
  const searchEl = panel.querySelector<any>("#apps-search")!;
  const countEl  = panel.querySelector<HTMLElement>("#apps-count")!;
  const refreshBtn = panel.querySelector<any>("#btn-refresh-apps")!;

  // ── Render list ─────────────────────────────────────────────────────────
  function renderList(filter = ""): void {
    const lc = filter.toLowerCase();
    const filtered = filter
      ? apps.filter((a) => a.packageName.toLowerCase().includes(lc))
      : apps;

    countEl.textContent = `${filtered.length} / ${apps.length} apps`;
    grid.innerHTML = "";

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No packages match "${filter}"</p></div>`;
      return;
    }

    filtered.forEach((entry) => {
      const row = createAppRow(entry, removeApp);
      wireRowActions(row, entry);
      grid.appendChild(row);
    });
  }

  function removeApp(pkg: string): void {
    apps = apps.filter((a) => a.packageName !== pkg);
    const row = grid.querySelector<HTMLElement>(`[data-pkg="${pkg}"]`);
    if (row) {
      row.style.transition = "opacity 0.3s, transform 0.3s";
      row.style.opacity = "0";
      row.style.transform = "translateX(12px)";
      setTimeout(() => row.remove(), 300);
    }
    countEl.textContent = `${apps.length} apps`;
  }

  // ── Wire action buttons ─────────────────────────────────────────────────
  function wireRowActions(row: HTMLElement, entry: AppEntry): void {
    row.querySelectorAll<any>("md-outlined-button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async (e: Event) => {
        e.stopPropagation();
        const action = btn.dataset["action"]!;
        btn.disabled = true;
        const origHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg class="spinner-stroke" slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
          </svg>
        `;

        let result: { success: boolean; message: string } | null = null;

        if (action === "stop") {
          result = await forceStop(adb, entry.packageName);
        } else if (action === "clear") {
          if (!confirm(`Clear ALL data for ${entry.packageName}?`)) {
            btn.disabled = false; btn.innerHTML = origHtml; return;
          }
          result = await clearAppData(adb, entry.packageName);
        } else if (action === "uninstall") {
          if (!confirm(`Uninstall ${entry.packageName}? This cannot be undone.`)) {
            btn.disabled = false; btn.innerHTML = origHtml; return;
          }
          result = await uninstallApp(adb, entry.packageName);
          if (result.success) { removeApp(entry.packageName); return; }
        } else if (action === "toggle-disable") {
          if (entry.disabled) {
            result = await enableApp(adb, entry.packageName);
            if (result.success) entry.disabled = false;
          } else {
            result = await disableApp(adb, entry.packageName);
            if (result.success) entry.disabled = true;
          }
          // Re-render this row to update the button state
          if (result.success) {
            const fresh = createAppRow(entry, removeApp);
            wireRowActions(fresh, entry);
            row.replaceWith(fresh);
            return;
          }
        }

        if (result) toast(result.message, result.success ? "success" : "error");
        btn.disabled = false;
        btn.innerHTML = origHtml;
      });
    });
  }

  // ── Load apps ───────────────────────────────────────────────────────────
  async function loadApps(): Promise<void> {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `
      <svg class="spinner-stroke" slot="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
      </svg>
    `;
    grid.innerHTML = `
      <div class="empty-state">
        <svg class="spinner-stroke" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
        </svg>
        <p>Fetching packages…</p>
      </div>
    `;

    try {
      let entries = await listUserApps(adb);
      entries = await mergeDisabledState(adb, entries);
      apps = entries.sort((a, b) => a.packageName.localeCompare(b.packageName));
      renderList(searchEl.value);
    } catch (err) {
      toast(`Failed to list apps: ${String(err)}`, "error");
      grid.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error: ${String(err)}</p></div>`;
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        ${refreshIcon}
        Reload
      `;
    }
  }

  searchEl.addEventListener("input", () => renderList(searchEl.value));
  refreshBtn.addEventListener("click", loadApps);

  // Auto-load
  setTimeout(loadApps, 80);

  return panel;
}
