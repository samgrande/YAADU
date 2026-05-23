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
  health:      string;
  voltage:     string;
  technology:  string;
}

export interface SystemDetails {
  // System & Build
  sdkVersion:    string;
  buildId:       string;
  buildDate:     string;
  securityPatch: string;
  fingerprint:   string;
  productName:   string;
  manufacturer:  string;
  board:         string;
  deviceName:    string;

  // Hardware & Display
  densityDpi:   string;
  cpuAbi:       string;
  totalMemory:  string;
  availMemory:  string;

  // Battery extras
  health:      string;
  voltage:     string;
  technology:  string;
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
    health:     parseHealth(get("health")),
    voltage:    get("voltage") ? `${(parseInt(get("voltage"), 10) / 1000).toFixed(2)}V` : "",
    technology: get("technology"),
  };
}

function parseHealth(code: string): string {
  const map: Record<string, string> = {
    "1": "Unknown", "2": "Good", "3": "Overheat",
    "4": "Dead", "5": "Over Voltage", "6": "Unspecified Failure", "7": "Cold",
  };
  return map[code] ?? "Unknown";
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
    batteryLevel:    battery.level,
    batteryTemp:     battery.tempCelsius,
    batteryCharging: battery.status === "Charging",
  };
}

export async function fetchBattery(adb: Adb): Promise<BatteryData> {
  const out = await shell(adb, "dumpsys battery");
  return parseBattery(out);
}

function parseMeminfo(output: string): { total: string; avail: string } {
  const get = (key: string): string => {
    const m = output.match(new RegExp(`${key}:\\s*(\\d+)`));
    return m ? m[1] : "";
  };
  const totalKb  = parseInt(get("MemTotal"), 10) || 0;
  const availKb  = parseInt(get("MemAvailable"), 10) || 0;
  const toGb = (kb: number) => `${(kb / 1024 / 1024).toFixed(1)} GB`;
  return { total: toGb(totalKb), avail: toGb(availKb) };
}

export async function fetchSystemDetails(adb: Adb): Promise<SystemDetails> {
  // Batch property lookups in a single shell command for speed
  const multiPropCmd = [
    'echo "---sdk---"',  'getprop ro.build.version.sdk',
    'echo "---build_id---"', 'getprop ro.build.display.id',
    'echo "---build_date---"', 'getprop ro.build.date',
    'echo "---security_patch---"', 'getprop ro.build.version.security_patch',
    'echo "---fingerprint---"', 'getprop ro.build.fingerprint',
    'echo "---product---"', 'getprop ro.product.name',
    'echo "---manufacturer---"', 'getprop ro.product.manufacturer',
    'echo "---board---"', 'getprop ro.product.board',
    'echo "---device---"', 'getprop ro.product.vendor.device',
    'echo "---density---"', 'getprop ro.sf.lcd_density',
    'echo "---cpu_abi---"', 'getprop ro.product.cpu.abi',
  ].join(" && ");

  const [propOut, memOut] = await Promise.all([
    shell(adb, multiPropCmd).catch(() => ""),
    shell(adb, "cat /proc/meminfo").catch(() => ""),
  ]);

  function extract(marker: string): string {
    const re = new RegExp(`---${marker}---\\n(.*?)(?:\\n---|$)`, "s");
    const m = propOut.match(re);
    return m ? m[1].trim() : "—";
  }

  const mem = parseMeminfo(memOut);

  return {
    sdkVersion:    extract("sdk"),
    buildId:       extract("build_id"),
    buildDate:     extract("build_date"),
    securityPatch: extract("security_patch"),
    fingerprint:   extract("fingerprint"),
    productName:   extract("product"),
    manufacturer:  extract("manufacturer"),
    board:         extract("board"),
    deviceName:    extract("device"),
    densityDpi:    extract("density"),
    cpuAbi:        extract("cpu_abi"),
    totalMemory:   mem.total,
    availMemory:   mem.avail,
    health:        "",
    voltage:       "",
    technology:    "",
  };
}
