import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget =
    env.VITE_API_PROXY || env.VITE_API_URL || "http://127.0.0.1:5001";

  return {
    plugins: [react()],
    server: {
      // Listen on LAN so phones can open http://<mac-ip>:5173
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          timeout: 120_000,
          proxyTimeout: 120_000,
        },
      },
    },
  };
});
