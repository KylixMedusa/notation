import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Plus, Search, X } from "lucide-react";
import { songChips } from "../lib/format";
import { useSongs } from "../lib/db";
import { MetadataSheet } from "../components/editors/MetadataSheet";
import { ImportSheet } from "../components/editors/ImportSheet";

export function SongsList() {
  const songs = useSongs();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const today = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "Working late?"
    : hour < 12 ? "Good morning"
    : hour < 17 ? "Good afternoon"
    : hour < 22 ? "Good evening"
    : "Working late?";

  const filtered = useMemo(() => {
    if (!songs) return songs;
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter((s) =>
      [s.title, s.subtitle ?? "", ...s.tags].join(" ").toLowerCase().includes(q),
    );
  }, [songs, query]);

  return (
    <div className="relative min-h-dvh px-5 pt-8 pb-28">
      <header className="mb-6 border-b border-border pb-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">{today}</p>
            <h1 className="font-display text-4xl font-bold text-foreground">{greeting}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Import from photo"
              onClick={() => setImporting(true)}
              className="grid size-11 place-items-center rounded-full bg-surface text-foreground/70 transition-colors hover:text-foreground"
            >
              <Camera size={20} />
            </button>
            <button
              aria-label={searching ? "Close search" : "Search"}
              onClick={() => { setSearching((s) => !s); setQuery(""); }}
              className="grid size-11 place-items-center rounded-full bg-surface text-foreground/70 transition-colors hover:text-foreground"
            >
              {searching ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>
        </div>

        {searching && (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, tags…"
            className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        )}
      </header>

      {filtered === null ? (
        <p className="mt-10 text-center text-muted">Loading your journal…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          {query ? "No songs match your search." : "No songs yet — tap + to start one."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((song) => (
            <li key={song.id}>
              <Link
                to={`/song/${song.id}`}
                className="block rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(44,42,38,0.04)] transition-transform active:scale-[0.99]"
              >
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {song.title || "Untitled"}
                </h2>
                {song.subtitle && <p className="text-sm text-muted">{song.subtitle}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {songChips(song).map((chip) => (
                    <span
                      key={chip}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setCreating(true)}
        aria-label="New song"
        className="fixed bottom-8 right-5 grid size-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition-transform active:scale-95"
      >
        <Plus size={28} />
      </button>

      <MetadataSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(song) => navigate(`/song/${song.id}`)}
      />

      <ImportSheet
        open={importing}
        onClose={() => setImporting(false)}
        onImported={(song) => { setImporting(false); navigate(`/song/${song.id}`); }}
      />
    </div>
  );
}
