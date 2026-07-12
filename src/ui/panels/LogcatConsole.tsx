import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Adb } from "@yume-chan/adb";
import { List, useListRef } from "react-window";
import { useLogcatStore, logcatStore, SEVERITY_LEVELS, type SeverityLevel } from "../../adb/logcat-store.js";
import { logcatSession } from "../../adb/logcat-session.js";
import { toast } from "../Toast.js";

const ROW_HEIGHT = 22;
const LEVEL_LABELS: Record<string, string> = {
  F: "Fatal",
  E: "Error",
  W: "Warning",
  I: "Info",
  D: "Debug",
  V: "Verbose",
};

interface Props {
  adb: Adb;
}

function LogRow({ index, style, data }: { index: number; style: React.CSSProperties; data: { entries: import("../../adb/logcat-parser.js").LogcatEntry[] } }) {
  const entry = data.entries[index];
  const levelClass = `logcat-row--${entry.level.toLowerCase()}`;
  return (
    <div style={style} className={`logcat-row ${levelClass}`} title={entry.message}>
      <span className="logcat-row-level">{entry.level}</span>
      <span className="logcat-row-pid">{entry.pid}</span>
      <span className="logcat-row-tag">{entry.tag}</span>
      <span className="logcat-row-msg">{entry.message}</span>
    </div>
  );
}

