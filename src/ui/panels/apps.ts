import type { Adb } from "@yume-chan/adb";
import {
  listUserApps, mergeDisabledState,
  forceStop, clearAppData, uninstallApp,
  disableApp, enableApp, installApk,
  fetchAppLabel,
  type AppEntry, type InstallProgress,
} from "../../adb/apps.js";
import { toast } from "../toast.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function shortPkg(pkg: string): string {
  const parts = pkg.split(".");
  return parts.slice(-2).join(" ");
}

function pkgInitial(pkg: string): string {
  const parts = pkg.split(".");
  return (parts[parts.length - 1]?.[0] ?? "?").toUpperCase();
}

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ── App Card ───────────────────────────────────────────────────────────────

const SHAPES = [
  // Squircle shape
  "M334.285 259.457C331.711 284.036 330.424 296.325 325.697 306.022C318.858 320.055 306.923 330.89 292.372 336.277C282.317 340 270.067 340 245.568 340L121.863 340C92.2359 340 77.4221 340 66.1134 335.146C49.7395 328.118 37.2802 314.151 32.0729 296.985C28.4765 285.129 30.0331 270.267 33.1463 240.543L45.7147 120.543C48.289 95.9642 49.5762 83.6748 54.3026 73.9777C61.142 59.9453 73.0768 49.1101 87.6278 43.7229C97.6833 40 109.933 40 134.432 40L258.137 40C287.764 40 302.578 40 313.887 44.8539C330.261 51.8819 342.72 65.8495 347.927 83.0153C351.524 94.871 349.967 109.733 346.854 139.457L334.285 259.457Z",
  // Tombstone shape
  "M40 182.857C40 103.959 107.157 40 190 40C272.843 40 340 103.959 340 182.857L340 282.857C340 314.416 313.137 340 280 340C270.178 340 260.907 337.752 252.724 333.768C248.554 331.737 244.394 329.512 240.216 327.277C225.513 319.411 210.592 311.429 194.27 311.429H185.73C169.408 311.429 154.487 319.411 139.784 327.277C135.606 329.512 131.446 331.737 127.276 333.768C119.093 337.752 109.822 340 100 340C66.8629 340 40 314.416 40 282.857L40 182.857Z",
  // Starburst shape
  "M166.725 43.1869C177.261 25.6044 202.739 25.6044 213.275 43.1868L225.124 62.9597C231.268 73.2136 243.399 78.2385 254.995 75.3327L277.355 69.7294C297.237 64.7468 315.253 82.7627 310.271 102.645L304.667 125.005C301.762 136.601 306.786 148.732 317.04 154.876L336.813 166.725C354.396 177.261 354.396 202.739 336.813 213.275L317.04 225.124C306.786 231.268 301.762 243.399 304.667 254.995L310.271 277.355C315.253 297.237 297.237 315.253 277.355 310.271L254.995 304.667C243.399 301.762 231.268 306.786 225.124 317.04L213.275 336.813C202.739 354.396 177.261 354.396 166.725 336.813L154.876 317.04C148.732 306.786 136.601 301.762 125.005 304.667L102.646 310.271C82.7627 315.253 64.7468 297.237 69.7294 277.355L75.3327 254.995C78.2385 243.399 73.2136 231.268 62.9597 225.124L43.1869 213.275C25.6044 202.739 25.6044 177.261 43.1868 166.725L62.9597 154.876C73.2136 148.732 78.2385 136.601 75.3327 125.005L69.7294 102.646C64.7468 82.7627 82.7627 64.7468 102.645 69.7294L125.005 75.3327C136.601 78.2385 148.732 73.2136 154.876 62.9597L166.725 43.1869Z"
];

