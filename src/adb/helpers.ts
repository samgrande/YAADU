import type { Adb } from "@yume-chan/adb";

export async function shell(adb: Adb, command: string): Promise<string> {
  return adb.subprocess.spawnAndWaitLegacy(command);
}

export async function shellFull(
  adb: Adb,
  command: string | string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return adb.subprocess.spawnAndWait(command);
}

export async function getProp(adb: Adb, key: string): Promise<string> {
  return (await adb.getProp(key)).trim();
}

export function formatBytes(bytes: number | bigint): string {
  const n = Number(bytes);
  if (n < 1024)            return `${n} B`;
  if (n < 1024 * 1024)     return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
