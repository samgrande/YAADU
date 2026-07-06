# Technical Details

Architecture, module reference, and tech stack for YAADU.

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

## UI

Material 3 theme generated via `@material/material-color-utilities` from source color `#376A3E`. React rendering with Material Web Components for interactive controls. APK sideloader uses a custom fixed-position overlay instead of `<md-dialog>`. Long panels use a `ResizeObserver`-driven `ScrollPill` indicator.

---## Known Limitations

| Limitation | Reason |
|---|---|
| Chrome/Edge desktop only | WebUSB is not available in Firefox, Safari, or on Android Chrome |
| No serial number display | `Adb` instance in 0.0.19 doesn't expose the USB serial; `adb.model` is used instead |
| APK split APKs | Only supports monolithic `.apk` files (not `.apks` bundles) |
| Large backup files | Individual files are fully buffered in RAM before download; >500 MB files may strain low-memory devices |
| System apps | `pm list packages -3` only shows user-installed apps; system apps require `pm list packages -s` (not shown by default) |

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
