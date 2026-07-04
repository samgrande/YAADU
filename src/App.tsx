import { useReducer, useEffect } from "react";
import { AppContext } from "./context.js";
import { initialState, appReducer } from "./state.js";
import { ConnectScreen } from "./ui/panels/ConnectScreen.js";
import { Dashboard } from "./ui/Dashboard.js";
import { ToastContainer } from "./ui/Toast.js";

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

import { themeFromSourceColor, argbFromHex, applyTheme } from "@material/material-color-utilities";

const SOURCE_COLOR = "#376A3E";

function generateAndApplyTheme(): void {
  const theme = themeFromSourceColor(argbFromHex(SOURCE_COLOR));
  applyTheme(theme, { target: document.documentElement, dark: false });
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    generateAndApplyTheme();

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
    };
  }, []);

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
    <AppContext.Provider value={{ state, dispatch }}>
      {state.connection === "connected" && state.adb ? (
        <Dashboard adb={state.adb} />
      ) : (
        <ConnectScreen />
      )}
      <ToastContainer />
    </AppContext.Provider>
  );
}
