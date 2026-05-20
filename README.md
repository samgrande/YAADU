# YAADU — Yet Another Android Debug Utility

A fully client-side Android dashboard that communicates with a physical device over USB via the **WebUSB API** and **@yume-chan/adb (Tango) 0.0.19**.

No backend. No companion app. No native binaries. Just a browser tab.

---

## Prerequisites

| Requirement | Details |
|---|---|
| Browser | Chrome 89+ or Edge 89+ on Desktop (macOS / Windows / Linux) |
| USB Debugging | Enabled in **Developer Options** on the Android device |
| Secure Context | Page served from `localhost` or HTTPS (WebUSB requirement) |
| ADB port conflict | Stop any local `adb server` on the host first: `adb kill-server` |

---

## Quick Start

```bash
# 1 — Install dependencies (Node 18+)
npm install

# 2 — Start dev server (auto opens on http://localhost:5173)
npm run dev

# 3 — Build production bundle
npm run build
npm run preview        # preview at localhost:4173
```

---

## Architecture

```
yaadu/
├── index.html                   Entry point (Google Fonts, style.css link)
├── vite.config.ts               Vite build config (ESM, excludes yume-chan from pre-bundling)
├── tsconfig.json
└── src/
    ├── main.ts                  App bootstrapper — connect↔dashboard state machine
    ├── state.ts                 Reactive AppState singleton (EventBus)
    ├── style.css                Full design system (CSS custom properties, dark industrial)
    │
    ├── adb/                     ── ADB Protocol Layer ──────────────────────
    │   ├── credential.ts        AdbCredentialStore — RSA-2048 via Web Crypto, localStorage
    │   ├── connection.ts        Module 1: WebUSB lifecycle, Adb.authenticate()
    │   ├── helpers.ts           shell() / shellFull() / getProp() / formatBytes()
    │   ├── telemetry.ts         Module 2: getprop, wm size, dumpsys battery parsers
    │   ├── apps.ts              Module 3: pm/am commands + APK push via sync.write()
    │   ├── backup.ts            Module 4: AdbSync readdir/read → Blob → anchor download
    │   └── tweaks.ts            Module 5: settings put global/secure, wm density
    │
    └── ui/                      ── Presentation Layer ──────────────────────
        ├── toast.ts             Global toast notification system
        ├── dashboard.ts         Sidebar nav + panel router + device card
        └── panels/
            ├── connect.ts       Connect screen with 3-state UI
            ├── telemetry.ts     Device Identity + Battery panel
            ├── apps.ts          App grid + APK sideloader
            ├── backup.ts        Media backup engine with progress log
            └── tweaks.ts        Animation scale / Night mode / DPI controls
```

---

## Module Details

### Module 1 — WebUSB Connection Lifecycle

- `AdbWebUsbBackendManager.BROWSER.requestDevice()` — triggers the browser's native USB picker (requires user gesture)
- `Adb.authenticate(connection, credentialStore)` — RSA challenge/response handshake via `@yume-chan/adb`'s built-in authenticator
- `YaaduCredentialStore` — stores the PKCS#8 RSA-2048 private key in `localStorage`; generates a new one automatically on first run
- Manages state transitions: `disconnected → connecting → authorizing → connected`
- Watches `adb.disconnected` promise for unexpected cable pulls

### Module 2 — Device Telemetry

- Queries `ro.product.brand`, `ro.product.model` via `adb.getProp()`
- Parses `wm size` output for physical screen resolution
- Parses `dumpsys battery` with regex for `level`, `temperature` (÷10 → °C), `status`, and `plugged` type
- Auto-refreshes on panel load; manual refresh button available

### Module 3 — App Management

- Lists user-installed packages via `pm list packages -3`
- Merges disabled state from `pm list packages -d`
- Per-app controls: Force Stop (`am force-stop`), Clear Data (`pm clear`), Uninstall (`pm uninstall`), Disable/Enable (`pm disable-user --user 0` / `pm enable`)
- APK Installer: drag-and-drop or file picker → chunks file into a `ReadableStream<Consumable<Uint8Array>>` → pushes via `sync.write()` to `/data/local/tmp/` → `pm install -r` → cleanup

### Module 4 — Media Backup Engine

- Opens `adb.sync()` per-file to avoid stream interleaving
- `sync.readdir()` scans `/sdcard/DCIM/Camera`, filters by `LinuxFileType.File === 8`
- `sync.read()` returns a `ReadableStream<Uint8Array>`; collected into a `Uint8Array`, wrapped in a `Blob`, saved via `URL.createObjectURL` + `<a download>`
- Supports AbortController cancellation mid-backup

### Module 5 — System Tweaks

- **Animation Scale**: sets `window_animation_scale`, `transition_animation_scale`, and `animator_duration_scale` simultaneously via `settings put global`
- **Night Mode**: `settings put secure ui_night_mode 2/1` + `cmd uimode night yes/no`
- **DPI**: `wm density <value>` with preset dropdown (320–560) + custom input + `wm density reset`

---

## Known Limitations

| Limitation | Reason |
|---|---|
| Chrome/Edge desktop only | WebUSB is not available in Firefox, Safari, or on Android Chrome |
| No serial number display | `Adb` instance in 0.0.19 doesn't expose the USB serial; `adb.model` is used instead |
| APK split APKs | Only supports monolithic `.apk` files (not `.apks` bundles) |
| Large backup files | Individual files are fully buffered in RAM before download; >500 MB files may strain low-memory devices |
| System apps | `pm list packages -3` only shows user-installed apps; system apps require `pm list packages -s` (not shown by default) |

---

## Pairing Troubleshooting

1. **"No devices found" in picker** — Ensure USB debugging is enabled and cable is data-capable (not charge-only)
2. **"Allow USB Debugging?" never appears** — Kill any ADB server: `adb kill-server`, then retry
3. **Repeated authorization prompts** — Clear stored key: open DevTools console → `localStorage.removeItem("yaadu:adb-private-key")`, then reconnect
4. **Permission denied errors** — YAADU runs as the `shell` user; some `pm` operations (e.g. uninstalling system apps) require `root`

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `@yume-chan/adb` | 0.0.19 | ADB daemon protocol (subprocess, sync, props) |
| `@yume-chan/adb-backend-webusb` | 0.0.19 | WebUSB transport for the ADB protocol |
| `@yume-chan/stream-extra` | 0.0.19 | `Consumable<T>` wrapper + stream utilities |
| `vite` | 5.4.0 | Build tool |
| `typescript` | 5.4.5 | Type safety |

All three `@yume-chan` packages are pinned to `0.0.19` to ensure they share a single copy of `stream-extra` and avoid `Consumable` type version conflicts.
