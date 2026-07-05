import React, { useState, useCallback, useRef } from "react";
import type { Adb } from "@yume-chan/adb";
import {
  listMediaFiles,
  backupMediaFiles,
  backupWhatsApp,
  checkWhatsAppDir,
  downloadSingleFile,
  type BackupEntry,
  type BackupProgress,
} from "../../adb/backup.js";
import { formatBytes } from "../../adb/helpers.js";
import { toast } from "../Toast.js";
import { useAppContext } from "../../context.js";

// ── Helpers ────────────────────────────────────────────────────────────────

function fileIcon(name: string): React.ReactNode {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isVideo = ["mp4", "mov", "mkv", "avi", "3gp"].includes(ext);
  if (isVideo) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

// ── Hero shapes ────────────────────────────────────────────────────────────

const SHAPES = [
  { d: "M145.838 83.2831C161.501 4.55727 109.422 4.55727 125.084 83.2831C109.422 4.55727 61.3051 24.4835 105.901 91.2273C61.3051 24.4835 24.4835 61.305 91.2273 105.901C24.4835 61.305 4.5573 109.422 83.2832 125.074C4.5573 109.412 4.5573 161.491 83.2832 145.829C4.5573 161.491 24.4929 209.598 91.2273 165.002C24.4929 209.598 61.3145 246.42 105.901 179.676C61.3051 246.411 109.422 266.337 125.075 187.62C109.412 266.346 161.491 266.346 145.829 187.62C161.491 266.346 209.598 246.411 165.002 179.676C209.598 246.411 246.42 209.589 179.676 165.002C246.411 209.598 266.337 161.482 187.62 145.829C266.346 161.491 266.346 109.412 187.62 125.074C266.346 109.412 246.411 61.305 179.676 105.901C246.411 61.305 209.589 24.4835 165.002 91.2273C209.598 24.4929 161.482 4.56668 145.829 83.2831H145.838Z" },
  { d: "M95.1123 46.8733C107.635 37.7775 113.896 33.2295 120.569 30.9687C130.221 27.6986 140.682 27.6986 150.334 30.9687C157.008 33.2295 163.269 37.7775 175.791 46.8733L203.949 67.3268C211.386 72.7283 215.104 75.4291 218.135 78.6713C222.515 83.3571 225.876 88.9005 228.003 94.9511C229.475 99.1378 230.149 103.683 231.498 112.773L236.711 147.928C239.076 163.876 240.259 171.849 239.065 179.036C237.339 189.431 232.121 198.929 224.273 205.963C218.847 210.826 211.482 214.106 196.752 220.667L163.38 235.53C154.491 239.489 150.047 241.469 145.478 242.48C138.874 243.943 132.03 243.943 125.426 242.48C120.856 241.469 116.412 239.489 107.523 235.53L74.1512 220.667C59.4215 214.106 52.0566 210.826 46.6308 205.963C38.7822 198.929 33.5648 189.431 31.8383 179.036C30.6448 171.849 31.8273 163.876 34.1923 147.928L39.4058 112.773C40.7539 103.683 41.4279 99.1378 42.9002 94.9511C45.0278 88.9005 48.388 83.3571 52.7684 78.6713C55.7993 75.4291 59.5175 72.7283 66.9539 67.3268L95.1123 46.8733Z" },
  { d: "M216.099 54.7956C207.634 46.3302 188.345 50.5161 165.071 63.9341C158.101 37.9874 147.421 21.3871 135.449 21.3871C123.477 21.3871 112.798 37.9864 105.828 63.9317C82.5555 50.515 63.2676 46.3298 54.8026 54.7948C46.3367 63.2607 50.5236 82.5516 63.9436 105.828C37.9915 112.797 21.3872 123.478 21.3872 135.452C21.3872 147.423 37.9857 158.103 63.9299 165.072C50.5089 188.349 46.3214 207.641 54.7876 216.107C63.2542 224.574 82.5475 220.386 105.826 206.963C112.795 232.913 123.476 249.516 135.449 249.516C147.423 249.516 158.104 232.912 165.073 206.961C188.353 220.384 207.647 224.573 216.114 216.107C224.58 207.641 220.393 188.349 206.973 165.072C232.918 158.103 249.516 147.424 249.516 135.452C249.516 123.478 232.912 112.797 206.959 105.828C220.378 82.5518 224.565 63.2614 216.099 54.7956Z" },
  { d: "M176.403 218.491C164.4 234.199 158.399 242.052 151.468 245.63C141.428 250.812 129.476 250.812 119.436 245.63C112.505 242.052 106.504 234.199 94.5014 218.491L54.6415 166.326C47.3413 156.772 43.6912 151.995 41.8837 146.881C39.2692 139.483 39.2692 131.421 41.8837 124.023C43.6912 118.908 47.3413 114.131 54.6415 104.577L94.5014 52.4123C106.504 36.7048 112.505 28.851 119.436 25.2737C129.476 20.0916 141.428 20.0916 151.468 25.2737C158.399 28.851 164.4 36.7048 176.403 52.4123L216.262 104.577C223.563 114.131 227.213 118.908 229.02 124.023C231.635 131.421 231.635 139.483 229.02 146.881C227.213 151.995 223.563 156.772 216.262 166.326L176.403 218.491Z" },
];

// SVG icons displayed inside each hero graphic shape
const HERO_ICONS = [
  // Image / photo icon
  <svg key="img" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>,
  // Video icon
  <svg key="vid" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>,
  // Music icon
  <svg key="mus" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>,
  // File / folder icon
  <svg key="file" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>,
];

const GRAPHIC_ITEMS = [
  { cls: "item-1", shapeIdx: 0, iconIdx: 0 },
  { cls: "item-2", shapeIdx: 1, iconIdx: 1 },
  { cls: "item-3", shapeIdx: 2, iconIdx: 2 },
  { cls: "item-4", shapeIdx: 3, iconIdx: 3 },
];

// ── Main BackupPanel component ─────────────────────────────────────────────

interface Props { adb: Adb; }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "md-linear-progress": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { value?: number }, HTMLElement>;
    }
  }
}

