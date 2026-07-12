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
