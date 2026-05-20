import type { Adb } from "@yume-chan/adb";
import { fetchDeviceInfo, fetchBattery } from "../../adb/telemetry.js";
import { state } from "../../state.js";
import { toast } from "../toast.js";

// ── Template ───────────────────────────────────────────────────────────────

function renderSkeleton(): string {
  return `
    <!-- Row 1: Brand | Model (Marketing) -->
    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Brand</div>
        <div class="metric-value telemetry-skeleton" id="val-brand">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Model (Marketing)</div>
        <div class="metric-value telemetry-skeleton" id="val-model-marketing">—</div>
      </div>
    </div>

    <!-- Row 2: Model Number | OS Version -->
    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Model Number</div>
        <div class="metric-value telemetry-skeleton" id="val-model-number">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">OS Version</div>
        <div class="metric-value telemetry-skeleton" id="val-os">—</div>
      </div>
    </div>

    <!-- Row 3: Codename | Resolution -->
    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Codename</div>
        <div class="metric-value telemetry-skeleton" id="val-codename">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Resolution</div>
        <div class="metric-value telemetry-skeleton" id="val-screen">—</div>
      </div>
    </div>

    <!-- Row 4: Battery Status | Temperature -->
    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Battery</div>
        <div class="metric-value telemetry-skeleton" id="val-battery">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Temperature</div>
        <div class="metric-value telemetry-skeleton" id="val-temp">—</div>
      </div>
    </div>
  `;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function renderTelemetryPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "telem-panel";

  const refreshIconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

  panel.innerHTML = `
    <div class="telem-header">
      <span class="telem-title">Device Info</span>
      <button class="btn-refresh-green" id="btn-refresh-telem">
        ${refreshIconSvg}
        <span class="btn-refresh-text">Reload</span>
      </button>
    </div>
    <div class="telem-body" id="telem-body">
      ${renderSkeleton()}
    </div>
  `;

  const body = panel.querySelector<HTMLElement>("#telem-body")!;
  const refreshBtn = panel.querySelector<HTMLButtonElement>("#btn-refresh-telem")!;

  // ── Data fetching ─────────────────────────────────────────────────────
  async function loadData(): Promise<void> {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = `
      <svg class="spinner-stroke" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
      </svg>
      <span class="btn-refresh-text">Loading…</span>
    `;

    try {
      const info = state.device || await fetchDeviceInfo(adb);
      state.device = info;

      const battery = await fetchBattery(adb);

      const q = (id: string) => body.querySelector<HTMLElement>(`#${id}`)!;
      q("val-brand").textContent           = info.brand;
      q("val-model-marketing").textContent = info.marketingName;
      q("val-model-number").textContent    = info.model;
      q("val-codename").textContent        = adb.device ?? adb.model ?? "—";
      q("val-os").textContent              = `Android ${info.osVersion}`;
      q("val-screen").textContent          = info.screenSize;
      q("val-battery").textContent         = `${battery.level}% (${battery.status})`;
      q("val-temp").textContent            = `${battery.tempCelsius.toFixed(1)}°C`;

      // Remove shimmer
      body.querySelectorAll<HTMLElement>(".telemetry-skeleton")
          .forEach((el) => el.classList.remove("telemetry-skeleton"));

    } catch (err) {
      toast(`Telemetry error: ${String(err)}`, "error");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = `
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <span class="btn-refresh-text">Reload</span>
      `;
    }
  }

  refreshBtn.addEventListener("click", loadData);

  // Auto-load on mount
  setTimeout(loadData, 80);

  return panel;
}
