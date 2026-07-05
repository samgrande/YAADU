# YAADU — Yet Another Android Debug Utility

A fully client-side Android dashboard that communicates with a physical device over USB via the **WebUSB API** and **@yume-chan/adb (Tango) 0.0.19**.

Built with **React 19** and **Material 3** web components. No backend. No companion app. No native binaries. Just a browser tab.

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

# 2 — Start dev server (http://localhost:5173)
npm run dev

# 3 — Build production bundle
npm run build
npm run preview        # preview at localhost:4173
```

---

## Architecture

```
yaadu/
├── index.html                   Entry HTML — fonts, #app mount point
├── vite.config.ts               Vite + React plugin; excludes yume-chan from pre-bundling
├── tsconfig.json
└── src/
    ├── main.tsx                 React bootstrap (createRoot)
    ├── App.tsx                  Theme generation, MWC imports, WebUSB gate, routing
    ├── state.ts                 AppState types + useReducer reducer
    ├── context.tsx              React context (state + dispatch)
    ├── global.d.ts              JSX types for Material Web Components
    ├── style.css                Full design system — M3 token mapping, layout, clamp() sizing
    │
    ├── adb/                     ── ADB Protocol Layer ──────────────────────
    │   ├── credential.ts        YaaduCredentialStore — RSA-2048 via Web Crypto, localStorage
    │   ├── connection.ts        WebUSB lifecycle, Adb.authenticate(), disconnect handling
    │   ├── helpers.ts           shell() / shellFull() / getProp() / formatBytes()
    │   ├── telemetry.ts         Device info, battery, system, connectivity, sensors
    │   ├── device-names.ts      Marketing name resolution from model/build props
    │   ├── apps.ts              pm/am commands + APK push via sync.write()
    │   ├── app-names.ts         Live app label lookup via pm dump
    │   ├── backup.ts            AdbSync readdir/read → JSZip archive → browser download
    │   └── tweaks.ts            settings put global/secure, wm density
    │
    ├── data/
    │   └── common-apps.json     Package name → display name map (160+ apps)
    │
    ├── assets/                  SVG illustrations (tweaks panel)
    │
    └── ui/                      ── Presentation Layer (React) ─────────────
        ├── Dashboard.tsx        Sidebar nav + panel router + device card
        ├── Toast.tsx            Global toast notification system
        ├── ScrollPill.tsx       Scroll-position indicator for long panels
        └── panels/
            ├── ConnectScreen.tsx   Connect / help / about landing screen
            ├── TelemetryPanel.tsx  Device identity, battery, system, connectivity, sensors
            ├── AppsPanel.tsx       App grid + APK sideloader overlay
            ├── BackupPanel.tsx     Media backup engine with progress log
            └── TweaksPanel.tsx     Animation scale / Night mode / DPI controls
