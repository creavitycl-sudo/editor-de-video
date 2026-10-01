import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4321",
      "/public": "http://127.0.0.1:4321",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
