/**
 * Lightweight toast notification system.
 * Creates a fixed container and appends toast elements programmatically.
 */

type ToastKind = "success" | "error" | "info";

interface ToastOptions {
  duration?: number; // ms, default 3500
}

let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function iconFor(kind: ToastKind): string {
  if (kind === "success") return svgCheck();
  if (kind === "error")   return svgX();
  return svgInfo();
}

export function toast(
  message: string,
  kind: ToastKind = "info",
  opts: ToastOptions = {}
): void {
  const c = getContainer();
  const duration = opts.duration ?? 3500;

  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `${iconFor(kind)}<span>${escapeHtml(message)}</span>`;

  c.appendChild(el);

  const remove = () => {
    el.classList.add("exit");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  };

  setTimeout(remove, duration);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function svgCheck(): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}
function svgX(): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
}
function svgInfo(): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
}
