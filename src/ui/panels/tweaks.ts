import type { Adb } from "@yume-chan/adb";
import {
  setAnimationScale, getAnimationScale,
  setNightMode, getNightMode,
  setDensity, resetDensity, getCurrentDensity,
  type AnimScale,
} from "../../adb/tweaks.js";
import { toast } from "../toast.js";
import animSvg from "../../assets/illus-anim.svg?raw";
import themeSvg from "../../assets/illus-theme.svg?raw";
import densitySvg from "../../assets/illus-density.svg?raw";

const SPARKLE_ICON = `<svg width="20" height="20" viewBox="0 0 37 37" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.6146 19.277L23.4918 16.6654C23.5184 16.5757 23.5716 16.4977 23.6444 16.4388C23.6996 16.3962 23.764 16.3671 23.8324 16.3539C23.9009 16.3406 23.9715 16.3435 24.0386 16.3624C24.1057 16.3813 24.1674 16.4156 24.2189 16.4626C24.2704 16.5096 24.3102 16.5679 24.3351 16.633L25.2123 19.277C25.5374 20.2699 26.0915 21.1724 26.8298 21.9116C27.5682 22.6508 28.4701 23.2059 29.4627 23.532L32.0712 24.4416C32.1605 24.4705 32.2383 24.5269 32.2935 24.6028C32.3487 24.6787 32.3784 24.7702 32.3784 24.864C32.3784 24.9579 32.3487 25.0493 32.2935 25.1252C32.2383 25.2011 32.1605 25.2575 32.0712 25.2864L29.4288 26.1636C28.4461 26.4909 27.5534 27.0429 26.8214 27.7756C26.0895 28.5084 25.5385 29.4017 25.2123 30.3847L24.3027 32.9963C24.2746 33.0864 24.2185 33.1651 24.1425 33.221C24.0665 33.2769 23.9746 33.3071 23.8803 33.3071C23.786 33.3071 23.6941 33.2769 23.6181 33.221C23.5421 33.1651 23.486 33.0864 23.4579 32.9963L22.5822 30.3523C22.2559 29.3692 21.7047 28.4757 20.9724 27.743C20.2402 27.0102 19.3471 26.4583 18.3642 26.1313L15.7233 25.254C15.6341 25.2251 15.5562 25.1687 15.501 25.0928C15.4458 25.0169 15.4161 24.9255 15.4161 24.8316C15.4161 24.7378 15.4458 24.6464 15.501 24.5705C15.5562 24.4946 15.6341 24.4381 15.7233 24.4092L18.3642 23.532C19.3562 23.2048 20.2575 22.6493 20.9957 21.9103C21.734 21.1713 22.2884 20.2693 22.6146 19.277Z"/><path d="M9.85884 10.989L10.4956 9.09122C10.5145 9.02601 10.5534 8.96841 10.6069 8.92655C10.6604 8.88469 10.7256 8.86071 10.7935 8.85798C10.8613 8.85525 10.9283 8.87392 10.9849 8.91135C11.0416 8.94878 11.085 9.00307 11.1091 9.06655L11.7474 10.989C11.9836 11.7111 12.3866 12.3675 12.9236 12.9051C13.4605 13.4426 14.1165 13.8462 14.8384 14.0831L16.7347 14.746C16.7989 14.7677 16.8547 14.8089 16.8942 14.864C16.9338 14.919 16.955 14.9851 16.955 15.0528C16.955 15.1206 16.9338 15.1867 16.8942 15.2417C16.8547 15.2967 16.7989 15.338 16.7347 15.3596L14.8153 15.9994C14.1011 16.2379 13.4521 16.6393 12.9197 17.1717C12.3872 17.7042 11.9859 18.3531 11.7474 19.0673L11.0845 20.9667C11.0628 21.0309 11.0216 21.0867 10.9665 21.1262C10.9115 21.1658 10.8454 21.187 10.7777 21.187C10.7099 21.187 10.6439 21.1658 10.5888 21.1262C10.5338 21.0867 10.4925 21.0309 10.4709 20.9667L9.83418 19.0427C9.59673 18.3279 9.19576 17.6784 8.66317 17.1458C8.13058 16.6132 7.48105 16.2122 6.76626 15.9748L4.84534 15.335C4.78113 15.3133 4.72532 15.2721 4.68579 15.217C4.64626 15.162 4.625 15.0959 4.625 15.0282C4.625 14.9604 4.64626 14.8944 4.68579 14.8393C4.72532 14.7843 4.78113 14.743 4.84534 14.7214L6.76626 14.0831C7.48786 13.8453 8.14357 13.4414 8.68069 12.904C9.21781 12.3666 9.62134 11.7107 9.85884 10.989Z"/></svg>`;

