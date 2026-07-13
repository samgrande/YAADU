import { useSyncExternalStore } from "react";

type Listener = () => void;

interface MirrorPanelState {
  isExpanded: boolean;
}

const state: MirrorPanelState = { isExpanded: false };
const listeners = new Set<Listener>();
let cachedSnapshot = { ...state };

function emit() {
  cachedSnapshot = { ...state };
  for (const l of listeners) l();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  return cachedSnapshot;
}

export const mirrorStore = {
  subscribe,
  getSnapshot,

  toggleExpanded() {
    state.isExpanded = !state.isExpanded;
    emit();
  },

  setExpanded(v: boolean) {
    if (state.isExpanded === v) return;
    state.isExpanded = v;
    emit();
  },

  reset() {
    state.isExpanded = false;
    emit();
  },
};

export function useMirrorStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
