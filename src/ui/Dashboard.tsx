import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { Adb } from "@yume-chan/adb";
import { useAppContext } from "../context.js";
import { disconnectDevice } from "../adb/connection.js";
import { DeviceShellProvider } from "../features/device-shell/DeviceShellProvider.js";
import { BottomBar } from "../features/device-shell/components/BottomBar.js";
import { ShellConsolePanel } from "../features/device-shell/components/ShellConsolePanel.js";
import { MirrorPanel } from "../features/mirror/components/MirrorPanel.js";
import { MirrorToggle } from "../features/mirror/components/MirrorToggle.js";
import { useMirrorStore } from "../features/mirror/MirrorStore.js";
import { PanelLoader } from "./PanelLoader.js";
import type { ActivePanel } from "../state.js";

const TelemetryPanel = lazy(() => import("./panels/TelemetryPanel.js").then(m => ({ default: m.TelemetryPanel })));
const AppsPanel = lazy(() => import("./panels/AppsPanel.js").then(m => ({ default: m.AppsPanel })));
const BackupPanel = lazy(() => import("./panels/BackupPanel.js").then(m => ({ default: m.BackupPanel })));
const TweaksPanel = lazy(() => import("./panels/TweaksPanel.js").then(m => ({ default: m.TweaksPanel })));

const TelemetryIcon = () => (
  <svg viewBox="0 0 20 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.66667 29.3333C1.93333 29.3333 1.30578 29.0724 0.784 28.5507C0.262222 28.0289 0.000888889 27.4009 0 26.6667V2.66667C0 1.93333 0.261333 1.30578 0.784 0.784C1.30667 0.262222 1.93422 0.000888889 2.66667 0H16C16.7333 0 17.3613 0.261333 17.884 0.784C18.4067 1.30667 18.6676 1.93422 18.6667 2.66667V6.8C19.0667 6.95556 19.3889 7.2 19.6333 7.53333C19.8778 7.86667 20 8.24444 20 8.66667V11.3333C20 11.7556 19.8778 12.1333 19.6333 12.4667C19.3889 12.8 19.0667 13.0444 18.6667 13.2V26.6667C18.6667 27.4 18.4058 28.028 17.884 28.5507C17.3622 29.0733 16.7342 29.3342 16 29.3333H2.66667ZM2.66667 26.6667H16V2.66667H2.66667V26.6667ZM10.284 20.9493C10.5391 20.6951 10.6667 20.3787 10.6667 20C10.6667 19.6213 10.5387 19.3049 10.2827 19.0507C10.0267 18.7964 9.71022 18.6684 9.33333 18.6667C8.95644 18.6649 8.64 18.7929 8.384 19.0507C8.128 19.3084 8 19.6249 8 20C8 20.3751 8.128 20.692 8.384 20.9507C8.64 21.2093 8.95644 21.3369 9.33333 21.3333C9.71022 21.3298 10.0271 21.2018 10.284 20.9493ZM10.284 15.616C10.5391 15.3609 10.6667 15.0444 10.6667 14.6667V9.33333C10.6667 8.95556 10.5387 8.63911 10.2827 8.384C10.0267 8.12889 9.71022 8.00089 9.33333 8C8.95644 7.99911 8.64 8.12711 8.384 8.384C8.128 8.64089 8 8.95733 8 9.33333V14.6667C8 15.0444 8.128 15.3613 8.384 15.6173C8.64 15.8733 8.95644 16.0009 9.33333 16C9.71022 15.9991 10.0271 15.8711 10.284 15.616Z" fill="var(--md-sys-color-primary)"/>
  </svg>
);

