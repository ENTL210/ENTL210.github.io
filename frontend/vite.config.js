import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget =
    env.VITE_API_PROXY || env.VITE_API_URL || "http://127.0.0.1:5001";
  // GitHub project pages: https://<user>.github.io/<repo>/
  const base = env.VITE_BASE_PATH || "/";

  return {
    base,
    plugins: [react()],
    server: {
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
