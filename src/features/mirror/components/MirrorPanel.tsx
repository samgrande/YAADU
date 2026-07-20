import { useCallback, useEffect, useRef, useState } from "react";
import type { Adb } from "@yume-chan/adb";
import { startScreenMirror, type MirrorSession } from "../../../adb/screenMirror.js";
import { useMirrorStore } from "../MirrorStore.js";

type MirrorStatus = "idle" | "starting" | "active" | "error";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
}

export function MirrorPanel({ adb }: { adb: Adb }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<MirrorSession | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<MirrorStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [deviceSize, setDeviceSize] = useState<{ w: number; h: number } | null>(null);
  const [sourceType, setSourceType] = useState<"screen" | "camera" | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");

  const { isExpanded } = useMirrorStore();
  const isActive = status === "active";
  const isBusy = status === "starting";
  const isCamera = sourceType === "camera";

  const cameraDeviceSize = isCamera ? deviceSize ?? { w: 640, h: 480 } : deviceSize;
  const displaySize = isCamera && cameraDeviceSize
    ? { w: cameraDeviceSize.h, h: cameraDeviceSize.w }
    : cameraDeviceSize;
  const cameraStyle = isCamera && cameraDeviceSize
    ? {
        transform: cameraFacing === "front" ? "scaleX(-1) rotate(-90deg)" : "rotate(90deg)",
        width: "230%",
        height: `${(cameraDeviceSize.h / cameraDeviceSize.w) * 100}%`,
      }
    : {};

  const startSession = useCallback(async (type: "screen" | "camera") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSourceType(type);
    setStatus("starting");
    setError(null);

    try {
      const opts = type === "camera"
        ? {
            videoSource: "camera" as const,
            cameraFacing: cameraFacing as "front" | "back",
            cameraSize: "640x480",
            control: false,
          }
        : undefined;
      const session = await startScreenMirror(adb, canvas, opts);
      sessionRef.current = session;

      session.onSizeChange((w, h) => {
        if (w > 0 && h > 0) setDeviceSize({ w, h });
      });

      setStatus("active");
    } catch (err) {
      console.error(`[Mirror] ${type} start failed:`, err);
      setError(err instanceof Error ? err.message : `Failed to start ${type}`);
      setStatus("error");
      setSourceType(null);
    }
  }, [adb, cameraFacing]);

  const stopSession = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    sessionRef.current?.stop().catch(() => {});
    sessionRef.current = null;
    setStatus("idle");
    setDeviceSize(null);
    setIsRecording(false);
    setSourceType(null);
  }, []);

  // Auto-stop when panel is collapsed
  useEffect(() => {
    if (isExpanded || !sessionRef.current) return;
    stopSession();
  }, [isExpanded, stopSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      sessionRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleStart = useCallback(async () => {
    if (isActive) {
      stopSession();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus("starting");
    setError(null);

    try {
      const session = await startScreenMirror(adb, canvas);
      sessionRef.current = session;

      session.onSizeChange((w, h) => {
        if (w > 0 && h > 0) setDeviceSize({ w, h });
      });

      setSourceType("screen");
      setStatus("active");
    } catch (err) {
      console.error("[Mirror] Start failed:", err);
      setError(err instanceof Error ? err.message : "Failed to start mirroring");
      setStatus("error");
    }
  }, [adb, isActive, stopSession]);

  const handleCam = useCallback(async () => {
    if (isActive && isCamera) {
      stopSession();
      return;
    }
    // Stop screen mirror if active, then start camera
    if (sessionRef.current) {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      await sessionRef.current.stop().catch(() => {});
      sessionRef.current = null;
      setIsRecording(false);
    }
    await startSession("camera");
  }, [isActive, isCamera, stopSession, startSession]);

  const handleSwitchCamera = useCallback(async () => {
    const next = cameraFacing === "front" ? "back" : "front";
    setCameraFacing(next);

    if (!isCamera || !sessionRef.current) return;

    // Restart with new facing
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    await sessionRef.current.stop().catch(() => {});
    sessionRef.current = null;
    setIsRecording(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus("starting");
    setError(null);

    try {
      const session = await startScreenMirror(adb, canvas, {
        videoSource: "camera",
        cameraFacing: next as "front" | "back",
        cameraSize: "640x480",
        control: false,
      });
      sessionRef.current = session;

      session.onSizeChange((w, h) => {
        if (w > 0 && h > 0) setDeviceSize({ w, h });
      });

      setStatus("active");
    } catch (err) {
      console.error("[Mirror] Camera switch failed:", err);
      setError(err instanceof Error ? err.message : "Failed to switch camera");
      setStatus("error");
      setSourceType(null);
    }
  }, [adb, cameraFacing, isCamera]);

  const handleScreenshot = useCallback(async () => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (blob) downloadBlob(blob, `yaadu_screenshot_${timestamp()}.png`);
    } catch (err) {
      console.error("[Mirror] Screenshot failed:", err);
    }
  }, [isActive]);

  const handleRecord = useCallback(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isRecording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }

    // Start recording
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      downloadBlob(blob, `yaadu_recording_${timestamp()}.webm`);
      chunksRef.current = [];
      setIsRecording(false);
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setIsRecording(true);
  }, [isActive, isRecording]);

  return (
    <section className="mirror-panel">
      <div className="mirror-panel-inner">
        {/* Control row */}
        <div className="mirror-controls">
          <button
            className={`mirror-btn mirror-btn-start${isActive ? " active" : ""}${isBusy ? " busy" : ""}`}
            onClick={handleStart}
            disabled={isBusy}
            title={isActive ? (isCamera ? "Stop camera" : "Stop mirroring") : "Start mirroring"}
          >
            {isActive ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21"/>
              </svg>
            )}
            <span>{isActive ? "STOP" : isBusy ? "STARTING…" : "START"}</span>
          </button>

          <button
            className="mirror-btn mirror-btn-icon"
            onClick={handleScreenshot}
            disabled={!isActive}
            title="Screenshot"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>SNAP</span>
          </button>

          <button
            className={`mirror-btn mirror-btn-icon mirror-btn-record${isRecording ? " recording" : ""}`}
            onClick={handleRecord}
            disabled={!isActive}
            title={isRecording ? "Stop recording" : "Record screen"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              {isRecording ? (
                <rect x="8" y="8" width="8" height="8" rx="1" fill="var(--md-sys-color-error)" stroke="none"/>
              ) : (
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
              )}
            </svg>
            <span>{isRecording ? "STOP" : "RECORD"}</span>
          </button>

          <button
            className={`mirror-btn mirror-btn-icon${isCamera ? " camera" : ""}`}
            onClick={handleCam}
            disabled={isBusy}
            title={isCamera ? "Stop camera" : "Stream camera"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
            <span>CAM</span>
          </button>

          <button
            className="mirror-btn mirror-btn-icon"
            onClick={handleSwitchCamera}
            disabled={isBusy}
            title={`Switch to ${cameraFacing === "front" ? "back" : "front"} camera`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s1.5-5 5-7c3.5-2 7-1.5 9 1"/>
              <path d="M12 3v3h3"/>
              <path d="M23 12s-1.5 5-5 7c-3.5 2-7 1.5-9-1"/>
              <path d="M12 21v-3h-3"/>
            </svg>
          </button>
        </div>

        {/* Viewport */}
        <div className="mirror-viewport">
          <div
            className="mirror-viewport-inner"
            style={displaySize ? { aspectRatio: `${displaySize.w} / ${displaySize.h}` } : undefined}
          >
            <canvas
              ref={canvasRef}
              className="mirror-canvas"
          style={{
            display: status === "idle" || status === "error" ? "none" : "block",
            ...cameraStyle,
          }}
            />
            {status === "idle" && (
              <div className="mirror-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                <span>Press START to mirror</span>
              </div>
            )}
            {status === "starting" && (
              <div className="mirror-placeholder">
                <div className="mirror-spinner"/>
                <span>Connecting…</span>
              </div>
            )}
            {status === "error" && (
              <div className="mirror-placeholder mirror-error">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>{error ?? "Unknown error"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
