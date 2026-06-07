import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { saveSong, useSong } from "../lib/db";
import { TablatureStave } from "../components/tab/TablatureStave";
import { TabKeyboard } from "../components/tab/TabKeyboard";
import { createEditorState, applyCommand, setCursor, getDisabledKeys } from "../lib/tab/editor";
import type { TabEditorState } from "../lib/tab/editor";
import type { NotePosition } from "../lib/tab/geometry";
import { FEELS, STANDARD_6_TUNING, emptyTablature } from "../types";
import type { Feel, TTablature } from "../types";

export function TabsWriter() {
  const { id = "", sectionId = "" } = useParams();
  const navigate = useNavigate();
  const song = useSong(id);
  const section = song?.sections.find((s) => s.id === sectionId);

  const [editorState, setEditorState] = useState<TabEditorState | null>(null);
  const [label, setLabel] = useState("");
  const [feel, setFeel] = useState<Feel>("straight");
  const [repeatCount, setRepeatCount] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  // Callback-ref + observer: fires when the canvas div actually mounts (after `loaded`),
  // not on the initial loading-screen render.
  useEffect(() => {
    if (!containerEl) return;
    setContainerWidth(containerEl.clientWidth);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(containerEl);
    return () => ro.disconnect();
  }, [containerEl]);

  useEffect(() => {
    if (!loaded && section) {
      // Always use the high→low standard tuning (index 0 = high e on top).
      const savedEvents = (section.tab as unknown as { events?: import("../types").TEvent[] })?.events;
      const tab: TTablature = {
        tuning: STANDARD_6_TUNING,
        events: savedEvents && savedEvents.length ? savedEvents : emptyTablature().events,
      };
      setEditorState(createEditorState(tab));
      setLabel(section.label);
      setFeel(section.feel ?? song?.feel ?? "straight");
      setRepeatCount(section.repeatCount ?? 1);
      setLoaded(true);
    }
  }, [section, loaded, song]);

  const dispatch = useCallback((cmd: Parameters<typeof applyCommand>[1]) => {
    setEditorState((s) => s ? applyCommand(s, cmd) : s);
  }, []);

  const handleClickPosition = useCallback((pos: NotePosition) => {
    setEditorState((s) => s ? setCursor(s, pos) : s);
  }, []);

  async function save() {
    if (!editorState || !song || saving) return;
    setSaving(true);
    const tab = {
      tuning: editorState.tablature.tuning,
      events: editorState.tablature.events,
      stringCount: editorState.tablature.tuning.strings.length,
      columns: [],
    };
    const sections = song.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            label: label.trim() || s.label,
            feel: feel === "straight" ? undefined : feel,
            repeatCount: repeatCount > 1 ? repeatCount : undefined,
            tab: tab as unknown as import("../types").TabBlock,
          }
        : s,
    );
    try {
      await saveSong({ ...song, sections });
      navigate(`/song/${id}`);
    } catch {
      setSaving(false);
    }
  }

  if (!editorState || !loaded) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <p className="text-muted">{song === undefined ? "Loading…" : "Section not found."}</p>
      </div>
    );
  }

  const { tablature, cursor, history, future } = editorState;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <button onClick={() => navigate(`/song/${id}`)} aria-label="Cancel" className="grid size-9 place-items-center text-foreground">
          <X size={22} />
        </button>
        <h1 className="font-display text-lg font-semibold">Edit Tab</h1>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-2 font-semibold text-accent disabled:opacity-60">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : "Done"}
        </button>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Section name"
          className="min-w-36 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-display text-base font-semibold text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
        <label className="flex items-center gap-1 text-sm text-muted">
          Repeat ×
          <input
            type="number" min={1} max={16} value={repeatCount}
            onChange={(e) => setRepeatCount(Math.max(1, Number(e.target.value)))}
            className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-center font-mono text-sm text-foreground focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1 text-sm text-muted">
          Feel
          <select
            value={feel}
            onChange={(e) => setFeel(e.target.value as Feel)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground capitalize focus:border-accent focus:outline-none"
          >
            {FEELS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
      </div>

      {/* Stave canvas — full width, scrollable vertically */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden" ref={setContainerEl}>
        <TablatureStave
          tablature={tablature}
          containerWidth={containerWidth}
          cursor={cursor}
          onClickPosition={handleClickPosition}
        />
      </div>

      <div className="shrink-0">
        <TabKeyboard
          onCommand={dispatch}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
          disabledKeys={getDisabledKeys(editorState)}
        />
      </div>
    </div>
  );
}