```

### State management

Global state lives in a React `useReducer` hook (`App.tsx`) and is exposed via `AppContext`:

- `connection` — `disconnected | connecting | authorizing | connected | error`
- `adb` — live `@yume-chan/adb` instance after authentication
- `device` — cached `DeviceInfo` (pre-fetched on connect)
- `panel` — active sidebar panel (`telemetry | apps | backup | tweaks`)

ADB modules receive `dispatch` from the connection layer; panels read state through `useAppContext()`.

---

## Module Details

### Module 1 — WebUSB Connection Lifecycle

- `AdbWebUsbBackendManager.BROWSER.requestDevice()` — triggers the browser's native USB picker (requires user gesture)
- `Adb.authenticate(connection, credentialStore)` — RSA challenge/response handshake via `@yume-chan/adb`'s built-in authenticator
- `YaaduCredentialStore` — stores the PKCS#8 RSA-2048 private key in `localStorage`; generates a new one automatically on first run
- Manages state transitions: `disconnected → connecting → authorizing → connected → error`
- Pre-fetches device info asynchronously after connect
- Watches `adb.disconnected` promise for unexpected cable pulls

### Module 2 — Device Telemetry

Core identity via `getProp()` and `resolveDeviceDetails()`:

- Brand, model, marketing name, OS version, screen resolution
- Battery level, temperature, charging state, health, voltage, technology

Extended telemetry fetched in parallel:

- **System details** — SDK version, build ID/date, security patch, fingerprint, CPU ABI, RAM, DPI
- **Connectivity** — WiFi SSID, IP, RSSI, link speed, frequency, DNS, gateway (parsed from `dumpsys wifi`, `ip`, `iw`)
- **Sensors** — touchscreen and active sensor list

The telemetry panel displays Android version logos (9–16), a memory usage SVG ring with a sine-wave progress arc, and a unified reload button. Data auto-refreshes on panel load.

### Module 3 — App Management

- Lists user-installed packages via `pm list packages -3`
- Merges disabled state from `pm list packages -d`
- Resolves display names from `common-apps.json`, falling back to live `pm dump` / `fetchAppLabel()`
- Per-app controls: Force Stop (`am force-stop`), Clear Data (`pm clear`), Uninstall (`pm uninstall`), Disable/Enable (`pm disable-user --user 0` / `pm enable`)
- APK Installer: drag-and-drop or file picker → chunks file into a `ReadableStream<Consumable<Uint8Array>>` → pushes via `sync.write()` to `/data/local/tmp/` → `pm install -r` → cleanup

### Module 4 — Media Backup Engine

- Opens `adb.sync()` per-file to avoid stream interleaving
- `sync.readdir()` scans `/sdcard/DCIM/Camera`, filters by `LinuxFileType.File`
- **Single file**: `sync.read()` → buffer → Blob → anchor download
- **Bulk backup**: downloads all selected files, assembles a `.zip` via **JSZip**, saves as `<device>_media_backup.zip`
- Supports `AbortController` cancellation mid-backup

### Module 5 — System Tweaks

- **Animation Scale**: sets `window_animation_scale`, `transition_animation_scale`, and `animator_duration_scale` simultaneously via `settings put global`
- **Night Mode**: `settings put secure ui_night_mode 2/1` + `cmd uimode night yes/no`
- **DPI**: `wm density <value>` with preset dropdown (320–560) + custom input + `wm density reset`

---

## UI Design System

The UI is built on **Material 3 (Material You)** with **React** rendering and **Material Web Components** for interactive controls.

### Theme Generation (`@material/material-color-utilities 0.4.0`)

In `App.tsx`, a programmatic green theme is generated from a single source color:

```tsx
import { argbFromHex, themeFromSourceColor, applyTheme } from '@material/material-color-utilities';

const theme = themeFromSourceColor(argbFromHex('#376A3E'));
applyTheme(theme, { target: document.documentElement, dark: false });
```

`applyTheme()` sets `--md-sys-color-*` CSS custom properties on `document.documentElement`. The source color `#376A3E` produces a green-toned light scheme with:

- `--md-sys-color-primary`: ≈ `#376A3E`
- `--md-sys-color-primary-container`: `#B7F1B9` (tonal green)
- `--md-sys-color-on-primary-container`: `#095F4C` (dark green text)

The theme is always **light-only** — `dark: false` is passed to `applyTheme()` and no dark mode is supported.

### Material Web Components (`@material/web 2.4.1`)

MWC web components are registered globally in `App.tsx` and used as JSX custom elements (typed in `global.d.ts`):

| Element | Usage |
|---|---|
| `<md-filled-button>` | Primary connect button (landing page) |
| `<md-filled-tonal-button>` | Sidebar nav items, help/about/github, disconnect |
| `<md-outlined-button>` | Secondary actions |
| `<md-text-button>` | App action buttons (Stop, Clear, Uninstall, etc.) |
| `<md-icon-button>` | Refresh buttons, APK sideloader trigger |
| `<md-outlined-select>` + `<md-select-option>` | DPI preset dropdown |
| `<md-switch>` | Toggle controls in tweaks panel |
| `<md-linear-progress>` / `<md-circular-progress>` | APK install and backup progress |
| `<md-outlined-text-field>` | Custom DPI input |
| `<md-list>` / `<md-list-item>` | Structured lists |
| `<md-dialog>` | Available; APK sideloader uses a custom overlay instead |

MWC typography styles are adopted via `document.adoptedStyleSheets`.

### CSS Variable Strategy

Legacy CSS variables are mapped to M3 tokens so all styles reference the dynamic theme:

