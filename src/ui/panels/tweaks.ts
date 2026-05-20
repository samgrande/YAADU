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
          <svg class="ct-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/></svg>
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
