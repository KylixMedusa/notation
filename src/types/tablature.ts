/**
 * Guitar tablature model — based on the my-guitar-tabs architecture.
 * Events are the atomic unit; the array is the full song timeline.
 * Chord | Barline | DefaultEvent (empty space).
 */

export type Fret = number | "x";

export interface TNote {
  fret: Fret;
  stringIndex: number;
}

// ── Markings ──────────────────────────────────────────────────────────────────

export type BendValue = "1/4" | "1/2" | "3/4" | "1" | "2";
export type BendType = "up" | "down" | "pre";

export interface BendData { value: BendValue; type: BendType; stringIndex: number; }
export interface StringData { stringIndex: number; }

export type NoteMarking =
  | { type: "bend";    data: BendData }
  | { type: "slur";    data: StringData }
  | { type: "slide";   data: StringData }
  | { type: "harmonic"; data: StringData }
  | { type: "ghost";   data: StringData }
  | { type: "tremolo-picking"; data: StringData };

export type EventMarking =
  | { type: "vibrato" }
  | { type: "palm-muting" }
  | { type: "downstroke" }
  | { type: "upstroke" }
  | { type: "line-break" }
  | { type: "annotation"; data: { text: string } };

export type TMarking = NoteMarking | EventMarking;
export type NoteMarkingType = NoteMarking["type"];
export type EventMarkingType = EventMarking["type"];

// ── Events ────────────────────────────────────────────────────────────────────

export type BarlineType = "single" | "double" | "repeat-start" | "repeat-end";

export type TEvent =
  | { kind: "chord";   notes: TNote[]; markings: TMarking[] }
  | { kind: "barline"; barlineType: BarlineType; markings: TMarking[] }
  | { kind: "default"; markings: TMarking[] };

// ── Tablature ─────────────────────────────────────────────────────────────────

export interface TTuning {
  name: string;
  /** High → low, displayed top-to-bottom on the stave. Length = stringCount. */
  strings: string[];
}

export const STANDARD_6_TUNING: TTuning = {
  name: "Standard",
  strings: ["E", "B", "G", "D", "A", "E"],
};

export const STANDARD_4_BASS_TUNING: TTuning = {
  name: "Bass (Standard)",
  strings: ["G", "D", "A", "E"],
};

export interface TTablature {
  tuning: TTuning;
  events: TEvent[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function emptyTablature(tuning = STANDARD_6_TUNING): TTablature {
  // Start with one empty default event so the stave has something to show.
  return { tuning, events: [{ kind: "default", markings: [] }] };
}

export function getStringCount(t: TTablature): number {
  return t.tuning.strings.length;
}

export function isChord(e: TEvent): e is Extract<TEvent, { kind: "chord" }> {
  return e.kind === "chord";
}
export function isBarline(e: TEvent): e is Extract<TEvent, { kind: "barline" }> {
  return e.kind === "barline";
}
export function isDefault(e: TEvent): e is Extract<TEvent, { kind: "default" }> {
  return e.kind === "default";
}
export function isEmpty(e: TEvent): boolean {
  if (e.kind !== "chord") return true;
  return e.notes.length === 0;
}

export function getEventMarkings<T extends EventMarkingType>(
  e: TEvent, type: T,
): Extract<EventMarking, { type: T }>[] {
  return e.markings.filter((m): m is Extract<EventMarking, { type: T }> => m.type === type);
}
export function getNoteMarkings<T extends NoteMarkingType>(
  e: TEvent, type: T,
): Extract<NoteMarking, { type: T }>[] {
  return e.markings.filter((m): m is Extract<NoteMarking, { type: T }> => m.type === type);
}
export function hasMarking(e: TEvent, type: TMarking["type"]): boolean {
  return e.markings.some((m) => m.type === type);
}
