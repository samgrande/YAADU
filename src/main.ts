/**
 * YAADU — Yet Another Android Debug Utility
 * Main entry point
 *
 * Bootstraps the app, manages connect ↔ dashboard transitions,
 * and ties together all modules.
 */

import { state } from "./state.js";
import { renderConnectScreen } from "./ui/panels/connect.js";
import { renderDashboard }     from "./ui/dashboard.js";

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

import {styles as typescaleStyles} from "@material/web/typography/md-typescale-styles.js";
if (typescaleStyles.styleSheet) {
  document.adoptedStyleSheets.push(typescaleStyles.styleSheet);
}

import { themeFromSourceColor, argbFromHex, applyTheme } from "@material/material-color-utilities";

// ── Material 3 Theme Generator ────────────────────────────────────────────

const SOURCE_COLOR = "#376A3E";

function generateAndApplyTheme(): void {
  const theme = themeFromSourceColor(argbFromHex(SOURCE_COLOR));
  applyTheme(theme, { target: document.documentElement, dark: false });
}

generateAndApplyTheme();

// ── App Bootstrap ──────────────────────────────────────────────────────────

function boot(): void {
  const root = document.getElementById("app")!;

  // Check WebUSB support early
  if (!navigator.usb) {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;color:var(--text-muted);font-size:14px;text-align:center;padding:20px">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--text)">WebUSB Not Available</div>
        <div style="max-width:340px;line-height:1.7">
          YAADU requires <strong>WebUSB API</strong> support.<br/>
          Please use <strong>Chrome</strong> or <strong>Edge 89+</strong> on desktop,
          and make sure the page is served over <code style="font-family:'JetBrains Mono',monospace;font-size:12px;background:var(--surface-mid);padding:2px 6px;border-radius:4px">localhost</code> or HTTPS.
        </div>
      </div>`;
    return;
  }

  // Render connect screen initially
  const connectScreen = renderConnectScreen();
  root.appendChild(connectScreen);

  let dashboardEl: HTMLElement | null = null;

  // ── React to connection state changes ───────────────────────────────────
  state.on("connectionChanged", (status) => {
    if (status === "connected" && state.adb) {
      // Transition: connect screen → dashboard
      connectScreen.classList.add("exit");

      dashboardEl = renderDashboard(state.adb);
      root.appendChild(dashboardEl);

      // Remove connect screen after transition
      connectScreen.addEventListener("transitionend", () => {
        connectScreen.remove();
      }, { once: true });

    } else if (
      (status === "disconnected" || status === "error") &&
      dashboardEl
    ) {
      // Transition: dashboard → connect screen
      dashboardEl.style.opacity = "0";
      dashboardEl.style.transition = "opacity 0.3s ease";

      const newConnect = renderConnectScreen();
      root.appendChild(newConnect);

      setTimeout(() => {
        dashboardEl?.remove();
        dashboardEl = null;
      }, 300);
    }
  });
}

// ── Run ────────────────────────────────────────────────────────────────────

boot();

// ── Global Ripple Animation ────────────────────────────────────────────────
document.addEventListener("mousedown", (e) => {
  const target = e.target as HTMLElement;
  const button = target.closest("button, .anim-btn, .nav-item-m3, .telemetry-skeleton") as HTMLElement;
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

  button.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 1200);
});
