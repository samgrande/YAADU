import { useEffect, useRef, useState } from "react";
import type { Adb } from "@yume-chan/adb";
import { useAppContext } from "../context.js";
import { disconnectDevice } from "../adb/connection.js";
import { TelemetryPanel } from "./panels/TelemetryPanel.js";
import { AppsPanel } from "./panels/AppsPanel.js";
import { BackupPanel } from "./panels/BackupPanel.js";
import { TweaksPanel } from "./panels/TweaksPanel.js";
import type { ActivePanel } from "../state.js";

interface NavItem {
  id:    ActivePanel;
  label: string;
  icon:  string;
  title: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "telemetry",
    label: "Info",
    title: "Device Info",
    icon: `<svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.66667 29.3333C1.93333 29.3333 1.30578 29.0724 0.784 28.5507C0.262222 28.0289 0.000888889 27.4009 0 26.6667V2.66667C0 1.93333 0.261333 1.30578 0.784 0.784C1.30667 0.262222 1.93422 0.000888889 2.66667 0H16C16.7333 0 17.3613 0.261333 17.884 0.784C18.4067 1.30667 18.6676 1.93422 18.6667 2.66667V6.8C19.0667 6.95556 19.3889 7.2 19.6333 7.53333C19.8778 7.86667 20 8.24444 20 8.66667V11.3333C20 11.7556 19.8778 12.1333 19.6333 12.4667C19.3889 12.8 19.0667 13.0444 18.6667 13.2V26.6667C18.6667 27.4 18.4058 28.028 17.884 28.5507C17.3622 29.0733 16.7342 29.3342 16 29.3333H2.66667ZM2.66667 26.6667H16V2.66667H2.66667V26.6667ZM10.284 20.9493C10.5391 20.6951 10.6667 20.3787 10.6667 20C10.6667 19.6213 10.5387 19.3049 10.2827 19.0507C10.0267 18.7964 9.71022 18.6684 9.33333 18.6667C8.95644 18.6649 8.64 18.7929 8.384 19.0507C8.128 19.3084 8 19.6249 8 20C8 20.3751 8.128 20.692 8.384 20.9507C8.64 21.2093 8.95644 21.3369 9.33333 21.3333C9.71022 21.3298 10.0271 21.2018 10.284 20.9493ZM10.284 15.616C10.5391 15.3609 10.6667 15.0444 10.6667 14.6667V9.33333C10.6667 8.95556 10.5387 8.63911 10.2827 8.384C10.0267 8.12889 9.71022 8.00089 9.33333 8C8.95644 7.99911 8.64 8.12711 8.384 8.384C8.128 8.64089 8 8.95733 8 9.33333V14.6667C8 15.0444 8.128 15.3613 8.384 15.6173C8.64 15.8733 8.95644 16.0009 9.33333 16C9.71022 15.9991 10.0271 15.8711 10.284 15.616Z" fill="var(--md-sys-color-primary)"/>
</svg>`,
  },
  {
    id: "apps",
    label: "Apps",
    title: "App Management",
    icon: `<svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.91667 9.5625L12.75 8.14583L15.5833 9.5625V2.83333H9.91667V9.5625ZM5.66667 19.8333V17H12.75V19.8333H5.66667ZM2.83333 25.5C2.05417 25.5 1.38739 25.2228 0.833 24.6684C0.278611 24.114 0.000944444 23.4468 0 22.6667V2.83333C0 2.05417 0.277667 1.38739 0.833 0.833C1.38833 0.278611 2.05511 0.000944444 2.83333 0H22.6667C23.4458 0 24.1131 0.277667 24.6684 0.833C25.2237 1.38833 25.5009 2.05511 25.5 2.83333V22.6667C25.5 23.4458 25.2228 24.1131 24.6684 24.6684C24.114 25.2237 23.4468 25.5009 22.6667 25.5H2.83333ZM2.83333 22.6667H22.6667V2.83333H18.4167V14.1667L12.75 11.3333L7.08333 14.1667V2.83333H2.83333V22.6667Z" fill="var(--md-sys-color-primary)"/>
</svg>`,
  },
  {
    id: "backup",
    label: "Media",
    title: "Backup Engine",
    icon: `<svg viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.66006 10.875C6.16941 10.875 5.69885 11.0725 5.35191 11.4242C5.00497 11.7758 4.81006 12.2527 4.81006 12.75C4.81006 13.2473 5.00497 13.7242 5.35191 14.0758C5.69885 14.4275 6.16941 14.625 6.67486 14.625H6.66006Z" fill="var(--md-sys-color-primary)"/>
<path d="M5.92 3.375C5.92 2.47989 6.27084 1.62145 6.89534 0.988515C7.51983 0.355579 8.36683 0 9.25 0H22.57C23.4532 0 24.3002 0.355579 24.9247 0.988515C25.5492 1.62145 25.9 2.47989 25.9 3.375V16.875C25.9 17.7701 25.5492 18.6286 24.9247 19.2615C24.3002 19.8944 23.4532 20.25 22.57 20.25H19.98V22.875C19.98 23.7701 19.6292 24.6286 19.0047 25.2615C18.3802 25.8944 17.5332 26.25 16.65 26.25H3.33C2.44683 26.25 1.59983 25.8944 0.975335 25.2615C0.350839 24.6286 0 23.7701 0 22.875V9.375C0 8.47989 0.350839 7.62145 0.975335 6.98851C1.59983 6.35558 2.44683 6 3.33 6H5.92V3.375ZM17.76 9.375C17.76 9.07663 17.6431 8.79048 17.4349 8.57951C17.2267 8.36853 16.9444 8.25 16.65 8.25H3.33C3.03561 8.25 2.75328 8.36853 2.54511 8.57951C2.33695 8.79048 2.22 9.07663 2.22 9.375V19.788L10.6086 15.381C11.2178 15.0606 11.9097 14.9388 12.5898 15.0323C13.2698 15.1257 13.9048 15.4298 14.4078 15.903L17.76 19.059V9.375ZM2.22 22.875C2.22 23.496 2.71728 24 3.33 24H16.65C16.9444 24 17.2267 23.8815 17.4349 23.6705C17.6431 23.4595 17.76 23.1734 17.76 22.875V22.1295L12.8967 17.553C12.7293 17.3952 12.5179 17.2937 12.2914 17.2623C12.0649 17.2309 11.8344 17.2711 11.6313 17.3775L2.22 22.323V22.875ZM8.14 6H16.65C17.5332 6 18.3802 6.35558 19.0047 6.98851C19.6292 7.62145 19.98 8.47989 19.98 9.375V18H22.57C22.8644 18 23.1467 17.8815 23.3549 17.6705C23.5631 17.4595 23.68 17.1734 23.68 16.875V3.375C23.68 3.07663 23.5631 2.79048 23.3549 2.5795C23.1467 2.36853 22.8644 2.25 22.57 2.25H9.25C8.95561 2.25 8.67328 2.36853 8.46511 2.5795C8.25695 2.79048 8.14 3.07663 8.14 3.375V6Z" fill="var(--md-sys-color-primary)"/>
</svg>`,
  },
  {
    id: "tweaks",
    label: "Tweaks",
    title: "System Control",
    icon: `<svg viewBox="0 0 28 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.781 15.565L18.5871 13.1652C18.6115 13.0827 18.6604 13.011 18.7273 12.9569C18.778 12.9178 18.8372 12.8911 18.9001 12.8789C18.963 12.8667 19.0278 12.8694 19.0895 12.8867C19.1512 12.9041 19.2079 12.9356 19.2552 12.9788C19.3025 13.022 19.3391 13.0756 19.362 13.1354L20.1681 15.565C20.4668 16.4774 20.976 17.3068 21.6544 17.986C22.3329 18.6652 23.1617 19.1753 24.0738 19.475L26.4708 20.3109C26.5529 20.3374 26.6244 20.3893 26.6751 20.459C26.7258 20.5288 26.7531 20.6128 26.7531 20.699C26.7531 20.7853 26.7258 20.8693 26.6751 20.939C26.6244 21.0088 26.5529 21.0606 26.4708 21.0872L24.0426 21.8933C23.1397 22.194 22.3193 22.7012 21.6467 23.3746C20.9741 24.0479 20.4678 24.8688 20.1681 25.7721L19.3322 28.1719C19.3064 28.2547 19.2549 28.3271 19.185 28.3785C19.1152 28.4298 19.0308 28.4576 18.9441 28.4576C18.8574 28.4576 18.7729 28.4298 18.7031 28.3785C18.6333 28.3271 18.5817 28.2547 18.5559 28.1719L17.7512 25.7424C17.4513 24.8389 16.9448 24.0179 16.272 23.3446C15.5991 22.6712 14.7784 22.1641 13.8752 21.8635L11.4485 21.0574C11.3664 21.0309 11.2949 20.979 11.2442 20.9093C11.1935 20.8395 11.1661 20.7555 11.1661 20.6693C11.1661 20.583 11.1935 20.499 11.2442 20.4293C11.2949 20.3595 11.3664 20.3077 11.4485 20.2811L13.8752 19.475C14.7868 19.1743 15.615 18.6639 16.2934 17.9848C16.9717 17.3057 17.4813 16.4769 17.781 15.565Z" fill="var(--md-sys-color-primary)"/>
<path d="M6.05948 7.94903L6.64456 6.20512C6.66195 6.1452 6.69775 6.09226 6.74687 6.0538C6.796 6.01534 6.85598 5.9933 6.91832 5.99079C6.98066 5.98828 7.04221 6.00544 7.09427 6.03984C7.14632 6.07423 7.18625 6.12412 7.20839 6.18245L7.79489 7.94903C8.01199 8.61262 8.38225 9.21578 8.8757 9.70972C9.36915 10.2037 9.97194 10.5745 10.6353 10.7923L12.3778 11.4014C12.4368 11.4213 12.4881 11.4592 12.5244 11.5098C12.5607 11.5604 12.5803 11.6211 12.5803 11.6834C12.5803 11.7456 12.5607 11.8063 12.5803 11.6834C12.5803 11.7456 12.5607 11.8063 12.5244 11.8569C12.4881 11.9075 12.4368 11.9454 12.3778 11.9653L10.6141 12.5532C9.95776 12.7724 9.36141 13.1412 8.87214 13.6304C8.38287 14.1197 8.01407 14.7161 7.79489 15.3724L7.18573 17.1177C7.16584 17.1767 7.12793 17.228 7.07736 17.2643C7.02678 17.3006 6.96608 17.3202 6.90381 17.3202C6.84154 17.3202 6.78084 17.3006 6.73026 17.2643C6.67969 17.228 6.64178 17.1767 6.62189 17.1177L6.03681 15.3497C5.81862 14.6929 5.45016 14.096 4.96075 13.6066C4.47134 13.1172 3.87448 12.7487 3.21764 12.5305L1.45248 11.9426C1.39347 11.9227 1.34219 11.8848 1.30586 11.8342C1.26954 11.7837 1.25 11.723 1.25 11.6607C1.25 11.5984 1.26954 11.5377 1.30586 11.4872C1.34219 11.4366 1.39347 11.3987 1.45248 11.3788L3.21764 10.7923C3.88073 10.5737 4.48328 10.2026 4.97685 9.70878C5.47042 9.21497 5.84123 8.61223 6.05948 7.94903Z" fill="var(--md-sys-color-primary)" stroke="var(--md-sys-color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17.4707 2.22995L17.764 1.35728C17.7727 1.32732 17.7906 1.30086 17.8151 1.28163C17.8397 1.26239 17.8697 1.25137 17.9009 1.25012C17.932 1.24887 17.9628 1.25745 17.9888 1.27464C18.0149 1.29184 18.0348 1.31679 18.0459 1.34595L18.3391 2.22995C18.4477 2.56195 18.6329 2.86372 18.8797 3.11083C19.1266 3.35793 19.4282 3.54343 19.7601 3.65228L20.6313 3.95545C20.6613 3.96506 20.6875 3.98396 20.7061 4.00942C20.7247 4.03489 20.7347 4.06559 20.7347 4.09712C20.7347 4.12864 20.7247 4.15935 20.7061 4.18481C20.6875 4.21027 20.6613 4.22917 20.6313 4.23878L19.7487 4.53203C19.4203 4.64113 19.1219 4.82536 18.8772 5.07006C18.6325 5.31477 18.4482 5.6132 18.3391 5.94162L18.036 6.81428C18.0264 6.8443 18.0075 6.8705 17.982 6.88908C17.9565 6.90766 17.9258 6.91768 17.8943 6.91768C17.8628 6.91768 17.8321 6.90766 17.8066 6.88908C17.781 6.88908 17.7623 6.8443 17.7526 6.81428L17.4608 5.93028C17.3517 5.60186 17.1675 5.30343 16.9228 5.05873C16.6781 4.81402 16.3796 4.6298 16.0512 4.5207L15.1686 4.22745C15.1386 4.21775 15.1127 4.19831 15.095 4.1722C15.0813 4.15339 15.0723 4.13162 15.0687 4.10866C15.0651 4.0857 15.0669 4.06221 15.0741 4.04011C15.0813 4.018 15.0936 3.99791 15.11 3.98147C15.1265 3.96504 15.1465 3.95272 15.1686 3.94553L16.0512 3.65228C16.3829 3.54324 16.6842 3.35766 16.9308 3.11056C17.1774 2.86347 17.3623 2.5618 17.4707 2.22995Z" fill="var(--md-sys-color-primary)" stroke="var(--md-sys-color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
];

export function Dashboard({ adb }: { adb: Adb }) {
  const { state, dispatch } = useAppContext();
  const [activePanel, setActivePanel] = useState<ActivePanel>(state.panel);
  const [exitingPanel, setExitingPanel] = useState<ActivePanel | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const device = state.device;

  const handlePanelChange = (panelId: ActivePanel) => {
    if (panelId === activePanel) return;
    if (transitionRef.current !== null) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    setExitingPanel(activePanel);
    transitionRef.current = setTimeout(() => {
      transitionRef.current = null;
      setActivePanel(panelId);
      setExitingPanel(null);
      dispatch({ type: "SET_PANEL", panel: panelId });
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (transitionRef.current !== null) {
        clearTimeout(transitionRef.current);
      }
    };
  }, []);

  const handleDisconnect = () => {
    if (confirm("Disconnect from device?")) {
      disconnectDevice(dispatch, adb);
    }
  };

  const batteryLevel = device?.batteryLevel ?? 0;
  const unfilledHeight = batteryLevel >= 100 ? "0%" : `calc(${100 - batteryLevel}% - 6px)`;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <span className="sidebar-wordmark">YAADU</span>
          </div>

          <nav className="sidebar-nav" id="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`nav-item-m3${activePanel === item.id ? " active" : ""}`}
                onClick={() => handlePanelChange(item.id)}
                title={item.title}
              >
                <span className="nav-icon-pill">
                  <span
                    className="nav-icon"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Device card */}
          {device && (
            <div className="sidebar-device-card" id="sb-device-card">
              <div className="device-card-inner">
                <div className="battery-v-container">
                  <div
                    className="battery-v-unfilled"
                    style={{ height: unfilledHeight }}
                  />
                  <div
                    className="battery-v-fill"
                    style={{ height: `${batteryLevel}%` }}
                  />
                </div>
                <div className="device-card-body">
                  <div className="battery-pct-main">
                    <span id="sb-batt-pct-num">{batteryLevel}</span>
                    <div className="battery-right-stack">
                      <div className="battery-icon-above">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(-90deg)" }}>
                          <rect x="2" y="7" width="16" height="11" rx="2"/>
                          <path d="M22 11v3"/>
                          <line x1="6" y1="12.5" x2="12" y2="12.5"/>
                        </svg>
                      </div>
                      <span className="battery-pct-unit">%</span>
                    </div>
                  </div>
                  <div className="device-brand" id="sb-brand">{device.brand.toUpperCase()}</div>
                  <div className="device-model" id="sb-model">{device.marketingName}</div>
                </div>
              </div>
            </div>
          )}

          <div className="sidebar-disconnect-wrap">
            <button id="btn-disconnect" className="btn-disconnect" onClick={handleDisconnect}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            className={`panel-area ${exitingPanel !== null ? "panel-exit" : ""}`}
            data-panel-id={activePanel}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {activePanel === "telemetry" && <TelemetryPanel adb={adb} />}
            {activePanel === "apps" && <AppsPanel adb={adb} />}
            {activePanel === "backup" && <BackupPanel adb={adb} />}
            {activePanel === "tweaks" && <TweaksPanel adb={adb} />}
          </div>
        </div>
      </main>
    </div>
  );
}
