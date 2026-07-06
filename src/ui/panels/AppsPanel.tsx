import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Adb } from "@yume-chan/adb";
import {
  listUserApps, listAllApps, mergeDisabledState,
  forceStop, uninstallApp,
  disableApp, enableApp, installApk,
  fetchAppLabel,
  type AppEntry, type InstallProgress,
} from "../../adb/apps.js";
import { toast } from "../Toast.js";
import { ScrollPill } from "../ScrollPill.js";
import { PanelLoader } from "../PanelLoader.js";
import { sortCategories } from "../../adb/app-categories.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function shortPkg(pkg: string): string {
  const parts = pkg.split(".");
  return parts.slice(-2).join(" ");
}

// ── APK Installer ──────────────────────────────────────────────────────────

interface ApkInstallerProps {
  adb: Adb;
  onInstalled: () => void;
}

function ApkInstaller({ adb, onInstalled }: ApkInstallerProps) {
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".apk")) {
      toast("Please select a valid .apk file", "error");
      return;
    }
    setProgress({ phase: "pushing", percent: 0, message: "Starting…" });
    const result = await installApk(adb, file, setProgress);
    if (result.success) {
      toast(result.message, "success", { duration: 4000 });
      setTimeout(() => { setProgress(null); onInstalled(); }, 1500);
    } else {
      toast(result.message, "error", { duration: 6000 });
      setProgress(null);
    }
  }, [adb, onInstalled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [handleFile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".apk"
        style={{ display: "none" }}
        onChange={handleChange}
        id="apk-file-input"
      />
      <div
        className={`apk-drop-zone${dragging ? " drag-over" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ pointerEvents: progress ? "none" : "auto" }}
      >
        <div className="apk-drop-title">Drop APK here or click to browse</div>
        <div className="apk-drop-sub">Supports Android APK files · Will push to /data/local/tmp then install</div>
      </div>

      {progress && (
        <div className="apk-progress" style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "16px" }}>
          <div className="apk-progress-label" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
            <span>{progress.message}</span>
            <span>{progress.percent}%</span>
          </div>
          <md-linear-progress value={progress.percent / 100} style={{ width: "100%" }}></md-linear-progress>
        </div>
      )}
    </div>
  );
}

// ── App card component ─────────────────────────────────────────────────────

const SHAPES = [
  "M334.285 259.457C331.711 284.036 330.424 296.325 325.697 306.022C318.858 320.055 306.923 330.89 292.372 336.277C282.317 340 270.067 340 245.568 340L121.863 340C92.2359 340 77.4221 340 66.1134 335.146C49.7395 328.118 37.2802 314.151 32.0729 296.985C28.4765 285.129 30.0331 270.267 33.1463 240.543L45.7147 120.543C48.289 95.9642 49.5762 83.6748 54.3026 73.9777C61.142 59.9453 73.0768 49.1101 87.6278 43.7229C97.6833 40 109.933 40 134.432 40L258.137 40C287.764 40 302.578 40 313.887 44.8539C330.261 51.8819 342.72 65.8495 347.927 83.0153C351.524 94.871 349.967 109.733 346.854 139.457L334.285 259.457Z",
  "M40 182.857C40 103.959 107.157 40 190 40C272.843 40 340 103.959 340 182.857L340 282.857C340 314.416 313.137 340 280 340C270.178 340 260.907 337.752 252.724 333.768C248.554 331.737 244.394 329.512 240.216 327.277C225.513 319.411 210.592 311.429 194.27 311.429H185.73C169.408 311.429 154.487 319.411 139.784 327.277C135.606 329.512 131.446 331.737 127.276 333.768C119.093 337.752 109.822 340 100 340C66.8629 340 40 314.416 40 282.857L40 182.857Z",
  "M166.725 43.1869C177.261 25.6044 202.739 25.6044 213.275 43.1868L225.124 62.9597C231.268 73.2136 243.399 78.2385 254.995 75.3327L277.355 69.7294C297.237 64.7468 315.253 82.7627 310.271 102.645L304.667 125.005C301.762 136.601 306.786 148.732 317.04 154.876L336.813 166.725C354.396 177.261 354.396 202.739 336.813 213.275L317.04 225.124C306.786 231.268 301.762 243.399 304.667 254.995L310.271 277.355C315.253 297.237 297.237 315.253 277.355 310.271L254.995 304.667C243.399 301.762 231.268 306.786 225.124 317.04L213.275 336.813C202.739 354.396 177.261 354.396 166.725 336.813L154.876 317.04C148.732 306.786 136.601 301.762 125.005 304.667L102.646 310.271C82.7627 315.253 64.7468 297.237 69.7294 277.355L75.3327 254.995C78.2385 243.399 73.2136 231.268 62.9597 225.124L43.1869 213.275C25.6044 202.739 25.6044 177.261 43.1868 166.725L62.9597 154.876C73.2136 148.732 78.2385 136.601 75.3327 125.005L69.7294 102.646C64.7468 82.7627 82.7627 64.7468 102.645 69.7294L125.005 75.3327C136.601 78.2385 148.732 73.2136 154.876 62.9597L166.725 43.1869Z",
];

interface AppCardProps {
  entry: AppEntry;
  adb: Adb;
  onRemove: (pkg: string) => void;
}

function AppCard({ entry, adb, onRemove }: AppCardProps) {
  const displayName = entry.label ?? shortPkg(entry.packageName);
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();
  const isSystem = entry.systemApp;
  const [confirming, setConfirming] = useState(false);

  const handleAction = useCallback(async (action: string) => {
    const pkg = entry.packageName;
    let result;
    switch (action) {
      case "stop":           result = await forceStop(adb, pkg); break;
      case "uninstall":
        setConfirming(false);
        result = await uninstallApp(adb, pkg);
        if (result.success) { onRemove(pkg); }
        break;
      case "toggle-disable":
        result = entry.disabled ? await enableApp(adb, pkg) : await disableApp(adb, pkg);
        if (result.success) { onRemove(pkg); }
        break;
      default: return;
    }
    if (result) toast(result.message, result.success ? "success" : "error");
  }, [adb, entry, onRemove]);

  return (
    <div className={`app-card${entry.disabled ? " disabled-app" : ""}`} data-pkg={entry.packageName}>
      <div className="app-icon-wrap">
        <div className="app-icon-placeholder">
          <svg className="avatar-shape avatar-shape-top" viewBox="0 0 380 380">
            <path d={SHAPES[0]} fill="var(--md-sys-color-primary)" fillOpacity="0.16"/>
          </svg>
          <svg className="avatar-shape avatar-shape-left" viewBox="0 0 380 380">
            <path d={SHAPES[1]} fill="var(--md-sys-color-primary)" fillOpacity="0.16"/>
          </svg>
          <svg className="avatar-shape avatar-shape-right" viewBox="0 0 380 380">
            <path d={SHAPES[2]} fill="var(--md-sys-color-primary)" fillOpacity="0.16"/>
          </svg>
          <span className="avatar-letter">{initial}</span>
        </div>
      </div>
      <div className="app-details-wrap">
        <div className="app-info">
          <div className="app-pkg">{displayName}</div>
          <div className="app-pkg-short">
            {entry.packageName}
            {isSystem && (
              <span className="badge badge-outline" style={{ fontSize: "9px", padding: "1px 6px", marginLeft: "6px" }}>
                SYSTEM
              </span>
            )}
            {entry.disabled && (
              <span className="badge badge-amber" style={{ fontSize: "9px", padding: "1px 6px", marginLeft: "6px" }}>
                DISABLED
              </span>
            )}
          </div>
        </div>
        {confirming ? (
          <div className="app-confirm-bar">
            <span className="app-confirm-text">Uninstall {displayName}?</span>
            <div className="app-confirm-actions">
              <button className="btn-app-action" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="btn-app-action btn-action-danger" onClick={() => handleAction("uninstall")}>Confirm</button>
            </div>
          </div>
        ) : (
          <div className="app-actions">
            <button className="btn-app-action" onClick={() => handleAction("stop")} title="Force Stop">Stop</button>
            <button className="btn-app-action" onClick={() => handleAction("toggle-disable")}>
              {entry.disabled ? "Enable" : "Disable"}
            </button>
            <button className="btn-app-action btn-action-danger" onClick={() => setConfirming(true)} title="Uninstall">Uninstall</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main AppsPanel component ───────────────────────────────────────────────

interface Props { adb: Adb; }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "md-linear-progress": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { value?: number }, HTMLElement>;
    }
  }
}

export function AppsPanel({ adb }: Props) {
  const [apps, setApps]                   = useState<AppEntry[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("");
  const [showSystem, setShowSystem]       = useState(false);
  const [showInstaller, setShowInstaller] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const panelRef                          = useRef<HTMLDivElement>(null);

  const loadApps = useCallback(async () => {
    setActiveCategory("all");
    setLoading(true);
    try {
      let list = showSystem ? await listAllApps(adb) : await listUserApps(adb);
      list = await mergeDisabledState(adb, list);
      list = await Promise.all(list.map(async (a) => {
        if (a.label) return a;
        const label = await fetchAppLabel(adb, a.packageName);
        return { ...a, label: label ?? undefined };
      }));
      setApps(list);
    } catch (err) {
      toast(`Failed to list apps: ${String(err)}`, "error");
    } finally {
      setLoading(false);
    }
  }, [adb, showSystem]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleRemove = useCallback((pkg: string) => {
    setApps((prev) => prev.filter((a) => a.packageName !== pkg));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    apps.forEach((a) => { if (a.category) set.add(a.category); });
    return sortCategories([...set]);
  }, [apps]);

  const filtered = apps.filter((a) => {
    if (activeCategory !== "all" && a.category !== activeCategory) return false;
    if (filter && !a.packageName.toLowerCase().includes(filter.toLowerCase()) &&
        !(a.label ?? "").toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const navbarAppsIcon = (
    <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.91667 9.5625L12.75 8.14583L15.5833 9.5625V2.83333H9.91667V9.5625ZM5.66667 19.8333V17H12.75V19.8333H5.66667ZM2.83333 25.5C2.05417 25.5 1.38739 25.2228 0.833 24.6684C0.278611 24.114 0.000944444 23.4468 0 22.6667V2.83333C0 2.05417 0.277667 1.38739 0.833 0.833C1.38833 0.278611 2.05511 0.000944444 2.83333 0H22.6667C23.4458 0 24.1131 0.277667 24.6684 0.833C25.2237 1.38833 25.5009 2.05511 25.5 2.83333V22.6667C25.5 23.4458 25.2228 24.1131 24.6684 24.6684C24.114 25.2237 23.4468 25.5009 22.6667 25.5H2.83333ZM2.83333 22.6667H22.6667V2.83333H18.4167V14.1667L12.75 11.3333L7.08333 14.1667V2.83333H2.83333V22.6667Z" fill="currentColor"/>
    </svg>
  );

  return (
    <div className="card apps-list-card" style={{ display: "flex", flex: "1", flexDirection: "column" }}>
      <div className="card-header" style={{ alignItems: "center", padding: "clamp(16px,2vh,24px) clamp(20px,2.5vw,32px)" }}>
        <div className="page-title-row">
          <div className="page-title-icon">{navbarAppsIcon}</div>
          <span className="page-title">Installed Apps</span>
        </div>
        <div className="apps-header-actions">
          <button
            className="btn-m3-sideloader"
            title="Install APK"
            onClick={() => setShowInstaller((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button className="btn-refresh" title="Reload apps" onClick={loadApps}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* APK Sideloader Modal Overlay */}
      {showInstaller && (
        <div
          id="apk-sideloader-overlay"
          className="open"
          onClick={(e) => { if (e.target === e.currentTarget) setShowInstaller(false); }}
        >
          <div className="apk-dialog">
            <div className="apk-dialog-header">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Install APK
              <button
                onClick={() => setShowInstaller(false)}
                style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: "4px" }}
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="apk-dialog-body">
              <ApkInstaller adb={adb} onInstalled={() => { setShowInstaller(false); loadApps(); }} />
            </div>
          </div>
        </div>
      )}

      <div className="apps-toolbar">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search Apps"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            id="apps-search"
          />
        </div>
        <div className="pill-toggle">
          <label className="pill-toggle-inner">
            <span>System</span>
            <div
              className={`pill-toggle-switch${showSystem ? " on" : ""}`}
              onClick={() => setShowSystem((v) => !v)}
              role="switch"
              aria-checked={showSystem}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowSystem((v) => !v); } }}
            >
              <div className="pill-toggle-knob" />
            </div>
          </label>
          <span className="pill-toggle-divider" />
          <span>{filtered.length} apps</span>
        </div>
      </div>

      {!loading && (
        <div className="category-pill-row">
          <button
            className={`category-pill${activeCategory === "all" ? " active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >All</button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>
      )}

      <div className="apps-scroll-wrap">
        <div className="card-body no-pad" style={{ flex: 1, overflowY: "auto" }} ref={panelRef}>
          {loading ? (
            <PanelLoader />
          ) : (
            <div className="apps-grid" id="apps-grid">
              {filtered.length === 0 ? (
                <div className="apps-empty">
                  {apps.length === 0
                    ? (showSystem ? "No apps found" : "No user apps found")
                    : "No apps match your filter"}
                </div>
              ) : (
                filtered.map((entry) => (
                  <AppCard
                    key={entry.packageName}
                    entry={entry}
                    adb={adb}
                    onRemove={handleRemove}
                  />
                ))
              )}
            </div>
          )}
        </div>
        <ScrollPill panelRef={panelRef} />
      </div>
    </div>
  );
}


