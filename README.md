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
    ├── main.ts                  App bootstrapper — theme generator, MWC imports, ripple handler
    ├── state.ts                 Reactive AppState singleton (EventBus)
    ├── style.css                Full design system — M3 token mapping, MWC theming, layout
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
            ├── telemetry.ts     Device Identity + Extra Info + Memory ring
            ├── apps.ts          App grid + APK sideloader overlay
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

- Queries `ro.product.brand`, `ro.product.model`, `ro.product.cpu.abi`, `ro.build.display.id`, `ro.build.version.sdk`, `ro.build.version.security_patch` via `adb.getProp()`
- Parses `wm size` output for physical screen resolution
- Parses `dumpsys battery` with regex for `level`, `temperature` (÷10 → °C), `status`, and `plugged` type
- Displays memory info with an SVG progress ring (see Design System below)
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

## UI Design System

The entire UI is built on **Material 3 (Material You)** using two libraries:

### Theme Generation (`@material/material-color-utilities 0.4.0`)

In `main.ts`, a programmatic green theme is generated from a single source color:

```ts
import { argbFromHex, themeFromSourceColor, applyTheme } from '@material/material-color-utilities';

const theme = themeFromSourceColor(argbFromHex('#376A3E'));
applyTheme(theme, { dark: false });  // light-only theme
```

`applyTheme()` sets `--md-sys-color-*` CSS custom properties as inline styles on `document.documentElement`, replacing what were previously hardcoded hex values in `style.css :root`. The source color `#376A3E` produces a green-toned light scheme with:
- `--md-sys-color-primary`: ≈ `#376A3E`
- `--md-sys-color-primary-container`: `#B7F1B9` (tonal green)
- `--md-sys-color-on-primary-container`: `#095F4C` (dark green text)

The theme is always **light-only** — `dark: false` is passed to `applyTheme()` and no dark mode is supported.

### Material Web Components (`@material/web 2.4.1`)

MWC replaces nearly all native HTML controls:

| Element | Usage |
|---|---|
| `<md-filled-button>` | Primary connect button (landing page) |
| `<md-filled-tonal-button>` | Sidebar nav items, landing HELP/ABOUT/GITHUB, disconnect |
| `<md-text-button>` | App action buttons (Stop, Clear, Uninstall, etc.) |
| `<md-icon-button>` | Refresh buttons, APK sideloader trigger |
| `<md-outlined-select>` + `<md-select-option>` | DPI preset dropdown |
| `<md-dialog>` | (Available but replaced by custom overlay for APK) |
| `<md-icon-button>` | (Imported for future use) |

MWC components are imported in `main.ts`:
```ts
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
```

### CSS Variable Strategy

Legacy CSS variables from the original design are mapped to M3 tokens so all existing styles reference the dynamic theme:

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
- MWC buttons render visible text via `<slot>`, not the `label` property
- `.label` on an MWC button only sets `aria-label`
- Dynamic text must use `.textContent` (plain text) or `.innerHTML` (with icon slot)

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

The overlay appears when `.visible` class is added, and a trigger button (`#btn-apk-sideloader`) sits next to the refresh button in the apps card header.

### Memory Progress Ring

The telemetry panel shows memory usage with an SVG progress ring. The filled portion uses a **sine-wave path** (outward-only, frequency 20, amplitude 3) for a jagged organic look, while the unfilled portion is a smooth circle. A symmetric **GAP=2** offset separates both arcs:

- Filled sine-wave path: starts at `GAP` (3 o'clock), ends at `splitIdx - GAP`
- Unfilled smooth circle: starts at `splitIdx + GAP`, ends at `N - GAP`

This creates visible gaps at both the start and the progress boundary.

### Panel Sizing

The telemetry panel uses `fitPanelContent()` in `dashboard.ts` to scale content to fit within `main-content`, guarded by a `ResizeObserver`. The panel wrapper has `overflow: hidden` so the telemetry page never scrolls — content is scaled down instead.

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
| `@material/web` | 2.4.1 | Material 3 web components (buttons, selects, dialogs) |
| `@material/material-color-utilities` | 0.4.0 | Programmatic M3 theme generation from source color |
| `vite` | 5.4.0 | Build tool |
| `typescript` | 5.4.5 | Type safety |

All three `@yume-chan` packages are pinned to `0.0.19` to ensure they share a single copy of `stream-extra` and avoid `Consumable` type version conflicts.
