import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { saveSong, useSong } from "../lib/db";
import {
  applyWeights,
  clearSlot as clearSlotFn,
  commonPatterns,
  hasBoundaryAt,
  mergeAtBeat,
  patternLabel,
  setSlotChord,
  splitAtBeat,
} from "../lib/notation";
import { BarView } from "../components/notation/BarView";
import { ChordProgressionView } from "../components/notation/ChordProgressionView";
import { DEFAULT_TIME_SIGNATURE, FEELS } from "../types";
import type { Bar, Chord, Feel, Note, Quality, Slot, TimeSignature } from "../types";

const TIME_SIGS = ["4/4", "3/4", "6/8", "2/4", "5/4", "6/4", "7/8", "12/8"];

const ROOTS: Note[] = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
const QUALITY_OPTS: Array<{ q: Quality; label: string }> = [
  { q: "maj", label: "Maj" }, { q: "min", label: "Min" }, { q: "7", label: "7" },
  { q: "maj7", label: "Maj7" }, { q: "m7", label: "m7" }, { q: "sus2", label: "sus2" },
  { q: "sus4", label: "sus4" }, { q: "dim", label: "dim" }, { q: "dim7", label: "dim7" },
  { q: "aug", label: "aug" }, { q: "add9", label: "add9" }, { q: "9", label: "9" },
  { q: "m7b5", label: "m7♭5" }, { q: "6", label: "6" },
];

const emptyBar = (full: number): Bar => ({ slots: [{ kind: "rest", beats: full }] });

