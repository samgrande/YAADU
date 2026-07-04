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
}
