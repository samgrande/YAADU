import type { Adb } from "@yume-chan/adb";
import { LineBuffer, parseLogcatLine, type LogcatEntry } from "./logcat-parser.js";
import { logcatStore } from "./logcat-store.js";

const BATCH_INTERVAL_MS = 100;

export type CaptureStatus = "idle" | "capturing" | "stopped";

class LogcatSession {
  private process: { output: ReadableStream<Uint8Array>; kill(): void } | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private aborted = false;
  private entryIdCounter = 0;
  private batch: import("./logcat-parser.js").LogcatEntry[] = [];
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private lineBuffer = new LineBuffer();
  private lastEntry: import("./logcat-parser.js").LogcatEntry | null = null;

  get isActive(): boolean {
    return this.reader !== null && !this.aborted;
  }

  async start(adb: Adb): Promise<void> {
    if (this.isActive) return;
    this.aborted = false;
    const proc = await adb.subprocess.noneProtocol.spawn("logcat -v threadtime");
    this.process = proc as unknown as { output: ReadableStream<Uint8Array>; kill(): void };
    this.reader = this.process.output.getReader();
    this.batchTimer = setInterval(() => this.flushBatch(), BATCH_INTERVAL_MS);
    logcatStore.setCaptureStatus("capturing");
    this.readLoop().catch(() => {});
  }

  stop(): void {
    if (!this.isActive) return;
    this.aborted = true;
    this.flushBatch();
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.cleanup();
    logcatStore.setCaptureStatus("stopped");
  }

  clear(): void {
    this.entryIdCounter = 0;
    this.batch = [];
    this.lastEntry = null;
    logcatStore.clearBuffer();
  }

  markDisconnected(): void {
    this.aborted = true;
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.cleanup();
    logcatStore.setCaptureStatus("stopped");
  }

  private async readLoop(): Promise<void> {
    try {
      while (!this.aborted && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (!value) continue;
        const lines = this.lineBuffer.push(value);
        for (const line of lines) {
          const parsed = parseLogcatLine(line);
          if (parsed) {
            parsed.id = ++this.entryIdCounter;
            this.batch.push(parsed);
            this.lastEntry = parsed;
          } else if (this.lastEntry) {
            this.lastEntry.message += "\n" + line;
          } else {
            const orphan: LogcatEntry = {
              id: ++this.entryIdCounter,
              timestamp: "",
              pid: 0,
              tid: 0,
              level: "?",
              tag: "",
              message: line,
            };
            this.batch.push(orphan);
            this.lastEntry = orphan;
          }
        }
      }
    } catch {
      /* stream error */
    } finally {
      const tail = this.lineBuffer.flush();
      for (const line of tail) {
        const parsed = parseLogcatLine(line);
        if (parsed) {
          parsed.id = ++this.entryIdCounter;
          this.batch.push(parsed);
          this.lastEntry = parsed;
        } else if (this.lastEntry) {
          this.lastEntry.message += "\n" + line;
        } else {
          const orphan: LogcatEntry = {
            id: ++this.entryIdCounter,
            timestamp: "",
            pid: 0,
            tid: 0,
            level: "?",
            tag: "",
            message: line,
          };
          this.batch.push(orphan);
          this.lastEntry = orphan;
        }
      }
      this.flushBatch();
      this.cleanup();
      if (!this.aborted) {
        logcatStore.setCaptureStatus("stopped");
      }
    }
  }

  private flushBatch(): void {
    if (this.batch.length === 0) return;
    const entries = this.batch;
    this.batch = [];
    logcatStore.appendEntries(entries);
  }

  private cleanup(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.reader) {
      try { this.reader.releaseLock(); } catch { /* ignore */ }
      this.reader = null;
    }
    if (this.process) {
      try { this.process.kill(); } catch { /* ignore */ }
      this.process = null;
    }
  }
}

export const logcatSession = new LogcatSession();
