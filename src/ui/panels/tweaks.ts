import type { Adb } from "@yume-chan/adb";
import {
  setAnimationScale, getAnimationScale,
  setNightMode, getNightMode,
  setDensity, resetDensity, getCurrentDensity,
  type AnimScale,
} from "../../adb/tweaks.js";
import { toast } from "../toast.js";

// ── Panel ──────────────────────────────────────────────────────────────────

export function renderTweaksPanel(adb: Adb): HTMLElement {
  const panel = document.createElement("div");

  panel.innerHTML = `
    <div class="card">
      <div class="card-header" style="align-items: center;">
        <div class="card-title">
          <svg class="ct-icon" width="16" height="16" viewBox="0 0 37 37" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.6146 19.277L23.4918 16.6654C23.5184 16.5757 23.5716 16.4977 23.6444 16.4388C23.6996 16.3962 23.764 16.3671 23.8324 16.3539C23.9009 16.3406 23.9715 16.3435 24.0386 16.3624C24.1057 16.3813 24.1674 16.4156 24.2189 16.4626C24.2704 16.5096 24.3102 16.5679 24.3351 16.633L25.2123 19.277C25.5374 20.2699 26.0915 21.1724 26.8298 21.9116C27.5682 22.6508 28.4701 23.2059 29.4627 23.532L32.0712 24.4416C32.1605 24.4705 32.2383 24.5269 32.2935 24.6028C32.3487 24.6787 32.3784 24.7702 32.3784 24.864C32.3784 24.9579 32.3487 25.0493 32.2935 25.1252C32.2383 25.2011 32.1605 25.2575 32.0712 25.2864L29.4288 26.1636C28.4461 26.4909 27.5534 27.0429 26.8214 27.7756C26.0895 28.5084 25.5385 29.4017 25.2123 30.3847L24.3027 32.9963C24.2746 33.0864 24.2185 33.1651 24.1425 33.221C24.0665 33.2769 23.9746 33.3071 23.8803 33.3071C23.786 33.3071 23.6941 33.2769 23.6181 33.221C23.5421 33.1651 23.486 33.0864 23.4579 32.9963L22.5822 30.3523C22.2559 29.3692 21.7047 28.4757 20.9724 27.743C20.2402 27.0102 19.3471 26.4583 18.3642 26.1313L15.7233 25.254C15.6341 25.2251 15.5562 25.1687 15.501 25.0928C15.4458 25.0169 15.4161 24.9255 15.4161 24.8316C15.4161 24.7378 15.4458 24.6464 15.501 24.5705C15.5562 24.4946 15.6341 24.4381 15.7233 24.4092L18.3642 23.532C19.3562 23.2048 20.2575 22.6493 20.9957 21.9103C21.734 21.1713 22.2884 20.2693 22.6146 19.277Z"/><path d="M9.85884 10.989L10.4956 9.09122C10.5145 9.02601 10.5534 8.96842 10.6069 8.92655C10.6604 8.88469 10.7256 8.86071 10.7935 8.85798C10.8613 8.85525 10.9283 8.87392 10.9849 8.91135C11.0416 8.94878 11.085 9.00307 11.1091 9.06655L11.7474 10.989C11.9836 11.7111 12.3866 12.3675 12.9236 12.9051C13.4605 13.4426 14.1165 13.8462 14.8384 14.0831L16.7347 14.746C16.7989 14.7677 16.8547 14.8089 16.8942 14.864C16.9338 14.919 16.955 14.9851 16.955 15.0528C16.955 15.1206 16.9338 15.1867 16.8942 15.2417C16.8547 15.2967 16.7989 15.338 16.7347 15.3596L14.8153 15.9994C14.1011 16.2379 13.4521 16.6393 12.9197 17.1717C12.3872 17.7042 11.9859 18.3531 11.7474 19.0673L11.0845 20.9667C11.0628 21.0309 11.0216 21.0867 10.9665 21.1262C10.9115 21.1658 10.8454 21.187 10.7777 21.187C10.7099 21.187 10.6439 21.1658 10.5888 21.1262C10.5338 21.0867 10.4925 21.0309 10.4709 20.9667L9.83418 19.0427C9.59673 18.3279 9.19576 17.6784 8.66317 17.1458C8.13058 16.6132 7.48105 16.2122 6.76626 15.9748L4.84534 15.335C4.78113 15.3133 4.72532 15.2721 4.68579 15.217C4.64626 15.162 4.625 15.0959 4.625 15.0282C4.625 14.9604 4.64626 14.8944 4.68579 14.8393C4.72532 14.7843 4.78113 14.743 4.84534 14.7214L6.76626 14.0831C7.48786 13.8453 8.14357 13.4414 8.68069 12.904C9.21781 12.3666 9.62134 11.7107 9.85884 10.989Z"/><path d="M22.277 4.7653L22.5961 3.81563C22.6056 3.78303 22.625 3.75423 22.6518 3.7333C22.6785 3.71237 22.7111 3.70038 22.7451 3.69901C22.779 3.69765 22.8125 3.70699 22.8408 3.7257C22.8691 3.74441 22.8908 3.77156 22.9029 3.8033L23.222 4.7653C23.3401 5.12659 23.5416 5.45499 23.8103 5.7239C24.0789 5.99281 24.4071 6.19467 24.7683 6.31313L25.7164 6.64305C25.7491 6.65351 25.7776 6.67408 25.7978 6.70179C25.818 6.72949 25.8289 6.76291 25.8289 6.79722C25.8289 6.83152 25.818 6.86494 25.7978 6.89265C25.7776 6.92035 25.7491 6.94092 25.7164 6.95138L24.756 7.27051C24.3986 7.38923 24.0738 7.58971 23.8075 7.85601C23.5412 8.12231 23.3407 8.44707 23.222 8.80447L22.8921 9.75413C22.8816 9.7868 22.8611 9.81531 22.8334 9.83553C22.8056 9.85575 22.7722 9.86665 22.7379 9.86665C22.7036 9.86665 22.6702 9.85575 22.6425 9.83553C22.6148 9.81531 22.5942 9.7868 22.5838 9.75413L22.2662 8.79213C22.1475 8.43474 21.947 8.10997 21.6807 7.84368C21.4144 7.57738 21.0896 7.3769 20.7322 7.25817L19.7718 6.93905C19.7391 6.92849 19.7109 6.90733 19.6916 6.87892C19.6767 6.85845 19.6669 6.83476 19.663 6.80978C19.659 6.78479 19.661 6.75923 19.6689 6.73517C19.6767 6.71112 19.6901 6.68925 19.708 6.67137C19.7258 6.65348 19.7477 6.64008 19.7718 6.63226L20.7322 6.31313C21.0931 6.19446 21.421 5.99251 21.6894 5.72361C21.9577 5.45472 22.159 5.12643 22.277 4.7653Z"/></svg>
          System Tweaks
        </div>
        <md-outlined-button id="btn-load-tweaks">
          <svg slot="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Load Current
        </md-outlined-button>
      </div>

      <!-- ── Anim Speed ─────────────────────────────────────────────── -->
      <div class="tweak-row">
        <div class="tweak-info">
          <div class="tweak-label">Animation Speed</div>
          <div class="tweak-desc">
            Controls window, transition, and animator duration scales.
            <code style="font-family:'JetBrains Mono',monospace;font-size:10.5px;background:var(--surface-mid);padding:1px 5px;border-radius:3px;color:var(--text-muted)">settings put global *_animation_scale</code>
          </div>
        </div>
        <div class="tweak-control">
          <div class="anim-slider-group">
            <button class="anim-btn active" data-scale="0.0">Off</button>
            <button class="anim-btn" data-scale="0.5">0.5×</button>
            <button class="anim-btn" data-scale="1.0">1×</button>
          </div>
        </div>
      </div>

      <!-- ── Night Mode ────────────────────────────────────────────── -->
      <div class="tweak-row">
        <div class="tweak-info">
          <div class="tweak-label">System Night Mode</div>
          <div class="tweak-desc">
            Forces system-wide dark theme.
            <code style="font-family:'JetBrains Mono',monospace;font-size:10.5px;background:var(--surface-mid);padding:1px 5px;border-radius:3px;color:var(--text-muted)">settings put secure ui_night_mode</code>
          </div>
        </div>
        <div class="tweak-control">
          <md-switch id="toggle-night-mode"></md-switch>
        </div>
      </div>

      <!-- ── DPI ──────────────────────────────────────────────────── -->
      <div class="tweak-row">
        <div class="tweak-info">
          <div class="tweak-label">Display Density (DPI)</div>
          <div class="tweak-desc">
            Override device display density. Current: <strong id="current-dpi">—</strong> DPI.
            <code style="font-family:'JetBrains Mono',monospace;font-size:10.5px;background:var(--surface-mid);padding:1px 5px;border-radius:3px;color:var(--text-muted)">wm density &lt;value&gt;</code>
          </div>
        </div>
        <div class="tweak-control">
          <div class="dpi-row" style="display:flex; align-items:center; gap:8px;">
            <select id="dpi-preset" style="background:var(--surface-mid);border:1px solid var(--border);color:var(--text);padding:10px 12px;border-radius:12px;font-size:13px;font-family:inherit;outline:none;cursor:pointer;height:52px;box-sizing:border-box;">
              <option value="">— Preset —</option>
              <option value="320">320 (Compact)</option>
              <option value="360">360</option>
              <option value="400">400</option>
              <option value="420">420 (Default)</option>
              <option value="440">440</option>
              <option value="480">480 (Large)</option>
              <option value="560">560 (XL)</option>
            </select>
            <md-outlined-text-field type="number" id="dpi-custom" label="DPI" min="120" max="640" style="width:90px;"></md-outlined-text-field>
            <md-filled-button id="btn-set-dpi">Apply</md-filled-button>
            <md-outlined-button id="btn-reset-dpi" title="Reset to device default">Reset</md-outlined-button>
          </div>
        </div>
      </div>

      <!-- ── Advanced tweaks info ───────────────────────────────────── -->
      <div style="padding:14px 20px;background:var(--surface-mid);border-top:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text-dim);line-height:1.7">
          ⚠ DPI and animation changes take effect immediately but may require a restart for all apps to respond.
          Changes persist across reboots via Android's settings database.
          Use <strong style="color:var(--text-muted)">Reset</strong> if the UI becomes unusable.
        </div>
      </div>
    </div>
  `;

  // ── Refs ──────────────────────────────────────────────────────────────
  const animBtns    = panel.querySelectorAll<HTMLButtonElement>(".anim-btn");
  const nightToggle = panel.querySelector<any>("#toggle-night-mode")!;
  const dpiPreset   = panel.querySelector<HTMLSelectElement>("#dpi-preset")!;
  const dpiCustom   = panel.querySelector<any>("#dpi-custom")!;
  const setDpiBtn   = panel.querySelector<any>("#btn-set-dpi")!;
  const resetDpiBtn = panel.querySelector<any>("#btn-reset-dpi")!;
  const currentDpiEl = panel.querySelector<HTMLElement>("#current-dpi")!;
  const loadBtn     = panel.querySelector<any>("#btn-load-tweaks")!;

  // ── Animation buttons ─────────────────────────────────────────────────
  animBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const scale = btn.dataset["scale"] as AnimScale;
      animBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      btn.innerHTML = `
        <svg class="spinner-stroke" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
        </svg>
      `;

      const result = await setAnimationScale(adb, scale);
      toast(result.message, result.success ? "success" : "error");
      btn.textContent = scale === "0.0" ? "Off" : `${scale}×`;
    });
  });

  // ── Night mode ────────────────────────────────────────────────────────
  nightToggle.addEventListener("change", async () => {
    const mode = nightToggle.selected ? "on" : "off";
    const result = await setNightMode(adb, mode);
    toast(result.message, result.success ? "success" : "error");
    if (!result.success) nightToggle.selected = !nightToggle.selected;
  });

  // ── DPI preset sync ───────────────────────────────────────────────────
  dpiPreset.addEventListener("change", () => {
    if (dpiPreset.value) dpiCustom.value = dpiPreset.value;
  });
  dpiCustom.addEventListener("input", () => { dpiPreset.value = ""; });

  setDpiBtn.addEventListener("click", async () => {
    const val = parseInt(dpiCustom.value || dpiPreset.value, 10);
    if (isNaN(val) || val < 120 || val > 640) {
      toast("DPI must be between 120 and 640", "error"); return;
    }
    setDpiBtn.disabled = true;
    setDpiBtn.innerHTML = `
      <svg class="spinner-stroke" slot="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
      </svg>
      Applying
    `;

    const result = await setDensity(adb, val);
    toast(result.message, result.success ? "success" : "error");
    if (result.success) currentDpiEl.textContent = String(val);

    setDpiBtn.disabled = false;
    setDpiBtn.textContent = "Apply";
  });

  resetDpiBtn.addEventListener("click", async () => {
    if (!confirm("Reset display density to device default?")) return;
    resetDpiBtn.disabled = true;

    const result = await resetDensity(adb);
    toast(result.message, result.success ? "success" : "error");

    if (result.success) {
      const dpi = await getCurrentDensity(adb);
      currentDpiEl.textContent = dpi ? String(dpi) : "default";
      dpiCustom.value = "";
      dpiPreset.value = "";
    }
    resetDpiBtn.disabled = false;
  });

  // ── Load current values ───────────────────────────────────────────────
  async function loadCurrentValues(): Promise<void> {
    loadBtn.disabled = true;
    loadBtn.innerHTML = `
      <svg class="spinner-stroke" slot="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <circle cx="12" cy="12" r="9" stroke-dasharray="40 10"/>
      </svg>
      Loading…
    `;

    try {
      const [animScale, nightMode, dpi] = await Promise.all([
        getAnimationScale(adb),
        getNightMode(adb),
        getCurrentDensity(adb),
      ]);

      // Sync animation buttons
      animBtns.forEach((b) => {
        b.classList.toggle("active", b.dataset["scale"] === animScale);
      });

      // Sync night mode toggle
      nightToggle.selected = nightMode === "on";

      // Sync DPI display
      if (dpi) {
        currentDpiEl.textContent = String(dpi);
        dpiCustom.value = String(dpi);
      }

      toast("Loaded current device settings", "info", { duration: 2000 });
    } catch (err) {
      toast(`Failed to load settings: ${String(err)}`, "error");
    } finally {
      loadBtn.disabled = false;
      loadBtn.innerHTML = `<svg slot="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Load Current`;
    }
  }

  loadBtn.addEventListener("click", loadCurrentValues);

  // Auto-load on mount
  setTimeout(loadCurrentValues, 100);

  return panel;
}
