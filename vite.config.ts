import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    outDir: "dist",
  },
  optimizeDeps: {
    // These packages are already ESM — skip pre-bundling to avoid transformation conflicts
    exclude: [
      "@yume-chan/adb",
      "@yume-chan/adb-backend-webusb",
      "@yume-chan/stream-extra",
    ],
  },
  server: {
    // WebUSB requires a secure context; localhost qualifies
    host: "localhost",
    port: 5173,
  },
});
