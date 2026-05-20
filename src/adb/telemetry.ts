/**
 * Module 2: Device Telemetry (adb 0.0.19)
 *
 * adb.model, adb.device, adb.product are properties on the Adb instance.
 * We still use getProp() for OS version and shell for screen/battery.
 * Note: in 0.0.19 there is no .serial property; we use adb.model for display.
 */

import type { Adb } from "@yume-chan/adb";
import type { DeviceInfo } from "../state.js";
import { getProp, shell } from "./helpers.js";
import { resolveDeviceDetails } from "./device-names.js";

export interface BatteryData {
  level:       number;
  tempCelsius: number;
  status:      string;
  plugged:     string;
}

function parseWmSize(output: string): string {
  const m = output.match(/(?:Physical|Override) size:\s*(\d+x\d+)/);
  return m ? m[1] : "Unknown";
}

function parseBattery(output: string): BatteryData {
  const get = (key: string): string => {
    const m = output.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : "";
  };
  const level       = parseInt(get("level"), 10) || 0;
  const rawTemp     = parseInt(get("temperature"), 10) || 0;
  const tempCelsius = rawTemp / 10;
  const statusCode  = parseInt(get("status"), 10);
  const statusMap: Record<number, string> = {
    1: "Unknown", 2: "Charging", 3: "Discharging", 4: "Not Charging", 5: "Full",
  };
  const pluggedCode = parseInt(get("plugged"), 10);
  const pluggedMap: Record<number, string> = { 0: "None", 1: "AC", 2: "USB", 4: "Wireless" };
  return {
    level,
    tempCelsius,
    status:  statusMap[statusCode]  ?? "Unknown",
    plugged: pluggedMap[pluggedCode] ?? "Unknown",
  };
}

export async function fetchDeviceInfo(adb: Adb): Promise<DeviceInfo> {
  // Query product details. Wrap all calls in catch fallbacks to be extremely resilient.
  const [brand, model, marketName1, marketName2, osVersion, wmSizeOut, battOut] = await Promise.all([
    getProp(adb, "ro.product.brand").catch(() => ""),
    getProp(adb, "ro.product.model").catch(() => ""),
    getProp(adb, "ro.product.marketname").catch(() => ""),
    getProp(adb, "ro.config.marketing_name").catch(() => ""),
    getProp(adb, "ro.build.version.release").catch(() => ""),
    shell(adb, "wm size").catch(() => ""),
    shell(adb, "dumpsys battery").catch(() => ""),
  ]);

  const battery    = parseBattery(battOut);
  const screenSize = parseWmSize(wmSizeOut);

  const rawBrand = brand || adb.product || "Android";
  const rawModel = model || adb.model   || "Unknown";
  const rawMarket = marketName1 || marketName2 || "";

  const resolved = resolveDeviceDetails(rawModel, rawBrand, rawMarket);

  return {
    brand:         resolved.brand,
    model:         rawModel,
    marketingName: resolved.marketingName,
    osVersion:     osVersion || "?",
    screenSize,
    batteryLevel:  battery.level,
    batteryTemp:   battery.tempCelsius,
  };
}

export async function fetchBattery(adb: Adb): Promise<BatteryData> {
  const out = await shell(adb, "dumpsys battery");
  return parseBattery(out);
}
