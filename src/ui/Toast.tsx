/**
 * Toast notification system — React version.
 * Exposes a toast() function and a <ToastContainer /> component.
 */

import { useState, useCallback, useEffect, useRef } from "react";

type ToastKind = "success" | "error" | "info" | "accent";

interface ToastItem {
  id:       number;
  message:  string;
  kind:     ToastKind;
  exiting:  boolean;
}

interface ToastOptions {
  duration?: number;
}

// ── Singleton emitter ──────────────────────────────────────────────────────

type ToastListener = (msg: string, kind: ToastKind, opts: ToastOptions) => void;
let _listener: ToastListener | null = null;
let _idCounter = 0;

export function toast(message: string, kind: ToastKind = "info", opts: ToastOptions = {}): void {
  if (_listener) _listener(message, kind, opts);
}

// ── Icons ──────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="color-mix(in srgb, var(--md-sys-color-primary-container) 70%, var(--md-sys-color-primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function AccentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function iconFor(kind: ToastKind) {
  if (kind === "success") return <CheckIcon />;
  if (kind === "error")   return <XIcon />;
  if (kind === "accent")  return <AccentIcon />;
  return <InfoIcon />;
}

// ── ToastContainer component ───────────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const mountedRef = useRef(true);

  const removeToast = useCallback((id: number) => {
    if (!mountedRef.current) return;
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    const fadeTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 400);
    timersRef.current.set(id + 0.5, fadeTimer);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    _listener = (message, kind, opts) => {
      const id = ++_idCounter;
      const duration = opts.duration ?? 3500;
      setToasts((prev) => [...prev, { id, message, kind, exiting: false }]);
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    };
    return () => {
      mountedRef.current = false;
      _listener = null;
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [removeToast]);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}${t.exiting ? " exit" : ""}`}>
          {iconFor(t.kind)}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
