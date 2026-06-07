/**
 * Guitar tablature model. Uses a COLUMN model (a beat/position = one column, all strings
 * advance together) rather than raw text — this is what guarantees multi-digit frets (10, 12)
 * stay vertically aligned. On render, each column pads `-` on the strings with no event.
 */
import type { Barline } from "./music";

export interface Tuning {
  /** Display name, e.g. "Standard", "Drop D", "DADGAD", "Eb". */
  name: string;
  /** Open-string pitches, low (6th string) → high (1st string), e.g. ["E","A","D","G","B","E"]. */
  strings: string[];
}

/**
 * Playing techniques. Inline connectors link two columns (e.g. `5h7`); above-staff annotations
 * (P.M., let ring, harmonic) span columns. Stored as a small enum so the AI can emit them.
 */
export const TECHNIQUES = [
  "h",        // hammer-on
  "p",        // pull-off
  "/",        // slide up
  "\\",       // slide down
  "b",        // bend
  "r",        // release
  "~",        // vibrato
  "t",        // tap
  "tr",       // trill
  "pm",       // palm mute (above-staff)
  "let-ring", // (above-staff)
  "harmonic", // natural/pinch harmonic (above-staff)
  "tremolo",  // (above-staff)
  "slap",     // bass
  "pop",      // bass
] as const;
export type Technique = (typeof TECHNIQUES)[number];

export interface TabCell {
  /** Fret number, or "x" for a dead/muted note. */
  fret: number | "x";
  /** Technique linking from the previous column on this string (e.g. the `h` in `5h7`). */
  connectorBefore?: Technique;
  /** Ghost note, rendered `(n)`. */
  ghost?: boolean;
}

/** One horizontal position. Index = string (low→high); `null` = no event on that string ("-"). */
export interface TabColumn {
  cells: (TabCell | null)[];
  /** Barline drawn before this column, if any. */
  barline?: Barline;
  /** Above-staff annotations active at this column (P.M., let ring, harmonic...). */
  annotations?: Technique[];
}

export interface TabBlock {
  /** 6 = guitar (default), 4 = bass, 7 / 8 = extended range. */
  stringCount: number;
  tuning: Tuning;
  columns: TabColumn[];
}

export const STANDARD_TUNING: Tuning = {
  name: "Standard",
  strings: ["E", "A", "D", "G", "B", "E"],
};

export const COMMON_TUNINGS: Tuning[] = [
  STANDARD_TUNING,
  { name: "Drop D", strings: ["D", "A", "D", "G", "B", "E"] },
  { name: "Eb (half-step down)", strings: ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"] },
  { name: "Drop C", strings: ["C", "G", "C", "F", "A", "D"] },
  { name: "DADGAD", strings: ["D", "A", "D", "G", "A", "D"] },
  { name: "Open G", strings: ["D", "G", "D", "G", "B", "D"] },
  { name: "Open D", strings: ["D", "A", "D", "F#", "A", "D"] },
  { name: "Bass (4-string)", strings: ["E", "A", "D", "G"] },
];
