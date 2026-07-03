import type { Adb } from "@yume-chan/adb";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "authorizing"
  | "connected"
  | "error";

export type ActivePanel = "telemetry" | "apps" | "backup" | "tweaks";

export interface DeviceInfo {
  brand:           string;
  model:           string;
  marketingName:   string;
  osVersion:       string;
  screenSize:      string;
  batteryLevel:    number;
  batteryTemp:     number;
  batteryCharging: boolean;
}

export interface AppState {
  connection: ConnectionStatus;
  adb:        Adb | null;
  device:     DeviceInfo | null;
  panel:      ActivePanel;
  error:      string | null;
}

export type AppAction =
  | { type: "SET_CONNECTION"; status: ConnectionStatus }
  | { type: "SET_ADB"; adb: Adb | null }
  | { type: "SET_DEVICE"; device: DeviceInfo | null }
  | { type: "SET_PANEL"; panel: ActivePanel }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "RESET" };

export const initialState: AppState = {
  connection: "disconnected",
  adb:        null,
  device:     null,
  panel:      "telemetry",
  error:      null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CONNECTION": return { ...state, connection: action.status };
    case "SET_ADB":        return { ...state, adb: action.adb };
    case "SET_DEVICE":     return { ...state, device: action.device };
    case "SET_PANEL":      return { ...state, panel: action.panel };
    case "SET_ERROR":      return { ...state, error: action.error };
    case "RESET":          return { ...initialState };
    default:               return state;
  }
}
