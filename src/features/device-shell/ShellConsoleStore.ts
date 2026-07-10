import { useSyncExternalStore } from "react";
import type { ShellSessionStatus } from "./AdbShellSession.js";
import { shellManager } from "./ShellManager.js";

export interface ShellWindowMeta {
  id: string;
  title: string;
  status: ShellSessionStatus;
  createdAt: number;
}

interface ShellConsoleSnapshot {
  isExpanded: boolean;
  windows: ShellWindowMeta[];
  activeWindowId: string | null;
  error: string | null;
}

type Listener = () => void;

const state: ShellConsoleSnapshot = {
  isExpanded: false,
  windows: [],
  activeWindowId: null,
  error: null,
};

const listeners = new Set<Listener>();
let cachedSnapshot: ShellConsoleSnapshot = { ...state, windows: [] };

function refreshSnapshot() {
  cachedSnapshot = {
    ...state,
    windows: [...state.windows],
  };
}

function emit() {
  refreshSnapshot();
  for (const listener of listeners) listener();
}

function snapshot(): ShellConsoleSnapshot {
  return cachedSnapshot;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `shell-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const shellConsoleStore = {
  subscribe,
  getSnapshot: snapshot,

  toggleExpanded() {
    state.isExpanded = !state.isExpanded;
    state.error = null;
    emit();
  },

  setExpanded(isExpanded: boolean) {
    state.isExpanded = isExpanded;
    emit();
  },

  async openNewWindow() {
    const id = createId();
    const usedNumbers = new Set(state.windows.map(w => {
      const m = w.title.match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    }));
    let next = 1;
    while (usedNumbers.has(next)) next++;
    const title = `Shell Window ${next}`;
    const meta: ShellWindowMeta = {
      id,
      title,
      status: "connecting",
      createdAt: Date.now(),
    };
    state.windows = [...state.windows, meta];
    state.activeWindowId = id;
    state.isExpanded = true;
    state.error = null;
    emit();

    try {
      const session = await shellManager.createSession(id);
      session.onStatusChange = (status) => {
        shellConsoleStore.setWindowStatus(id, status);
      };
      shellConsoleStore.setWindowStatus(id, session.status);
      return id;
    } catch (error) {
      state.error = error instanceof Error ? error.message : "Failed to open shell.";
      state.windows = state.windows.filter((window) => window.id !== id);
      state.activeWindowId = state.windows.at(-1)?.id ?? null;
      state.isExpanded = state.windows.length > 0 && state.isExpanded;
      emit();
      return null;
    }
  },

  setActiveWindow(id: string) {
    if (!state.windows.some((window) => window.id === id)) return;
    state.activeWindowId = id;
    state.error = null;
    emit();
  },

  async closeWindow(id: string) {
    const index = state.windows.findIndex((window) => window.id === id);
    if (index === -1) return;
    await shellManager.destroySession(id);
    state.windows = state.windows.filter((window) => window.id !== id);
    if (state.activeWindowId === id) {
      state.activeWindowId = state.windows[index - 1]?.id ?? state.windows[index]?.id ?? null;
    }
    if (state.windows.length === 0) {
      state.isExpanded = false;
    }
    emit();
  },

  setWindowStatus(id: string, status: ShellSessionStatus) {
    state.windows = state.windows.map((window) => (
      window.id === id ? { ...window, status } : window
    ));
    emit();
  },

  markDisconnected() {
    shellManager.markAllDisconnected();
    state.windows = state.windows.map((window) => ({ ...window, status: "error" }));
    emit();
  },

  reset() {
    state.isExpanded = false;
    state.windows = [];
    state.activeWindowId = null;
    state.error = null;
    emit();
  },
};

export function useShellConsoleStore() {
  return useSyncExternalStore(
    shellConsoleStore.subscribe,
    shellConsoleStore.getSnapshot,
    shellConsoleStore.getSnapshot,
  );
}
