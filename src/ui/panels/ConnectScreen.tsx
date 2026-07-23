import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAppContext } from "../../context.js";
import { connectDevice, silentReconnect } from "../../adb/connection.js";
import { credentialStore } from "../../adb/credential.js";
import type { ConnectionStatus } from "../../state.js";
import {
  applyYaaduTheme,
  loadStoredTheme,
  saveTheme,
  THEME_COLORS,
  type ThemeMode,
  type YaaduTheme,
} from "../../theme.js";
import { MarqueeIcons } from "../MarqueeIcons.js";

// ── Status messages ────────────────────────────────────────────────────────

const STATUS_MESSAGES: Record<ConnectionStatus, string> = {
  disconnected:  "Device Not Connected",
  connecting:    "Opening USB Device Picker…",
  authorizing:   "Authorize on Phone Screen",
  connected:     "Connected",
  reconnecting:  "Reconnecting…",
  error:         "Device Disconnected",
};

// ── Status badge icon ──────────────────────────────────────────────────────

function StatusBadgeIcon({ status }: { status: ConnectionStatus }) {
  if (status === "disconnected") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_4_2080_connect)">
          <path d="M5.99997 0V3H2.99997V6H8.99997V0H5.99997ZM17.64 0.09C17.1002 0.108035 16.5654 0.198855 16.05 0.36C15.24 0.66 14.46 1.11 13.8 1.77L12.48 3.09C12.2901 3.21038 12.1297 3.37191 12.0106 3.56265C11.8916 3.75338 11.8169 3.96844 11.7922 4.19192C11.7674 4.4154 11.7933 4.64157 11.8677 4.85372C11.9422 5.06587 12.0634 5.25857 12.2224 5.41755C12.3814 5.57654 12.5741 5.69775 12.7862 5.77222C12.9984 5.8467 13.2246 5.87252 13.4481 5.84779C13.6715 5.82307 13.8866 5.74841 14.0773 5.62936C14.2681 5.51031 14.4296 5.3499 14.55 5.16L15.87 3.84C16.2 3.51 16.59 3.33 17.01 3.18C18.06 2.82 19.35 2.97 20.19 3.84C21.36 5.01 21.36 6.96 20.19 8.16L15.69 12.66C15.5001 12.7804 15.3397 12.9419 15.2206 13.1326C15.1016 13.3234 15.0269 13.5384 15.0022 13.7619C14.9775 13.9854 15.0033 14.2116 15.0777 14.4237C15.1522 14.6359 15.2734 14.8286 15.4324 14.9876C15.5914 15.1465 15.7841 15.2678 15.9962 15.3422C16.2084 15.4167 16.4346 15.4425 16.6581 15.4178C16.8815 15.3931 17.0966 15.3184 17.2873 15.1994C17.4781 15.0803 17.6396 14.9199 17.76 14.73L22.26 10.23C23.0183 9.47804 23.5599 8.53555 23.8277 7.50174C24.0955 6.46793 24.0797 5.38103 23.7818 4.35547C23.484 3.3299 22.9152 2.4036 22.1352 1.67407C21.3553 0.944544 20.3931 0.438773 19.35 0.21C18.81 0.09 18.21 0.09 17.67 0.12L17.64 0.09ZM6.86997 8.82C6.64262 8.92951 6.44657 9.0946 6.29997 9.3L1.79997 13.8C1.24395 14.3521 0.802659 15.0088 0.501521 15.7322C0.200383 16.4556 0.0453491 17.2314 0.0453491 18.015C0.0453491 18.7986 0.200383 19.5744 0.501521 20.2978C0.802659 21.0212 1.24395 21.6779 1.79997 22.23C3.47997 23.91 5.87997 24.39 7.97997 23.64C8.78997 23.34 9.56997 22.89 10.23 22.23L11.55 20.91C11.7399 20.7896 11.9003 20.6281 12.0193 20.4374C12.1384 20.2466 12.213 20.0316 12.2378 19.8081C12.2625 19.5846 12.2367 19.3584 12.1622 19.1463C12.0877 18.9341 11.9665 18.7414 11.8075 18.5824C11.6485 18.4235 11.4558 18.3022 11.2437 18.2278C11.0315 18.1533 10.8054 18.1275 10.5819 18.1522C10.3584 18.1769 10.1434 18.2516 9.95262 18.3706C9.76188 18.4897 9.60035 18.6501 9.47997 18.84L8.15997 20.16C7.82997 20.49 7.43997 20.67 7.01997 20.82C5.96997 21.18 4.67997 21.03 3.83997 20.16C2.66997 18.99 2.66997 17.04 3.83997 15.84L8.33997 11.34C8.55781 11.1132 8.69885 10.8236 8.74315 10.5123C8.78745 10.2009 8.73278 9.88354 8.58686 9.60497C8.44093 9.32639 8.21114 9.10072 7.92997 8.95986C7.6488 8.819 7.33047 8.77007 7.01997 8.82H6.83997H6.86997ZM15.03 18V24H18.03V21H21.03V18H15.03Z" fill="currentColor"/>
        </g>
        <defs>
          <clipPath id="clip0_4_2080_connect">
            <rect width="24" height="24" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    );
  }
  if (status === "connecting" || status === "authorizing") {
    return (
      <svg className="spinner-stroke" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" strokeDasharray="40 10"/>
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Main ConnectScreen component ───────────────────────────────────────────

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "md-filled-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { disabled?: boolean }, HTMLElement>;
      "md-filled-tonal-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

type CardView = "main" | "help" | "about" | "theme";

const THEME_ICON = (
  <svg width="132" height="132" viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M66 14C37.28 14 14 37.28 14 66C14 94.72 37.28 118 66 118H70.2C75.1 118 78.58 113.22 77.05 108.55L73.92 99.02C72.38 94.33 75.9 89.5 80.84 89.5H91.5C105.31 89.5 116.5 78.31 116.5 64.5C116.5 36.61 93.89 14 66 14Z" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="43" cy="63" r="8" fill="currentColor"/>
    <circle cx="56" cy="40" r="8" fill="currentColor"/>
    <circle cx="84" cy="40" r="8" fill="currentColor"/>
    <circle cx="95" cy="63" r="8" fill="currentColor"/>
  </svg>
);

const RECONNECT_TIMEOUT_SECS = 60;

export function ConnectScreen() {
  const { state, dispatch } = useAppContext();
  const [cardView, setCardView] = useState<CardView>("main");
  const [cardPhase, setCardPhase] = useState<"enter" | "exit" | "idle">("idle");
  const [entered, setEntered] = useState(false);
  const [draftTheme, setDraftTheme] = useState<YaaduTheme>(() => loadStoredTheme());
  const pendingView = useRef<CardView>(cardView);
  const { connection, error } = state;

  const reconnectSecondsLeftRef = useRef(RECONNECT_TIMEOUT_SECS);
  const reconnectCancelledRef = useRef(false);
  const silentReconnectInProgressRef = useRef(false);

  const isConnecting = connection === "connecting" || connection === "authorizing";
  const isReconnecting = connection === "reconnecting";

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  const switchCard = useCallback((next: CardView) => {
    if (next === cardView) return;
    pendingView.current = next;
    setCardPhase("exit");
  }, [cardView]);

  useEffect(() => {
    if (cardPhase === "exit") {
      const t = setTimeout(() => {
        setCardView(pendingView.current);
        requestAnimationFrame(() => setCardPhase("enter"));
      }, 250);
      return () => clearTimeout(t);
    }
    if (cardPhase === "enter") {
      const t = setTimeout(() => setCardPhase("idle"), 250);
      return () => clearTimeout(t);
    }
  }, [cardPhase]);

  const cardStyle: React.CSSProperties = {
    transition: "opacity 0.3s cubic-bezier(0.2, 0, 0, 1), transform 0.3s cubic-bezier(0.2, 0, 0, 1)",
    opacity: !entered ? 0 : cardPhase === "exit" ? 0 : 1,
    transform: !entered
      ? "scale(0.95) translateY(20px)"
      : cardPhase === "exit"
        ? "scale(0.97) translateY(8px)"
        : cardPhase === "enter"
          ? "scale(0.97) translateY(-8px)"
          : "scale(1) translateY(0)",
  };

  const handleConnect = useCallback(async () => {
    if (isConnecting) return;
    await connectDevice(dispatch);
  }, [dispatch, isConnecting]);

  const handleCancelReconnect = useCallback(() => {
    reconnectCancelledRef.current = true;
    dispatch({ type: "RESET" });
  }, [dispatch]);

  // ── Reconnect mode: USB plug-in listener + countdown ticker ──────────────
  useEffect(() => {
    if (!isReconnecting) return;

    reconnectCancelledRef.current = false;
    silentReconnectInProgressRef.current = false;
    reconnectSecondsLeftRef.current = RECONNECT_TIMEOUT_SECS;

    // Listen for the USB cable being plugged back in
    const onUsbConnect = async () => {
      if (reconnectCancelledRef.current) return;
      if (silentReconnectInProgressRef.current) return;
      silentReconnectInProgressRef.current = true;
      await silentReconnect(dispatch);
      silentReconnectInProgressRef.current = false;
    };
    navigator.usb.addEventListener("connect", onUsbConnect);

    // Countdown ticker
    const interval = setInterval(() => {
      reconnectSecondsLeftRef.current -= 1;
      if (reconnectSecondsLeftRef.current <= 0) {
        clearInterval(interval);
        if (!reconnectCancelledRef.current) {
          dispatch({ type: "RESET" });
        }
      }
    }, 1000);

    return () => {
      navigator.usb.removeEventListener("connect", onUsbConnect);
      clearInterval(interval);
    };
  }, [isReconnecting, dispatch]);

  const selectedThemeName = THEME_COLORS.find((entry) => entry.value === draftTheme.color)?.name ?? "Custom Theme";

  const updateDraftTheme = useCallback((patch: Partial<YaaduTheme>) => {
    setDraftTheme((current) => {
      const next = { ...current, ...patch };
      applyYaaduTheme(next);
      return next;
    });
  }, []);

  const handleSaveTheme = useCallback(() => {
    saveTheme(draftTheme);
    switchCard("main");
  }, [draftTheme, switchCard]);

  const statusLabel = error ?? STATUS_MESSAGES[connection] ?? "Device Not Connected";

  return (
    <div className="connect-screen" id="connect-screen">
      <MarqueeIcons />
      <div className="connect-screen-content">
        {/* Top Brand Header */}
        <div className="connect-brand-header">
          <div className="connect-title-yaadu">
            <svg width="100%" height="100%" viewBox="0 0 1074 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M86 171.532C88.0375 147.308 95.4517 125.009 108.243 104.634C121.034 84.2591 138.069 68.0723 159.35 56.0737L134.221 12.607C132.863 10.5695 132.523 8.41884 133.202 6.15495C133.881 3.89106 135.353 2.19314 137.617 1.0612C139.428 -0.0707465 141.465 -0.297135 143.729 0.382031C145.993 1.0612 147.804 2.41953 149.163 4.45703L174.292 47.9237C193.761 39.7737 214.136 35.6987 235.417 35.6987C256.697 35.6987 277.072 39.7737 296.542 47.9237L321.671 4.45703C323.029 2.41953 324.84 1.0612 327.104 0.382031C329.368 -0.297135 331.406 -0.0707465 333.217 1.0612C335.481 2.19314 336.952 3.89106 337.631 6.15495C338.31 8.41884 337.971 10.5695 336.613 12.607L311.483 56.0737C332.764 68.0723 349.8 84.2591 362.591 104.634C375.382 125.009 382.796 147.308 384.833 171.532H86ZM179.555 129.254C182.838 125.971 184.479 121.953 184.479 117.199C184.479 112.445 182.838 108.426 179.555 105.143C176.273 101.861 172.254 100.22 167.5 100.22C162.746 100.22 158.727 101.861 155.445 105.143C152.162 108.426 150.521 112.445 150.521 117.199C150.521 121.953 152.162 125.971 155.445 129.254C158.727 132.537 162.746 134.178 167.5 134.178C172.254 134.178 176.273 132.537 179.555 129.254ZM315.389 129.254C318.671 125.971 320.313 121.953 320.313 117.199C320.313 112.445 318.671 108.426 315.389 105.143C312.106 101.861 308.088 100.22 303.333 100.22C298.579 100.22 294.561 101.861 291.278 105.143C287.995 108.426 286.354 112.445 286.354 117.199C286.354 121.953 287.995 125.971 291.278 129.254C294.561 132.537 298.579 134.178 303.333 134.178C308.088 134.178 312.106 132.537 315.389 129.254Z" fill="var(--md-sys-color-primary)"/>
              <rect y="171.032" width="1074" height="248" rx="50" fill="var(--md-sys-color-on-surface)" fillOpacity="6.12"/>
              <path d="M721.66 372.622C719.54 371.842 716.69 370.152 715.32 368.872C714.59 368.182 713.95 367.602 713.41 366.942C710 362.852 710 355.922 710 302.612V300.972C710 261.742 710.36 241.222 711.07 239.352C712.4 235.812 715.61 232.332 719.5 230.182C722.1 228.752 726.19 228.542 750.5 228.632C780.84 228.752 786.75 229.572 799.58 235.442C816.73 243.292 829.79 259.472 835.16 279.532C838.14 290.682 838.12 309.222 835.12 320.532C828.2 346.642 810.97 364.182 785.34 371.222C778.44 373.122 774.39 373.412 751.5 373.702C730.93 373.962 724.7 373.732 721.66 372.622ZM556.96 371.782C553.7 370.142 551.89 368.332 550.25 365.072C549.58 363.742 548.97 362.822 548.57 361.812C546.84 357.372 549.4 351.262 570.34 301.242C572.18 296.852 574.16 292.122 576.29 287.032C595.45 241.212 596.01 239.932 598.29 236.832C601.81 232.052 608.2 228.862 615.42 228.282C620.75 227.862 622.64 228.182 627.24 230.282C636.26 234.412 635.11 232.262 659.72 291.032L661.88 296.172C684.46 350.082 686.11 354.022 685.88 357.842C685.85 358.252 685.8 358.672 685.76 359.152C685.2 365.022 681.88 369.732 676.6 372.122C671.42 374.482 667.59 374.482 662.42 372.132C656.98 369.662 654.96 366.852 650.48 355.562L646.71 346.032H616.97C589.52 346.032 587.19 346.162 586.71 347.782C585.26 352.602 578.84 366.542 577.28 368.272C574.61 371.232 568.51 374.032 564.75 374.032C562.92 374.032 559.42 373.022 556.96 371.782ZM398.02 371.782C392.31 368.862 389.82 365.322 389.3 359.352C388.91 354.882 390.65 350.352 413.42 296.592C433.97 248.082 438.56 238.042 441.65 234.882C448.4 227.962 459.39 226.142 468.56 230.412C474.94 233.382 478.76 238.202 483.32 249.032C518.29 332.132 527 353.802 527 357.732C526.99 368.342 516.23 376.212 505.95 373.132C499.33 371.152 496.63 367.952 491.96 356.562L487.65 346.032H428.28L424.49 355.282C419.68 366.992 417.69 369.812 412.6 372.122C407.17 374.592 403.35 374.502 398.02 371.782ZM914.76 375.012C889.5 371.982 870.45 356.072 864.36 332.932C862.95 327.552 862.62 319.752 862.29 284.032L861.9 241.532L864.2 237.072C868.85 228.062 881.35 225.242 889.41 231.402C891.37 232.892 893.54 235.112 894.24 236.322C895.17 237.962 895.64 249.492 896.05 281.032C896.65 326.992 896.76 327.952 902.29 335.182C906.92 341.252 913.68 344.372 923.18 344.852C933.58 345.372 939.9 343.232 945.97 337.142C954.19 328.882 954.35 327.852 954.97 279.852C955.48 239.552 955.57 238.082 957.59 235.352C962.83 228.302 973.54 225.902 980.08 230.302C981.93 231.552 984.48 234.102 985.73 235.952L988 239.332V281.022C988 327.522 987.62 330.902 980.77 344.872C976.72 353.162 966.8 363.312 958.46 367.722C946.82 373.892 929.51 376.772 914.76 375.012ZM317.97 371.782C315.03 370.302 312.74 368.172 311.27 365.532C309.14 361.722 309.03 360.452 309.02 339.162L309 316.792L299.16 302.662C271.8 263.352 264.79 252.312 264.27 247.732C263.58 241.612 265.4 236.812 269.98 232.672C276.68 226.612 287.41 226.672 293.27 232.792C295.59 235.212 306.32 251.812 321.36 276.252C323.64 279.952 325.72 282.982 326 283.002C326.28 283.012 328.59 279.762 331.13 275.782C333.68 271.792 340.37 261.332 345.98 252.532C357.82 233.992 359.12 232.402 364.5 229.922C369.83 227.462 374.65 227.582 379.47 230.312C385.46 233.702 388 238.132 388 245.192C388 251.022 387.92 251.172 376.65 267.792C370.41 277.002 360.29 291.722 354.15 300.502L343 316.472L342.98 338.002C342.96 356.792 342.72 360.042 341.11 363.532C336.61 373.272 327.42 376.552 317.97 371.782ZM777.23 341.042C793.44 336.032 802.6 322.682 803.75 302.392C804.87 282.352 796.05 267.722 779.37 261.982C774.7 260.382 770.96 260.032 758.34 260.032H743V343.032H756.89C767.94 343.032 772.11 342.622 777.23 341.042ZM92 345.322C88.29 343.972 86 340.672 86 336.672C86 332.792 86.66 331.992 104.5 314.062C114.67 303.832 123 295.022 123 294.492C123 293.952 114.67 285.192 104.5 275.032C86.53 257.082 86 256.432 86 252.462C86 245.592 92.75 241.302 98.72 244.382C102.58 246.382 143.9 288.642 145.12 291.842C147.02 296.832 144.66 299.902 121.47 322.532C109.07 334.632 98.15 344.842 97.21 345.212C95.16 346.032 93.99 346.052 92 345.322ZM167.02 347.942C162.63 346.142 161 343.952 161 339.832C161 337.032 161.69 335.252 163.45 333.482L165.91 331.032H223.65L225.83 333.342C229 336.732 228.81 342.922 225.42 346.112L222.84 348.532L196.17 348.742C179.95 348.872 168.53 348.552 167.02 347.942ZM634 314.192C634 313.282 618.42 274.512 617.36 272.812C617.01 272.232 612.97 281.112 608.39 292.542C603.81 303.972 600.3 313.712 600.59 314.182C601.27 315.282 634 315.302 634 314.192ZM474.56 313.282C466.67 292.102 458.48 272.162 457.91 272.762C456.6 274.142 441.2 313.512 441.66 314.282C441.91 314.692 449.56 315.032 458.67 315.032C474.01 315.032 475.17 314.902 474.56 313.282Z" fill="var(--md-sys-color-primary)"/>
            </svg>
          </div>
          <div className="connect-tagline-text">{`>// Yet. Another. Android. Debug. Tool`}</div>
        </div>

        {/* Card */}
        <div className="connect-card-m3" style={cardStyle}>
          {cardView === "main" && (
            <>
              {isReconnecting ? (
                /* ── Reconnect banner ─────────────────────────────────── */
                <>
                  <div className="reconnect-graphic-container">
                    <div className="reconnect-icon-ring">
                      <svg className="reconnect-usb-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_rc)">
                          <path d="M5.99997 0V3H2.99997V6H8.99997V0H5.99997ZM17.64 0.09C17.1002 0.108035 16.5654 0.198855 16.05 0.36C15.24 0.66 14.46 1.11 13.8 1.77L12.48 3.09C12.2901 3.21038 12.1297 3.37191 12.0106 3.56265C11.8916 3.75338 11.8169 3.96844 11.7922 4.19192C11.7674 4.4154 11.7933 4.64157 11.8677 4.85372C11.9422 5.06587 12.0634 5.25857 12.2224 5.41755C12.3814 5.57654 12.5741 5.69775 12.7862 5.77222C12.9984 5.8467 13.2246 5.87252 13.4481 5.84779C13.6715 5.82307 13.8866 5.74841 14.0773 5.62936C14.2681 5.51031 14.4296 5.3499 14.55 5.16L15.87 3.84C16.2 3.51 16.59 3.33 17.01 3.18C18.06 2.82 19.35 2.97 20.19 3.84C21.36 5.01 21.36 6.96 20.19 8.16L15.69 12.66C15.5001 12.7804 15.3397 12.9419 15.2206 13.1326C15.1016 13.3234 15.0269 13.5384 15.0022 13.7619C14.9775 13.9854 15.0033 14.2116 15.0777 14.4237C15.1522 14.6359 15.2734 14.8286 15.4324 14.9876C15.5914 15.1465 15.7841 15.2678 15.9962 15.3422C16.2084 15.4167 16.4346 15.4425 16.6581 15.4178C16.8815 15.3931 17.0966 15.3184 17.2873 15.1994C17.4781 15.0803 17.6396 14.9199 17.76 14.73L22.26 10.23C23.0183 9.47804 23.5599 8.53555 23.8277 7.50174C24.0955 6.46793 24.0797 5.38103 23.7818 4.35547C23.484 3.3299 22.9152 2.4036 22.1352 1.67407C21.3553 0.944544 20.3931 0.438773 19.35 0.21C18.81 0.09 18.21 0.09 17.67 0.12L17.64 0.09ZM6.86997 8.82C6.64262 8.92951 6.44657 9.0946 6.29997 9.3L1.79997 13.8C1.24395 14.3521 0.802659 15.0088 0.501521 15.7322C0.200383 16.4556 0.0453491 17.2314 0.0453491 18.015C0.0453491 18.7986 0.200383 19.5744 0.501521 20.2978C0.802659 21.0212 1.24395 21.6779 1.79997 22.23C3.47997 23.91 5.87997 24.39 7.97997 23.64C8.78997 23.34 9.56997 22.89 10.23 22.23L11.55 20.91C11.7399 20.7896 11.9003 20.6281 12.0193 20.4374C12.1384 20.2466 12.213 20.0316 12.2378 19.8081C12.2625 19.5846 12.2367 19.3584 12.1622 19.1463C12.0877 18.9341 11.9665 18.7414 11.8075 18.5824C11.6485 18.4235 11.4558 18.3022 11.2437 18.2278C11.0315 18.1533 10.8054 18.1275 10.5819 18.1522C10.3584 18.1769 10.1434 18.2516 9.95262 18.3706C9.76188 18.4897 9.60035 18.6501 9.47997 18.84L8.15997 20.16C7.82997 20.49 7.43997 20.67 7.01997 20.82C5.96997 21.18 4.67997 21.03 3.83997 20.16C2.66997 18.99 2.66997 17.04 3.83997 15.84L8.33997 11.34C8.55781 11.1132 8.69885 10.8236 8.74315 10.5123C8.78745 10.2009 8.73278 9.88354 8.58686 9.60497C8.44093 9.32639 8.21114 9.10072 7.92997 8.95986C7.6488 8.819 7.33047 8.77007 7.01997 8.82H6.83997H6.86997ZM15.03 18V24H18.03V21H21.03V18H15.03Z" fill="currentColor"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_rc">
                            <rect width="24" height="24" fill="white"/>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  <div className="reconnect-banner" id="reconnect-banner">
                    <div className="reconnect-banner-title">USB Disconnected</div>
                    <div className="reconnect-banner-sub">
                      Please connect your device again.
                    </div>
                  </div>

                  <md-filled-button
                    id="btn-cancel-reconnect"
                    onClick={handleCancelReconnect}
                  >
                    Cancel
                  </md-filled-button>
                </>
              ) : (
                /* ── Normal connect UI ───────────────────────────────── */
                <>
                  <div className="phone-graphic-container">
                    <svg width="100%" height="100%" viewBox="0 0 265 265" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="pulse-circle outer-2" cx="132.5" cy="118" r="132.5" fill="var(--md-sys-color-primary-container)" fillOpacity="0.16"/>
                      <circle className="pulse-circle outer-1" cx="132.5" cy="118" r="115" fill="var(--md-sys-color-primary-container)" fillOpacity="0.37"/>
                      <circle className="pulse-circle-static" cx="132.5" cy="118" r="95" fill="var(--md-sys-color-primary-container)"/>
                      <g transform="translate(102.5, 48)">
                        <path d="M32.5004 114V113.5C32.5004 112.096 32.5004 111.393 32.1634 110.889C32.0175 110.671 31.8299 110.483 31.6114 110.337C31.1074 110 30.4044 110 29.0004 110C27.5964 110 26.8934 110 26.3894 110.337C26.171 110.483 25.9834 110.671 25.8374 110.889C25.5004 111.393 25.5004 112.096 25.5004 113.5V114" stroke="var(--md-sys-color-primary)" strokeWidth="2"/>
                        <path d="M23.0044 115.113C22.9374 114.243 23.6404 113.5 24.5304 113.5H33.4704C34.3604 113.5 35.0634 114.243 34.9964 115.113L34.8124 117.492C34.6774 119.206 34.0984 120.855 33.1324 122.277L32.5324 123.162C32.2488 123.576 31.8684 123.914 31.4243 124.147C30.9803 124.38 30.486 124.501 29.9844 124.5H28.0164C27.515 124.501 27.021 124.38 26.5771 124.147C26.1332 123.913 25.753 123.575 25.4694 123.162L24.8684 122.277C23.9025 120.855 23.3235 119.206 23.1884 117.492L23.0044 115.113Z" stroke="var(--md-sys-color-primary)" strokeWidth="2"/>
                        <path d="M29 124.757V162.04M28 117H30" stroke="var(--md-sys-color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 1.5H48C50.736 1.5 53.3924 2.69433 55.375 4.875C57.3619 7.06061 58.5 10.0535 58.5 13.2002V96.7998C58.5 99.9465 57.3619 102.939 55.375 105.125C53.3924 107.306 50.736 108.5 48 108.5H12L11.4912 108.486C10.3061 108.422 9.135 108.134 8.0293 107.63C6.76539 107.054 5.60723 106.205 4.625 105.125C2.63808 102.939 1.5 99.9465 1.5 96.7998V13.2002C1.5 10.0535 2.63808 7.06061 4.625 4.875C6.60757 2.69433 9.26398 1.5 12 1.5Z" fill="var(--md-sys-color-on-surface)" fillOpacity="0.16" stroke="var(--md-sys-color-primary)" strokeWidth="3"/>
                        <mask id="path-5-inside-1_5_92" fill="white">
                          <path d="M42 69C42 72.1826 40.7357 75.2348 38.4853 77.4853C36.2348 79.7357 33.1826 81 30 81C26.8174 81 23.7652 79.7357 21.5147 77.4853C19.2643 75.2348 18 72.1826 18 69L30 69H42Z"/>
                        </mask>
                        <path d="M42 69C42 72.1826 40.7357 75.2348 38.4853 77.4853C36.2348 79.7357 33.1826 81 30 81C26.8174 81 23.7652 79.7357 21.5147 77.4853C19.2643 75.2348 18 72.1826 18 69L30 69H42Z" fill="var(--md-sys-color-primary-container)" stroke="var(--md-sys-color-primary)" strokeWidth="4" mask="url(#path-5-inside-1_5_92)"/>
                        <rect x="20.5" y="40.5" width="2" height="17" rx="1" fill="var(--md-sys-color-on-surface)" stroke="var(--md-sys-color-primary)"/>
                        <rect x="38.5" y="40.5" width="2" height="17" rx="1" fill="var(--md-sys-color-on-surface)" stroke="var(--md-sys-color-primary)"/>
                      </g>
                    </svg>
                  </div>

                  <div className={`status-badge-m3 ${connection}`} id="conn-status">
                    <span className="status-badge-icon"><StatusBadgeIcon status={connection} /></span>
                    <span className="status-badge-text">{statusLabel}</span>
                  </div>

                  <md-filled-button
                    id="btn-connect"
                    onClick={handleConnect}
                    disabled={isConnecting ? true : undefined}
                  >
                    {isConnecting ? (connection === "authorizing" ? "Waiting for Authorization…" : "Connecting…") : "CONNECT"}
                  </md-filled-button>
                </>
              )}
            </>
          )}


          {cardView === "help" && (
            <>
              <div className="card-content-wrapper text-layout">
                <div className="card-text-content help-layout-retro">
                  <div className="about-header-main">USB Debugging Guide</div>
                  <div className="about-header-line"></div>
                  
                  <div className="help-retro-cards">
                    <div className="help-retro-card">
                      <div className="help-retro-top">
                        <div className="help-retro-num-badge">01</div>
                        <div className="help-retro-title">Developer Options</div>
                      </div>
                      <div className="help-retro-body">
                        Open <strong>Settings</strong> &gt; <strong>About phone</strong> and tap <strong>Build number</strong> 7 times.
                      </div>
                    </div>
                    
                    <div className="help-retro-card">
                      <div className="help-retro-top">
                        <div className="help-retro-num-badge">02</div>
                        <div className="help-retro-title">USB Debugging</div>
                      </div>
                      <div className="help-retro-body">
                        Go to <strong>Developer options</strong> and enable the <strong>USB debugging</strong> toggle.
                      </div>
                    </div>
                    
                    <div className="help-retro-card">
                      <div className="help-retro-top">
                        <div className="help-retro-num-badge">03</div>
                        <div className="help-retro-title">Connect & Allow</div>
                      </div>
                      <div className="help-retro-body">
                        Plug in USB, click <strong>Connect</strong> below, and <strong>Allow</strong> authorization on your phone screen.
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="btn-forget-adb-key"
                  onClick={() => { credentialStore.clearKey(); alert("ADB key cleared. You will need to re-authorize on next connection."); }}
                  title="Clear stored RSA-2048 ADB key"
                >
                  Forget ADB Key
                </button>
                <md-filled-button onClick={() => switchCard("main")}>
                  Close Help
                </md-filled-button>
              </div>
            </>
          )}

          {cardView === "about" && (
            <>
              <div className="card-content-wrapper text-layout">
                <div className="card-text-content about-layout-retro">
                  <div className="about-header-main">About YAADU</div>
                  <div className="about-header-line"></div>
                  
                  <div className="about-japanese-sub">(Yet Another Android Debug Utility)</div>
                  
                  <div className="about-paragraphs">
                    <div className="about-para-card">
                      YAADU is a web-based client for Android Debug Bridge (ADB), running entirely inside your browser using the WebUSB API.
                    </div>
                    <div className="about-para-card">
                      It allows you to view telemetry, manage installed apps, backup photos/videos, and configure advanced tweaks without installing anything on your PC.
                    </div>
                  </div>

                  <div className="dev-card">
                    <div className="dev-card-header-main">Created By</div>
                    <div className="dev-card-header-line"></div>
                    <div className="dev-card-body">
                      <img
                        className="dev-avatar"
                        src="https://avatars.githubusercontent.com/u/22313910"
                        alt="HeX"
                      />
                      <div className="dev-info">
                        <div className="dev-detail">
                          <svg className="dev-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M22 7l-10 7L2 7" />
                          </svg>
                          talktosayan35@gmail.com
                        </div>
                        <div className="dev-detail">
                          <svg className="dev-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                          </svg>
                          <a href="https://github.com/samgrande" target="_blank" rel="noopener noreferrer">samgrande</a>
                        </div>
                        <div className="dev-detail">
                          <svg className="dev-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          Kolkata, India
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                <md-filled-button onClick={() => switchCard("main")}>
                  Awesome
                </md-filled-button>
              </div>
            </>
          )}

          {cardView === "theme" && (
            <div className="theme-card-content">
              <div className="theme-graphic-wrap">
                <div className="theme-pulse theme-pulse-outer"></div>
                <div className="theme-pulse theme-pulse-inner"></div>
                <div className="theme-icon-main">{THEME_ICON}</div>
              </div>

              <div className="theme-name">{selectedThemeName}</div>

              <div className="theme-swatch-row" role="radiogroup" aria-label="Theme color">
                {THEME_COLORS.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    className={`theme-swatch${draftTheme.color === entry.value ? " active" : ""}`}
                    style={{ backgroundColor: entry.value }}
                    aria-label={entry.name}
                    aria-checked={draftTheme.color === entry.value}
                    role="radio"
                    onClick={() => updateDraftTheme({ color: entry.value })}
                  >
                    {draftTheme.color === entry.value && (
                      <svg className="theme-swatch-check" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="white" opacity="0.25"/>
                        <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="theme-mode-toggle" role="radiogroup" aria-label="Theme mode">
                {(["light", "dark"] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`theme-mode-option${draftTheme.mode === mode ? " active" : ""}`}
                    aria-checked={draftTheme.mode === mode}
                    role="radio"
                    onClick={() => updateDraftTheme({ mode })}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              <md-filled-button className="theme-save-button" onClick={handleSaveTheme}>
                SAVE
              </md-filled-button>
            </div>
          )}
        </div>
        
        {cardView === "main" && (
          <div className={`connect-bottom-buttons${cardPhase === "exit" ? " btn-exit" : ""}`}>
            <md-filled-tonal-button onClick={() => switchCard("help")}>
              <span className="bottom-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.1 9a3 3 0 1 1 4.8 2.4c-1.1.8-1.9 1.4-1.9 2.6" />
                  <path d="M12 17h.01" />
                </svg>
              </span>
              HELP
            </md-filled-tonal-button>
            <md-filled-tonal-button onClick={() => switchCard("about")}>
              <span className="bottom-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </span>
              ABOUT
            </md-filled-tonal-button>
            <md-filled-tonal-button onClick={() => switchCard("theme")}>
              <span className="bottom-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a9 9 0 0 0 0 18h.8a1.8 1.8 0 0 0 1.7-2.4l-.5-1.5a1.8 1.8 0 0 1 1.7-2.4H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z" />
                  <circle cx="7.5" cy="10.5" r=".8" fill="currentColor" />
                  <circle cx="10" cy="7.5" r=".8" fill="currentColor" />
                  <circle cx="14" cy="7.5" r=".8" fill="currentColor" />
                  <circle cx="16.5" cy="10.5" r=".8" fill="currentColor" />
                </svg>
              </span>
              THEME
            </md-filled-tonal-button>
          </div>
        )}
      </div>
    </div>
  );
}
