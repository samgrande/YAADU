/**
 * Module 1: WebUSB Connection Lifecycle (Tango ADB 2.x API)
 *
 * In 2.x: AdbDaemonTransport.authenticate({serial, connection, credentialStore})
 * returns a transport, then new Adb(transport) creates the high-level instance.
 * The Adb instance now has adb.banner.model, adb.serial, etc.
 */

import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import { AdbDaemonWebUsbDeviceManager, type AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import type { AppAction } from "../state.js";
import { credentialStore } from "./credential.js";
import { fetchDeviceInfo } from "./telemetry.js";
import { normalizeError } from "./errors.js";
import { shellManager } from "../features/device-shell/ShellManager.js";
import { shellConsoleStore } from "../features/device-shell/ShellConsoleStore.js";
import { logcatSession } from "./logcat-session.js";

let _usbDevice: USBDevice | null = null;

export async function connectDevice(dispatch: React.Dispatch<AppAction>): Promise<void> {
  dispatch({ type: "SET_ERROR", error: null });
  dispatch({ type: "SET_CONNECTION", status: "connecting" });

  try {
    const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
    if (!Manager) {
      throw new Error("WebUSB is not available. Use Chrome or Edge 89+.");
    }

    // Step 1: User picks device — must be inside user gesture
    const device = await Manager.requestDevice();
    if (!device) {
      dispatch({ type: "SET_CONNECTION", status: "disconnected" });
      return;
    }

    // Store raw USB device reference for forcible close on disconnect
    _usbDevice = device.raw;

    // Step 2: Open connection
    const connection = await device.connect();

    // Step 3: RSA handshake — triggers "Allow USB Debugging?" on phone
    dispatch({ type: "SET_CONNECTION", status: "authorizing" });
    console.info("[YAADU] Auth started:", device.serial);

    // 2.x API: AdbDaemonTransport.authenticate() then new Adb(transport)
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore,
    });

    const adb = new Adb(transport);

    dispatch({ type: "SET_ADB", adb });
    dispatch({ type: "SET_CONNECTION", status: "connected" });
    console.info("[YAADU] Connected. Model:", adb.banner.model);

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
  logcatSession.markDisconnected();
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
  logcatSession.markDisconnected();
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
    const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
    if (!Manager) return false;

    const devices: AdbDaemonWebUsbDevice[] = await Manager.getDevices();
    if (devices.length === 0) return false;

    const device = devices[0];
    _usbDevice = device.raw;

    dispatch({ type: "SET_CONNECTION", status: "connecting" });
    const connection = await device.connect();

    dispatch({ type: "SET_CONNECTION", status: "authorizing" });
    const transport = await AdbDaemonTransport.authenticate({
      serial: device.serial,
      connection,
      credentialStore,
    });
    const adb = new Adb(transport);

    dispatch({ type: "SET_ADB", adb });
    dispatch({ type: "SET_CONNECTION", status: "connected" });
    console.info("[YAADU] Silently reconnected. Model:", adb.banner.model);

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