export function BackupPanel({ adb }: Props) {
  const { state } = useAppContext();
  const deviceName = state.device?.marketingName ?? "device";
  const [files, setFiles]               = useState<BackupEntry[]>([]);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [scanned, setScanned]           = useState(false);
  const [scanning, setScanning]         = useState(false);
  const [progress, setProgress]         = useState<BackupProgress | null>(null);
  const [isRunning, setIsRunning]       = useState(false);
  const [whatsappFound, setWhatsappFound] = useState(false);
  const [isWhatsAppBackingUp, setIsWhatsAppBackingUp] = useState(false);
  const abortRef                        = useRef<AbortController | null>(null);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setWhatsappFound(false);
    try {
      const [list, waFound] = await Promise.all([
        listMediaFiles(adb),
        checkWhatsAppDir(adb),
      ]);
      setFiles(list);
      setSelected(new Set(list.map((f) => f.name)));
      setWhatsappFound(waFound);
      setScanned(true);
      if (waFound) {
        toast("WhatsApp media folder detected", "info");
      }
    } catch (err) {
      toast(`Scan failed: ${String(err)}`, "error");
    } finally {
      setScanning(false);
    }
  }, [adb]);

  const handleReload = useCallback(async () => {
    setScanned(false);
    setFiles([]);
    setSelected(new Set());
    setProgress(null);
    await handleScan();
  }, [handleScan]);

  const toggleSelect = useCallback((name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setSelected(checked ? new Set(files.map((f) => f.name)) : new Set());
  }, [files]);

  const handleExport = useCallback(async () => {
    const toExport = files.filter((f) => selected.has(f.name));
    if (toExport.length === 0) { toast("No files selected", "error"); return; }
    abortRef.current = new AbortController();
    setIsRunning(true);
    try {
      const saved = await backupMediaFiles(adb, toExport, setProgress, abortRef.current.signal, deviceName);
      const ok = saved.filter(s => s.status === "ok").length;
      toast(`Exported ${ok} file${ok !== 1 ? "s" : ""}`, "success");
    } catch (err) {
      toast(`Backup error: ${String(err)}`, "error");
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [adb, files, selected]);

  const handleReset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      toast("Backup aborted", "info");
    }
    setScanned(false);
    setFiles([]);
    setSelected(new Set());
    setProgress(null);
    setWhatsappFound(false);
    setIsWhatsAppBackingUp(false);
  }, []);

  const handleWhatsAppBackup = useCallback(async () => {
    abortRef.current = new AbortController();
    setIsWhatsAppBackingUp(true);
    try {
      const saved = await backupWhatsApp(adb, setProgress, abortRef.current.signal, deviceName);
      const ok = saved.filter(s => s.status === "ok").length;
      toast(`WhatsApp backup complete: ${ok} file${ok !== 1 ? "s" : ""} exported`, "success");
    } catch (err) {
      toast(`WhatsApp backup error: ${String(err)}`, "error");
    } finally {
      setIsWhatsAppBackingUp(false);
      abortRef.current = null;
    }
  }, [adb, deviceName]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    toast("Backup aborted", "info");
  }, []);

  const handleDownloadSingle = useCallback(async (entry: BackupEntry) => {
    try {
      await downloadSingleFile(adb, entry);
      toast(`Downloaded ${entry.name}`, "success");
    } catch (err) {
      toast(`Download failed: ${String(err)}`, "error");
    }
  }, [adb]);

  const allSelected = files.length > 0 && selected.size === files.length;

  const mediaIcon = (
    <svg viewBox="0 0 26 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.66006 10.875C6.16941 10.875 5.69885 11.0725 5.35191 11.4242C5.00497 11.7758 4.81006 12.2527 4.81006 12.75C4.81006 13.2473 5.00497 13.7242 5.35191 14.0758C5.69885 14.4275 6.16941 14.625 6.67486 14.625H6.66006Z"/>
      <path d="M5.92 3.375C5.92 2.47989 6.27084 1.62145 6.89534 0.988515C7.51983 0.355579 8.36683 0 9.25 0H22.57C23.4532 0 24.3002 0.355579 24.9247 0.988515C25.5492 1.62145 25.9 2.47989 25.9 3.375V16.875C25.9 17.7701 25.5492 18.6286 24.9247 19.2615C24.3002 19.8944 23.4532 20.25 22.57 20.25H19.98V22.875C19.98 23.7701 19.6292 24.6286 19.0047 25.2615C18.3802 25.8944 17.5332 26.25 16.65 26.25H3.33C2.44683 26.25 1.59983 25.8944 0.975335 25.2615C0.350839 24.6286 0 23.7701 0 22.875V9.375C0 8.47989 0.350839 7.62145 0.975335 6.98851C1.59983 6.35558 2.44683 6 3.33 6H5.92V3.375ZM17.76 9.375C17.76 9.07663 17.6431 8.79048 17.4349 8.57951C17.2267 8.36853 16.9444 8.25 16.65 8.25H3.33C3.03561 8.25 2.75328 8.36853 2.54511 8.57951C2.33695 8.79048 2.22 9.07663 2.22 9.375V19.788L10.6086 15.381C11.2178 15.0606 11.9097 14.9388 12.5898 15.0323C13.2698 15.1257 13.9048 15.4298 14.4078 15.903L17.76 19.059V9.375ZM2.22 22.875C2.22 23.496 2.71728 24 3.33 24H16.65C16.9444 24 17.2267 23.8815 17.4349 23.6705C17.6431 23.4595 17.76 23.1734 17.76 22.875V22.1295L12.8967 17.553C12.7293 17.3952 12.5179 17.2937 12.2914 17.2623C12.0649 17.2309 11.8344 17.2711 11.6313 17.3775L2.22 22.323V22.875ZM8.14 6H16.65C17.5332 6 18.3802 6.35558 19.0047 6.98851C19.6292 7.62145 19.98 8.47989 19.98 9.375V18H22.57C22.8644 18 23.1467 17.8815 23.3549 17.6705C23.5631 17.4595 23.68 17.1734 23.68 16.875V3.375C23.68 3.07663 23.5631 2.79048 23.3549 2.5795C23.1467 2.36853 22.8644 2.25 22.57 2.25H9.25C8.95561 2.25 8.67328 2.36853 8.46511 2.5795C8.25695 2.79048 8.14 3.07663 8.14 3.375V6Z"/>
    </svg>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Header */}
      <div className="card-header" style={{ alignItems: "center", position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "clamp(16px,2vh,28px) clamp(20px,2.5vw,32px)", gap: "16px" }}>
        <div className="page-title-row">
          <div className="page-title-icon">{mediaIcon}</div>
          <span className="page-title">Media Backup</span>
        </div>
        <div className="backup-header-actions">
          <button className="btn-refresh" onClick={handleReload} title="Reload / Scan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`card-body${scanned ? " scanned" : ""}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 0, overflow: "hidden", position: "relative", width: "100%", height: "100%" }}>
        {/* Background graphics */}
        <div className="backup-hero-graphics" id="backup-graphics">
          {GRAPHIC_ITEMS.map(({ cls, shapeIdx, iconIdx }, i) => (
            <div key={i} className={`hero-graphic-item ${cls}`}>
              <svg className="hero-shape" width="271" height="271" viewBox="0 0 271 271" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d={SHAPES[shapeIdx].d} fill="var(--md-sys-color-primary)" fillOpacity="0.85"/>
              </svg>
              <span className="hero-icon">
                {HERO_ICONS[iconIdx]}
              </span>
            </div>
          ))}
        </div>

        {/* Initial state overlay — always rendered, hidden via CSS when scanned */}
        <div className="backup-hero-overlay" id="backup-hero-overlay" style={{ opacity: scanned ? 0 : 1, pointerEvents: scanned ? "none" : "auto", transition: "opacity 0.4s ease" }}>
          <div className="backup-hero-text">
            Scan your device to list files available for backup
          </div>
          <div className="backup-hero-action">
            <button
              className="btn-m3-scan"
              onClick={handleScan}
              disabled={scanning}
              id="btn-scan"
            >
              {scanning ? (
                <svg className="spinner-stroke" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" strokeDasharray="40 10"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>
                </svg>
              )}
              {scanning ? "Scanning…" : "Scan"}
            </button>
          </div>
        </div>

        {/* Content after scan — always rendered, animated in via .scanned CSS class */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 5, pointerEvents: scanned ? "auto" : "none" }}>
          {/* WhatsApp backup card */}
          {scanned && whatsappFound && !isWhatsAppBackingUp && (
            <div className="wa-backup-card">
              <div className="wa-backup-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M3.50002 12C3.50002 7.30558 7.3056 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C10.3278 20.5 8.77127 20.0182 7.45798 19.1861C7.21357 19.0313 6.91408 18.9899 6.63684 19.0726L3.75769 19.9319L4.84173 17.3953C4.96986 17.0955 4.94379 16.7521 4.77187 16.4751C3.9657 15.176 3.50002 13.6439 3.50002 12ZM12 1.5C6.20103 1.5 1.50002 6.20101 1.50002 12C1.50002 13.8381 1.97316 15.5683 2.80465 17.0727L1.08047 21.107C0.928048 21.4637 0.99561 21.8763 1.25382 22.1657C1.51203 22.4552 1.91432 22.5692 2.28599 22.4582L6.78541 21.1155C8.32245 21.9965 10.1037 22.5 12 22.5C17.799 22.5 22.5 17.799 22.5 12C22.5 6.20101 17.799 1.5 12 1.5ZM14.2925 14.1824L12.9783 15.1081C12.3628 14.7575 11.6823 14.2681 10.9997 13.5855C10.2901 12.8759 9.76402 12.1433 9.37612 11.4713L10.2113 10.7624C10.5697 10.4582 10.6678 9.94533 10.447 9.53028L9.38284 7.53028C9.23954 7.26097 8.98116 7.0718 8.68115 7.01654C8.38113 6.96129 8.07231 7.046 7.84247 7.24659L7.52696 7.52195C6.76823 8.18414 6.3195 9.2723 6.69141 10.3741C7.07698 11.5163 7.89983 13.314 9.58552 14.9997C11.3991 16.8133 13.2413 17.5275 14.3186 17.8049C15.1866 18.0283 16.008 17.7288 16.5868 17.2572L17.1783 16.7752C17.4313 16.5691 17.5678 16.2524 17.544 15.9269C17.5201 15.6014 17.3389 15.308 17.0585 15.1409L15.3802 14.1409C15.0412 13.939 14.6152 13.9552 14.2925 14.1824Z" fill="var(--md-sys-color-primary)"/>
                </svg>
              </div>
              <div className="wa-backup-card-text">
                <strong>WhatsApp backup found</strong>
                <span>Do you want to backup its media folder?</span>
              </div>
              <div className="wa-backup-card-actions">
                <button className="wa-backup-btn-yes" onClick={handleWhatsAppBackup}>
                  Yes, Backup
                </button>
                <button className="wa-backup-btn-no" onClick={() => setWhatsappFound(false)}>
                  No
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp backup progress */}
          {isWhatsAppBackingUp && (
            <div className="wa-backup-card">
              <div className="wa-backup-card-icon">
                <svg className="spinner-stroke" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" strokeDasharray="40 10"/>
                </svg>
              </div>
              <div className="wa-backup-card-text">
                <strong>Backing up WhatsApp media…</strong>
                {progress && <span>{progress.message}</span>}
              </div>
            </div>
          )}

          <div className="backup-dialog-box" id="backup-dialog-box">
            {/* Dialog header */}
            <div className="backup-dialog-header">
              <div className="backup-header-left">
                <label className="custom-checkbox-wrapper select-all-wrapper">
                  <input
                    type="checkbox"
                    className="real-checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    id="chk-select-all"
                  />
                  <span className="state-layer">
                    <span className="checkbox-container">
                      <svg className="check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6 L4.5 8.5 L9.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </span>
                </label>
                <span className="backup-file-count-badge">{selected.size}</span>
                <span className="backup-header-title">Files</span>
              </div>
              <div className="backup-header-right">
                <button className="backup-dialog-close-btn" onClick={handleReset} title="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {progress && (
              <div className="apk-progress" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "16px 24px", background: "var(--surface-mid)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="apk-progress-label" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span>{progress.message}</span>
                  <span>{progress.current}/{progress.total}</span>
                </div>
                <md-linear-progress
                  value={progress.total > 0 ? progress.current / progress.total : 0}
                  style={{ width: "100%" }}
                ></md-linear-progress>
              </div>
            )}

            {/* File list */}
            <div className="backup-file-list" id="backup-file-list">
              {files.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                  No media files found in /sdcard/DCIM/Camera
                </div>
              ) : (
                files.map((f) => (
                  <div key={f.name} className="backup-file-item">
                    <div className="backup-file-item-left">
                      <label className="custom-checkbox-wrapper">
                        <input
                          type="checkbox"
                          className="real-checkbox"
                          checked={selected.has(f.name)}
                          onChange={() => toggleSelect(f.name)}
                        />
                        <span className="state-layer">
                          <span className="checkbox-container">
                            <svg className="check-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6 L4.5 8.5 L9.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </span>
                      </label>
                      <div className="file-icon-circle">
                        {fileIcon(f.name)}
                      </div>
                      <div className="backup-file-name-container">
                        <span className="backup-file-name">{f.name}</span>
                        <div className="backup-file-meta">
                          <span className="backup-file-size">{formatBytes(f.size)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="backup-file-save-btn"
                      onClick={(e) => { e.stopPropagation(); handleDownloadSingle(f); }}
                      title={`Download ${f.name}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>


          </div>

          {/* Footer actions — only show export/cancel button when scanned is true */}
          {scanned && (
            <div className="backup-footer-actions" style={{ marginTop: "24px", display: "flex", justifyContent: "center", gap: "16px", width: "100%" }}>
              {!isRunning ? (
                <button
                  className="btn-export"
                  onClick={handleExport}
                  disabled={selected.size === 0}
                  id="btn-backup"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="19 12 12 19 5 12"/>
                  </svg>
                  Export
                </button>
              ) : (
                <button className="btn-cancel" onClick={handleCancel} id="btn-cancel">
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

