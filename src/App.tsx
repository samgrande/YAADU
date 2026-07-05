import { useReducer, useEffect, useState } from "react";
import { AppContext } from "./context.js";
import { initialState, appReducer } from "./state.js";
import { ConnectScreen } from "./ui/panels/ConnectScreen.js";
import { Dashboard } from "./ui/Dashboard.js";
import { ToastContainer } from "./ui/Toast.js";
import { applyYaaduTheme, loadStoredTheme } from "./theme.js";

// Import Material Web Components
import "@material/web/button/filled-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/button/text-button.js";
import "@material/web/switch/switch.js";
import "@material/web/progress/linear-progress.js";
import "@material/web/progress/circular-progress.js";
import "@material/web/list/list.js";
import "@material/web/list/list-item.js";
import "@material/web/divider/divider.js";
import "@material/web/textfield/outlined-text-field.js";
import "@material/web/iconbutton/icon-button.js";
import "@material/web/select/outlined-select.js";
import "@material/web/select/select-option.js";
import "@material/web/dialog/dialog.js";

import { styles as typescaleStyles } from "@material/web/typography/md-typescale-styles.js";
if (typescaleStyles.styleSheet) {
  document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
}


function useIsSmallScreen(breakpoint = 1024) {
  const [small, setSmall] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setSmall(e.matches);
    mq.addEventListener("change", handler);
    setSmall(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return small;
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isSmallScreen = useIsSmallScreen();

  useEffect(() => {
    applyYaaduTheme(loadStoredTheme());

    // Gradient map filter for SVG illustrations
    const parseCssColor = (value: string): { r: number; g: number; b: number } | null => {
      const hex = value.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (hex) {
        return {
          r: parseInt(hex[1], 16) / 255,
          g: parseInt(hex[2], 16) / 255,
          b: parseInt(hex[3], 16) / 255,
        };
      }
      const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/i);
      if (rgb) {
        return {
          r: parseInt(rgb[1]) / 255,
          g: parseInt(rgb[2]) / 255,
          b: parseInt(rgb[3]) / 255,
        };
      }
      return null;
    };

    const updateFilter = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--md-sys-color-primary');
      const color = parseCssColor(raw.trim());
      if (!color) return;
      const setTableValue = (id: string, ...values: number[]) => {
        document.getElementById(id)?.setAttribute('tableValues', values.join(' '));
      };
      setTableValue('android-func-r', 0, color.r, 1);
      setTableValue('android-func-g', 0, color.g, 1);
      setTableValue('android-func-b', 0, color.b, 1);
    };

    updateFilter();
    window.addEventListener('themeChange', updateFilter);

    // Global Ripple Animation
    const handleRipple = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const webButton = target.closest("md-filled-button, md-filled-tonal-button, md-outlined-button, md-text-button") as HTMLElement | null;
      const button = webButton || target.closest("button, .anim-btn, .nav-item-m3, .telemetry-skeleton") as HTMLElement | null;
      if (!button || button.hasAttribute("disabled") || button.classList.contains("disabled")) return;

      const ripple = document.createElement("span");
      ripple.className = "m3-ripple";

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      button.style.position = "relative";
      button.style.overflow = "hidden";
      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 1200);
    };

    document.addEventListener("mousedown", handleRipple);
    return () => {
      document.removeEventListener("mousedown", handleRipple);
      window.removeEventListener('themeChange', updateFilter);
    };
  }, []);

  // Lock app on small screens
  if (isSmallScreen) {
    return (
      <div className="small-screen-lock">
        <div className="small-screen-logo">
          <svg width="100%" height="100%" viewBox="0 0 512 170" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M86 120C88.0375 95.776 95.4517 73.4768 108.243 53.1018C121.034 32.7268 138.069 16.54 159.35 4.54144L134.221 -38.9253C132.863 -40.9628 132.523 -43.1134 133.202 -45.3773C133.881 -47.6412 135.353 -49.3391 137.617 -50.4711C139.428 -51.603 141.465 -51.8294 143.729 -51.1503C145.993 -50.4711 147.804 -49.1127 149.163 -47.0753L174.292 -3.60854C193.761 -11.7586 214.136 -15.8335 235.417 -15.8335C256.697 -15.8335 277.072 -11.7586 296.542 -3.60854L321.671 -47.0753C323.029 -49.1127 324.84 -50.4711 327.104 -51.1503C329.368 -51.8294 331.406 -51.603 333.217 -50.4711C335.481 -49.3391 336.952 -47.6412 337.631 -45.3773C338.31 -43.1134 337.971 -40.9628 336.613 -38.9253L311.483 4.54144C332.764 16.54 349.8 32.7268 362.591 53.1018C375.382 73.4768 382.796 95.776 384.833 120H86Z" fill="var(--md-sys-color-primary)"/>
          </svg>
        </div>
        <div className="small-screen-title">Oops</div>
        <div className="small-screen-text">This app cannot be accessed from a phone or tablet. Please use a desktop browser.</div>
      </div>
    );
  }

  // Check WebUSB support early
  if (!navigator.usb) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>WebUSB Not Available</div>
        <div style={{ maxWidth: "340px", lineHeight: 1.7 }}>
          YAADU requires <strong>WebUSB API</strong> support.<br />
          Please use <strong>Chrome</strong> or <strong>Edge 89+</strong> on desktop,
          and make sure the page is served over <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12px", background: "var(--surface-mid)", padding: "2px 6px", borderRadius: "4px" }}>localhost</code> or HTTPS.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden SVG filter for gradient map on SVGs throughout the app */}
      <div style={{ display: 'none' }}>
        <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="android-theme-map" color-interpolation-filters="sRGB">
              <feColorMatrix type="saturate" values="0.2" in="SourceGraphic" />
              <feComponentTransfer>
                <feFuncR id="android-func-r" type="table" tableValues="0 0 1" />
                <feFuncG id="android-func-g" type="table" tableValues="0 0 1" />
                <feFuncB id="android-func-b" type="table" tableValues="0 0 1" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </div>
      <AppContext.Provider value={{ state, dispatch }}>
        {state.connection === "connected" && state.adb ? (
          <Dashboard adb={state.adb} />
        ) : (
          <ConnectScreen />
        )}
        <ToastContainer />
      </AppContext.Provider>
    </>
  );
}
