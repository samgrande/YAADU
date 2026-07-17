import { useState, useRef, useEffect } from "react";
import type { Adb } from "@yume-chan/adb";
import { shell } from "../../../adb/helpers.js";
import { toast } from "../../../ui/Toast.js";

const POWER_OPTIONS = [
  {
    id: "shutdown",
    label: "Shutdown",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v10" />
        <path d="M8 5.5a8 8 0 1 0 8 0" />
      </svg>
    ),
    command: "reboot -p",
  },
  {
    id: "reboot",
    label: "Reboot",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
    command: "reboot",
  },
  {
    id: "recovery",
    label: "Recovery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
    command: "reboot recovery",
  },
  {
    id: "bootloader",
    label: "Bootloader",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="9" y1="22" x2="15" y2="22" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h4" />
      </svg>
    ),
    command: "reboot bootloader",
  },
];

interface Props {
  adb: Adb;
}

export function DevicePowerMenu({ adb }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAction = async (id: string, label: string, command: string) => {
    setOpen(false);
    toast(`Executing: ${label}...`, "info");
    try {
      await shell(adb, command);
    } catch (err) {
      toast(`Failed to ${label}: ${err}`, "error");
    }
  };

  return (
    <div className="device-power-menu-wrap" ref={ref}>
      <button
        type="button"
        className="device-shell-power"
        style={{ marginLeft: "1rem" }}
        aria-label="Power"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="device-shell-toggle-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v10" />
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          </svg>
        </span>
        <span>Power</span>
      </button>
      {open && (
        <div className="device-power-popup" onClick={() => setOpen(false)}>
          <div className="device-power-popup-title">Device Actions</div>
          <div className="device-power-popup-options" onClick={(e) => e.stopPropagation()}>
            {POWER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="device-power-option"
                onClick={() => handleAction(opt.id, opt.label, opt.command)}
              >
                <span className="device-power-option-icon">{opt.icon}</span>
                <span className="device-power-option-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