const RELOAD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

const RESET_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;

export function renderTweaksPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "tweaks-root";

  panel.innerHTML = `
    <div class="page-header">
      <div class="page-title-row">
        <div class="page-title-icon">${SPARKLE_ICON}</div>
        <span class="page-title">System Tweaks</span>
      </div>
      <button class="btn-refresh" id="btn-load-tweaks">
        ${RELOAD_ICON}
        <span>Reload</span>
      </button>
    </div>

    <div class="tweaks-grid">

      <!-- Animation Speed Card -->
      <div class="tweak-card">
        <div class="tweak-card-illus">
          ${animSvg}
        </div>
        <div class="tweak-card-body">
          <div class="tweak-card-title">Animation Speed</div>
          <div class="tweak-card-desc">Controls window, transition, and animator duration scales.</div>
          <div class="tweak-card-controls">
            <div class="tweak-pill-group">
              <button class="tweak-pill active" data-scale="0.0">OFF</button>
              <button class="tweak-pill" data-scale="0.5">0.5 X</button>
              <button class="tweak-pill" data-scale="1.0">1 X</button>
            </div>
          </div>
        </div>
      </div>

      <!-- System Theme Card -->
      <div class="tweak-card">
        <div class="tweak-card-illus">
          ${themeSvg}
        </div>
        <div class="tweak-card-body">
          <div class="tweak-card-title">System Theme</div>
          <div class="tweak-card-desc">Forces system-wide dark theme.</div>
          <div class="tweak-card-controls">
            <div class="tweak-pill-group">
              <button class="tweak-pill" id="btn-day" data-mode="off">DAY</button>
              <button class="tweak-pill active" id="btn-night" data-mode="on">NIGHT</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Display Density Card -->
      <div class="tweak-card">
        <div class="tweak-card-illus tweak-card-illus--density">
          ${densitySvg}
        </div>
        <div class="tweak-card-body">
          <div class="tweak-card-title">Display Density</div>
          <div class="tweak-card-desc">Override device display density. Current: <strong id="current-dpi">—</strong> DPI</div>
          <div class="tweak-card-controls">
            <div class="density-controls">
              <div class="tweak-dropdown tweak-dropdown--up" id="dpi-preset">
                <button class="tweak-dropdown-trigger" type="button">
                  <span>Presets</span>
                  <svg class="tweak-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div class="tweak-dropdown-menu">
                  <button class="tweak-dropdown-option" type="button" data-value="">Presets</button>
                  <button class="tweak-dropdown-option" type="button" data-value="320">320 – Compact</button>
                  <button class="tweak-dropdown-option" type="button" data-value="360">360</button>
                  <button class="tweak-dropdown-option" type="button" data-value="400">400</button>
                  <button class="tweak-dropdown-option" type="button" data-value="420">420 – Default</button>
                  <button class="tweak-dropdown-option" type="button" data-value="440">440</button>
                  <button class="tweak-dropdown-option" type="button" data-value="480">480 – Large</button>
                  <button class="tweak-dropdown-option" type="button" data-value="560">560 – XL</button>
                </div>
              </div>
              <input type="number" class="tweak-dpi-input" id="dpi-custom" placeholder="DPI" min="120" max="640" />
              <button class="tweak-pill tweak-pill--filled" id="btn-set-dpi">APPLY</button>
              <button class="tweak-icon-btn" id="btn-reset-dpi" title="Reset to device default">
                ${RESET_ICON}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // ── Refs ──────────────────────────────────────────────────────────────
  const animBtns     = panel.querySelectorAll<HTMLButtonElement>(".tweak-pill[data-scale]");
  const themeBtns    = panel.querySelectorAll<HTMLButtonElement>(".tweak-pill[data-mode]");
  const dpiDropdown  = panel.querySelector<HTMLElement>("#dpi-preset")!;
  const dpiTrigger   = dpiDropdown.querySelector<HTMLButtonElement>(".tweak-dropdown-trigger")!;
  const dpiLabel     = dpiTrigger.querySelector("span")!;
  const dpiOpts      = dpiDropdown.querySelectorAll<HTMLButtonElement>(".tweak-dropdown-option");
  let dpiValue = "";
  const dpiCustom    = panel.querySelector<HTMLInputElement>("#dpi-custom")!;
  const setDpiBtn    = panel.querySelector<HTMLButtonElement>("#btn-set-dpi")!;
  const resetDpiBtn  = panel.querySelector<HTMLButtonElement>("#btn-reset-dpi")!;
  const currentDpiEl = panel.querySelector<HTMLElement>("#current-dpi")!;
  const loadBtn      = panel.querySelector<HTMLButtonElement>("#btn-load-tweaks")!;

  // ── Animation buttons ─────────────────────────────────────────────────
  animBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const scale = btn.dataset["scale"] as AnimScale;
      animBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const label = btn.textContent!;
      btn.innerHTML = `<svg class="spinner-stroke" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/></svg>`;
      const result = await setAnimationScale(adb, scale);
      toast(result.message, result.success ? "success" : "error");
      btn.textContent = label;
    });
  });

  // ── Theme buttons ─────────────────────────────────────────────────────
  themeBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const mode = btn.dataset["mode"] as "on" | "off";
      const result = await setNightMode(adb, mode);
      toast(result.message, result.success ? "success" : "error");
      if (result.success) {
        themeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });

  // ── DPI preset → input sync ───────────────────────────────────────────
  dpiTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dpiDropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => { dpiDropdown.classList.remove("open"); });
  dpiOpts.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = opt.dataset["value"] ?? "";
      dpiValue = val;
      dpiLabel.textContent = opt.textContent;
      dpiDropdown.classList.remove("open");
      if (val) dpiCustom.value = val;
    });
  });
  dpiCustom.addEventListener("input", () => { dpiValue = ""; dpiLabel.textContent = "Presets"; });

  // ── Apply DPI ─────────────────────────────────────────────────────────
  setDpiBtn.addEventListener("click", async () => {
    const val = parseInt(dpiCustom.value || dpiValue, 10);
    if (isNaN(val) || val < 120 || val > 640) {
      toast("DPI must be between 120 and 640", "error"); return;
    }
    setDpiBtn.disabled = true;
    setDpiBtn.textContent = "…";
    const result = await setDensity(adb, val);
    toast(result.message, result.success ? "success" : "error");
    if (result.success) currentDpiEl.textContent = String(val);
    setDpiBtn.disabled = false;
    setDpiBtn.textContent = "APPLY";
  });

  // ── Reset DPI ─────────────────────────────────────────────────────────
  resetDpiBtn.addEventListener("click", async () => {
    if (!confirm("Reset display density to device default?")) return;
    resetDpiBtn.disabled = true;
    const result = await resetDensity(adb);
    toast(result.message, result.success ? "success" : "error");
    if (result.success) {
      const dpi = await getCurrentDensity(adb);
      currentDpiEl.textContent = dpi ? String(dpi) : "default";
      dpiCustom.value = "";
      dpiValue = "";
      dpiLabel.textContent = "Presets";
    }
    resetDpiBtn.disabled = false;
  });

  // ── Load current values ───────────────────────────────────────────────
  async function loadCurrentValues(): Promise<void> {
    loadBtn.disabled = true;
    try {
      const [animScale, nightMode, dpi] = await Promise.all([
        getAnimationScale(adb),
        getNightMode(adb),
        getCurrentDensity(adb),
      ]);
      animBtns.forEach((b) => b.classList.toggle("active", b.dataset["scale"] === animScale));
      themeBtns.forEach((b) => b.classList.toggle("active", b.dataset["mode"] === nightMode));
      if (dpi) {
        currentDpiEl.textContent = String(dpi);
        dpiCustom.value = String(dpi);
      }
      toast("Loaded current device settings", "info", { duration: 2000 });
    } catch (err) {
      toast(`Failed to load settings: ${String(err)}`, "error");
    } finally {
      loadBtn.disabled = false;
    }
  }

  loadBtn.addEventListener("click", loadCurrentValues);
  setTimeout(loadCurrentValues, 100);

  return panel;
}
