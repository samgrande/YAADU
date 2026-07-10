/**
 * Module 1: WebUSB Connection Lifecycle (adb 0.0.19 API)
 *
 * In 0.0.19: Adb.authenticate(connection, credentialStore) is the static entry point.
 * The Adb instance has model/device/product properties but NO serial field.
 * We use the WebUSB device serial as our identifier.
 */

import { Adb } from "@yume-chan/adb";
import { AdbWebUsbBackendManager, type AdbWebUsbBackend } from "@yume-chan/adb-backend-webusb";
import type { AppAction } from "../state.js";
import { credentialStore } from "./credential.js";
import { fetchDeviceInfo } from "./telemetry.js";
import { normalizeError } from "./errors.js";
import { shellManager } from "../features/device-shell/ShellManager.js";
import { shellConsoleStore } from "../features/device-shell/ShellConsoleStore.js";

let _usbDevice: USBDevice | null = null;

export async function connectDevice(dispatch: React.Dispatch<AppAction>): Promise<void> {
  dispatch({ type: "SET_ERROR", error: null });
  dispatch({ type: "SET_CONNECTION", status: "connecting" });

  try {
    const manager = AdbWebUsbBackendManager.BROWSER;
    if (!manager) {
      throw new Error("WebUSB is not available. Use Chrome or Edge 89+.");
    }

    // Step 1: User picks device — must be inside user gesture
    const backend = await manager.requestDevice();
    if (!backend) {
      dispatch({ type: "SET_CONNECTION", status: "disconnected" });
      return;
    }

    // Store raw USB device reference for forcible close on disconnect
    _usbDevice = (backend as unknown as { device: USBDevice }).device;

    // Step 2: Open USB stream pair
    const connection = await backend.connect();

    // Step 3: RSA handshake — triggers "Allow USB Debugging?" on phone
    dispatch({ type: "SET_CONNECTION", status: "authorizing" });
    console.info("[YAADU] Auth started:", backend.serial);

    // 0.0.19 API: Adb.authenticate(connection, credentialStore)
    const adb = await Adb.authenticate(connection, credentialStore);

    dispatch({ type: "SET_ADB", adb });
    dispatch({ type: "SET_CONNECTION", status: "connected" });
    console.info("[YAADU] Connected. Model:", adb.model);

    // Asynchronously pre-fetch device info so it is available to the UI immediately
    fetchDeviceInfo(adb)
      .then((info) => { dispatch({ type: "SET_DEVICE", device: info }); })
      .catch((err) => { console.warn("[YAADU] Failed to pre-fetch device info:", err); });

    // Step 4: Watch for disconnects
    adb.disconnected
      .then(() => handleDisconnect(dispatch))
      .catch(() => handleDisconnect(dispatch));

  } catch (err: unknown) {
    const isDomException = err instanceof DOMException;
    if (isDomException && err.name === "NotFoundError") {
      dispatch({ type: "SET_CONNECTION", status: "disconnected" });
      return;
    }
    const msg = normalizeError(err);
    console.error("[YAADU] Connection failed:", err);
    dispatch({ type: "SET_ERROR", error: msg });
    dispatch({ type: "SET_CONNECTION", status: "error" });
  }
}

export async function disconnectDevice(
  dispatch: React.Dispatch<AppAction>,
  adb: Adb | null
): Promise<void> {
  if (!adb) { dispatch({ type: "RESET" }); return; }
  await shellManager.disposeAll();
  shellConsoleStore.reset();

  // Close the raw USB device directly, bypassing the ADB protocol close
  // handshake which can fail with "data buffer exceeded maximum size".
  if (_usbDevice) {
    try { await _usbDevice.close(); } catch { /* ignore */ }
    _usbDevice = null;
  }
  dispatch({ type: "RESET" });
  console.info("[YAADU] Disconnected.");
}

function handleDisconnect(dispatch: React.Dispatch<AppAction>): void {
  shellConsoleStore.markDisconnected();
  shellManager.setAdb(null);
  dispatch({ type: "SET_ADB", adb: null });
  dispatch({ type: "SET_DEVICE", device: null });
  dispatch({ type: "SET_ERROR", error: null });
  dispatch({ type: "SET_CONNECTION", status: "reconnecting" });
}

/**
 * Silently reconnect to the previously-paired device without showing the USB
 * picker. Uses getDevices() which returns already-granted devices — no user
 * gesture required. Returns true on success.
 */
export async function silentReconnect(
  dispatch: React.Dispatch<AppAction>
): Promise<boolean> {
  try {
    const manager = AdbWebUsbBackendManager.BROWSER;
    if (!manager) return false;

    // getDevices() returns devices the user has already granted access to
    const devices: AdbWebUsbBackend[] = await (manager as unknown as {
      getDevices(): Promise<AdbWebUsbBackend[]>;
    }).getDevices();

    if (devices.length === 0) return false;

    const backend = devices[0];
    _usbDevice = (backend as unknown as { device: USBDevice }).device;

    dispatch({ type: "SET_CONNECTION", status: "connecting" });
    const connection = await backend.connect();

    dispatch({ type: "SET_CONNECTION", status: "authorizing" });
    const adb = await Adb.authenticate(connection, credentialStore);

    dispatch({ type: "SET_ADB", adb });
    dispatch({ type: "SET_CONNECTION", status: "connected" });
    console.info("[YAADU] Silently reconnected. Model:", adb.model);

    fetchDeviceInfo(adb)
      .then((info) => { dispatch({ type: "SET_DEVICE", device: info }); })
      .catch((err) => { console.warn("[YAADU] Failed to pre-fetch device info:", err); });

    // Watch for the next disconnect
    adb.disconnected
      .then(() => handleDisconnect(dispatch))
      .catch(() => handleDisconnect(dispatch));

    return true;
  } catch (err) {
    console.warn("[YAADU] Silent reconnect failed:", err);
    // Keep in reconnecting state so the countdown continues
    dispatch({ type: "SET_CONNECTION", status: "reconnecting" });
    return false;
  }
}
