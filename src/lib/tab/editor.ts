/**
 * Tab editor state machine. All mutations go through `applyCommand` which returns a new state
 * and pushes to the undo stack — never mutates in place.
 */
import type { NotePosition } from "./geometry";
import type { TabKeyboardCommand } from "../../components/tab/TabKeyboard";
import type { TEvent, TTablature, TMarking, NoteMarkingType, EventMarkingType, BarlineType, BendType, BendValue } from "../../types/tablature";
import { isBarline, isChord, STANDARD_6_TUNING } from "../../types/tablature";

export interface TabEditorState {
  tablature: TTablature;
  cursor: NotePosition;
  clipboard: TEvent[] | null;
  history: TTablature[];
  future: TTablature[];
}

export function createEditorState(tablature?: TTablature): TabEditorState {
  const tab: TTablature = tablature ?? {
    tuning: STANDARD_6_TUNING,
    events: [{ kind: "default", markings: [] }],
  };
  return { tablature: tab, cursor: { eventIndex: 0, stringIndex: 0 }, clipboard: null, history: [], future: [] };
}

const stringCount = (state: TabEditorState) => state.tablature.tuning.strings.length;

// ── Immutable event helpers ───────────────────────────────────────────────────

function setEvents(state: TabEditorState, events: TEvent[]): TTablature {
  return { ...state.tablature, events };
}

function withHistory(state: TabEditorState, next: TTablature): TabEditorState {
  return {
    ...state,
    tablature: next,
    history: [...state.history, state.tablature],
    future: [],
  };
}

function clampCursor(state: TabEditorState): NotePosition {
  const len = state.tablature.events.length;
  return {
    eventIndex: Math.max(0, Math.min(state.cursor.eventIndex, len - 1)),
    stringIndex: Math.max(0, Math.min(state.cursor.stringIndex, stringCount(state) - 1)),
  };
}

// ── Command handlers ──────────────────────────────────────────────────────────

function insertFret(state: TabEditorState, fret: number | "x"): TabEditorState {
  const ei = state.cursor.eventIndex;
  const si = state.cursor.stringIndex;
  const events = [...state.tablature.events];

  // Ensure there's a chord at this position.
  const existing = events[ei];
  let ev: Extract<TEvent, { kind: "chord" }>;
  if (isChord(existing)) {
    ev = { ...existing, notes: existing.notes.filter((n) => n.stringIndex !== si) };
  } else {
    ev = { kind: "chord", notes: [], markings: existing?.markings ?? [] };
  }
  ev = { ...ev, notes: [...ev.notes, { fret, stringIndex: si }] };
  events[ei] = ev;

  // Ensure there's a default event after for the cursor to advance to.
  if (ei === events.length - 1) events.push({ kind: "default", markings: [] });

  const next = withHistory(state, setEvents(state, events));
  return { ...next, cursor: { eventIndex: ei + 1, stringIndex: si } };
}

function applyNoteMarking(state: TabEditorState, marking: NoteMarkingType): TabEditorState {
  const ei = state.cursor.eventIndex;
  const si = state.cursor.stringIndex;
  const events = [...state.tablature.events];
  const ev = events[ei];
  if (!isChord(ev)) return state;

  const hasIt = ev.markings.some((m) => m.type === marking && "data" in m && (m as {data:{stringIndex:number}}).data?.stringIndex === si);
  let markings: TMarking[];
  if (hasIt) {
    markings = ev.markings.filter((m) => !(m.type === marking && "data" in m && (m as {data:{stringIndex:number}}).data?.stringIndex === si));
  } else {
    const newMark = { type: marking, data: { stringIndex: si } } as TMarking;
    markings = [...ev.markings, newMark];
  }
  events[ei] = { ...ev, markings };
  return withHistory(state, setEvents(state, events));
}

/** Bend: press cycles the value 1/4 → 1/2 → 1 → (removed), per bend type, on the cursor note. */
function applyBend(state: TabEditorState, bendType: BendType): TabEditorState {
  const { eventIndex: ei, stringIndex: si } = state.cursor;
  const events = [...state.tablature.events];
  const ev = events[ei];
  if (!isChord(ev) || !ev.notes.some((n) => n.stringIndex === si)) return state;

  const existing = ev.markings.find(
    (m): m is Extract<TMarking, { type: "bend" }> =>
      m.type === "bend" && m.data.stringIndex === si && m.data.type === bendType,
  );
  const without = ev.markings.filter(
    (m) => !(m.type === "bend" && m.data.stringIndex === si && m.data.type === bendType),
  );

  let next: BendValue | null;
  if (!existing) next = "1/4";
  else next = existing.data.value === "1/4" ? "1/2" : existing.data.value === "1/2" ? "1" : null;

  const markings: TMarking[] = next
    ? [...without, { type: "bend", data: { type: bendType, value: next, stringIndex: si } }]
    : without;
  events[ei] = { ...ev, markings };
  return withHistory(state, setEvents(state, events));
}

function applyEventMarking(state: TabEditorState, marking: EventMarkingType): TabEditorState {
  const ei = state.cursor.eventIndex;
  const events = [...state.tablature.events];
  const ev = events[ei];
  const hasIt = ev.markings.some((m) => m.type === marking);
  const markings = hasIt
    ? ev.markings.filter((m) => m.type !== marking)
    : [...ev.markings, { type: marking } as TMarking];
  events[ei] = { ...ev, markings };
  return withHistory(state, setEvents(state, events));
}

