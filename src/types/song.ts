/**
 * Song / section / progression model. Timing is stored as explicit `beats` per slot (always
 * summing to the bar's beat count) so the rhythm is unambiguous in any time signature — the
 * `-` / `//` shorthand is only an input/render convenience layered on top.
 */
import type { Chord, Feel, Key, TimeSignature } from "./music";
import type { TabBlock, Tuning } from "./tab";

/** A slot occupies part of a bar. `rest` = empty bar/beat (the whole-bar `//`); `nc` = N.C. */
export const SLOT_KINDS = ["chord", "rest", "nc"] as const;
export type SlotKind = (typeof SLOT_KINDS)[number];

export type Slot =
  | { kind: "chord"; chord: Chord; beats: number }
  | { kind: "rest"; beats: number }
  | { kind: "nc"; beats: number };

/** Navigation markers placed at a bar (a symbol drawn on/above the bar). */
export const BAR_MARKS = ["segno", "coda", "to-coda", "fine"] as const;
export type BarMark = (typeof BAR_MARKS)[number];

/** Navigation directives written after a bar. */
export const JUMPS = [
  "D.C.", "D.S.", "D.C. al Coda", "D.S. al Coda", "D.C. al Fine", "D.S. al Fine",
] as const;
export type Jump = (typeof JUMPS)[number];

export interface Bar {
  /** Chords/rests within the bar; their `beats` sum to the (section/song) time signature. */
  slots: Slot[];
  /** `|:` opens a repeated span. */
  repeatStart?: boolean;
  /** `:|` closes a repeated span. */
  repeatEnd?: boolean;
  /** Play count shown at the repeat-end (default 2). The whiteboard's "×2" phrase repeat. */
  repeatCount?: number;
  /** 1st / 2nd ending bracket starts at this bar. */
  ending?: number;
  /** Simile — repeat the previous bar (`%` / 𝄎). When set, the slots are ignored on playback. */
  repeatPrevious?: boolean;
  /** A navigation symbol on this bar (Segno, Coda, To Coda, Fine). */
  mark?: BarMark;
  /** A navigation directive after this bar (D.C./D.S. variants). */
  jump?: Jump;
}

export interface ChordProgression {
  bars: Bar[];
}

export interface Section {
  id: string;
  /** "Verse 1", "Chorus", "Outro Fingerpicking", "12 Bar Blues". */
  label: string;
  /** Overrides the song default (e.g. a 3/4 section inside a 4/4 song — see the whiteboard). */
  timeSignature?: TimeSignature;
  /** Overrides the song default feel (e.g. a "shuffle/swing" section). */
  feel?: Feel;
  /** Whole-section repeat count — the "×2" written over an entire phrase. Default 1. */
  repeatCount?: number;
  chords?: ChordProgression;
  tab?: TabBlock;
  /** Optional free-text cue (lyric line, "let ring", reminder). Hidden in the UI when empty. */
  note?: string;
  /** Reuse another section by id ("Chorus 2 = Chorus") instead of duplicating its content. */
  repeatOf?: string;
}

export interface Song {
  id: string;
  title: string;
  /** Artist / band / "extra info". */
  subtitle?: string;
  key?: Key;
  /** Beats per minute. */
  tempo?: number;
  /** Song-level default; individual sections may override. */
  timeSignature: TimeSignature;
  /** Song-level default feel; sections may override. */
  feel?: Feel;
  /** Capo fret; 0 or undefined = none. */
  capo?: number;
  tuning: Tuning;
  tags: string[];
  favorite?: boolean;
  sections: Section[];
  /** Epoch milliseconds. */
  createdAt: number;
  updatedAt: number;
}
