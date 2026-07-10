import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import type { AdbShellStream } from "../../lib/adb/openShellStream.js";

export type ShellSessionStatus = "connecting" | "ready" | "closed" | "error";

export class AdbShellSession {
  readonly id: string;
  readonly terminal: Terminal;
  readonly fitAddon: FitAddon;
  readonly createdAt: number;

  private readonly stream: AdbShellStream;
  private readonly textDecoder = new TextDecoder();
  private readonly textEncoder = new TextEncoder();
  private readonly disposables: { dispose(): void }[] = [];
  private closed = false;
  status: ShellSessionStatus = "ready";
  onStatusChange?: (status: ShellSessionStatus) => void;

  constructor(id: string, stream: AdbShellStream) {
    this.id = id;
    this.stream = stream;
    this.createdAt = Date.now();
    this.terminal = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
      fontSize: 16,
      lineHeight: 1.35,
      scrollback: 5000,
      convertEol: false,
      theme: readTerminalTheme(),
    });
    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    this.disposables.push(this.terminal.onData((input) => {
      void this.writeInput(input);
    }));

    void this.pipeReadable(this.stream.stdout);
    void this.pipeReadable(this.stream.stderr);
    void this.watchExit();
  }

  fitAndResize() {
    if (this.closed) return;
    try {
      this.fitAddon.fit();
      void this.stream.resize(this.terminal.rows, this.terminal.cols);
    } catch {
      /* xterm fit can throw while hidden. */
    }
  }

  applyTheme() {
    this.terminal.options.theme = readTerminalTheme();
  }

  markDisconnected() {
    if (this.closed) return;
    this.setStatus("error");
    this.terminal.writeln("\r\n[device disconnected]");
    this.terminal.options.disableStdin = true;
  }

  async dispose() {
    if (this.closed) return;
    this.closed = true;
    this.setStatus("closed");
    this.disposables.forEach((disposable) => disposable.dispose());
    await this.stream.close();
    this.terminal.dispose();
  }

  private async writeInput(input: string) {
    if (this.closed || this.status === "closed" || this.status === "error") return;
    const encoded = this.textEncoder.encode(input);
    const chunkSize = 16 * 1024;
    for (let offset = 0; offset < encoded.length; offset += chunkSize) {
      await this.stream.write(encoded.slice(offset, offset + chunkSize));
    }
  }

  private async pipeReadable(readable: ReadableStream<Uint8Array>) {
    const reader = readable.getReader();
    try {
      while (!this.closed) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.terminal.write(this.textDecoder.decode(value, { stream: true }));
        }
      }
    } catch {
      if (!this.closed) {
        this.setStatus("error");
      }
    } finally {
      const tail = this.textDecoder.decode();
      if (tail) this.terminal.write(tail);
      reader.releaseLock();
    }
  }

  private async watchExit() {
    try {
      await this.stream.exit;
      if (!this.closed) {
        this.setStatus("closed");
        this.terminal.writeln("\r\n[process exited]");
        this.terminal.options.disableStdin = true;
      }
    } catch {
      if (!this.closed) {
        this.setStatus("error");
      }
    }
  }

  private setStatus(status: ShellSessionStatus) {
    this.status = status;
    this.onStatusChange?.(status);
  }
}


function cssVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function readTerminalTheme() {
  const background = cssVar("--ds-bg-terminal", "#1c221d");
  const foreground = cssVar("--ds-text-terminal", "#b7f1b9");
  const accent = cssVar("--ds-accent-primary", "#71e174");
  return {
    background,
    foreground,
    cursor: foreground,
    selectionBackground: cssVar("--ds-terminal-selection", `${accent}55`),
    black: background,
    green: accent,
    brightGreen: foreground,
    white: cssVar("--ds-terminal-white", foreground),
  };
}
