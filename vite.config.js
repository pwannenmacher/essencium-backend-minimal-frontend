import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React und React-DOM in separaten Chunk
          "react-vendor": ["react", "react-dom"],
          // Mantine UI Komponenten in separaten Chunk
          "mantine-vendor": [
            "@mantine/core",
            "@mantine/hooks",
            "@mantine/form",
            "@mantine/notifications",
            "@mantine/dates",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1400,
  },
});
