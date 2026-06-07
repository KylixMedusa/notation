/**
 * Core musical primitives. These types are intentionally plain, serializable, and
 * enum-constrained so they can double as the JSON Schema the AI vision model fills when
 * extracting a chart from a screenshot (see `api/extract-chart`). Enum `const` arrays are
 * exported so the schema can be generated from a single source of truth.
 */

/** Pitch classes, both sharp and flat spellings allowed (key-aware spelling chosen on render). */
export const NOTES = [
  "A", "A#", "Bb", "B", "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab",
] as const;
export type Note = (typeof NOTES)[number];

/**
 * Chord qualities. Richer than a beginner set — real charts use slash chords, extensions, and
 * altered tensions (the example whiteboard alone needs `m7` and `dim7`).
 */
export const QUALITIES = [
  "maj", "min", "dim", "aug", "5", "6", "7", "maj7", "m7", "m7b5", "dim7",
  "sus2", "sus4", "7sus4", "add9", "6/9", "9", "maj9", "m9", "11", "13",
  "7b9", "7#9", "7#5", "7b5",
] as const;
export type Quality = (typeof QUALITIES)[number];

export interface Chord {
  root: Note;
  quality: Quality;
  /** Slash-chord bass note, e.g. the `F#` in `D/F#`. */
  bass?: Note;
}

/** Beats-per-bar and the beat unit, e.g. { numerator: 3, denominator: 4 } for 3/4. */
export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export const DEFAULT_TIME_SIGNATURE: TimeSignature = { numerator: 4, denominator: 4 };

/** Rhythmic feel — the whiteboard's "shuffle / swing" annotation. */
export const FEELS = ["straight", "shuffle", "swing"] as const;
export type Feel = (typeof FEELS)[number];

export const MODES = ["major", "minor"] as const;
export type Mode = (typeof MODES)[number];

/** Song key, e.g. { tonic: "G", mode: "major" } → "G Major". */
export interface Key {
  tonic: Note;
  mode: Mode;
}

/**
 * Barline kinds, shared by chord bars and tab columns. `repeat-start`/`repeat-end` carry an
 * optional play count (the `×2` / `:||` cases) on the owning bar.
 */
export const BARLINES = ["single", "double", "repeat-start", "repeat-end"] as const;
export type Barline = (typeof BARLINES)[number];
