import { Outlet } from "react-router-dom";

/** Minimal shell — no sidebar or tab bar; just a centered content column. */
export function AppShell() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-3xl">
        <Outlet />
      </div>
    </div>
  );
}
