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
      setTableValue('android-func-r', 1, color.r, color.r, 1, 1);
      setTableValue('android-func-g', 1, color.g, color.g, 1, 1);
      setTableValue('android-func-b', 1, color.b, color.b, 1, 1);
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
        <svg width="200" height="140" viewBox="0 0 979 681" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="224" cy="388" r="41" fill="#8EC072"/>
          <circle cx="754" cy="386.5" r="41" fill="#8EC072"/>
          <rect x="303" y="409" width="386" height="252" fill="#FC5353"/>
          <path d="M230 384C233.532 342.058 246.384 303.448 268.556 268.169C290.728 232.891 320.258 204.864 357.145 184.089L313.586 108.829C311.232 105.301 310.643 101.577 311.82 97.657C312.998 93.7372 315.548 90.7973 319.473 88.8374C322.612 86.8775 326.144 86.4855 330.068 87.6615C333.992 88.8374 337.132 91.1893 339.486 94.7171L383.045 169.978C416.794 155.866 452.112 148.811 489 148.811C525.888 148.811 561.206 155.866 594.955 169.978L638.514 94.7171C640.868 91.1893 644.008 88.8374 647.932 87.6615C651.856 86.4855 655.388 86.8775 658.527 88.8374C662.452 90.7973 665.002 93.7372 666.18 97.657C667.357 101.577 666.768 105.301 664.414 108.829L620.855 184.089C657.742 204.864 687.272 232.891 709.444 268.169C731.616 303.448 744.468 342.058 748 384H230Z" fill="#8EC072"/>
          <path d="M956.129 677.81L951.379 680L30.3786 680.46L24.5386 678.06C12.8286 673.23 5.64864 665.96 1.79864 655C-0.101359 649.61 -0.141354 646.22 0.108646 530.23L0.378643 411L3.37864 405.06C7.31864 397.26 13.9586 390.58 21.3786 386.94L27.3786 384L105.489 383.73L183.609 383.45L184.109 390.49C185.059 403.75 193.849 416.41 206.409 422.59C224.529 431.51 246.369 425.74 257.899 408.97C261.599 403.59 264.879 393.76 264.879 388.03V383.5L713.379 383.52L713.569 389.32C713.969 401.41 721.089 413.45 732.029 420.52C739.359 425.26 746.039 426.85 756.429 426.34C776.869 425.33 793.179 409.16 793.999 389.11L794.219 383.46L872.799 383.73L951.379 384L957.119 386.82C964.739 390.56 971.519 397.53 975.299 405.5L978.379 412V653L975.239 659C971.509 666.12 962.749 674.75 956.129 677.81ZM386.869 632.58C388.249 633 435.499 633.27 491.879 633.17L594.379 633L598.839 630.5C601.289 629.12 604.659 626.05 606.339 623.66C609.039 619.81 609.379 618.53 609.379 612.16V605L598.489 586C566.849 530.77 508.239 431.53 505.559 428.65C499.069 421.67 486.649 420.38 479.369 425.94C477.299 427.52 474.499 430.65 473.139 432.9C471.779 435.16 460.899 453.65 448.959 474C415.149 531.65 390.399 573.62 380.569 590C373.069 602.49 371.489 605.86 371.109 610.14C370.139 620.99 375.909 629.2 386.869 632.58ZM501.279 93.11C499.449 93.87 497.819 94.48 497.659 94.46C497.509 94.43 495.579 93.76 493.379 92.97C491.179 92.18 489.279 91.52 489.159 91.52C489.029 91.51 488.189 90.07 487.289 88.32C484.969 83.85 486.089 75.76 490.059 68.32C493.229 62.37 496.259 59.25 506.049 51.9C512.209 47.27 514.879 42.63 514.879 36.55C514.879 31.51 512.979 27.6 508.839 24.12C506.159 21.86 504.809 21.5 499.049 21.52C490.559 21.54 485.429 24.21 482.439 30.16C478.179 38.63 473.449 41.02 466.609 38.16C453.629 32.74 461.949 12.05 480.679 3.17C487.049 0.159998 487.969 0 499.379 0C510.509 0 511.799 0.200001 517.099 2.81C524.339 6.36 530.959 12.78 534.489 19.64C536.679 23.92 537.319 26.75 537.669 33.64C538.439 48.59 533.709 57.43 519.239 68.14C511.479 73.88 507.949 78.98 507.899 84.53C507.869 88.04 505.229 91.45 501.279 93.11ZM611.119 319.29C594.699 326.32 577.349 318.06 572.749 301.02C569.199 287.89 578.179 271.86 591.269 267.98C597.549 266.11 601.219 266.12 607.559 268C614.379 270.02 619.739 274.46 623.619 281.3C626.419 286.24 626.849 287.94 626.849 294C626.829 305.41 620.769 315.16 611.119 319.29ZM390.559 318.9C383.989 322.05 377.669 322.8 371.669 321.14C354.549 316.39 346.189 297.6 354.199 281.89C363.979 262.73 390.699 261.57 401.999 279.81C406.269 286.7 407.219 297.69 404.139 304.64C401.319 311.01 396.539 316.04 390.559 318.9ZM497.159 563.75C494.459 566.19 489.919 566.74 486.209 565.08C480.479 562.52 480.129 561.09 478.959 536C478.379 523.35 477.639 508.21 477.309 502.35C476.829 493.65 477.019 491.13 478.349 488.56C483.159 479.26 498.079 479.09 502.449 488.28C503.909 491.37 503.909 494.45 502.419 525.22C501.529 543.68 500.409 559.52 499.929 560.4C499.449 561.29 498.209 562.8 497.159 563.75ZM461.969 355.74C455.309 360.23 446.879 355.57 446.879 347.41C446.879 343.65 447.429 342.63 451.549 338.69C460.249 330.35 476.299 324.48 490.309 324.51C507.249 324.56 529.249 335.81 531.379 345.52C532.739 351.7 527.919 357.5 521.439 357.5C520.039 357.5 515.959 355.49 512.379 353.04C504.759 347.82 497.789 345.5 489.749 345.5C481.279 345.5 474.689 347.21 469.319 350.81C466.699 352.57 463.389 354.79 461.969 355.74ZM496.499 604.44C491.319 606.95 490.489 606.96 485.209 604.56C478.269 601.41 475.459 594.83 478.229 588.2C481.389 580.64 492.569 577.85 498.789 583.07C505.999 589.14 504.789 600.43 496.499 604.44ZM502.419 127.91C498.719 129.67 497.769 129.72 493.319 128.43C483.569 125.6 481.979 111.41 490.839 106.18C495.149 103.64 501.139 104 504.739 107.03C511.919 113.08 510.709 123.98 502.419 127.91Z" fill="#292E31"/>
        </svg>
        <div className="small-screen-title">YAADU</div>
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
              <feColorMatrix type="saturate" values="0" in="SourceGraphic" />
              <feComponentTransfer>
              <feFuncR id="android-func-r" type="table" tableValues="1 0 0 1 1" />
              <feFuncG id="android-func-g" type="table" tableValues="1 0 0 1 1" />
              <feFuncB id="android-func-b" type="table" tableValues="1 0 0 1 1" />
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
