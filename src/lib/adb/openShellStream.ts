import type { Adb } from "@yume-chan/adb";

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
  if (adb.subprocess.shellProtocol?.isSupported) {
    const pty = await adb.subprocess.shellProtocol.pty();
    const writer = pty.input.getWriter();
    let closed = false;

    return {
      stdout: pty.output as unknown as ReadableStream<Uint8Array>,
      stderr: new ReadableStream<Uint8Array>(),
      exit: pty.exited,
      supportsResize: true,

      async write(chunk: Uint8Array) {
        if (closed) return;
        await writer.write(chunk);
      },

      async resize(rows: number, cols: number) {
        if (closed) return;
        await pty.resize(rows, cols);
      },

      async close() {
        if (closed) return;
        closed = true;
        try { await writer.close(); } catch { /* ignore */ }
        try { await pty.kill(); } catch { /* ignore */ }
      },
    };
  }

  const proc = await adb.subprocess.noneProtocol.spawn("/system/bin/sh");
  const writer = proc.stdin.getWriter();
  let closed = false;

  return {
    stdout: proc.output as unknown as ReadableStream<Uint8Array>,
    stderr: new ReadableStream<Uint8Array>(),
    exit: proc.exited.then(() => 0),
    supportsResize: false,

    async write(chunk: Uint8Array) {
      if (closed) return;
      await writer.write(chunk);
    },

    async resize() { /* no-op for none protocol */ },

    async close() {
      if (closed) return;
      closed = true;
      try { await writer.close(); } catch { /* ignore */ }
      try { await proc.kill(); } catch { /* ignore */ }
    },
  };
}
