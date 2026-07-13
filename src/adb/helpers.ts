import type { Adb } from "@yume-chan/adb";

export async function shell(adb: Adb, command: string): Promise<string> {
  return adb.subprocess.noneProtocol.spawnWaitText(command);
}

export async function shellFull(
  adb: Adb,
  command: string | string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  if (adb.subprocess.shellProtocol?.isSupported) {
    const result = await adb.subprocess.shellProtocol.spawnWaitText(command);
    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
  }
  // Fallback: noneProtocol only has combined output, no exit code
  const stdout = await adb.subprocess.noneProtocol.spawnWaitText(command);
  return { stdout, stderr: "", exitCode: 0 };
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