function createAppCard(entry: AppEntry, _onRemove: (pkg: string) => void): HTMLElement {
  const card = document.createElement("div");
  card.className = `app-card${entry.disabled ? " disabled-app" : ""}`;
  card.dataset["pkg"] = entry.packageName;

  const displayName = entry.label ?? shortPkg(entry.packageName);
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  card.innerHTML = `
    <div class="app-icon-wrap">
      <div class="app-icon-placeholder">
        <!-- Top Shape (Squircle) -->
        <svg class="avatar-shape avatar-shape-top" viewBox="0 0 380 380">
          <path d="${SHAPES[0]}" fill="var(--md-sys-color-primary)" fill-opacity="0.16"/>
        </svg>
        <!-- Bottom Left Shape (Tombstone) -->
        <svg class="avatar-shape avatar-shape-left" viewBox="0 0 380 380">
          <path d="${SHAPES[1]}" fill="var(--md-sys-color-primary)" fill-opacity="0.16"/>
        </svg>
        <!-- Bottom Right Shape (Starburst) -->
        <svg class="avatar-shape avatar-shape-right" viewBox="0 0 380 380">
          <path d="${SHAPES[2]}" fill="var(--md-sys-color-primary)" fill-opacity="0.16"/>
        </svg>
        <span class="avatar-letter">${esc(initial)}</span>
      </div>
    </div>
    <div class="app-details-wrap">
      <div class="app-info">
        <div class="app-pkg">${esc(displayName)}</div>
        <div class="app-pkg-short">
          ${esc(entry.packageName)}
          ${entry.disabled ? ' <span class="badge badge-amber" style="font-size:9px;padding:1px 6px;margin-left:6px;">DISABLED</span>' : ""}
        </div>
      </div>
      <div class="app-actions">
        <button class="btn-app-action" data-action="stop" title="Force Stop">Stop</button>
        <button class="btn-app-action" data-action="clear" title="Clear Data">Clear</button>
        <button class="btn-app-action" data-action="toggle-disable" title="${entry.disabled ? "Enable" : "Disable"}">
          ${entry.disabled ? "Enable" : "Disable"}
        </button>
        <button class="btn-app-action btn-action-danger" data-action="uninstall" title="Uninstall">Uninstall</button>
      </div>
    </div>
  `;

  return card;
}

// ── APK Installer ──────────────────────────────────────────────────────────

