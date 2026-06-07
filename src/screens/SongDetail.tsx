import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteSong, saveSong, useSong } from "../lib/db";
import { createSection } from "../lib/songFactory";
import { ChordProgressionView } from "../components/notation/ChordProgressionView";
import { TabView } from "../components/notation/TabView";
import { MetadataSheet } from "../components/editors/MetadataSheet";
import { AddSectionSheet } from "../components/editors/AddSectionSheet";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatTimeSignature, songChips } from "../lib/format";

export function SongDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const song = useSong(id);
  const [editingMeta, setEditingMeta] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (song === undefined) {
    return (
      <div className="px-5 pt-8">
        <BackLink />
        <p className="mt-10 text-center text-muted">Loading…</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="px-5 pt-8">
        <BackLink />
        <p className="mt-10 text-center text-muted">
          {id === "new" ? "New song — the editor lands here soon." : "Song not found."}
        </p>
      </div>
    );
  }

  async function addSection(type: "chords" | "tab", label: string) {
    const section = createSection(type, label, song!);
    await saveSong({ ...song!, sections: [...song!.sections, section] });
    setAddingSection(false);
    navigate(`/song/${song!.id}/${type === "tab" ? "tab" : "chords"}/${section.id}`);
  }

  async function removeSection(sectionId: string) {
    await saveSong({ ...song!, sections: song!.sections.filter((s) => s.id !== sectionId) });
  }

  return (
    <div className="px-5 pt-4">
      <header className="sticky top-0 z-30 -mx-5 mb-6 flex items-center justify-between border-b border-border bg-background/90 px-5 py-3 backdrop-blur-md">
        <BackLink />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingMeta(true)}
            aria-label="Edit song details"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-accent"
          >
            <Pencil size={19} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete song"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:text-red-600"
          >
            <Trash2 size={19} />
          </button>
        </div>
      </header>

      <h1 className="font-display text-4xl font-bold text-foreground">{song.title}</h1>
      {song.subtitle && <p className="mt-1 text-muted">{song.subtitle}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {songChips(song).map((chip) => (
          <span
            key={chip}
            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-8 pb-12">
        {song.sections.map((section) => (
          <section key={section.id}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-mono text-[11px] font-bold tracking-[0.15em] text-muted uppercase">
                {section.label}
              </h2>
              {section.timeSignature && (
                <span className="font-mono text-[11px] text-muted">
                  · {formatTimeSignature(section.timeSignature)}
                </span>
              )}
              {section.feel && section.feel !== "straight" && (
                <span className="font-mono text-[11px] text-muted">· {section.feel}</span>
              )}
              {section.repeatCount && section.repeatCount > 1 && (
                <span className="font-mono text-[11px] text-accent">×{section.repeatCount}</span>
              )}
              <span className="flex-1" />
              <Link
                to={`/song/${song.id}/${section.tab ? "tab" : "chords"}/${section.id}`}
                aria-label="Edit section"
                className="grid size-7 place-items-center rounded-md text-muted hover:text-accent"
              >
                <Pencil size={15} />
              </Link>
              <button
                onClick={() => removeSection(section.id)}
                aria-label="Delete section"
                className="grid size-7 place-items-center rounded-md text-muted hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_8px_rgba(44,42,38,0.04)]">
              {section.chords && <ChordProgressionView prog={section.chords} barsPerRow={4} />}
              {section.tab && <TabView block={section.tab} />}
              {!section.chords && !section.tab && (
                <p className="font-mono text-sm text-muted">Empty section.</p>
              )}
            </div>
            {section.note && <p className="mt-2 text-sm text-muted italic">{section.note}</p>}
          </section>
        ))}

        <button
          onClick={() => setAddingSection(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-5 text-sm font-semibold text-muted transition-colors hover:bg-surface active:scale-[0.99]"
        >
          <Plus size={18} />
          Add Section
        </button>
      </div>

      <MetadataSheet
        open={editingMeta}
        onClose={() => setEditingMeta(false)}
        song={song}
        onSaved={() => setEditingMeta(false)}
      />
      <AddSectionSheet
        open={addingSection}
        onClose={() => setAddingSection(false)}
        onAdd={addSection}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete song?"
        message={`"${song.title || "Untitled"}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteSong(song.id);
          navigate("/");
        }}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      aria-label="Back to journal"
      className="-ml-2 grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-surface"
    >
      <ArrowLeft size={22} />
    </Link>
  );
}