const AppsIcon = () => (
  <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.91667 9.5625L12.75 8.14583L15.5833 9.5625V2.83333H9.91667V9.5625ZM5.66667 19.8333V17H12.75V19.8333H5.66667ZM2.83333 25.5C2.05417 25.5 1.38739 25.2228 0.833 24.6684C0.278611 24.114 0.000944444 23.4468 0 22.6667V2.83333C0 2.05417 0.277667 1.38739 0.833 0.833C1.38833 0.278611 2.05511 0.000944444 2.83333 0H22.6667C23.4458 0 24.1131 0.277667 24.6684 0.833C25.2237 1.38833 25.5009 2.05511 25.5 2.83333V22.6667C25.5 23.4458 25.2228 24.1131 24.6684 24.6684C24.114 25.2237 23.4468 25.5009 22.6667 25.5H2.83333ZM2.83333 22.6667H22.6667V2.83333H18.4167V14.1667L12.75 11.3333L7.08333 14.1667V2.83333H2.83333V22.6667Z" fill="var(--md-sys-color-primary)"/>
  </svg>
);

const BackupIcon = () => (
  <svg viewBox="0 0 26 27" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66006 10.875C6.16941 10.875 5.69885 11.0725 5.35191 11.4242C5.00497 11.7758 4.81006 12.2527 4.81006 12.75C4.81006 13.2473 5.00497 13.7242 5.35191 14.0758C5.69885 14.4275 6.16941 14.625 6.67486 14.625H6.66006Z" fill="var(--md-sys-color-primary)"/>
    <path d="M5.92 3.375C5.92 2.47989 6.27084 1.62145 6.89534 0.988515C7.51983 0.355579 8.36683 0 9.25 0H22.57C23.4532 0 24.3002 0.355579 24.9247 0.988515C25.5492 1.62145 25.9 2.47989 25.9 3.375V16.875C25.9 17.7701 25.5492 18.6286 24.9247 19.2615C24.3002 19.8944 23.4532 20.25 22.57 20.25H19.98V22.875C19.98 23.7701 19.6292 24.6286 19.0047 25.2615C18.3802 25.8944 17.5332 26.25 16.65 26.25H3.33C2.44683 26.25 1.59983 25.8944 0.975335 25.2615C0.350839 24.6286 0 23.7701 0 22.875V9.375C0 8.47989 0.350839 7.62145 0.975335 6.98851C1.59983 6.35558 2.44683 6 3.33 6H5.92V3.375ZM17.76 9.375C17.76 9.07663 17.6431 8.79048 17.4349 8.57951C17.2267 8.36853 16.9444 8.25 16.65 8.25H3.33C3.03561 8.25 2.75328 8.36853 2.54511 8.57951C2.33695 8.79048 2.22 9.07663 2.22 9.375V19.788L10.6086 15.381C11.2178 15.0606 11.9097 14.9388 12.5898 15.0323C13.2698 15.1257 13.9048 15.4298 14.4078 15.903L17.76 19.059V9.375ZM2.22 22.875C2.22 23.496 2.71728 24 3.33 24H16.65C16.9444 24 17.2267 23.8815 17.4349 23.6705C17.6431 23.4595 17.76 23.1734 17.76 22.875V22.1295L12.8967 17.553C12.7293 17.3952 12.5179 17.2937 12.2914 17.2623C12.0649 17.2309 11.8344 17.2711 11.6313 17.3775L2.22 22.323V22.875ZM8.14 6H16.65C17.5332 6 18.3802 6.35558 19.0047 6.98851C19.6292 7.62145 19.98 8.47989 19.98 9.375V18H22.57C22.8644 18 23.1467 17.8815 23.3549 17.6705C23.5631 17.4595 23.68 17.1734 23.68 16.875V3.375C23.68 3.07663 23.5631 2.79048 23.3549 2.5795C23.1467 2.36853 22.8644 2.25 22.57 2.25H9.25C8.95561 2.25 8.67328 2.36853 8.46511 2.5795C8.25695 2.79048 8.14 3.07663 8.14 3.375V6Z" fill="var(--md-sys-color-primary)"/>
  </svg>
);