```css
:root {
  --bg:             var(--md-sys-color-surface);
  --surface:        var(--md-sys-color-surface-container-low);
  --surface-mid:    var(--md-sys-color-surface-container);
  --text:           var(--md-sys-color-on-surface);
  --text-dim:       var(--md-sys-color-on-surface-variant);
  --green:          var(--md-sys-color-primary);
  --green-tonal:    var(--md-sys-color-primary-container);
  --green-text:     var(--md-sys-color-on-primary-container);
  --border:         var(--md-sys-color-outline-variant);
  /* ... */
}
```

For dim/glow color variants (e.g. status indicators), `color-mix()` is used instead of hardcoded rgba:

```css
--cyan-dim:  color-mix(in srgb, var(--md-sys-color-tertiary) 10%, transparent);
--green-dim: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
```

Layout, typography, and component sizing use **fluid `clamp()` values** in `style.css` so the dashboard scales across viewport sizes without fixed breakpoints.

### Button Theming

Buttons are themed via MWC's custom CSS properties rather than fighting shadow DOM styles:

```css
/* Nav sidebar — zero elevation, tonal surface */
.nav-item-m3 {
  --md-filled-tonal-button-container-color: var(--md-sys-color-surface-container);
  --md-filled-tonal-button-label-text-color: var(--md-sys-color-on-surface-variant);
  --md-filled-tonal-button-hover-label-text-color: var(--md-sys-color-on-surface);
  --md-filled-tonal-button-container-elevation: 0;
  --md-filled-tonal-button-hover-container-elevation: 0;
  --md-filled-tonal-button-focus-container-elevation: 0;
  --md-filled-tonal-button-pressed-container-elevation: 0;
}
.nav-item-m3.active {
  --md-filled-tonal-button-container-color: var(--md-sys-color-primary-container);
  --md-filled-tonal-button-label-text-color: var(--md-sys-color-on-primary-container);
}
```

**Important MWC Button Behavior:**
- MWC buttons render visible text via their `<slot>`, not the `label` property
- In React, pass button text as **children**: `<md-filled-button>Connect</md-filled-button>`
- The `label` attribute only sets `aria-label`

### Global Ripple

`App.tsx` attaches a document-level `mousedown` listener that injects a Material-style ripple span into clicked buttons and interactive elements.

### APK Sideloader — Custom Overlay Dialog

Instead of using MWC's `<md-dialog>` (which has unreliable centering), the APK sideloader uses a custom fixed-position overlay:

```css
#apk-sideloader-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.apk-dialog {
  width: 520px; max-width: 90vw;
  border-radius: 28px;
  background: var(--md-sys-color-surface-container-high);
  transform: scale(0.9); transition: transform 0.2s;
}
```

The overlay appears when `.visible` class is added, and a trigger button sits next to the refresh button in the apps card header.

### Memory Progress Ring

The telemetry panel shows memory usage with an SVG progress ring. The filled portion uses a **sine-wave path** (outward-only, frequency 20, amplitude 3) for a jagged organic look, while the unfilled portion is a smooth circle. A symmetric **GAP=2** offset separates both arcs:

- Filled sine-wave path: starts at `GAP` (3 o'clock), ends at `splitIdx - GAP`
- Unfilled smooth circle: starts at `splitIdx + GAP`, ends at `N - GAP`

This creates visible gaps at both the start and the progress boundary.

### Panel Transitions

`Dashboard.tsx` crossfades between panels with a 200 ms exit/enter transition. Long scrollable panels use `ScrollPill` (a `ResizeObserver`-driven scroll indicator) to hint at off-screen content.

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
| `react` / `react-dom` | 19.x | UI framework |
| `@vitejs/plugin-react` | 4.x | Vite React transform (Fast Refresh) |
| `@yume-chan/adb` | 0.0.19 | ADB daemon protocol (subprocess, sync, props) |
| `@yume-chan/adb-backend-webusb` | 0.0.19 | WebUSB transport for the ADB protocol |
| `@yume-chan/stream-extra` | 0.0.19 | `Consumable<T>` wrapper + stream utilities |
| `@material/web` | 2.4.1 | Material 3 web components (buttons, selects, switches, progress) |
| `@material/material-color-utilities` | 0.4.0 | Programmatic M3 theme generation from source color |
| `jszip` | 3.x | Bulk media backup archive creation |
| `vite` | 5.4.0 | Build tool |
| `typescript` | 5.4.5 | Type safety |

All three `@yume-chan` packages are pinned to `0.0.19` to ensure they share a single copy of `stream-extra` and avoid `Consumable` type version conflicts.