export function ChordsWriter() {
  const { id = "", sectionId = "" } = useParams();
  const navigate = useNavigate();
  const song = useSong(id);
  const section = song?.sections.find((s) => s.id === sectionId);

  const [bars, setBars] = useState<Bar[]>([]);
  const [ts, setTs] = useState<TimeSignature>(DEFAULT_TIME_SIGNATURE);
  const [feel, setFeel] = useState<Feel>("straight");
  const [label, setLabel] = useState("");
  const [repeatCount, setRepeatCount] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(0);
  const [slot, setSlot] = useState(0);
  const full = ts.numerator;

  useEffect(() => {
    if (!loaded && section) {
      setBars(section.chords?.bars ?? []);
      setTs(section.timeSignature ?? song?.timeSignature ?? DEFAULT_TIME_SIGNATURE);
      setFeel(section.feel ?? song?.feel ?? "straight");
      setLabel(section.label);
      setRepeatCount(section.repeatCount ?? 1);
      setLoaded(true);
    }
  }, [section, loaded, song]);

  if (song === undefined || !loaded) return <Msg text="Loading…" />;
  if (!song || !section) return <Msg text="Section not found." onBack={() => navigate(`/song/${id}`)} />;

  const activeBar: Bar | undefined = bars[active];
  const activeSlot = activeBar?.slots[slot];
  const activeChord = activeSlot?.kind === "chord" ? activeSlot.chord : undefined;

  const updateActive = (bar: Bar) => {
    setBars(bars.map((b, i) => (i === active ? bar : b)));
    setSlot((s) => Math.min(s, bar.slots.length - 1));
  };
  // Roadmap/simile controls hidden for now — re-enable with the BarMarkings block below.
  // const patchActive = (patch: Partial<Bar>) => {
  //   if (activeBar) updateActive({ ...activeBar, ...patch });
  // };

  function applyChord(chord: Chord) {
    if (activeBar) updateActive(setSlotChord(activeBar, slot, chord));
  }
  function setRoot(root: Note) {
    applyChord(activeChord ? { ...activeChord, root } : { root, quality: "maj" });
  }
  function setQuality(q: Quality) {
    if (activeChord) applyChord({ ...activeChord, quality: q });
  }
  function setBass(b: Note | undefined) {
    if (activeChord) applyChord({ ...activeChord, bass: b });
  }
  function toggleBoundary(beat: number) {
    if (!activeBar) return;
    updateActive(hasBoundaryAt(activeBar, beat) ? mergeAtBeat(activeBar, beat) : splitAtBeat(activeBar, beat, full));
  }
  function addBar() {
    setBars([...bars, emptyBar(full)]);
    setActive(bars.length);
    setSlot(0);
  }
  function deleteBar(i: number) {
    setBars(bars.filter((_, idx) => idx !== i));
    setActive((a) => Math.max(0, a > i ? a - 1 : a));
    setSlot(0);
  }

  function changeTs(value: string) {
    const [num, den] = value.split("/").map(Number);
    setTs({ numerator: num, denominator: den });
    // Re-fit bars whose beats no longer sum to the new total → collapse to a whole bar.
    setBars((bs) =>
      bs.map((b) => {
        if (b.slots.reduce((a, s) => a + s.beats, 0) === num) return b;
        const firstChord = b.slots.find((s): s is Extract<Slot, { kind: "chord" }> => s.kind === "chord");
        return { slots: [firstChord ? { kind: "chord", chord: firstChord.chord, beats: num } : { kind: "rest", beats: num }] };
      }),
    );
    setSlot(0);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const sections = song!.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            label: label.trim() || s.label,
            chords: { bars },
            timeSignature: ts,
            feel: feel === "straight" ? undefined : feel,
            repeatCount: repeatCount > 1 ? repeatCount : undefined,
          }
        : s,
    );
    try {
      await saveSong({ ...song!, sections });
      navigate(`/song/${id}`);
    } catch {
      setSaving(false);
    }
  }

  const patterns = commonPatterns(full);
  const activeSig = activeBar?.slots.map((s) => s.beats).join(",");

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <button onClick={() => navigate(`/song/${id}`)} aria-label="Cancel" className="grid size-9 place-items-center text-foreground">
          <X size={22} />
        </button>
        <h1 className="font-display text-lg font-semibold">Edit Progression</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-2 font-semibold text-accent disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Section name"
          className="min-w-36 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-display text-base font-semibold text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
        <label className="flex items-center gap-1 text-sm text-muted">
          Repeat ×
          <input
            type="number"
            min={1}
            max={16}
            value={repeatCount}
            onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))}
            className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-center font-mono text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1 text-sm text-muted">
          Time
          <select
            value={`${ts.numerator}/${ts.denominator}`}
            onChange={(e) => changeTs(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-sm font-medium text-foreground focus:border-accent focus:outline-none"
          >
            {TIME_SIGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-sm text-muted">
          Feel
          <select
            value={feel}
            onChange={(e) => setFeel(e.target.value as Feel)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground capitalize focus:border-accent focus:outline-none"
          >
            {FEELS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {bars.length > 0 && (
          <>
            <Label>Preview</Label>
            <div className="mb-6 rounded-xl border border-border bg-surface p-4">
              <ChordProgressionView prog={{ bars }} />
            </div>
          </>
        )}

        <Label>Bars</Label>
        <div className="flex flex-col gap-2">
          {bars.map((bar, i) => (
            <div
              key={i}
              onClick={() => { if (i !== active) { setActive(i); setSlot(0); } }}
              className={[
                "rounded-xl p-3 transition-colors",
                i === active ? "border-2 border-accent bg-surface ring-4 ring-accent/5" : "cursor-pointer border border-border bg-surface/70",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm text-muted">Bar {i + 1}</span>
                {i === active && (
                  <button onClick={() => deleteBar(i)} className="flex items-center gap-1 text-[11px] font-bold tracking-tight text-muted uppercase hover:text-red-600">
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
              <BarView
                bar={bar}
                selectedSlot={i === active ? slot : undefined}
                onSelectSlot={i === active ? setSlot : undefined}
              />
              {i === active && <BoundaryRuler bar={bar} full={full} onToggle={toggleBoundary} />}
              {/* Roadmap/simile controls hidden for now:
              {i === active && <BarMarkings bar={bar} onPatch={patchActive} />} */}
            </div>
          ))}
          <button onClick={addBar} className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-muted hover:bg-surface">
            <Plus size={16} /> Add Bar
          </button>
        </div>
      </div>

      {/* Bottom drawer */}
      <div className="border-t border-border bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <Label>Rhythm &amp; Weight</Label>
        <Scroller>
          {patterns.map((p) => (
            <Chip key={p.join(",")} active={activeSig === p.join(",")} onClick={() => activeBar && updateActive(applyWeights(activeBar, p, full))}>
              {patternLabel(p, full)}
            </Chip>
          ))}
        </Scroller>

        <Label>Root</Label>
        <Scroller>
          {ROOTS.map((r) => (
            <Chip key={r} active={activeChord?.root === r} onClick={() => setRoot(r)}>{r}</Chip>
          ))}
        </Scroller>

        <Label>Quality</Label>
        <Scroller>
          {QUALITY_OPTS.map(({ q, label }) => (
            <Chip key={q} active={activeChord?.quality === q} disabled={!activeChord} onClick={() => setQuality(q)}>{label}</Chip>
          ))}
        </Scroller>

        <Label>Bass</Label>
        <Scroller>
          <Chip active={activeChord ? !activeChord.bass : false} disabled={!activeChord} onClick={() => setBass(undefined)}>—</Chip>
          {ROOTS.map((r) => (
            <Chip key={r} active={activeChord?.bass === r} disabled={!activeChord} onClick={() => setBass(r)}>{r}</Chip>
          ))}
        </Scroller>

        <button onClick={() => activeBar && updateActive(clearSlotFn(activeBar, slot))} className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-muted hover:text-red-600">
          Clear selected slot
        </button>
      </div>
    </div>
  );
}

/** Tap the dividers between beats to split/merge — builds any beat-aligned rhythm. */
function BoundaryRuler({ bar, full, onToggle }: { bar: Bar; full: number; onToggle: (beat: number) => void }) {
  return (
    <div className="mt-2 flex h-7 items-stretch overflow-hidden rounded-md border border-border bg-background">
      {Array.from({ length: full }, (_, b) => (
        <Fragment key={b}>
          {b > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(b); }}
              aria-label={`Toggle boundary at beat ${b + 1}`}
              className={["w-2 shrink-0", hasBoundaryAt(bar, b) ? "bg-accent" : "bg-border/50"].join(" ")}
            />
          )}
          <div className="grid flex-1 place-items-center font-mono text-[10px] text-muted">{b + 1}</div>
        </Fragment>
      ))}
    </div>
  );
}

/* Roadmap + simile controls — hidden for now. To re-enable: uncomment this block, the
   <BarMarkings> render above, the patchActive helper, and the BAR_MARKS/JUMPS/BarMark/Jump imports.
function BarMarkings({ bar, onPatch }: { bar: Bar; onPatch: (p: Partial<Bar>) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
      <MiniToggle active={bar.repeatStart} onClick={() => onPatch({ repeatStart: !bar.repeatStart })}>|:</MiniToggle>
      <MiniToggle active={bar.repeatEnd} onClick={() => onPatch({ repeatEnd: !bar.repeatEnd })}>:|</MiniToggle>
      {bar.repeatEnd && (
        <label className="flex items-center gap-1 text-xs text-muted">
          ×
          <input
            type="number"
            min={2}
            max={8}
            value={bar.repeatCount ?? 2}
            onChange={(e) => onPatch({ repeatCount: Number(e.target.value) })}
            className="w-12 rounded border border-border bg-background px-1 py-0.5 text-center font-mono"
          />
        </label>
      )}
      <MiniToggle
        active={!!bar.ending}
        onClick={() => onPatch({ ending: bar.ending === 1 ? 2 : bar.ending === 2 ? undefined : 1 })}
      >
        {bar.ending ? `${bar.ending}.` : "1./2."}
      </MiniToggle>
      <MiniToggle active={bar.repeatPrevious} onClick={() => onPatch({ repeatPrevious: !bar.repeatPrevious })}>
        % simile
      </MiniToggle>
      <select
        value={bar.mark ?? ""}
        onChange={(e) => onPatch({ mark: (e.target.value || undefined) as BarMark | undefined })}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
      >
        <option value="">Mark…</option>
        {BAR_MARKS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select
        value={bar.jump ?? ""}
        onChange={(e) => onPatch({ jump: (e.target.value || undefined) as Jump | undefined })}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
      >
        <option value="">Jump…</option>
        {JUMPS.map((j) => <option key={j} value={j}>{j}</option>)}
      </select>
    </div>
  );
}

function MiniToggle({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={[
        "rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors",
        active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
*/

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 font-mono text-[10px] font-bold tracking-widest text-muted uppercase">{children}</p>;
}

function Scroller({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>{children}</div>;
}

function Chip({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "shrink-0 rounded-xl border px-4 py-2 font-mono text-sm transition-colors disabled:opacity-40",
        active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Msg({ text, onBack }: { text: string; onBack?: () => void }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background">
      <p className="text-muted">{text}</p>
      {onBack && <button onClick={onBack} className="text-accent">Back</button>}
    </div>
  );
}
