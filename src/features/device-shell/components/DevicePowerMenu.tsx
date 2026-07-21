import { useState, useRef, useEffect } from "react";
import type { Adb } from "@yume-chan/adb";
import { shell } from "../../../adb/helpers.js";
import { toast } from "../../../ui/Toast.js";

const POWER_OPTIONS = [
  {
    id: "shutdown",
    label: "Shutdown",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v10" />
        <path d="M4.93 10.93a9 9 0 1 0 14.14 0" />
      </svg>
    ),
    command: "reboot -p",
  },
  {
    id: "reboot",
    label: "Reboot",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6" />
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      </svg>
    ),
    command: "reboot",
  },
  {
    id: "recovery",
    label: "Recovery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    ),
    command: "reboot recovery",
  },
  {
    id: "bootloader",
    label: "Bootloader",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
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
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