function insertBarline(state: TabEditorState, barlineType: BarlineType): TabEditorState {
  const ei = state.cursor.eventIndex;
  const events = [...state.tablature.events];
  const barEv: TEvent = { kind: "barline", barlineType, markings: [] };
  events.splice(ei, 0, barEv);
  if (events[events.length - 1].kind !== "default") events.push({ kind: "default", markings: [] });
  return withHistory(state, setEvents(state, events));
}

function backspace(state: TabEditorState): TabEditorState {
  const ei = state.cursor.eventIndex;
  const si = state.cursor.stringIndex;
  const events = [...state.tablature.events];
  const ev = events[ei];

  if (isChord(ev) && ev.notes.some((n) => n.stringIndex === si)) {
    // Remove just the note on this string.
    const notes = ev.notes.filter((n) => n.stringIndex !== si);
    events[ei] = notes.length === 0 ? { kind: "default", markings: ev.markings } : { ...ev, notes };
    return withHistory(state, setEvents(state, events));
  }
  // Remove the whole event (if not the last default).
  if (events.length > 1) {
    events.splice(ei, 1);
    const newEi = Math.max(0, ei - 1);
    const next = withHistory(state, setEvents(state, events));
    return { ...next, cursor: { eventIndex: newEi, stringIndex: si } };
  }
  return state;
}

function moveCursor(state: TabEditorState, dir: "up" | "down" | "left" | "right"): TabEditorState {
  const { eventIndex: ei, stringIndex: si } = state.cursor;
  const sc = stringCount(state);
  const len = state.tablature.events.length;
  let newEi = ei, newSi = si;
  if (dir === "up")    newSi = Math.max(0, si - 1);
  if (dir === "down")  newSi = Math.min(sc - 1, si + 1);
  if (dir === "left")  newEi = Math.max(0, ei - 1);
  if (dir === "right") newEi = Math.min(len - 1, ei + 1);
  // Skip barlines on horizontal movement.
  if ((dir === "left" || dir === "right") && isBarline(state.tablature.events[newEi])) {
    newEi += dir === "right" ? 1 : -1;
    newEi = Math.max(0, Math.min(len - 1, newEi));
  }
  return { ...state, cursor: { eventIndex: newEi, stringIndex: newSi } };
}

function nextEvent(state: TabEditorState): TabEditorState {
  const events = state.tablature.events;
  let ei = state.cursor.eventIndex + 1;
  while (ei < events.length && isBarline(events[ei])) ei++;
  return { ...state, cursor: { ...state.cursor, eventIndex: Math.min(events.length - 1, ei) } };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function applyCommand(state: TabEditorState, cmd: TabKeyboardCommand): TabEditorState {
  switch (cmd.type) {
    case "fret":           return insertFret(state, cmd.fret);
    case "mute":           return insertFret(state, "x");
    case "backspace":      return backspace(state);
    case "move":           return moveCursor(state, cmd.dir);
    case "next-event":     return nextEvent(state);
    case "insert-barline": return insertBarline(state, cmd.barlineType);
    case "note-marking":   return applyNoteMarking(state, cmd.marking);
    case "bend":           return applyBend(state, cmd.bendType);
    case "event-marking":  return applyEventMarking(state, cmd.marking);
    case "undo": {
      if (!state.history.length) return state;
      const prev = state.history[state.history.length - 1];
      return { ...state, tablature: prev, history: state.history.slice(0, -1), future: [state.tablature, ...state.future], cursor: clampCursor({ ...state, tablature: prev }) };
    }
    case "redo": {
      if (!state.future.length) return state;
      const next = state.future[0];
      return { ...state, tablature: next, history: [...state.history, state.tablature], future: state.future.slice(1), cursor: clampCursor({ ...state, tablature: next }) };
    }
    case "space": {
      const spaceEvents = [...state.tablature.events];
      spaceEvents.splice(state.cursor.eventIndex + 1, 0, { kind: "default", markings: [] });
      const spaceNext = withHistory(state, setEvents(state, spaceEvents));
      return { ...spaceNext, cursor: { ...state.cursor, eventIndex: state.cursor.eventIndex + 1 } };
    }
    case "enter": {
      const enterEvents = [...state.tablature.events];
      enterEvents.splice(state.cursor.eventIndex + 1, 0, { kind: "default", markings: [] });
      return withHistory(state, setEvents(state, enterEvents));
    }
    case "line-break": return applyEventMarking(state, "line-break");
    case "copy":  return { ...state, clipboard: [state.tablature.events[state.cursor.eventIndex]] };
    case "cut": {
      const cut = backspace({ ...state, clipboard: [state.tablature.events[state.cursor.eventIndex]] });
      return { ...cut, clipboard: [state.tablature.events[state.cursor.eventIndex]] };
    }
    case "paste": {
      if (!state.clipboard?.length) return state;
      const ei = state.cursor.eventIndex;
      const events = [...state.tablature.events];
      events.splice(ei, 0, ...state.clipboard);
      return withHistory(state, setEvents(state, events));
    }
    default: return state;
  }
}

export function setCursor(state: TabEditorState, pos: NotePosition): TabEditorState {
  return { ...state, cursor: pos };
}

/**
 * Returns keys that should be disabled based on the current cursor event.
 * Mirrors the reference app's `disabledKeys` prop logic.
 */
export function getDisabledKeys(state: TabEditorState): import("../../components/tab/TabKeyboard").DisabledKey[] {
  const ev = state.tablature.events[state.cursor.eventIndex];
  if (!ev || !isChord(ev) || ev.notes.length === 0) {
    // No note on cursor: disable all per-note techniques.
    return ["slur", "slide", "bend", "harmonic", "ghost", "tremolo-picking"];
  }
  return [];
}