const TweaksIcon = () => (
  <svg width="33" height="36" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.46484 22.8447L11.4102 10.5625V1.5H21.2698V10.5625L27.1938 22.8447" stroke="var(--md-sys-color-primary)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M3.01628 34.0696C2.37485 33.7591 1.88303 33.2065 1.64901 32.5334C1.415 31.8603 1.45795 31.1218 1.76843 30.4804L5.46518 22.8447C5.46518 22.8447 11.3949 26.9495 16.3206 22.8447C21.2463 18.74 27.1949 22.8447 27.1949 22.8447L30.881 30.4837C31.0786 30.8934 31.169 31.3465 31.1437 31.8006C31.1184 32.2548 30.9782 32.6951 30.7362 33.0803C30.4943 33.4654 30.1586 33.7829 29.7604 34.0029C29.3623 34.2229 28.9149 34.3382 28.46 34.338H4.18695C3.7814 34.338 3.3816 34.2461 3.01628 34.0696Z" stroke="var(--md-sys-color-primary)" stroke-width="3" stroke-linejoin="round"/>
  </svg>

);

const NAV_ITEMS: { id: ActivePanel; label: string; title: string; icon: React.ComponentType; }[] = [
  { id: "telemetry", label: "Info",    title: "Device Info",     icon: TelemetryIcon },
  { id: "apps",      label: "Apps",    title: "App Management",  icon: AppsIcon },
  { id: "backup",    label: "Media",   title: "Backup Engine",   icon: BackupIcon },
  { id: "tweaks",    label: "Labs",  title: "System Control",  icon: TweaksIcon },
];

