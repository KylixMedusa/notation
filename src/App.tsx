import { Button } from "@heroui/react";

export default function App() {
  return (
    <main className="grid min-h-dvh place-items-center gap-6 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="font-mono text-sm tracking-[0.2em] text-muted uppercase">
          The Acoustic Notebook
        </p>
        <h1 className="font-display text-5xl font-bold text-foreground">Notation</h1>
        <p className="max-w-sm text-muted">
          A guitarist&apos;s songwriting journal — chords, tabs, and AI screenshot import.
        </p>
        <Button>Get started</Button>
      </div>
    </main>
  );
}
