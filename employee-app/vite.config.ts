import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // host: true exposes on the LAN; allowedHosts: true lets a public HTTPS tunnel
  // (e.g. cloudflared/ngrok) proxy to this dev server for sharing.
  server: { port: 5174, host: true, allowedHosts: true },
});
