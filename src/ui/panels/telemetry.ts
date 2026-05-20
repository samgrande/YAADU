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
      const isCharging = battery.status === "Charging";
      q("val-battery").innerHTML = `${battery.level}%${isCharging ? ` <svg width="28" height="28" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.4945 57.97C22.098 57.8027 21.7685 57.508 21.558 57.1327C21.3475 56.7573 21.268 56.3225 21.332 55.8969L24.8582 32.9375H15.5001C15.2034 32.9455 14.9089 32.8852 14.6392 32.7613C14.3695 32.6374 14.1319 32.4532 13.9447 32.223C13.7574 31.9927 13.6256 31.7225 13.5594 31.4332C13.4931 31.1439 13.4942 30.8432 13.5626 30.5544L19.3751 5.3669C19.4774 4.93342 19.7259 4.54841 20.0788 4.27669C20.4317 4.00497 20.8674 3.86312 21.3126 3.87502H40.6876C40.9771 3.87404 41.2631 3.93792 41.5246 4.06197C41.7861 4.18603 42.0165 4.36711 42.1989 4.5919C42.3838 4.81923 42.5147 5.08554 42.5819 5.3708C42.649 5.65606 42.6505 5.95283 42.5864 6.23877L39.2345 21.3125H48.4376C48.8007 21.3118 49.1568 21.4131 49.4651 21.605C49.7734 21.7968 50.0216 22.0714 50.1814 22.3975C50.3202 22.7105 50.3736 23.0547 50.3362 23.395C50.2987 23.7354 50.1718 24.0597 49.9682 24.335L24.7807 57.2725C24.6105 57.5249 24.3832 57.7335 24.1173 57.8817C23.8514 58.0298 23.5543 58.1131 23.2501 58.125C22.9909 58.1197 22.7348 58.0672 22.4945 57.97Z" fill="#095F4C"/></svg>` : ` (${battery.status})`}`;
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
