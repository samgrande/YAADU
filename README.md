<p align="center">
  <img src="src/assets/hero.png" alt="YAADU" width="600" />
</p>

<p align="center">
  <strong>Website</strong>: <a href="https://samgrande.github.io/YAADU/">https://samgrande.github.io/YAADU/</a>
</p>

# YAADU — Yet Another Android Debug Utility

A fully client-side Android dashboard that communicates with a physical device over USB via the **WebUSB API**. No backend. No companion app. No native binaries. Just a browser tab.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Browser | Chrome 89+ or Edge 89+ on Desktop (macOS / Windows / Linux) |
| USB Debugging | Enabled in **Developer Options** on the Android device |
| Secure Context | Page served from `localhost` or HTTPS (WebUSB requirement) |
| ADB port conflict | Stop any local `adb server` on the host first: `adb kill-server` |

---

---

## Pairing Troubleshooting

1. **"No devices found" in picker** — Ensure USB debugging is enabled and cable is data-capable (not charge-only)
2. **"Allow USB Debugging?" never appears** — Kill any ADB server: `adb kill-server`, then retry
3. **Repeated authorization prompts** — Clear stored key: open DevTools console → `localStorage.removeItem("yaadu:adb-private-key")`, then reconnect
4. **Permission denied errors** — YAADU runs as the `shell` user; some operations (e.g. uninstalling system apps) require `root`

---

> **For technical details — architecture, modules, UI system, and tech stack — see [`project-info.md`](./project-info.md)**
