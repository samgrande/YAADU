import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Adb } from "@yume-chan/adb";
import {
  setAnimationScale, getAnimationScale,
  setNightMode, getNightMode,
  setDensity, resetDensity, getCurrentDensity,
  type AnimScale,
} from "../../adb/tweaks.js";
import { toast } from "../Toast.js";
import { normalizeError } from "../../adb/errors.js";
import { LogcatConsole } from "./LogcatConsole.js";
import { ErrorBoundary } from "../ErrorBoundary.js";
import animSvg from "../../assets/illus-anim.svg?raw";
import themeSvg from "../../assets/illus-theme.svg?raw";
import densitySvg from "../../assets/illus-density.svg?raw";

const SPARKLE_ICON = (
  <svg width="33" height="36" viewBox="0 0 33 36" fill="none" stroke-width="4" stroke="currentColor" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.46484 22.8447L11.4102 10.5625V1.5H21.2698V10.5625L27.1938 22.8447"  />
<path d="M3.01628 34.0696C2.37485 33.7591 1.88303 33.2065 1.64901 32.5334C1.415 31.8603 1.45795 31.1218 1.76843 30.4804L5.46518 22.8447C5.46518 22.8447 11.3949 26.9495 16.3206 22.8447C21.2463 18.74 27.1949 22.8447 27.1949 22.8447L30.881 30.4837C31.0786 30.8934 31.169 31.3465 31.1437 31.8006C31.1184 32.2548 30.9782 32.6951 30.7362 33.0803C30.4943 33.4654 30.1586 33.7829 29.7604 34.0029C29.3623 34.2229 28.9149 34.3382 28.46 34.338H4.18695C3.7814 34.338 3.3816 34.2461 3.01628 34.0696Z"/>
</svg>

);

const RESET_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

interface Props {
  adb: Adb;
}

