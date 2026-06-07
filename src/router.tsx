import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { SongsList } from "./screens/SongsList";
import { SongDetail } from "./screens/SongDetail";
import { ChordsWriter } from "./screens/ChordsWriter";
import { TabsWriter } from "./screens/TabsWriter";
import { SearchScreen, SettingsScreen } from "./screens/Placeholders";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <SongsList /> },
      { path: "/song/:id", element: <SongDetail /> },
      { path: "/search", element: <SearchScreen /> },
      { path: "/settings", element: <SettingsScreen /> },
    ],
  },
  // Full-screen editors (no shell chrome).
  { path: "/song/:id/chords/:sectionId", element: <ChordsWriter /> },
  { path: "/song/:id/tab/:sectionId", element: <TabsWriter /> },
]);
