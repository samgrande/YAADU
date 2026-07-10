import type { Adb } from "@yume-chan/adb";
import { openShellStream } from "../../lib/adb/openShellStream.js";
import { AdbShellSession } from "./AdbShellSession.js";

const MAX_SESSIONS = 6;

class ShellManager {
  private adb: Adb | null = null;
  private sessions = new Map<string, AdbShellSession>();

  setAdb(adb: Adb | null) {
    this.adb = adb;
  }

  get count() {
    return this.sessions.size;
  }

  getSession(id: string | null) {
    if (!id) return null;
    return this.sessions.get(id) ?? null;
  }

  async createSession(id: string) {
    if (!this.adb) {
      throw new Error("No connected ADB device.");
    }
    if (this.sessions.size >= MAX_SESSIONS) {
      throw new Error(`Device Shell is limited to ${MAX_SESSIONS} windows.`);
    }
    const stream = await openShellStream(this.adb);
    const session = new AdbShellSession(id, stream);
    this.sessions.set(id, session);
    return session;
  }

  async destroySession(id: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    this.sessions.delete(id);
    await session.dispose();
  }

  markAllDisconnected() {
    for (const session of this.sessions.values()) {
      session.markDisconnected();
    }
  }

  async disposeAll() {
    const sessions = [...this.sessions.values()];
    this.sessions.clear();
    await Promise.allSettled(sessions.map((session) => session.dispose()));
  }
}

export const shellManager = new ShellManager();
