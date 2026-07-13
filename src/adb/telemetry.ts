/**
 * Module 2: Device Telemetry (adb 2.x)
 *
 * In 2.x: adb.banner.model, adb.banner.product, adb.banner.serial.
 * adb.getProp() is still available on the Adb instance.
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
  capacity:    string;
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
    capacity:   get("capacity") || "",
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
  if ((adb as any).isMock) {
    return {
      brand: "Google",
      model: "Pixel 8 Pro",
      marketingName: "Google Pixel 8 Pro",
      osVersion: "14",
      screenSize: "1344x2992",
      batteryLevel: 80,
      batteryTemp: 34.5,
      batteryCharging: true,
    };
  }

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

  const rawBrand = brand || adb.banner.product || "Android";
  const rawModel = model || adb.banner.model   || "Unknown";
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
  if ((adb as any).isMock) {
    return {
      level: 80,
      tempCelsius: 34.5,
      status: "Charging",
      plugged: "AC",
      health: "Good",
      voltage: "4.21V",
      technology: "Li-poly",
      capacity: "5000",
    };
  }
  const [out, capacityOut] = await Promise.all([
    shell(adb, "dumpsys battery"),
    shell(adb, "for f in /sys/class/power_supply/*/charge_full_design /sys/class/power_supply/*/charge_full; do cat \"$f\" 2>/dev/null; done; dumpsys batterystats 2>/dev/null | grep -i 'capacity:' | head -1").catch(() => ""),
  ]);
  const data = parseBattery(out);
  if (!data.capacity) {
    const m = capacityOut.match(/(\d+)/);
    if (m) {
      let val = parseInt(m[1], 10);
      if (val > 100000) val = Math.round(val / 1000);
      data.capacity = val > 0 ? String(val) : "";
    }
  }
  return data;
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

export interface ConnectivityData {
  wifiSsid:    string;
  ipAddress:   string;
  rssi:        string;
  linkSpeed:   string;
  frequency:   string;
  dns:         string;
  gateway:     string;
}

export interface SensorsData {
  touchScreen: string;
  activeSensors: string;
}

export async function fetchConnectivity(adb: Adb): Promise<ConnectivityData> {
  if ((adb as any).isMock) {
    return {
      wifiSsid:  "HomeNet",
      ipAddress: "192.168.1.42",
      rssi:      "-58 dBm",
      linkSpeed: "866 Mbps",
      frequency: "5 GHz",
      dns:       "8.8.8.8, 192.168.1.1",
      gateway:   "192.168.1.1",
    };
  }

  const [wifiOut, ipOut, routeOut, iwOut, cmdWifi] = await Promise.all([
    shell(adb, "dumpsys wifi 2>/dev/null").catch(() => ""),
    shell(adb, "ip -f inet addr show 2>/dev/null; ifconfig 2>/dev/null").catch(() => ""),
    shell(adb, "ip route show 2>/dev/null; cat /proc/net/route 2>/dev/null; route -n 2>/dev/null").catch(() => ""),
    shell(adb, "iw dev wlan0 link 2>/dev/null").catch(() => ""),
    shell(adb, "cmd wifi status 2>/dev/null").catch(() => ""),
  ]);

  const allWifi = [wifiOut, cmdWifi, iwOut].join("\n---SEPARATOR---\n");

  // SSID
  let wifiSsid = "—";
  const ssidM = allWifi.match(/SSID:\s*"([^"]+)"/)
    ?? allWifi.match(/SSID:\s*([^\r\n,]+)/i)
    ?? allWifi.match(/ssid="([^"]+)"/i)
    ?? allWifi.match(/mWifiInfo\s*[\[{][^\]}]*SSID[=:]\s*([^,\]}]+)/i)
    ?? allWifi.match(/"([^"]+)"\s*[\[{].*RSSI/i)
    ?? allWifi.match(/ssid[=:]"?([^"&\s,}\]]+)/i);
  if (ssidM) wifiSsid = ssidM[1].replace(/["\[\]{}]/g, "").trim();
  if (wifiSsid === "—" || wifiSsid === "<unknown ssid>" || /^0x[0-9a-f]+$/i.test(wifiSsid)) wifiSsid = "—";

  // IP address
  let ipAddress = "—";
  const ipM = ipOut.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
  if (ipM) ipAddress = ipM[1];

  // RSSI
  let rssi = "—";
  const rssiM = allWifi.match(/RSSI:\s*(-?\d+)/i)
    ?? allWifi.match(/(?:\b|[,{]\s*)rssi[\s=:]+(-?\d+)/i)
    ?? allWifi.match(/signal:\s*(-?\d+)/i)
    ?? allWifi.match(/mWifiInfo\s*[\[{][^\]}]*rssi[=:](-?\d+)/i)
    ?? allWifi.match(/WifiInfo[^}]*rssi[=:](-?\d+)/i)
    ?? allWifi.match(/RSSI[=:](-?\d+)/i);
  if (rssiM) rssi = `${rssiM[1]} dBm`;

  // Link speed
  let linkSpeed = "—";
  const lsM = allWifi.match(/Link\s*speed:\s*(\d+\s*Mbps)/i)
    ?? allWifi.match(/txLinkSpeed\s*=\s*(\d+)/i)
    ?? allWifi.match(/mWifiInfo\s*[\[{][^\]}]*?(\d+)\s*Mbps/i)
    ?? allWifi.match(/LinkSpeed[=:](\d+)/i)
    ?? allWifi.match(/link.?speed[=:](\d+)/i)
    ?? allWifi.match(/bitrate:\s*(\d+(?:\.\d+)?)\s*MBit\/s/i);
  if (lsM) linkSpeed = lsM[1].includes("Mbps") ? lsM[1] : `${Math.round(parseFloat(lsM[1]))} Mbps`;

  // Frequency band
  let frequency = "—";
  const freqM = allWifi.match(/mWifiInfo\s*[\[{][^\]}]*freq[=:](\d+)/i)
    ?? allWifi.match(/Frequency:\s*(\d+)/i)
    ?? allWifi.match(/[Ff]req[=:](\d{4,5})/i)
    ?? allWifi.match(/mWifiInfo\s*[\[{][^\]}]*?,\s*(\d{4,5})\s*MHz/i)
    ?? allWifi.match(/freq:\s*(\d+)/i)
    ?? allWifi.match(/\bfrequency\b[^:]*?(\d{4,5})/i)
    ?? allWifi.match(/channel:\s*(\d+)/i)
    ?? allWifi.match(/WifiInfo[^}]*freq[=:](\d+)/i);
  if (freqM) {
    const raw = parseInt(freqM[1], 10);
    if (raw < 200) {
      const ch2g: Record<number, number> = {1:2412,2:2417,3:2422,4:2427,5:2432,6:2437,7:2442,8:2447,9:2452,10:2457,11:2462,12:2467,13:2472};
      const ch5g: Record<number, number> = {36:5180,40:5200,44:5220,48:5240,149:5745,153:5765,157:5785,161:5805,165:5825};
      const f = ch5g[raw] || ch2g[raw] || 0;
      frequency = f >= 5000 ? "5 GHz" : f >= 2400 ? "2.4 GHz" : `Ch ${raw}`;
    } else {
      frequency = raw >= 5000 ? "5 GHz" : raw >= 2400 ? "2.4 GHz" : `${raw} MHz`;
    }
  }

  // DNS
  let dns = "—";
  const dnsM = ipOut.match(/dns\s*(\d+\.\d+\.\d+\.\d+)/i)
    ?? ipOut.match(/nameserver\s+(\d+\.\d+\.\d+\.\d+)/i);
  if (dnsM) dns = dnsM[1];

  // Gateway – try multiple route formats
  let gateway = "—";
  const gwM = routeOut.match(/default via\s+(\d+\.\d+\.\d+\.\d+)/i)
    ?? routeOut.match(/^0{8}\s+([0-9a-fA-F]{8})/m)
    ?? routeOut.match(/^0\.0\.0\.0\s+(\d+\.\d+\.\d+\.\d+)/m)
    ?? routeOut.match(/default\s+(\d+\.\d+\.\d+\.\d+)/i);
  if (gwM) {
    if (gwM[1].length === 8 && /^[0-9a-fA-F]+$/.test(gwM[1])) {
      const hex = gwM[1];
      gateway = `${parseInt(hex.slice(6,8), 16)}.${parseInt(hex.slice(4,6), 16)}.${parseInt(hex.slice(2,4), 16)}.${parseInt(hex.slice(0,2), 16)}`;
    } else {
      gateway = gwM[1];
    }
  }

  return { wifiSsid, ipAddress, rssi, linkSpeed, frequency, dns, gateway };
}

export async function fetchSensors(adb: Adb): Promise<SensorsData> {
  if ((adb as any).isMock) {
    return {
      touchScreen:  "Capacitive, 10-point",
      activeSensors: "Accelerometer, Gyroscope, Proximity, Light",
    };
  }

  const [senOut, inputOut] = await Promise.all([
    shell(adb, "dumpsys sensorservice 2>/dev/null | head -100").catch(() => ""),
    shell(adb, "dumpsys input 2>/dev/null | head -80").catch(() => ""),
  ]);

  // Touch screen
  let touchScreen = "—";
  const touchM = inputOut.match(/Touch\s*screen[^]*?(\d+)[^]*?touch/i);
  if (touchM) touchScreen = `Capacitive, ${touchM[1]}-point`;
  else if (/touch/i.test(inputOut)) touchScreen = "Capacitive";
  else if (/pointer|stylus|finger/i.test(inputOut)) touchScreen = "Capacitive";

  // Active sensors – clean name extraction from sensorservice
  let activeSensors = "—";
  const senNames: string[] = [];
  const knownSensors = /accelerometer|gyroscope|proximity|light|magnetometer|pressure|barometer|humidity|temperature|step.?counter|gravity|rotation|significant.?motion|tilt|gesture|hall|heart.?rate|spO2|blood.?pressure|glucose|color|HSV|IR|depth|pose|heading|hinge|fold|angle|wrist|tap|double.?tap|pick.?up|wake|stylus|motion/i;

  const SENSOR_LABELS: Record<string, string> = {
    accelerometer:      "Accelerometer",
    gyroscope:          "Gyroscope",
    gyroscopeunc:       "Gyroscope",
    proximity:          "Proximity",
    light:              "Ambient Light",
    magnetometer:       "Magnetometer",
    pressure:           "Barometer",
    barometer:          "Barometer",
    humidity:           "Humidity",
    temperature:        "Thermometer",
    "step counter":     "Step Counter",
    stepcounter:        "Step Counter",
    "step detector":    "Step Detector",
    stepdetector:       "Step Detector",
    gravity:            "Gravity",
    "rotation vector":  "Rotation Vector",
    rotationvector:     "Rotation Vector",
    "game rotation":    "Game Rotation",
    "geomagnetic":      "Geomagnetic",
    "significant motion": "Significant Motion",
    significantmotion:  "Significant Motion",
    tilt:               "Tilt Detector",
    tiltdetector:       "Tilt Detector",
    gesture:            "Gesture",
    "pick up":          "Pick-up",
    pickup:             "Pick-up",
    "wake gesture":     "Wake Gesture",
    wakegesture:        "Wake Gesture",
    "glance gesture":   "Glance Gesture",
    glancegesture:      "Glance Gesture",
    hall:               "Hall Effect",
    "heart rate":       "Heart Rate",
    heartrate:          "Heart Rate",
    spO2:               "SpO₂",
    "blood pressure":   "Blood Pressure",
    glucose:            "Glucose",
    color:              "Color",
    HSV:                "HSV",
    ir:                 "IR",
    depth:              "Depth",
    pose:               "Pose",
    heading:            "Heading",
    hinge:              "Hinge Angle",
    "hinge angle":      "Hinge Angle",
    hingeangle:         "Hinge Angle",
    fold:               "Fold",
    angle:              "Angle",
    wrist:              "Wrist Gesture",
    "wrist gesture":    "Wrist Gesture",
    tap:                "Tap",
    "double tap":       "Double Tap",
    doubletap:          "Double Tap",
    motion:             "Motion",
    stylus:             "Stylus",
  };

  for (const line of senOut.split("\n")) {
    if (!knownSensors.test(line)) continue;

    let name = line.replace(/^\s*\d+\)\s*/, "").trim();
    const pipeIdx = name.indexOf("|");
    if (pipeIdx > 0) name = name.substring(0, pipeIdx).trim();
    name = name.replace(/,.*$/, "").trim();

    // try to extract the sensor type from "type: xxx" in the line
    const typeM = line.match(/type:\s*(\w+(?:\s*\w+)?)/i);
    let label = typeM ? SENSOR_LABELS[typeM[1].toLowerCase().replace(/\s+/g, "")] : undefined;
    if (!label) {
      // check the whole name against the map
      label = SENSOR_LABELS[name.toLowerCase().replace(/\s+/g, "")];
    }
    if (!label && /uncalibrated/i.test(line)) continue;
    if (!label) {
      // clean up raw name: strip leading vendor-like segments
      const words = name.split(/\s+/);
      const clean = words.slice(1).join(" ");
      label = SENSOR_LABELS[clean.toLowerCase().replace(/\s+/g, "")];
    }
    if (!label || label.length < 2) continue;
    if (!senNames.includes(label)) senNames.push(label);
  }
  if (senNames.length > 0) {
    activeSensors = senNames.slice(0, 6).join(", ");
    if (senNames.length > 6) activeSensors += ` +${senNames.length - 6} more`;
  }

  return { touchScreen, activeSensors };
}

export async function fetchSystemDetails(adb: Adb): Promise<SystemDetails> {
  if ((adb as any).isMock) {
    return {
      sdkVersion: "34",
      buildId: "AP1A.240305.019.A1",
      buildDate: "Tue Mar  5 12:00:00 PST 2024",
      securityPatch: "2024-03-05",
      fingerprint: "google/husky/husky:14/AP1A.240305.019.A1/11467431:user/release-keys",
      productName: "husky",
      manufacturer: "Google",
      board: "husky",
      deviceName: "husky",
      densityDpi: "480",
      cpuAbi: "arm64-v8a",
      totalMemory: "12.0 GB",
      availMemory: "4.8 GB",
      health: "Good",
      voltage: "4.21V",
      technology: "Li-poly",
    };
  }
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
