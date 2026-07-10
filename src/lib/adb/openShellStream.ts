import type { Adb, AdbSubprocessProtocol } from "@yume-chan/adb";
import { ConsumableWritableStream } from "@yume-chan/stream-extra";

export interface AdbShellStream {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  exit: Promise<number>;
  supportsResize: boolean;
  write(chunk: Uint8Array): Promise<void>;
  resize(rows: number, cols: number): Promise<void>;
  close(): Promise<void>;
}

export async function openShellStream(adb: Adb): Promise<AdbShellStream> {
  const protocol = await adb.subprocess.shell();
  return wrapProtocol(protocol);
}

function wrapProtocol(protocol: AdbSubprocessProtocol): AdbShellStream {
  const writer = protocol.stdin.getWriter();
  let closed = false;

  return {
    stdout: protocol.stdout as unknown as ReadableStream<Uint8Array>,
    stderr: protocol.stderr as unknown as ReadableStream<Uint8Array>,
    exit: protocol.exit,
    supportsResize: true,

    async write(chunk: Uint8Array) {
      if (closed) return;
      await ConsumableWritableStream.write(writer, chunk);
    },

    async resize(rows: number, cols: number) {
      if (closed) return;
      await protocol.resize(rows, cols);
    },

    async close() {
      if (closed) return;
      closed = true;
      try { await writer.close(); } catch { /* ignore */ }
      try { await protocol.kill(); } catch { /* ignore */ }
    },
  };
}