export function LogcatConsole({ adb }: Props) {
  const { captureStatus, entries, activeLevels } = useLogcatStore();
  const listRef = useListRef(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const filteredEntries = useMemo(
    () => entries.filter(e => activeLevels.has(e.level as SeverityLevel)),
    [entries, activeLevels]
  );

  const isCapturing = captureStatus === "capturing";

  useEffect(() => {
    if (isCapturing && isAutoScroll && listRef.current && filteredEntries.length > 0) {
      listRef.current.scrollToRow({ index: filteredEntries.length - 1, align: "end" });
    }
  }, [filteredEntries.length, isCapturing, isAutoScroll]);

  const handleStartStop = useCallback(() => {
    if (captureStatus === "capturing") {
      logcatSession.stop();
    } else {
      logcatSession.start(adb);
    }
  }, [adb, captureStatus]);

  const handleExport = useCallback(() => {
    if (captureStatus === "idle" && entries.length === 0) {
      toast("Start a capture before exporting logs", "error");
      return;
    }
    const text = filteredEntries.map(e =>
      `${e.timestamp} ${String(e.pid).padStart(5)} ${String(e.tid).padStart(5)} ${e.level} ${e.tag}: ${e.message}`
    ).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logcat-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [captureStatus, entries, filteredEntries]);

  const handleClear = useCallback(() => {
    logcatSession.clear();
  }, []);

  const handleToggleLevel = useCallback((level: SeverityLevel) => {
    logcatStore.toggleLevel(level);
  }, []);

  const isExportDisabled = captureStatus === "capturing" || entries.length === 0;

  return (
    <section className="logcat-card" aria-labelledby="logcat-title">
      <div className="logcat-card-info">
        <div>
          <h2 className="logcat-card-title" id="logcat-title">LogCat ++</h2>
          <p className="logcat-card-desc">Take live android system logs or export them</p>
        </div>
        <div className="logcat-actions">
          <button
            className="logcat-action"
            type="button"
            onClick={handleStartStop}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {captureStatus === "capturing" ? (
                <rect x="6" y="6" width="12" height="12" rx="1" />
              ) : (
                <path d="M8 5.14v13.72a1 1 0 0 0 1.52.86l10.25-6.86a1 1 0 0 0 0-1.72L9.52 4.28A1 1 0 0 0 8 5.14Z" />
              )}
            </svg>
            <span>{captureStatus === "capturing" ? "Stop" : "Start"}</span>
          </button>
          <button
            className="logcat-action logcat-action--secondary"
            type="button"
            onClick={handleExport}
            disabled={isExportDisabled}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 16V3" /><path d="m7 8 5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
            <span>Export Log</span>
          </button>
          {captureStatus === "stopped" && entries.length > 0 && (
            <button
              className="logcat-action logcat-action--secondary"
              type="button"
              onClick={handleClear}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
      <div className="logcat-console" aria-label="LogCat output">
        <div className="logcat-output">
          {filteredEntries.length === 0 ? (
            <div className="logcat-empty">
              {captureStatus === "stopped" && (
                <svg className="logcat-empty-icon" viewBox="0 0 1050 1190" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M699.521 1120.01H104.872C85.6393 1120.01 69.9989 1104.26 69.9989 1085.01V174.976C69.9989 155.732 85.6393 139.981 104.872 139.981H209.791V174.976C209.791 194.221 225.532 209.971 244.764 209.971H664.492C683.725 209.971 699.465 194.221 699.465 174.976V139.981H804.385C823.617 139.981 839.358 155.732 839.358 174.976V700.009C839.358 719.254 855.098 735.004 874.33 735.004C893.563 735.004 909.303 719.254 909.303 700.009L909.352 174.976C909.352 117.241 862.131 69.9901 804.433 69.9901H699.513V34.995C699.513 15.7505 683.773 0 664.54 0H244.812C225.58 0 209.839 15.7505 209.839 34.995V69.9901H104.92C47.2213 69.9901 0 117.241 0 174.976V1085.01C0 1142.75 47.2213 1190 104.92 1190H699.569C718.801 1190 734.541 1174.25 734.541 1155C734.541 1135.76 718.801 1120.01 699.569 1120.01L699.521 1120.01ZM279.742 69.9434H629.52V139.935H279.742V69.9434ZM279.742 332.485C279.742 361.525 256.327 385.003 227.257 385.003C198.235 385.003 174.772 361.574 174.772 332.485C174.772 303.445 198.186 279.967 227.257 279.967C256.278 279.967 279.742 303.396 279.742 332.485ZM734.49 332.485C734.49 351.729 718.749 367.48 699.517 367.48H384.708C365.476 367.48 349.735 351.729 349.735 332.485C349.735 313.24 365.476 297.49 384.708 297.49H699.517C718.749 297.49 734.49 313.24 734.49 332.485ZM279.742 507.466C279.742 536.506 256.327 559.985 227.257 559.985C198.235 559.985 174.772 536.556 174.772 507.466C174.772 478.426 198.186 454.948 227.257 454.948C256.278 454.948 279.742 478.377 279.742 507.466ZM734.49 507.466C734.49 526.711 718.749 542.461 699.517 542.461H384.708C365.476 542.461 349.735 526.711 349.735 507.466C349.735 488.222 365.476 472.471 384.708 472.471H699.517C718.749 472.471 734.49 488.222 734.49 507.466ZM279.742 682.498C279.742 711.538 256.327 735.017 227.257 735.017C198.235 735.017 174.772 711.587 174.772 682.498C174.772 653.458 198.186 629.98 227.257 629.98C256.278 629.98 279.742 653.409 279.742 682.498ZM699.521 717.493H384.712C365.479 717.493 349.739 701.743 349.739 682.498C349.739 663.254 365.479 647.503 384.712 647.503H699.521C718.753 647.503 734.493 663.254 734.493 682.498C734.493 701.743 718.753 717.493 699.521 717.493ZM279.742 857.471C279.742 886.511 256.327 909.989 227.257 909.989C198.235 909.989 174.772 886.56 174.772 857.471C174.772 828.431 198.186 804.953 227.257 804.953C256.278 804.953 279.742 828.382 279.742 857.471ZM629.52 822.476C648.752 822.476 664.492 838.226 664.492 857.471C664.492 876.715 648.752 892.466 629.52 892.466H384.661C365.429 892.466 349.688 876.715 349.688 857.471C349.688 838.226 365.429 822.476 384.661 822.476H629.52ZM1030.07 843.837L890.181 773.846C890.181 773.846 888.411 773.846 887.722 773.157C885.607 772.123 883.197 771.779 880.737 771.385C878.622 771.04 876.556 770.696 874.441 770.696C872.326 770.696 870.26 771.04 868.145 771.385C865.685 771.73 863.619 772.419 861.16 773.157C860.471 773.157 859.389 773.157 858.701 773.846L718.812 843.837C706.908 849.793 699.58 862.049 699.58 874.994C699.58 879.523 699.924 989.087 738.389 1065.78C778.282 1145.22 855.558 1184.79 859.049 1186.51C860.427 1187.2 861.853 1187.55 863.23 1187.89C864.263 1187.89 865.001 1188.58 866.034 1188.93C868.838 1189.61 871.986 1189.96 874.79 1189.96C877.594 1189.96 880.742 1189.61 883.546 1188.93C884.578 1188.93 885.316 1188.24 886.349 1187.89C887.727 1187.55 889.153 1187.2 890.53 1186.51C893.678 1184.74 971.348 1145.22 1011.19 1065.78C1049.31 989.141 1050 879.921 1050 874.994C1050 861.705 1042.67 849.45 1030.77 843.837H1030.07ZM948.22 1034.22C928.299 1074.13 894.358 1100.71 874.781 1114C854.86 1100.71 820.92 1074.08 800.997 1034.22C778.961 990.115 772.321 928.146 770.549 895.952L874.78 843.779L979.011 895.952C976.895 928.143 970.599 990.111 948.562 1034.22H948.22Z" fill="currentColor"/>
                </svg>
              )}
              {captureStatus === "idle"
                ? "Press Start to begin capturing logs"
                : captureStatus === "capturing"
                  ? "Waiting for log entries…"
                  : "No log entries captured"}
            </div>
          ) : (
            <List
              style={{ height: "100%" }}
              rowCount={filteredEntries.length}
              rowHeight={ROW_HEIGHT}
              listRef={listRef}
              overscanCount={20}
              rowComponent={LogRow}
              rowProps={{ data: { entries: filteredEntries } } as any}
            />
          )}
          {!isAutoScroll && captureStatus === "capturing" && (
            <div className="logcat-scroll-hint" onClick={() => {
              if (listRef.current) {
                listRef.current.scrollToRow({ index: filteredEntries.length - 1, align: "end" });
                setIsAutoScroll(true);
              }
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              New logs below
            </div>
          )}
        </div>
        <div className="logcat-filters" aria-label="Log severity filters">
          <span className="logcat-filters-label">
            <svg width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z"/></svg>
            Filters
          </span>
          {SEVERITY_LEVELS.map(level => (
            <button
              key={level}
              className={`logcat-filter logcat-filter--${level.toLowerCase()} ${activeLevels.has(level) ? "logcat-filter--active" : ""}`}
              type="button"
              onClick={() => handleToggleLevel(level)}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
