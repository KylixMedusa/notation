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
      // Icons are the high-quality IconKitchen set in public/ (full-bleed terracotta — no
      // white border on iOS). Declared explicitly below rather than auto-generated.
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-192-maskable.png",
        "icon-512-maskable.png",
      ],
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
        icons: [
          { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
          { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
          { src: "/icon-192-maskable.png", type: "image/png", sizes: "192x192", purpose: "maskable" },
          { src: "/icon-512-maskable.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
        ],
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
