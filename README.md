# YAADU — Yet Another Android Debug Utility

A fully client-side Android dashboard that communicates with a physical device over USB via the **WebUSB API** and **@yume-chan/adb (Tango) 0.0.19**.

Built with **React 19** and **Material 3** web components. No backend. No companion app. No native binaries. Just a browser tab.

<p align="center">
  <a href="https://samgrande.github.io/YAADU/">🌐 samgrande.github.io/YAADU</a>
</p>

<p align="center">
  <svg width="400" viewBox="0 0 1074 420" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M86 171.532C88.0375 147.308 95.4517 125.009 108.243 104.634C121.034 84.2591 138.069 68.0723 159.35 56.0737L134.221 12.607C132.863 10.5695 132.523 8.41884 133.202 6.15495C133.881 3.89106 135.353 2.19314 137.617 1.0612C139.428 -0.0707465 141.465 -0.297135 143.729 0.382031C145.993 1.0612 147.804 2.41953 149.163 4.45703L174.292 47.9237C193.761 39.7737 214.136 35.6987 235.417 35.6987C256.697 35.6987 277.072 39.7737 296.542 47.9237L321.671 4.45703C323.029 2.41953 324.84 1.0612 327.104 0.382031C329.368 -0.297135 331.406 -0.0707465 333.217 1.0612C335.481 2.19314 336.952 3.89106 337.631 6.15495C338.31 8.41884 337.971 10.5695 336.613 12.607L311.483 56.0737C332.764 68.0723 349.8 84.2591 362.591 104.634C375.382 125.009 382.796 147.308 384.833 171.532H86ZM179.555 129.254C182.838 125.971 184.479 121.953 184.479 117.199C184.479 112.445 182.838 108.426 179.555 105.143C176.273 101.861 172.254 100.22 167.5 100.22C162.746 100.22 158.727 101.861 155.445 105.143C152.162 108.426 150.521 112.445 150.521 117.199C150.521 121.953 152.162 125.971 155.445 129.254C158.727 132.537 162.746 134.178 167.5 134.178C172.254 134.178 176.273 132.537 179.555 129.254ZM315.389 129.254C318.671 125.971 320.313 121.953 320.313 117.199C320.313 112.445 318.671 108.426 315.389 105.143C312.106 101.861 308.088 100.22 303.333 100.22C298.579 100.22 294.561 101.861 291.278 105.143C287.995 108.426 286.354 112.445 286.354 117.199C286.354 121.953 287.995 125.971 291.278 129.254C294.561 132.537 298.579 134.178 303.333 134.178C308.088 134.178 312.106 132.537 315.389 129.254Z" fill="#376A3E"/>
    <rect y="171.032" width="1074" height="248" rx="50" fill="#1f1f1f" fillOpacity="0.08"/>
    <path d="M721.66 372.622C719.54 371.842 716.69 370.152 715.32 368.872C714.59 368.182 713.95 367.602 713.41 366.942C710 362.852 710 355.922 710 302.612V300.972C710 261.742 710.36 241.222 711.07 239.352C712.4 235.812 715.61 232.332 719.5 230.182C722.1 228.752 726.19 228.542 750.5 228.632C780.84 228.752 786.75 229.572 799.58 235.442C816.73 243.292 829.79 259.472 835.16 279.532C838.14 290.682 838.12 309.222 835.12 320.532C828.2 346.642 810.97 364.182 785.34 371.222C778.44 373.122 774.39 373.412 751.5 373.702C730.93 373.962 724.7 373.732 721.66 372.622ZM556.96 371.782C553.7 370.142 551.89 368.332 550.25 365.072C549.58 363.742 548.97 362.822 548.57 361.812C546.84 357.372 549.4 351.262 570.34 301.242C572.18 296.852 574.16 292.122 576.29 287.032C595.45 241.212 596.01 239.932 598.29 236.832C601.81 232.052 608.2 228.862 615.42 228.282C620.75 227.862 622.64 228.182 627.24 230.282C636.26 234.412 635.11 232.262 659.72 291.032L661.88 296.172C684.46 350.082 686.11 354.022 685.88 357.842C685.85 358.252 685.8 358.672 685.76 359.152C685.2 365.022 681.88 369.732 676.6 372.122C671.42 374.482 667.59 374.482 662.42 372.132C656.98 369.662 654.96 366.852 650.48 355.562L646.71 346.032H616.97C589.52 346.032 587.19 346.162 586.71 347.782C585.26 352.602 578.84 366.542 577.28 368.272C574.61 371.232 568.51 374.032 564.75 374.032C562.92 374.032 559.42 373.022 556.96 371.782ZM398.02 371.782C392.31 368.862 389.82 365.322 389.3 359.352C388.91 354.882 390.65 350.352 413.42 296.592C433.97 248.082 438.56 238.042 441.65 234.882C448.4 227.962 459.39 226.142 468.56 230.412C474.94 233.382 478.76 238.202 483.32 249.032C518.29 332.132 527 353.802 527 357.732C526.99 368.342 516.23 376.212 505.95 373.132C499.33 371.152 496.63 367.952 491.96 356.562L487.65 346.032H428.28L424.49 355.282C419.68 366.992 417.69 369.812 412.6 372.122C407.17 374.592 403.35 374.502 398.02 371.782ZM914.76 375.012C889.5 371.982 870.45 356.072 864.36 332.932C862.95 327.552 862.62 319.752 862.29 284.032L861.9 241.532L864.2 241.962L925.33 252.432C946.58 255.682 962.24 257.692 970.7 258.502C980.58 259.442 988.22 260.902 994.49 263.192C1003.5 266.472 1010.55 271.852 1015.63 279.392C1020.28 286.322 1022.66 293.992 1022.66 302.302C1022.66 314.562 1018.62 325.482 1010.53 335.082C1002.45 344.682 991.5 351.622 977.69 355.882C969.48 358.442 954.53 360.202 932.84 361.182C915.35 361.972 921.4 375.912 914.76 375.012Z" fill="#376A3E"/>
  </svg>
</p>

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
