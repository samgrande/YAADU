import type { Adb } from "@yume-chan/adb";
import { shell } from "./helpers.js";
import commonNames from "../data/common-apps.json";

const CACHE_KEY = "yaadu-app-names";
const API_BASE = "https://play.rajkumaar.co.in/json";

// ── localStorage cache ────────────────────────────────────────────────────

function loadCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, string>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded, silently ignore
  }
}

// ── dumpsys parsing (fallback) ────────────────────────────────────────────

function extractLabelFromAppInfo(appInfo: string): string | null {
  const m = appInfo.match(/\blabel=(.*?)(?=\s+\w+=|$)/);
  if (!m) return null;
  const label = m[1].trim();
  if (!label || label.startsWith("@")) return null;
  return label;
}

function parseDumpsysLabel(output: string): string | null {
  const m = output.match(/applicationInfo=ApplicationInfo\{([\s\S]*?)\}/);
  if (m) {
    const label = extractLabelFromAppInfo(m[1]);
    if (label) return label;
  }
  for (const line of output.split("\n")) {
    const l = line.match(/^\s+label=(.+)$/);
    if (l) {
      const v = l[1].trim();
      if (v && !v.startsWith("@")) return v;
    }
  }
  const broad = output.match(/\blabel=([^\s\}]+)/);
  if (broad) return broad[1];
  return null;
}

// ── Main resolution pipeline ──────────────────────────────────────────────

const staticMap = commonNames as Record<string, string>;

const ICON_CACHE_KEY = "yaadu-app-icons";

function loadIconCache(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveIconCache(cache: Record<string, string>): void {
  try {
    localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded, silently ignore
  }
}

export async function fetchAppIconUrl(packageName: string): Promise<string | null> {
  const iconCache = loadIconCache();
  const cached = iconCache[packageName];
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BASE}?id=${encodeURIComponent(packageName)}`);
    if (res.ok) {
      const data = (await res.json()) as { name?: string; logo?: string } | undefined;
      if (data?.logo) {
        iconCache[packageName] = data.logo;
        saveIconCache(iconCache);
      }
      if (data?.name) {
        const cache = loadCache();
        cache[packageName] = data.name;
        saveCache(cache);
      }
      return data?.logo ?? null;
    }
  } catch {
    // network error, fall through
  }

  return null;
}

export async function fetchAppName(adb: Adb, packageName: string): Promise<string | null> {
  // 1. Check localStorage cache
  const cache = loadCache();
  const cached = cache[packageName];
  if (cached) return cached;

  // 2. Check bundled static map
  const mapped = staticMap[packageName];
  if (mapped) {
    cache[packageName] = mapped;
    saveCache(cache);
    return mapped;
  }

  // 3. Fetch from Play Store API
  try {
    const res = await fetch(`${API_BASE}?id=${encodeURIComponent(packageName)}`);
    if (res.ok) {
      const data = (await res.json()) as { name?: string; logo?: string } | undefined;
      const name = data?.name;
      if (name) {
        cache[packageName] = name;
        saveCache(cache);
      }
      if (data?.logo) {
        const iconCache = loadIconCache();
        iconCache[packageName] = data.logo;
        saveIconCache(iconCache);
      }
      if (name) return name;
    }
  } catch {
    // network error, fall through
  }

  // 4. Fallback: dumpsys
  try {
    const output = await shell(adb, `dumpsys package ${packageName}`);
    const label = parseDumpsysLabel(output);
    if (label) {
      cache[packageName] = label;
      saveCache(cache);
      return label;
    }
  } catch {
    // dumpsys failed, fall through
  }

  return null;
}
