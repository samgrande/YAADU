import { useReducer, useEffect, useState } from "react";
import { AppContext } from "./context.js";
import { initialState, appReducer } from "./state.js";
import { ConnectScreen } from "./ui/panels/ConnectScreen.js";
import { Dashboard } from "./ui/Dashboard.js";
import { ToastContainer } from "./ui/Toast.js";
import { applyYaaduTheme, loadStoredTheme } from "./theme.js";
import errorPng from "./assets/error.png";

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

const updateAndroidFilter = () => {
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

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isSmallScreen = useIsSmallScreen();

  useEffect(() => {
    applyYaaduTheme(loadStoredTheme());
    updateAndroidFilter();
    window.addEventListener('themeChange', updateAndroidFilter);

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
      window.removeEventListener('themeChange', updateAndroidFilter);
    };
  }, []);

  useEffect(() => {
    if (!isSmallScreen) {
      updateAndroidFilter();
    }
  }, [isSmallScreen]);

  // Lock app on small screens
  if (isSmallScreen) {
    return (
      <div className="small-screen-lock">
        <div className="connect-title-yaadu" style={{ marginBottom: "1rem" }}>
          <svg width="100%" height="100%" viewBox="0 0 1074 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M86 171.532C88.0375 147.308 95.4517 125.009 108.243 104.634C121.034 84.2591 138.069 68.0723 159.35 56.0737L134.221 12.607C132.863 10.5695 132.523 8.41884 133.202 6.15495C133.881 3.89106 135.353 2.19314 137.617 1.0612C139.428 -0.0707465 141.465 -0.297135 143.729 0.382031C145.993 1.0612 147.804 2.41953 149.163 4.45703L174.292 47.9237C193.761 39.7737 214.136 35.6987 235.417 35.6987C256.697 35.6987 277.072 39.7737 296.542 47.9237L321.671 4.45703C323.029 2.41953 324.84 1.0612 327.104 0.382031C329.368 -0.297135 331.406 -0.0707465 333.217 1.0612C335.481 2.19314 336.952 3.89106 337.631 6.15495C338.31 8.41884 337.971 10.5695 336.613 12.607L311.483 56.0737C332.764 68.0723 349.8 84.2591 362.591 104.634C375.382 125.009 382.796 147.308 384.833 171.532H86ZM179.555 129.254C182.838 125.971 184.479 121.953 184.479 117.199C184.479 112.445 182.838 108.426 179.555 105.143C176.273 101.861 172.254 100.22 167.5 100.22C162.746 100.22 158.727 101.861 155.445 105.143C152.162 108.426 150.521 112.445 150.521 117.199C150.521 121.953 152.162 125.971 155.445 129.254C158.727 132.537 162.746 134.178 167.5 134.178C172.254 134.178 176.273 132.537 179.555 129.254ZM315.389 129.254C318.671 125.971 320.313 121.953 320.313 117.199C320.313 112.445 318.671 108.426 315.389 105.143C312.106 101.861 308.088 100.22 303.333 100.22C298.579 100.22 294.561 101.861 291.278 105.143C287.995 108.426 286.354 112.445 286.354 117.199C286.354 121.953 287.995 125.971 291.278 129.254C294.561 132.537 298.579 134.178 303.333 134.178C308.088 134.178 312.106 132.537 315.389 129.254Z" fill="var(--md-sys-color-primary)"/>
              <rect y="171.032" width="1074" height="248" rx="50" fill="var(--md-sys-color-on-surface)" fillOpacity="6.12"/>
              <path d="M721.66 372.622C719.54 371.842 716.69 370.152 715.32 368.872C714.59 368.182 713.95 367.602 713.41 366.942C710 362.852 710 355.922 710 302.612V300.972C710 261.742 710.36 241.222 711.07 239.352C712.4 235.812 715.61 232.332 719.5 230.182C722.1 228.752 726.19 228.542 750.5 228.632C780.84 228.752 786.75 229.572 799.58 235.442C816.73 243.292 829.79 259.472 835.16 279.532C838.14 290.682 838.12 309.222 835.12 320.532C828.2 346.642 810.97 364.182 785.34 371.222C778.44 373.122 774.39 373.412 751.5 373.702C730.93 373.962 724.7 373.732 721.66 372.622ZM556.96 371.782C553.7 370.142 551.89 368.332 550.25 365.072C549.58 363.742 548.97 362.822 548.57 361.812C546.84 357.372 549.4 351.262 570.34 301.242C572.18 296.852 574.16 292.122 576.29 287.032C595.45 241.212 596.01 239.932 598.29 236.832C601.81 232.052 608.2 228.862 615.42 228.282C620.75 227.862 622.64 228.182 627.24 230.282C636.26 234.412 635.11 232.262 659.72 291.032L661.88 296.172C684.46 350.082 686.11 354.022 685.88 357.842C685.85 358.252 685.8 358.672 685.76 359.152C685.2 365.022 681.88 369.732 676.6 372.122C671.42 374.482 667.59 374.482 662.42 372.132C656.98 369.662 654.96 366.852 650.48 355.562L646.71 346.032H616.97C589.52 346.032 587.19 346.162 586.71 347.782C585.26 352.602 578.84 366.542 577.28 368.272C574.61 371.232 568.51 374.032 564.75 374.032C562.92 374.032 559.42 373.022 556.96 371.782ZM398.02 371.782C392.31 368.862 389.82 365.322 389.3 359.352C388.91 354.882 390.65 350.352 413.42 296.592C433.97 248.082 438.56 238.042 441.65 234.882C448.4 227.962 459.39 226.142 468.56 230.412C474.94 233.382 478.76 238.202 483.32 249.032C518.29 332.132 527 353.802 527 357.732C526.99 368.342 516.23 376.212 505.95 373.132C499.33 371.152 496.63 367.952 491.96 356.562L487.65 346.032H428.28L424.49 355.282C419.68 366.992 417.69 369.812 412.6 372.122C407.17 374.592 403.35 374.502 398.02 371.782ZM914.76 375.012C889.5 371.982 870.45 356.072 864.36 332.932C862.95 327.552 862.62 319.752 862.29 284.032L861.9 241.532L864.2 237.072C868.85 228.062 881.35 225.242 889.41 231.402C891.37 232.892 893.54 235.112 894.24 236.322C895.17 237.962 895.64 249.492 896.05 281.032C896.65 326.992 896.76 327.952 902.29 335.182C906.92 341.252 913.68 344.372 923.18 344.852C933.58 345.372 939.9 343.232 945.97 337.142C954.19 328.882 954.35 327.852 954.97 279.852C955.48 239.552 955.57 238.082 957.59 235.352C962.83 228.302 973.54 225.902 980.08 230.302C981.93 231.552 984.48 234.102 985.73 235.952L988 239.332V281.022C988 327.522 987.62 330.902 980.77 344.872C976.72 353.162 966.8 363.312 958.46 367.722C946.82 373.892 929.51 376.772 914.76 375.012ZM317.97 371.782C315.03 370.302 312.74 368.172 311.27 365.532C309.14 361.722 309.03 360.452 309.02 339.162L309 316.792L299.16 302.662C271.8 263.352 264.79 252.312 264.27 247.732C263.58 241.612 265.4 236.812 269.98 232.672C276.68 226.612 287.41 226.672 293.27 232.792C295.59 235.212 306.32 251.812 321.36 276.252C323.64 279.952 325.72 282.982 326 283.002C326.28 283.012 328.59 279.762 331.13 275.782C333.68 271.792 340.37 261.332 345.98 252.532C357.82 233.992 359.12 232.402 364.5 229.922C369.83 227.462 374.65 227.582 379.47 230.312C385.46 233.702 388 238.132 388 245.192C388 251.022 387.92 251.172 376.65 267.792C370.41 277.002 360.29 291.722 354.15 300.502L343 316.472L342.98 338.002C342.96 356.792 342.72 360.042 341.11 363.532C336.61 373.272 327.42 376.552 317.97 371.782ZM777.23 341.042C793.44 336.032 802.6 322.682 803.75 302.392C804.87 282.352 796.05 267.722 779.37 261.982C774.7 260.382 770.96 260.032 758.34 260.032H743V343.032H756.89C767.94 343.032 772.11 342.622 777.23 341.042ZM92 345.322C88.29 343.972 86 340.672 86 336.672C86 332.792 86.66 331.992 104.5 314.062C114.67 303.832 123 295.022 123 294.492C123 293.952 114.67 285.192 104.5 275.032C86.53 257.082 86 256.432 86 252.462C86 245.592 92.75 241.302 98.72 244.382C102.58 246.382 143.9 288.642 145.12 291.842C147.02 296.832 144.66 299.902 121.47 322.532C109.07 334.632 98.15 344.842 97.21 345.212C95.16 346.032 93.99 346.052 92 345.322ZM167.02 347.942C162.63 346.142 161 343.952 161 339.832C161 337.032 161.69 335.252 163.45 333.482L165.91 331.032H223.65L225.83 333.342C229 336.732 228.81 342.922 225.42 346.112L222.84 348.532L196.17 348.742C179.95 348.872 168.53 348.552 167.02 347.942ZM634 314.192C634 313.282 618.42 274.512 617.36 272.812C617.01 272.232 612.97 281.112 608.39 292.542C603.81 303.972 600.3 313.712 600.59 314.182C601.27 315.282 634 315.302 634 314.192ZM474.56 313.282C466.67 292.102 458.48 272.162 457.91 272.762C456.6 274.142 441.2 313.512 441.66 314.282C441.91 314.692 449.56 315.032 458.67 315.032C474.01 315.032 475.17 314.902 474.56 313.282Z" fill="var(--md-sys-color-primary)"/>
            </svg>
        </div>
        <div className="small-screen-logo">
          <img src={errorPng} alt="YAADU" style={{ maxWidth: "300px", width: "100%" }} />
        </div>
        <div className="small-screen-title">Oops</div>
        <div className="small-screen-text">App opened on wrong screen size. Please open on a desktop browser in a full window for the full experience.</div>
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
