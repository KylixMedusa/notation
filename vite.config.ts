import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Auto-generate icons (incl. apple-touch + maskable) and inject head tags from logo.svg.
      pwaAssets: { preset: "minimal-2023", image: "public/logo.svg" },
      manifest: {
        name: "Notation",
        short_name: "Notation",
        description:
          "A guitarist's songwriting journal — chords, tabs, and AI screenshot import.",
        theme_color: "#FDFBF7",
        background_color: "#FDFBF7",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        categories: ["music", "productivity"],
      },
      workbox: {
        // Precache the app shell + self-hosted fonts (woff2) so it works fully offline.
        globPatterns: ["**/*.{js,css,html,woff2,svg,png,ico}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
