import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/YAADU/",
  build: {
    target: "esnext",
    outDir: "docs",
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
