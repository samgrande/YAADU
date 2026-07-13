/**
 * Screen Mirroring via Scrcpy
 *
 * Uses @yume-chan/adb-scrcpy + @yume-chan/scrcpy-decoder-webcodecs
 * to mirror the device screen to a <canvas> element.
 */

import type { Adb } from "@yume-chan/adb";
import { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import {
  WebCodecsVideoDecoder,
  WebGLVideoFrameRenderer,
} from "@yume-chan/scrcpy-decoder-webcodecs";
import type { ScrcpyControlMessageWriter } from "@yume-chan/scrcpy";

const SERVER_PATH = "/data/local/tmp/scrcpy-server.jar";
const SERVER_URL = `${(import.meta as any).env?.BASE_URL ?? "/YAADU/"}scrcpy-server`;

export interface MirrorSession {
  readonly width: number;
  readonly height: number;
  readonly controller: ScrcpyControlMessageWriter | undefined;
  onSizeChange(listener: (width: number, height: number) => void): () => void;
  screenshot(): Promise<Blob | undefined>;
  stop(): Promise<void>;
}

interface MirrorOptions {
  videoBitRate?: number;
  maxSize?: number;
  maxFps?: number;
  control?: boolean;
}

export async function startScreenMirror(
  adb: Adb,
  canvas: HTMLCanvasElement,
  options?: MirrorOptions,
): Promise<MirrorSession> {
  console.info("[ScreenMirror] Pushing scrcpy server…");
  const serverResp = await fetch(SERVER_URL);
  if (!serverResp.ok) throw new Error(`Failed to fetch scrcpy server: ${serverResp.status}`);
  const serverBody = serverResp.body;
  if (!serverBody) throw new Error("Server response body is null");
  await AdbScrcpyClient.pushServer(adb, serverBody as unknown as import("@yume-chan/stream-extra").ReadableStream<Uint8Array>, SERVER_PATH);

  console.info("[ScreenMirror] Starting scrcpy session…");
  const scrcpyOpts = new AdbScrcpyOptionsLatest({
    video: true,
    videoCodec: "h264",
    videoBitRate: options?.videoBitRate ?? 8_000_000,
    maxSize: options?.maxSize ?? 0,
    maxFps: options?.maxFps ?? 0,
    audio: false,
    control: options?.control ?? true,
    showTouches: false,
    stayAwake: false,
    powerOn: true,
    cleanup: true,
  });

  const client = await AdbScrcpyClient.start(adb, SERVER_PATH, scrcpyOpts);

  const videoStreamPromise = client.videoStream;
  if (!videoStreamPromise) {
    await client.close();
    throw new Error("No video stream available (video: false?)");
  }
  const videoStream = await videoStreamPromise;

  console.info(
    "[ScreenMirror] Video stream ready:",
    videoStream.metadata.width,
    "x",
    videoStream.metadata.height,
    "codec:",
    videoStream.metadata.codec,
  );

  const renderer = new WebGLVideoFrameRenderer(canvas);
  const decoder = new WebCodecsVideoDecoder({
    codec: videoStream.metadata.codec,
    renderer,
  });

  // Pipe video stream into decoder
  // Both stream types are from @yume-chan/stream-extra internally
  const readable = videoStream.stream as unknown as ReadableStream<import("@yume-chan/scrcpy").ScrcpyMediaStreamPacket>;
  const writable = decoder.writable as unknown as WritableStream<import("@yume-chan/scrcpy").ScrcpyMediaStreamPacket>;
  readable.pipeTo(writable);

  // Size change listeners
  const sizeListeners = new Set<(w: number, h: number) => void>();
  const removeSizeListener = decoder.sizeChanged(({ width, height }) => {
    for (const fn of sizeListeners) fn(width, height);
  });

  let stopped = false;

  return {
    get width() { return decoder.width; },
    get height() { return decoder.height; },
    get controller() { return client.controller; },

    onSizeChange(listener: (w: number, h: number) => void) {
      sizeListeners.add(listener);
      return () => { sizeListeners.delete(listener); };
    },

    async screenshot() {
      return decoder.snapshot();
    },

    async stop() {
      if (stopped) return;
      stopped = true;
      removeSizeListener();
      decoder.dispose();
      await client.close();
      console.info("[ScreenMirror] Stopped.");
    },
  };
}
