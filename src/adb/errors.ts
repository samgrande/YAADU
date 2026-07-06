const KNOWN: [string, string][] = [
  ["The data buffer exceeded supported maximum size", "USB connection error. Please try again."],
  ["Failed to execute 'transferIn' on 'USBDevice'",    "USB connection error. Please try again."],
  ["Failed to execute 'transferOut' on 'USBDevice'",   "USB connection error. Please try again."],
  ["The device was disconnected",                      "USB connection error. Please try again."],
  ["A transfer error has occurred",                    "USB connection error. Please try again."],
];

export function normalizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  for (const [key, replacement] of KNOWN) {
    if (raw.includes(key)) return replacement;
  }
  return raw;
}
