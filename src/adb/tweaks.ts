/**
 * Module 5: System Tweak Panel
 *
 * Injects settings directly into Android's database via:
 *   settings put global  window_animation_scale     <val>
 *   settings put global  transition_animation_scale <val>
 *   settings put secure  ui_night_mode              <1|2>
 *   wm density           <dpi>
 *   wm density reset
 */

import type { Adb } from "@yume-chan/adb";
import { shell } from "./helpers.js";

// ── Types ──────────────────────────────────────────────────────────────────

export type AnimScale = "0.0" | "0.5" | "1.0";
export type NightMode = "on" | "off";

export interface TweakResult {
  success: boolean;
  message: string;
}

// ── Animation Scale ────────────────────────────────────────────────────────

/**
 * Sets window AND transition animation scales simultaneously.
 * Valid values: "0.0" (off), "0.5" (fast), "1.0" (normal)
 */
export async function setAnimationScale(
  adb: Adb,
  scale: AnimScale
): Promise<TweakResult> {
  try {
    // Apply both scales in parallel
    await Promise.all([
      shell(adb, `settings put global window_animation_scale ${scale}`),
      shell(adb, `settings put global transition_animation_scale ${scale}`),
      shell(adb, `settings put global animator_duration_scale ${scale}`),
    ]);
    const label = scale === "0.0" ? "disabled" : `${scale}×`;
    return { success: true, message: `Animations set to ${label}` };
  } catch (err) {
    return { success: false, message: `Failed to set animations: ${String(err)}` };
  }
}

export async function getAnimationScale(adb: Adb): Promise<AnimScale> {
  try {
    const raw = await shell(adb, "settings get global window_animation_scale");
    const parsed = parseFloat(raw);
    if (parsed === 0)   return "0.0";
    if (parsed <= 0.5)  return "0.5";
    return "1.0";
  } catch {
    return "1.0";
  }
}

// ── Night Mode ─────────────────────────────────────────────────────────────

/**
 * Toggles system dark mode.
 *   On  → ui_night_mode = 2 (force dark)
 *   Off → ui_night_mode = 1 (force light)
 */
export async function setNightMode(
  adb: Adb,
  mode: NightMode
): Promise<TweakResult> {
  const value = mode === "on" ? 2 : 1;
  try {
    await shell(adb, `settings put secure ui_night_mode ${value}`);
    // Also apply via cmd uimode on Android 10+
    await shell(adb, `cmd uimode night ${mode === "on" ? "yes" : "no"}`).catch(() => {});
    return { success: true, message: `Night mode ${mode === "on" ? "enabled" : "disabled"}` };
  } catch (err) {
    return { success: false, message: `Failed to set night mode: ${String(err)}` };
  }
}

export async function getNightMode(adb: Adb): Promise<NightMode> {
  try {
    const raw = await shell(adb, "settings get secure ui_night_mode");
    return raw.trim() === "2" ? "on" : "off";
  } catch {
    return "off";
  }
}

// ── Display Density ────────────────────────────────────────────────────────

export interface DpiResult extends TweakResult {
  currentDpi?: number;
}

export async function setDensity(adb: Adb, dpi: number): Promise<DpiResult> {
  if (dpi < 120 || dpi > 640) {
    return { success: false, message: "DPI must be between 120 and 640." };
  }
  try {
    await shell(adb, `wm density ${dpi}`);
    return { success: true, message: `Display density set to ${dpi} DPI`, currentDpi: dpi };
  } catch (err) {
    return { success: false, message: `Failed to set DPI: ${String(err)}` };
  }
}

export async function resetDensity(adb: Adb): Promise<DpiResult> {
  try {
    await shell(adb, "wm density reset");
    return { success: true, message: "Display density reset to default" };
  } catch (err) {
    return { success: false, message: `Failed to reset DPI: ${String(err)}` };
  }
}

export async function getCurrentDensity(adb: Adb): Promise<number | null> {
  try {
    const out = await shell(adb, "wm density");
    // "Physical density: 420\nOverride density: 400" or just "Physical density: 420"
    const override = out.match(/Override density:\s*(\d+)/);
    const physical = out.match(/Physical density:\s*(\d+)/);
    const match = override ?? physical;
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}
