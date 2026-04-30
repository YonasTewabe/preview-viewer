import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function apiProxyTargetFromEnv(env) {
  const fallback = "http://localhost:4000";
  const raw = env.VITE_BACKEND_URL;
  if (!raw || typeof raw !== "string") return fallback;
  try {
    const normalized = raw.replace(/\/+$/, "");
    return new URL(`${normalized}/`).origin;
  } catch {
    return fallback;
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTargetFromEnv(env),
          changeOrigin: true,
        },
      },
    },
  };
});
