import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  // Local `npm run dev` stays at `/`. Production (and preview) uses the
  // GitHub Pages project path so assets resolve at
  // https://mightymoshie.github.io/Game-dev-log/
  base: mode === "development" ? "/" : "/Game-dev-log/",
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
}));
