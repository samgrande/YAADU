/**
 * Module 1: WebUSB Connection Lifecycle (adb 0.0.19 API)
 *
 * In 0.0.19: Adb.authenticate(connection, credentialStore) is the static entry point.
 * The Adb instance has model/device/product properties but NO serial field.
 * We use the WebUSB device serial as our identifier.
 */

import { Adb } from "@yume-chan/adb";
import { AdbWebUsbBackendManager } from "@yume-chan/adb-backend-webusb";
import type { AppAction } from "../state.js";
import { credentialStore } from "./credential.js";
import { fetchDeviceInfo } from "./telemetry.js";

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
      .then(() => handleDisconnect(dispatch, "Device disconnected unexpectedly."))
      .catch(() =>
        handleDisconnect(dispatch, "Oops, it seems you have unplugged your device")
      );

  } catch (err: unknown) {
    const isDomException = err instanceof DOMException;
    if (isDomException && err.name === "NotFoundError") {
      dispatch({ type: "SET_CONNECTION", status: "disconnected" });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
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
  try { await adb.close(); } catch { /* ignore */ }
  finally {
    dispatch({ type: "RESET" });
    console.info("[YAADU] Disconnected.");
  }
}

function handleDisconnect(dispatch: React.Dispatch<AppAction>, reason: string): void {
  dispatch({ type: "SET_ERROR", error: reason });
  dispatch({ type: "SET_ADB", adb: null });
  dispatch({ type: "SET_DEVICE", device: null });
  dispatch({ type: "SET_CONNECTION", status: "error" });
}
