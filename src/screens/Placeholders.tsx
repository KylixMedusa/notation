/** Lightweight placeholder screens, filled out in the screens phase. */
function Placeholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="px-5 pt-8">
      <h1 className="font-display text-4xl font-bold text-foreground">{title}</h1>
      <p className="mt-3 max-w-sm text-muted">{blurb}</p>
    </div>
  );
}

export function SearchScreen() {
  return <Placeholder title="Search" blurb="Search across titles, artists, and notation — coming soon." />;
}

export function SettingsScreen() {
  return <Placeholder title="Settings" blurb="Theme, default tuning, and library backup — coming soon." />;
}

export function ChordsWriter() {
  return <Placeholder title="Chords Writer" blurb="Bar-by-bar progression builder — coming soon." />;
}

export function TabsWriter() {
  return <Placeholder title="Tabs Writer" blurb="Six-string tab editor with the custom keyboard — coming soon." />;
}
