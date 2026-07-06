import rawMapping from "../data/app-categories.json";

const CATEGORY_ORDER = [
  "Communication",
  "Social",
  "Shopping",
  "Gaming",
  "Photos",
  "Music",
  "Video",
  "Internet",
  "Productivity",
  "Finance",
  "Travel",
  "Health",
  "Tools",
  "System",
];

const mapping = rawMapping as Record<string, string>;
const sortedPrefixes = Object.keys(mapping).sort((a, b) => b.length - a.length);

export function categorizeApp(packageName: string, systemApp: boolean): string | null {
  for (const prefix of sortedPrefixes) {
    if (packageName.startsWith(prefix)) {
      return mapping[prefix];
    }
  }
  if (systemApp) return "System";
  return null;
}

export function sortCategories(cats: string[]): string[] {
  const order: Record<string, number> = {};
  CATEGORY_ORDER.forEach((c, i) => { order[c] = i; });
  return [...cats].sort((a, b) => (order[a] ?? Infinity) - (order[b] ?? Infinity));
}
