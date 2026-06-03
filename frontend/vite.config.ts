import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      "/runs": {
        target: "http://localhost:5173",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:5173",
        changeOrigin: true,
      },
    },
  },
});
