import { useSyncExternalStore } from "react";
import type { LogcatEntry } from "./logcat-parser.js";
import type { CaptureStatus } from "./logcat-session.js";

const MAX_ENTRIES = 8000;

export const SEVERITY_LEVELS = ["F", "E", "W", "I", "D", "V"] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export interface LogcatSnapshot {
  captureStatus: CaptureStatus;
  entries: LogcatEntry[];
  activeLevels: Set<SeverityLevel>;
}

type Listener = () => void;

const state: LogcatSnapshot = {
  captureStatus: "idle",
  entries: [],
  activeLevels: new Set<SeverityLevel>(["F", "E", "W", "I", "D", "V"]),
};

const listeners = new Set<Listener>();
let cachedSnapshot: LogcatSnapshot;

function refreshSnapshot() {
  cachedSnapshot = {
    captureStatus: state.captureStatus,
    entries: [...state.entries],
    activeLevels: new Set(state.activeLevels),
  };
}

function emit() {
  refreshSnapshot();
  for (const listener of listeners) listener();
}

function snapshot(): LogcatSnapshot {
  return cachedSnapshot;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

refreshSnapshot();

export const logcatStore = {
  subscribe,
  getSnapshot: snapshot,

  appendEntries(entries: LogcatEntry[]) {
    if (state.entries.length + entries.length > MAX_ENTRIES) {
      const overflow = state.entries.length + entries.length - MAX_ENTRIES;
      state.entries.splice(0, overflow);
    }
    for (const e of entries) {
      state.entries.push(e);
    }
    emit();
  },

  clearBuffer() {
    state.entries = [];
    emit();
  },

  setCaptureStatus(status: CaptureStatus) {
    state.captureStatus = status;
    emit();
  },

  toggleLevel(level: SeverityLevel) {
    if (state.activeLevels.has(level)) {
      if (state.activeLevels.size > 1) {
        state.activeLevels.delete(level);
      }
    } else {
      state.activeLevels.add(level);
    }
    emit();
  },

};

export function useLogcatStore() {
  return useSyncExternalStore(
    logcatStore.subscribe,
    logcatStore.getSnapshot,
    logcatStore.getSnapshot,
  );
}
