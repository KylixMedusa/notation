import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Self-hosted fonts (offline-safe) — Lora (display), Inter (UI), JetBrains Mono (notation).
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./router";
import { requestPersistentStorage } from "./lib/persist";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

void requestPersistentStorage();
