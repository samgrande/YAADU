/**
 * Module 1: WebUSB Connection Lifecycle (adb 0.0.19 API)
 *
 * In 0.0.19: Adb.authenticate(connection, credentialStore) is the static entry point.
 * The Adb instance has model/device/product properties but NO serial field.
 * We use the WebUSB device serial as our identifier.
 */

import { Adb } from "@yume-chan/adb";
import { AdbWebUsbBackendManager } from "@yume-chan/adb-backend-webusb";
import { state } from "../state.js";
import { credentialStore } from "./credential.js";
import { fetchDeviceInfo } from "./telemetry.js";

export async function connectDevice(): Promise<void> {
  if (
    state.connection === "connected" ||
    state.connection === "connecting" ||
    state.connection === "authorizing"
  ) return;

  state.error = null;
  state.connection = "connecting";

  try {
    const manager = AdbWebUsbBackendManager.BROWSER;
    if (!manager) {
      throw new Error("WebUSB is not available. Use Chrome or Edge 89+.");
    }

    // Step 1: User picks device — must be inside user gesture
    const backend = await manager.requestDevice();
    if (!backend) {
      state.connection = "disconnected";
      return;
    }

    // Step 2: Open USB stream pair
    const connection = await backend.connect();

    // Step 3: RSA handshake — triggers "Allow USB Debugging?" on phone
    state.connection = "authorizing";
    console.info("[YAADU] Auth started:", backend.serial);

    // 0.0.19 API: Adb.authenticate(connection, credentialStore)
    const adb = await Adb.authenticate(connection, credentialStore);

    state.adb = adb;
    state.connection = "connected";
    console.info("[YAADU] Connected. Model:", adb.model);

    // Asynchronously pre-fetch device info so it is available to the UI immediately
    fetchDeviceInfo(adb)
      .then((info) => {
        state.device = info;
      })
      .catch((err) => {
        console.warn("[YAADU] Failed to pre-fetch device info:", err);
      });

    // Step 4: Watch for disconnects
    adb.disconnected
      .then(() => handleDisconnect("Device disconnected unexpectedly."))
      .catch((err: unknown) =>
        handleDisconnect(`Connection lost: ${err instanceof Error ? err.message : String(err)}`)
      );

  } catch (err: unknown) {
    const isDomException = err instanceof DOMException;
    if (isDomException && err.name === "NotFoundError") {
      state.connection = "disconnected";
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[YAADU] Connection failed:", err);
    state.error = msg;
    state.connection = "error";
  }
}

export async function disconnectDevice(): Promise<void> {
  const adb = state.adb;
  if (!adb) { state.reset(); return; }
  try { await adb.close(); } catch { /* ignore */ }
  finally { state.reset(); console.info("[YAADU] Disconnected."); }
}

function handleDisconnect(reason: string): void {
  if (state.connection !== "connected") return;
  state.error = reason;
  state.adb = null;
  state.device = null;
  state.connection = "error";
}