export function Dashboard({ adb }: { adb: Adb }) {
  const { state, dispatch } = useAppContext();
  const { isExpanded: isMirrorExpanded } = useMirrorStore();
  const [activePanel, setActivePanel] = useState<ActivePanel>(state.panel);
  const [exitingPanel, setExitingPanel] = useState<ActivePanel | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const device = state.device;

  const handlePanelChange = (panelId: ActivePanel) => {
    if (panelId === activePanel) {
      setRefreshKey((k) => k + 1);
      return;
    }
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
    <DeviceShellProvider adb={adb}>
    <div className="dashboard">
      <div className="dashboard-body">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <div className="sidebar-wordmark">
              <svg width="100%" height="100%" viewBox="0 0 1074 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M86 171.532C88.0375 147.308 95.4517 125.009 108.243 104.634C121.034 84.2591 138.069 68.0723 159.35 56.0737L134.221 12.607C132.863 10.5695 132.523 8.41884 133.202 6.15495C133.881 3.89106 135.353 2.19314 137.617 1.0612C139.428 -0.0707465 141.465 -0.297135 143.729 0.382031C145.993 1.0612 147.804 2.41953 149.163 4.45703L174.292 47.9237C193.761 39.7737 214.136 35.6987 235.417 35.6987C256.697 35.6987 277.072 39.7737 296.542 47.9237L321.671 4.45703C323.029 2.41953 324.84 1.0612 327.104 0.382031C329.368 -0.297135 331.406 -0.0707465 333.217 1.0612C335.481 2.19314 336.952 3.89106 337.631 6.15495C338.31 8.41884 337.971 10.5695 336.613 12.607L311.483 56.0737C332.764 68.0723 349.8 84.2591 362.591 104.634C375.382 125.009 382.796 147.308 384.833 171.532H86ZM179.555 129.254C182.838 125.971 184.479 121.953 184.479 117.199C184.479 112.445 182.838 108.426 179.555 105.143C176.273 101.861 172.254 100.22 167.5 100.22C162.746 100.22 158.727 101.861 155.445 105.143C152.162 108.426 150.521 112.445 150.521 117.199C150.521 121.953 152.162 125.971 155.445 129.254C158.727 132.537 162.746 134.178 167.5 134.178C172.254 134.178 176.273 132.537 179.555 129.254ZM315.389 129.254C318.671 125.971 320.313 121.953 320.313 117.199C320.313 112.445 318.671 108.426 315.389 105.143C312.106 101.861 308.088 100.22 303.333 100.22C298.579 100.22 294.561 101.861 291.278 105.143C287.995 108.426 286.354 112.445 286.354 117.199C286.354 121.953 287.995 125.971 291.278 129.254C294.561 132.537 298.579 134.178 303.333 134.178C308.088 134.178 312.106 132.537 315.389 129.254Z" fill="var(--md-sys-color-primary)"/>
                <rect y="171.032" width="1074" height="248" rx="50" fill="var(--md-sys-color-on-surface)" fillOpacity="6.12"/>
                <path d="M721.66 372.622C719.54 371.842 716.69 370.152 715.32 368.872C714.59 368.182 713.95 367.602 713.41 366.942C710 362.852 710 355.922 710 302.612V300.972C710 261.742 710.36 241.222 711.07 239.352C712.4 235.812 715.61 232.332 719.5 230.182C722.1 228.752 726.19 228.542 750.5 228.632C780.84 228.752 786.75 229.572 799.58 235.442C816.73 243.292 829.79 259.472 835.16 279.532C838.14 290.682 838.12 309.222 835.12 320.532C828.2 346.642 810.97 364.182 785.34 371.222C778.44 373.122 774.39 373.412 751.5 373.702C730.93 373.962 724.7 373.732 721.66 372.622ZM556.96 371.782C553.7 370.142 551.89 368.332 550.25 365.072C549.58 363.742 548.97 362.822 548.57 361.812C546.84 357.372 549.4 351.262 570.34 301.242C572.18 296.852 574.16 292.122 576.29 287.032C595.45 241.212 596.01 239.932 598.29 236.832C601.81 232.052 608.2 228.862 615.42 228.282C620.75 227.862 622.64 228.182 627.24 230.282C636.26 234.412 635.11 232.262 659.72 291.032L661.88 296.172C684.46 350.082 686.11 354.022 685.88 357.842C685.85 358.252 685.8 358.672 685.76 359.152C685.2 365.022 681.88 369.732 676.6 372.122C671.42 374.482 667.59 374.482 662.42 372.132C656.98 369.662 654.96 366.852 650.48 355.562L646.71 346.032H616.97C589.52 346.032 587.19 346.162 586.71 347.782C585.26 352.602 578.84 366.542 577.28 368.272C574.61 371.232 568.51 374.032 564.75 374.032C562.92 374.032 559.42 373.022 556.96 371.782ZM398.02 371.782C392.31 368.862 389.82 365.322 389.3 359.352C388.91 354.882 390.65 350.352 413.42 296.592C433.97 248.082 438.56 238.042 441.65 234.882C448.4 227.962 459.39 226.142 468.56 230.412C474.94 233.382 478.76 238.202 483.32 249.032C518.29 332.132 527 353.802 527 357.732C526.99 368.342 516.23 376.212 505.95 373.132C499.33 371.152 496.63 367.952 491.96 356.562L487.65 346.032H428.28L424.49 355.282C419.68 366.992 417.69 369.812 412.6 372.122C407.17 374.592 403.35 374.502 398.02 371.782ZM914.76 375.012C889.5 371.982 870.45 356.072 864.36 332.932C862.95 327.552 862.62 319.752 862.29 284.032L861.9 241.532L864.2 237.072C868.85 228.062 881.35 225.242 889.41 231.402C891.37 232.892 893.54 235.112 894.24 236.322C895.17 237.962 895.64 249.492 896.05 281.032C896.65 326.992 896.76 327.952 902.29 335.182C906.92 341.252 913.68 344.372 923.18 344.852C933.58 345.372 939.9 343.232 945.97 337.142C954.19 328.882 954.35 327.852 954.97 279.852C955.48 239.552 955.57 238.082 957.59 235.352C962.83 228.302 973.54 225.902 980.08 230.302C981.93 231.552 984.48 234.102 985.73 235.952L988 239.332V281.022C988 327.522 987.62 330.902 980.77 344.872C976.72 353.162 966.8 363.312 958.46 367.722C946.82 373.892 929.51 376.772 914.76 375.012ZM317.97 371.782C315.03 370.302 312.74 368.172 311.27 365.532C309.14 361.722 309.03 360.452 309.02 339.162L309 316.792L299.16 302.662C271.8 263.352 264.79 252.312 264.27 247.732C263.58 241.612 265.4 236.812 269.98 232.672C276.68 226.612 287.41 226.672 293.27 232.792C295.59 235.212 306.32 251.812 321.36 276.252C323.64 279.952 325.72 282.982 326 283.002C326.28 283.012 328.59 279.762 331.13 275.782C333.68 271.792 340.37 261.332 345.98 252.532C357.82 233.992 359.12 232.402 364.5 229.922C369.83 227.462 374.65 227.582 379.47 230.312C385.46 233.702 388 238.132 388 245.192C388 251.022 387.92 251.172 376.65 267.792C370.41 277.002 360.29 291.722 354.15 300.502L343 316.472L342.98 338.002C342.96 356.792 342.72 360.042 341.11 363.532C336.61 373.272 327.42 376.552 317.97 371.782ZM777.23 341.042C793.44 336.032 802.6 322.682 803.75 302.392C804.87 282.352 796.05 267.722 779.37 261.982C774.7 260.382 770.96 260.032 758.34 260.032H743V343.032H756.89C767.94 343.032 772.11 342.622 777.23 341.042ZM92 345.322C88.29 343.972 86 340.672 86 336.672C86 332.792 86.66 331.992 104.5 314.062C114.67 303.832 123 295.022 123 294.492C123 293.952 114.67 285.192 104.5 275.032C86.53 257.082 86 256.432 86 252.462C86 245.592 92.75 241.302 98.72 244.382C102.58 246.382 143.9 288.642 145.12 291.842C147.02 296.832 144.66 299.902 121.47 322.532C109.07 334.632 98.15 344.842 97.21 345.212C95.16 346.032 93.99 346.052 92 345.322ZM167.02 347.942C162.63 346.142 161 343.952 161 339.832C161 337.032 161.69 335.252 163.45 333.482L165.91 331.032H223.65L225.83 333.342C229 336.732 228.81 342.922 225.42 346.112L222.84 348.532L196.17 348.742C179.95 348.872 168.53 348.552 167.02 347.942ZM634 314.192C634 313.282 618.42 274.512 617.36 272.812C617.01 272.232 612.97 281.112 608.39 292.542C603.81 303.972 600.3 313.712 600.59 314.182C601.27 315.282 634 315.302 634 314.192ZM474.56 313.282C466.67 292.102 458.48 272.162 457.91 272.762C456.6 274.142 441.2 313.512 441.66 314.282C441.91 314.692 449.56 315.032 458.67 315.032C474.01 315.032 475.17 314.902 474.56 313.282Z" fill="var(--md-sys-color-primary)"/>
              </svg>
            </div>
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
                  <span className="nav-icon">
                    <item.icon />
                  </span>
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
              <MirrorToggle />
            </div>
          )}

        </div>
      </aside>

      <div className={`mirror-panel-column${isMirrorExpanded ? " expanded" : ""}`}>
        <MirrorPanel adb={adb} />
      </div>

      <main className="main-content">
        <div className="main-content-stack">
          <div className="dashboard-panel-layer">
            <div
              className={`panel-area ${exitingPanel !== null ? "panel-exit" : ""}`}
              data-panel-id={activePanel}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <Suspense fallback={<PanelLoader />}>
                {activePanel === "telemetry" && <TelemetryPanel key={refreshKey} adb={adb} />}
                {activePanel === "apps" && <AppsPanel key={refreshKey} adb={adb} />}
                {activePanel === "backup" && <BackupPanel key={refreshKey} adb={adb} />}
                {activePanel === "tweaks" && <TweaksPanel key={refreshKey} adb={adb} />}
              </Suspense>
            </div>
          </div>
          <ShellConsolePanel />
        </div>
      </main>
      </div>
      <div className="dashboard-footer">
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
        <BottomBar adb={adb} />
      </div>
    </div>
    </DeviceShellProvider>
  );
}
