import type { Adb } from "@yume-chan/adb";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "authorizing"
  | "connected"
  | "error";

export type ActivePanel = "telemetry" | "apps" | "backup" | "tweaks";

export interface DeviceInfo {
  brand:         string;
  model:         string;
  marketingName: string;
  osVersion:     string;
  screenSize:    string;
  batteryLevel:    number;
  batteryTemp:     number;
  batteryCharging: boolean;
}

// ── Simple event emitter ───────────────────────────────────────────────────

type Handler<T> = (value: T) => void;
type Unsub = () => void;

class EventBus {
  private listeners = new Map<string, Set<Handler<unknown>>>();

  on<T>(event: string, handler: Handler<T>): Unsub {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as Handler<unknown>);
    return () => this.listeners.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<T>(event: string, payload: T): void {
    this.listeners.get(event)?.forEach((h) => h(payload as unknown));
  }
}

// ── App State ──────────────────────────────────────────────────────────────

class AppState extends EventBus {
  private _connection: ConnectionStatus = "disconnected";
  private _adb:        Adb | null       = null;
  private _device:     DeviceInfo | null = null;
  private _panel:      ActivePanel       = "telemetry";
  private _error:      string | null     = null;

  get connection() { return this._connection; }
  set connection(v: ConnectionStatus) {
    this._connection = v; this.emit("connectionChanged", v);
  }

  get adb() { return this._adb; }
  set adb(v: Adb | null) {
    this._adb = v; this.emit("adbChanged", v);
  }

  get device() { return this._device; }
  set device(v: DeviceInfo | null) {
    this._device = v; this.emit("deviceChanged", v);
  }

  get panel() { return this._panel; }
  set panel(v: ActivePanel) {
    this._panel = v; this.emit("panelChanged", v);
  }

  get error() { return this._error; }
  set error(v: string | null) {
    this._error = v; this.emit("errorChanged", v);
  }

  reset(): void {
    this.adb = null; this.device = null; this.error = null;
    this.connection = "disconnected"; this.panel = "telemetry";
  }
}

export const state = new AppState();
