import { themeFromSourceColor, argbFromHex, applyTheme } from "@material/material-color-utilities";

export type ThemeMode = "light" | "dark";

export interface YaaduTheme {
  color: string;
  mode: ThemeMode;
}

export const THEME_STORAGE_KEY = "yaadu:theme";

export const THEME_COLORS = [
  { name: "Android Green", value: "#376A3E" },
  { name: "Signal Red", value: "#FF333D" },
  { name: "Pixel Blue", value: "#0B8BEF" },
  { name: "Sunbeam Yellow", value: "#FFC107" },
  { name: "Indigo Pulse", value: "#5A52E8" },
  { name: "Radical Pink", value: "#FF2F66" },
] as const;

export const DEFAULT_THEME: YaaduTheme = {
  color: THEME_COLORS[0].value,
  mode: "light",
};

export function loadStoredTheme(): YaaduTheme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<YaaduTheme>;
    const parsedColor = typeof parsed.color === "string" ? parsed.color : "";
    const color = THEME_COLORS.some((entry) => entry.value === parsedColor)
      ? parsedColor
      : DEFAULT_THEME.color;
    const mode = parsed.mode === "dark" ? "dark" : "light";
    return { color, mode };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: YaaduTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function applyYaaduTheme(theme: YaaduTheme): void {
  const materialTheme = themeFromSourceColor(argbFromHex(theme.color));
  applyTheme(materialTheme, {
    target: document.documentElement,
    dark: theme.mode === "dark",
  });
  document.documentElement.dataset.themeMode = theme.mode;

  if (theme.mode === "dark") {
    const darkSurfaces = [
      '--md-sys-color-surface',
      '--md-sys-color-surface-container-low',
      '--md-sys-color-surface-container',
      '--md-sys-color-surface-container-high',
      '--md-sys-color-surface-container-highest',
      '--md-sys-color-surface-variant',
      '--md-sys-color-outline-variant',
    ];
    for (const prop of darkSurfaces) {
      const val = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
      if (val) {
        document.documentElement.style.setProperty(prop, `color-mix(in srgb, ${val} 60%, black)`);
      }
    }
  }

  const primaryColor = theme.color.length === 7 && theme.color.startsWith('#') ? theme.color : '#376A3E';
  const rgb = primaryColor.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (rgb) {
    const [_, r, g, b] = rgb.map(val => parseInt(val, 16));
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    
    if (max !== min) {
      const d = max - min;
      if (max === r) {
        hue = (g - b) / d;
      } else if (max === g) {
        hue = (b - r) / d + 2;
      } else {
        hue = (r - g) / d + 4;
      }
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max / 255;
    
    document.documentElement.style.setProperty('--theme-hue', `${hue}`);
    document.documentElement.style.setProperty('--theme-saturation', `${Math.min(saturation, 0.5)}`);
    document.documentElement.style.setProperty('--theme-brightness', `${brightness + 0.15}`);
  }

  window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
}
