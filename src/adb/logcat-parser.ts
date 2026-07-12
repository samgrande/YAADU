export interface LogcatEntry {
  id: number;
  timestamp: string;
  pid: number;
  tid: number;
  level: string;
  tag: string;
  message: string;
}

const THREADTIME_RE = /^(\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEFS])\s+([^:]+):\s?(.*)$/;

export function parseLogcatLine(line: string): LogcatEntry | null {
  const m = THREADTIME_RE.exec(line);
  if (!m) return null;
  return {
    id: 0,
    timestamp: m[1],
    pid: parseInt(m[2], 10),
    tid: parseInt(m[3], 10),
    level: m[4],
    tag: m[5],
    message: m[6],
  };
}

export class LineBuffer {
  private decoder = new TextDecoder();
  private partial = "";

  push(chunk: Uint8Array): string[] {
    const text = this.decoder.decode(chunk, { stream: true });
    const lines = text.split("\n");
    if (this.partial) {
      lines[0] = this.partial + lines[0];
      this.partial = "";
    }
    if (lines.length > 0 && lines[lines.length - 1] !== "") {
      this.partial = lines.pop()!;
    } else if (lines.length > 0 && lines[lines.length - 1] === "") {
      lines.pop();
    }
    return lines;
  }

  flush(): string[] {
    const tail = this.decoder.decode();
    const lines = tail ? tail.split("\n") : [];
    if (this.partial) {
      if (lines.length > 0) {
        lines[0] = this.partial + lines[0];
      } else {
        lines.push(this.partial);
      }
      this.partial = "";
    }
    return lines.filter(l => l.length > 0);
  }
}
