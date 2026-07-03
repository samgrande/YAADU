import React, { useState, useCallback } from "react";
import { useAppContext } from "../../context.js";
import { connectDevice } from "../../adb/connection.js";
import type { ConnectionStatus } from "../../state.js";

// ── Status messages ────────────────────────────────────────────────────────

const STATUS_MESSAGES: Record<ConnectionStatus, string> = {
  disconnected: "Device Not Connected",
  connecting:   "Opening USB Device Picker…",
  authorizing:  "Authorize on Phone Screen",
  connected:    "Connected",
  error:        "Device Disconnected",
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

type CardView = "main" | "help" | "about";

export function ConnectScreen() {
  const { state, dispatch } = useAppContext();
  const [cardView, setCardView] = useState<CardView>("main");
  const { connection, error } = state;

  const isConnecting = connection === "connecting" || connection === "authorizing";

  const handleConnect = useCallback(async () => {
    if (isConnecting) return;
    await connectDevice(dispatch);
  }, [dispatch, isConnecting]);

  const statusLabel = error ?? STATUS_MESSAGES[connection] ?? "Device Not Connected";

  return (
    <div className="connect-screen" id="connect-screen">
      <div className="connect-screen-content">
        {/* Top Brand Header */}
        <div className="connect-brand-header">
          <div className="connect-title-yaadu">YAADU</div>
          <div className="connect-wave-separator">
            <svg className="connect-wave-path" width="300" height="12" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 6 C 10 12, 10 0, 20 6 C 30 12, 30 0, 40 6 C 50 12, 50 0, 60 6 C 70 12, 70 0, 80 6 C 90 12, 90 0, 100 6 C 110 12, 110 0, 120 6 C 130 12, 130 0, 140 6 C 150 12, 150 0, 160 6 C 170 12, 170 0, 180 6 C 190 12, 190 0, 200 6 C 210 12, 210 0, 220 6 C 230 12, 230 0, 240 6 C 250 12, 250 0, 260 6 C 270 12, 270 0, 280 6 C 290 12, 290 0, 300 6" stroke="var(--green)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="connect-tagline-text">{`>// Yet. Another. Android. Debug. Tool`}</div>
        </div>

        {/* Card */}
        <div className="connect-card-m3">
          {cardView === "main" && (
            <>
              <div className="phone-graphic-container">
                <svg width="265" height="265" viewBox="0 0 265 265" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="pulse-circle outer-2" cx="132.5" cy="132.5" r="132.5" fill="var(--md-sys-color-primary-container)" fillOpacity="0.16"/>
                  <circle className="pulse-circle outer-1" cx="132.5" cy="132.5" r="115" fill="var(--md-sys-color-primary-container)" fillOpacity="0.37"/>
                  <circle className="pulse-circle-static" cx="132.5" cy="132.5" r="95" fill="var(--md-sys-color-primary-container)"/>
                  <g transform="translate(102.5, 63)">
                    <path d="M32.5004 114V113.5C32.5004 112.096 32.5004 111.393 32.1634 110.889C32.0175 110.671 31.8299 110.483 31.6114 110.337C31.1074 110 30.4044 110 29.0004 110C27.5964 110 26.8934 110 26.3894 110.337C26.171 110.483 25.9834 110.671 25.8374 110.889C25.5004 111.393 25.5004 112.096 25.5004 113.5V114" stroke="var(--md-sys-color-primary)" strokeWidth="2"/>
                    <path d="M23.0044 115.113C22.9374 114.243 23.6404 113.5 24.5304 113.5H33.4704C34.3604 113.5 35.0634 114.243 34.9964 115.113L34.8124 117.492C34.6774 119.206 34.0984 120.855 33.1324 122.277L32.5324 123.162C32.2488 123.576 31.8684 123.914 31.4243 124.147C30.9803 124.38 30.486 124.501 29.9844 124.5H28.0164C27.515 124.501 27.021 124.38 26.5771 124.147C26.1332 123.913 25.753 123.575 25.4694 123.162L24.8684 122.277C23.9025 120.855 23.3235 119.206 23.1884 117.492L23.0044 115.113Z" stroke="var(--md-sys-color-primary)" strokeWidth="2"/>
                    <path d="M29 124.757V164M28 117H30" stroke="var(--md-sys-color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  {isConnecting ? (connection === "authorizing" ? "Waiting for Authorization…" : "Connecting…") : "Connect Device"}
              </md-filled-button>
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
                <md-filled-button onClick={() => setCardView("main")}>
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
                </div>
                <md-filled-button onClick={() => setCardView("main")}>
                  Awesome
                </md-filled-button>
              </div>
            </>
          )}
        </div>
        
        {cardView === "main" && (
          <div className="connect-bottom-buttons">
            <md-filled-tonal-button onClick={() => setCardView("help")}>
              HELP
            </md-filled-tonal-button>
            <md-filled-tonal-button onClick={() => setCardView("about")}>
              ABOUT
            </md-filled-tonal-button>
            <md-filled-tonal-button onClick={() => window.open("https://github.com/hex/YAADU", "_blank")}>
              GITHUB
            </md-filled-tonal-button>
          </div>
        )}
      </div>
    </div>
  );
}