function createApkInstaller(adb: Adb, onInstalled: () => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "16px";
  wrap.innerHTML = `
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

  const refreshIcon = `<svg class="reload-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
  const sideloadIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  const navbarAppsIcon = `<svg class="ct-icon" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.91667 9.5625L12.75 8.14583L15.5833 9.5625V2.83333H9.91667V9.5625ZM5.66667 19.8333V17H12.75V19.8333H5.66667ZM2.83333 25.5C2.05417 25.5 1.38739 25.2228 0.833 24.6684C0.278611 24.114 0.000944444 23.4468 0 22.6667V2.83333C0 2.05417 0.277667 1.38739 0.833 0.833C1.38833 0.278611 2.05511 0.000944444 2.83333 0H22.6667C23.4458 0 24.1131 0.277667 24.6684 0.833C25.2237 1.38833 25.5009 2.05511 25.5 2.83333V22.6667C25.5 23.4458 25.2228 24.1131 24.6684 24.6684C24.114 25.2237 23.4468 25.5009 22.6667 25.5H2.83333ZM2.83333 22.6667H22.6667V2.83333H18.4167V14.1667L12.75 11.3333L7.08333 14.1667V2.83333H2.83333V22.6667Z" fill="currentColor"/>
  </svg>`;

  panel.innerHTML = `
    <div class="card apps-list-card">
      <div class="card-header" style="align-items: center;">
        <div class="card-title">
          ${navbarAppsIcon}
          Installed Apps
        </div>
        <div class="apps-header-actions">
          <button id="btn-apk-sideloader" class="btn-m3-sideloader" title="Install APK">
            ${sideloadIcon}
          </button>
          <button id="btn-refresh-apps" class="btn-m3-reload" title="Reload apps">
            ${refreshIcon}
            <span>Reload</span>
          </button>
        </div>
      </div>
      <div class="apps-toolbar">
        <div class="search-wrapper">
          <input type="text" id="apps-search" placeholder="Filter Packages" />
        </div>
        <div class="count-pill">
          <svg class="nine-dots-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="5" r="2"/>
            <circle cx="12" cy="5" r="2"/>
            <circle cx="19" cy="5" r="2"/>
            <circle cx="5" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="19" cy="12" r="2"/>
            <circle cx="5" cy="19" r="2"/>
            <circle cx="12" cy="19" r="2"/>
            <circle cx="19" cy="19" r="2"/>
          </svg>
          <span id="apps-count">—</span>
        </div>
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

  // APK installer overlay dialog
  const overlay = document.createElement("div");
  overlay.id = "apk-sideloader-overlay";
  overlay.innerHTML = `
    <div class="apk-dialog">
      <div class="apk-dialog-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        APK Sideloader
      </div>
      <div class="apk-dialog-body"></div>
      <div class="apk-dialog-footer">
        <md-text-button id="apk-dialog-close">Close</md-text-button>
      </div>
    </div>
  `;
  const dialogContent = createApkInstaller(adb, () => loadApps());
  overlay.querySelector<HTMLElement>(".apk-dialog-body")!.appendChild(dialogContent);
  panel.appendChild(overlay);

  overlay.querySelector<HTMLElement>("#apk-dialog-close")!
    .addEventListener("click", () => overlay.classList.remove("open"));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });

  const grid     = panel.querySelector<HTMLElement>("#apps-grid")!;
  const searchEl = panel.querySelector<any>("#apps-search")!;
  const countEl  = panel.querySelector<HTMLElement>("#apps-count")!;
  const refreshBtn = panel.querySelector<any>("#btn-refresh-apps")!;
  const apkBtn = panel.querySelector<any>("#btn-apk-sideloader")!;
  apkBtn.addEventListener("click", () => overlay.classList.add("open"));

  // ── Render list ─────────────────────────────────────────────────────────
  function renderList(filter = ""): void {
    const lc = filter.toLowerCase();
    const filtered = filter
      ? apps.filter((a) => a.packageName.toLowerCase().includes(lc))
      : apps;

    countEl.textContent = `${filtered.length} / ${apps.length}`;
    grid.innerHTML = "";

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No packages match "${filter}"</p></div>`;
      return;
    }

    filtered.forEach((entry) => {
      const card = createAppCard(entry, removeApp);
      wireRowActions(card, entry);
      grid.appendChild(card);
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
    countEl.textContent = `${apps.length} / ${apps.length}`;
  }

  // ── Wire action buttons ─────────────────────────────────────────────────
  function wireRowActions(row: HTMLElement, entry: AppEntry): void {
    row.querySelectorAll<any>("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async (e: Event) => {
        e.stopPropagation();
        const action = btn.dataset["action"]!;
        btn.disabled = true;
        const origHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg class="spinner-stroke" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
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
            const fresh = createAppCard(entry, removeApp);
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
      <svg class="spinner-stroke" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
      </svg>
      <span>Reloading...</span>
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

      // Fetch human-readable labels in the background
      (async () => {
        const CONCURRENCY = 5;
        for (let i = 0; i < apps.length; i += CONCURRENCY) {
          const batch = apps.slice(i, i + CONCURRENCY);
          await Promise.all(batch.map(async (app) => {
            const label = await fetchAppLabel(adb, app.packageName);
            if (label && label !== app.label) {
              app.label = label;
              // Update card in-place if it exists
              const card = grid.querySelector<HTMLElement>(`[data-pkg="${app.packageName}"]`);
              if (card) {
                const pkgEl = card.querySelector<HTMLElement>(".app-pkg");
                if (pkgEl) pkgEl.textContent = label;
              }
            }
          }));
        }
      })();
    } catch (err) {
      toast(`Failed to list apps: ${String(err)}`, "error");
      grid.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Error: ${String(err)}</p></div>`;
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        ${refreshIcon}
        <span>Reload</span>
      `;
    }
  }

  searchEl.addEventListener("input", () => renderList(searchEl.value));
  refreshBtn.addEventListener("click", loadApps);

  // ── Custom scroll pill (mirrors telemetry) ──────────────────────────────
  const PILL_H = 80; // px — must match CSS height of .apps-scroll-pill
  const cardBody = panel.querySelector<HTMLElement>(".card-body.no-pad")!;

  // Wrap card-body in a relative container so the pill can be positioned inside it
  const scrollWrap = document.createElement("div");
  scrollWrap.className = "apps-scroll-wrap";
  cardBody.parentElement!.insertBefore(scrollWrap, cardBody);
  scrollWrap.appendChild(cardBody);

  // Build pill + thumb
  const scrollPill = document.createElement("div");
  scrollPill.className = "apps-scroll-pill";
  const scrollThumb = document.createElement("div");
  scrollThumb.className = "apps-scroll-thumb";
  scrollPill.appendChild(scrollThumb);
  scrollWrap.appendChild(scrollPill);

  function updateScrollState(): void {
    const { scrollTop, scrollHeight, clientHeight } = cardBody;
    const canScrollTop = scrollTop > 1;
    const canScrollBottom = scrollTop + clientHeight < scrollHeight - 1;
    const isScrollable = canScrollTop || canScrollBottom;

    cardBody.classList.toggle("can-scroll-top", canScrollTop);
    cardBody.classList.toggle("can-scroll-bottom", canScrollBottom);
    scrollPill.classList.toggle("pill-visible", isScrollable);

    if (isScrollable) {
      const thumbH = Math.max(16, (clientHeight / scrollHeight) * PILL_H);
      const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (PILL_H - thumbH);
      scrollThumb.style.height = `${thumbH}px`;
      scrollThumb.style.top = `${thumbTop}px`;
    }
  }

  cardBody.addEventListener("scroll", updateScrollState, { passive: true });
  new ResizeObserver(updateScrollState).observe(cardBody);

  // Auto-load
  setTimeout(loadApps, 80);

  return panel;
}
