import type { Adb } from "@yume-chan/adb";
import { fetchDeviceInfo, fetchBattery, fetchSystemDetails } from "../../adb/telemetry.js";
import { state } from "../../state.js";
import { toast } from "../toast.js";

// ── Template ───────────────────────────────────────────────────────────────

function renderSkeleton(): string {
  return `
    <!-- Section: System & Build Information -->
    <div class="telem-section">
    <div class="section-heading"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> System &amp; Build</div>
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

    <div class="telem-grid">
      <div class="metric-tile tile-square">
        <div class="metric-label">Android Version</div>
        <div class="metric-value telemetry-skeleton" id="val-sdk">—</div>
      </div>
    </div>

    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Model Number</div>
        <div class="metric-value telemetry-skeleton" id="val-model-number">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Device Codename</div>
        <div class="metric-value telemetry-skeleton" id="val-device-codename">—</div>
      </div>
    </div>
    </div>

    <!-- Section: Hardware & Display -->
    <div class="telem-section">
    <div class="section-heading"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Hardware &amp; Display</div>
    <div class="telem-grid">
      <div class="metric-tile mem-tile tile-square">
        <svg class="mem-bg-ring" viewBox="0 0 100 100">
          <path id="mem-ring-unfilled" fill="none" stroke="#E1E4DC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path id="mem-ring" fill="none" stroke="#095F4C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="mem-overlay">
          <div class="metric-label">Memory</div>
          <div class="mem-pct" id="mem-pct">0%</div>
          <div class="mem-avail" id="val-memory">—</div>
        </div>
      </div>
    </div>

    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Resolution</div>
        <div class="metric-value telemetry-skeleton" id="val-screen">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Density (DPI)</div>
        <div class="metric-value telemetry-skeleton" id="val-density">—</div>
      </div>
    </div>

    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">CPU Architecture</div>
        <div class="metric-value telemetry-skeleton" id="val-cpu-abi">—</div>
      </div>
    </div>
    </div>

    <!-- Section: Battery & Diagnostics -->
    <div class="telem-section">
    <div class="section-heading"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="11" y1="10" x2="11" y2="14"/><line x1="15" y1="10" x2="15" y2="14"/></svg> Extra Info</div>
    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Temperature</div>
        <div class="metric-value telemetry-skeleton" id="val-temp">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Health</div>
        <div class="metric-value telemetry-skeleton" id="val-health">—</div>
      </div>
    </div>

    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">Voltage</div>
        <div class="metric-value telemetry-skeleton" id="val-voltage">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Technology</div>
        <div class="metric-value telemetry-skeleton" id="val-technology">—</div>
      </div>
    </div>

    <div class="telem-grid">
      <div class="metric-tile">
        <div class="metric-label">SDK Level</div>
        <div class="metric-value telemetry-skeleton" id="val-sdk-level">—</div>
      </div>
      <div class="metric-tile">
        <div class="metric-label">Security Patch</div>
        <div class="metric-value telemetry-skeleton" id="val-security-patch">—</div>
      </div>
    </div>
    </div>
  `;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export function renderTelemetryPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "telem-panel";

  const refreshIconSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

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
    const icon = refreshBtn.querySelector("svg")!;
    icon.classList.add("rotating");

    try {
      const info = state.device || await fetchDeviceInfo(adb);
      state.device = info;

      const [battery, sys] = await Promise.all([
        fetchBattery(adb),
        fetchSystemDetails(adb),
      ]);

      const q = (id: string) => body.querySelector<HTMLElement>(`#${id}`)!;
      q("val-brand").textContent           = info.brand;
      q("val-model-marketing").textContent = info.marketingName;
      q("val-model-number").textContent    = info.model;
      q("val-screen").textContent          = info.screenSize;
      q("val-sdk").textContent             = `Android ${info.osVersion}`;
      q("val-sdk-level").textContent        = sys.sdkVersion;
      q("val-security-patch").textContent    = sys.securityPatch;
      q("val-device-codename").textContent    = sys.deviceName;
      q("val-density").textContent           = sys.densityDpi ? `${sys.densityDpi} dpi` : "—";
      q("val-cpu-abi").textContent            = sys.cpuAbi;
      const totalNum = parseFloat(sys.totalMemory);
      const availNum = parseFloat(sys.availMemory);
      const usedGb = (totalNum - availNum).toFixed(1);
      const usedPct = totalNum > 0 ? Math.round((1 - availNum / totalNum) * 100) : 0;
      q("val-memory").textContent = `${usedGb} GB / ${sys.totalMemory}`;

      const ring = body.querySelector<SVGPathElement>("#mem-ring")!;
      const ringUnfilled = body.querySelector<SVGPathElement>("#mem-ring-unfilled")!;
      const pctText = body.querySelector<HTMLElement>("#mem-pct")!;
      if (ring && ringUnfilled && pctText) {
        const CX = 50, CY = 50, R = 43, AMP = 3, FREQ = 20, N = 300, GAP = 2;
        const splitIdx = Math.floor(N * usedPct / 100);
        const filledStart = GAP;
        const filledEnd = Math.max(filledStart, Math.min(splitIdx - GAP, N - GAP));
        const unfilledStart = Math.max(splitIdx + GAP, GAP);
        const unfilledEnd = N - GAP;

        function pt(i: number, rad: number): string {
          const theta = (i / N) * 2 * Math.PI;
          return `${(CX + rad * Math.cos(theta)).toFixed(1)} ${(CY + rad * Math.sin(theta)).toFixed(1)}`;
        }

        // Build filled (sine wave) path from GAP to splitIdx - GAP
        const fPts: string[] = [];
        for (let i = filledStart; i <= filledEnd; i++) {
          const rad = R + AMP * 0.5 * (1 + Math.sin((i / N) * 2 * Math.PI * FREQ));
          fPts.push(`${i === filledStart ? 'M' : 'L'}${pt(i, rad)}`);
        }
        ring.setAttribute("d", fPts.join(''));

        // Build unfilled (circle) path from splitIdx + GAP to N - GAP
        const uPts: string[] = [];
        for (let i = unfilledStart; i <= unfilledEnd; i++) {
          uPts.push(`${i === unfilledStart ? 'M' : 'L'}${pt(i, R)}`);
        }
        ringUnfilled.setAttribute("d", uPts.join(''));

        pctText.textContent = `${usedPct}%`;
      }

      q("val-temp").textContent            = `${battery.tempCelsius.toFixed(1)}°C`;
      q("val-health").textContent           = battery.health;
      q("val-voltage").textContent           = battery.voltage || "—";
      q("val-technology").textContent        = battery.technology || "—";

      // Remove shimmer
      body.querySelectorAll<HTMLElement>(".telemetry-skeleton")
          .forEach((el) => el.classList.remove("telemetry-skeleton"));

    } catch (err) {
      toast(`Telemetry error: ${String(err)}`, "error");
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.querySelector("svg")?.classList.remove("rotating");
    }
  }

  refreshBtn.addEventListener("click", loadData);

  // Auto-load on mount
  setTimeout(loadData, 80);

  return panel;
}