export function TweaksPanel({ adb }: Props) {
  const [animationScale, setAnimationScaleState] = useState<AnimScale>("1.0");
  const [nightMode, setNightModeState] = useState<"on" | "off">("off");
  const [currentDpi, setCurrentDpi] = useState<string>("—");
  const [customDpi, setCustomDpi] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [dropdownLabel, setDropdownLabel] = useState<string>("420");
  const [isApplyingDpi, setIsApplyingDpi] = useState<boolean>(false);
  const [isResettingDpi, setIsResettingDpi] = useState<boolean>(false);
  const isLoadingSettingsRef = useRef(false);
  const [pendingScaleChange, setPendingScaleChange] = useState<AnimScale | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadCurrentValues = useCallback(async () => {
    isLoadingSettingsRef.current = true;
    try {
      const [animScale, mode, dpi] = await Promise.all([
        getAnimationScale(adb),
        getNightMode(adb),
        getCurrentDensity(adb),
      ]);
      setAnimationScaleState(animScale);
      setNightModeState(mode);
      if (dpi) {
        setCurrentDpi(String(dpi));
        setCustomDpi(String(dpi));
      }
    } catch (err) {
      toast(`Failed to load settings: ${normalizeError(err)}`, "error");
    } finally {
      isLoadingSettingsRef.current = false;
    }
  }, [adb]);

  useEffect(() => {
    loadCurrentValues();
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [loadCurrentValues]);

  const handleAnimationScaleChange = async (scale: AnimScale) => {
    setPendingScaleChange(scale);
    try {
      const result = await setAnimationScale(adb, scale);
      toast(result.message, result.success ? "success" : "error");
      if (result.success) {
        setAnimationScaleState(scale);
      }
    } catch (err) {
      toast(`Failed to set animations: ${normalizeError(err)}`, "error");
    } finally {
      setPendingScaleChange(null);
    }
  };

  const handleNightModeChange = async (mode: "on" | "off") => {
    try {
      const result = await setNightMode(adb, mode);
      toast(result.message, result.success ? "success" : "error");
      if (result.success) {
        setNightModeState(mode);
      }
    } catch (err) {
      toast(`Failed to set night mode: ${normalizeError(err)}`, "error");
    }
  };

  const handleApplyDpi = async () => {
    const val = parseInt(customDpi, 10);
    if (isNaN(val) || val < 120 || val > 640) {
      toast("DPI must be between 120 and 640", "error");
      return;
    }
    setIsApplyingDpi(true);
    try {
      const result = await setDensity(adb, val);
      toast(result.message, result.success ? "success" : "error");
      if (result.success) {
        setCurrentDpi(String(val));
      }
    } catch (err) {
      toast(`Failed to set DPI: ${normalizeError(err)}`, "error");
    } finally {
      setIsApplyingDpi(false);
    }
  };

  const handleResetDpi = async () => {
    setIsResettingDpi(true);
    try {
      const result = await resetDensity(adb);
      toast(result.message, result.success ? "success" : "error");
      if (result.success) {
        const dpi = await getCurrentDensity(adb);
        setCurrentDpi(dpi ? String(dpi) : "default");
        setCustomDpi("");
                        setDropdownLabel("420");
      }
    } catch (err) {
      toast(`Failed to reset DPI: ${normalizeError(err)}`, "error");
    } finally {
      setIsResettingDpi(false);
    }
  };

  const handlePresetSelect = (e: React.MouseEvent, val: string, label: string) => {
    e.stopPropagation();
    setDropdownLabel(label);
    setDropdownOpen(false);
    if (val) {
      setCustomDpi(val);
    }
  };

  return (
    <div className="tweaks-root">
      <div className="page-header">
        <div className="page-title-row">
          <div className="page-title-icon">{SPARKLE_ICON}</div>
          <span className="page-title">Labs</span>
        </div>
      </div>

      <div className="tweaks-grid">
        {/* Animation Speed Card */}
        <div className="tweak-card">
          <div
            className="tweak-card-illus"
            dangerouslySetInnerHTML={{ __html: animSvg }}
          />
          <div className="tweak-card-body">
            <div className="tweak-card-title">Animation Speed</div>
            <div className="tweak-card-desc">Controls window, transition, and animator duration scales.</div>
            <div className="tweak-card-controls">
              <div className="tweak-pill-group">
                <button
                  className={`tweak-pill ${animationScale === "0.0" ? "active" : ""}`}
                  onClick={() => handleAnimationScaleChange("0.0")}
                  disabled={pendingScaleChange !== null}
                >
                  {pendingScaleChange === "0.0" ? (
                    <svg className="spinner-stroke" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" strokeDasharray="40 10"/>
                    </svg>
                  ) : (
                    "OFF"
                  )}
                </button>
                <button
                  className={`tweak-pill ${animationScale === "0.5" ? "active" : ""}`}
                  onClick={() => handleAnimationScaleChange("0.5")}
                  disabled={pendingScaleChange !== null}
                >
                  {pendingScaleChange === "0.5" ? (
                    <svg className="spinner-stroke" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" strokeDasharray="40 10"/>
                    </svg>
                  ) : (
                    "0.5 X"
                  )}
                </button>
                <button
                  className={`tweak-pill ${animationScale === "1.0" ? "active" : ""}`}
                  onClick={() => handleAnimationScaleChange("1.0")}
                  disabled={pendingScaleChange !== null}
                >
                  {pendingScaleChange === "1.0" ? (
                    <svg className="spinner-stroke" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" strokeDasharray="40 10"/>
                    </svg>
                  ) : (
                    "1 X"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Theme Card */}
        <div className="tweak-card">
          <div
            className="tweak-card-illus"
            dangerouslySetInnerHTML={{ __html: themeSvg }}
          />
          <div className="tweak-card-body">
            <div className="tweak-card-title">System Theme</div>
            <div className="tweak-card-desc">Forces system-wide dark theme.</div>
            <div className="tweak-card-controls">
              <div className="tweak-pill-group">
                <button
                  className={`tweak-pill ${nightMode === "off" ? "active" : ""}`}
                  id="btn-day"
                  onClick={() => handleNightModeChange("off")}
                >
                  DAY
                </button>
                <button
                  className={`tweak-pill ${nightMode === "on" ? "active" : ""}`}
                  id="btn-night"
                  onClick={() => handleNightModeChange("on")}
                >
                  NIGHT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Display Density Card */}
        <div className="tweak-card">
          <div
            className="tweak-card-illus tweak-card-illus--density"
            dangerouslySetInnerHTML={{ __html: densitySvg }}
          />
          <div className="tweak-card-body">
            <div className="tweak-card-title">Display Density</div>
            <div className="tweak-card-desc">
              Override device display density. Current: <strong id="current-dpi">{currentDpi}</strong> DPI
            </div>
            <div className="tweak-card-controls">
              <div className="density-controls">
                <div className={`tweak-dropdown tweak-dropdown--up ${dropdownOpen ? "open" : ""}`} id="dpi-preset" ref={dropdownRef}>
                  <button
                    className="tweak-dropdown-trigger"
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span>{dropdownLabel}</span>
                    <svg className="tweak-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <div className="tweak-dropdown-menu">
                    <button className="tweak-dropdown-option" type="button" onClick={(e) => handlePresetSelect(e, "", "420")}>420</button>
                    <button className="tweak-dropdown-option" type="button" onClick={(e) => handlePresetSelect(e, "320", "320 – Compact")}>320 – Compact</button>
                    <button className="tweak-dropdown-option" type="button" onClick={(e) => handlePresetSelect(e, "360", "360")}>360</button>
                    <button className="tweak-dropdown-option" type="button" onClick={(e) => handlePresetSelect(e, "400", "400")}>400</button>
                    <button className="tweak-dropdown-option" type="button" onClick={(e) => handlePresetSelect(e, "420", "420 – Default")}>420 – Default</button>
                  </div>
                </div>
                <input
                  type="number"
                  className="tweak-dpi-input"
                  id="dpi-custom"
                  placeholder="DPI"
                  min="120"
                  max="640"
                  value={customDpi}
                  onChange={(e) => {
                    setCustomDpi(e.target.value);
        setDropdownLabel("420");
                  }}
                />
                <button
                  className="tweak-pill tweak-pill--filled"
                  id="btn-set-dpi"
                  onClick={handleApplyDpi}
                  disabled={isApplyingDpi}
                >
                  {isApplyingDpi ? "…" : "APPLY"}
                </button>
                <button
                  className="tweak-icon-btn"
                  id="btn-reset-dpi"
                  aria-label="Reset display density to default"
                  title="Reset to device default"
                  onClick={handleResetDpi}
                  disabled={isResettingDpi}
                >
                  {RESET_ICON}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ErrorBoundary><LogcatConsole adb={adb} /></ErrorBoundary>
    </div>
  );
}
