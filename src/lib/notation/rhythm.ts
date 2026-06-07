/**
 * Rhythm subdivision engine. A bar of `total` beats is partitioned into slots whose `beats`
 * sum to `total`. Following the chord-chart convention (iReal Pro et al.), chords land on
 * beats — so any beat-aligned partition is expressible: 1, ½ ½, ¼ ¼ ¼ ¼, ¾ ¼, ¼ ¾, ½ ¼ ¼, etc.
 */
import { distributeBeats } from "./chords";
import type { Bar, Chord, Slot } from "../../types";

const chordOf = (s: Slot): Chord | undefined => (s.kind === "chord" ? s.chord : undefined);

/** Start beat (offset from bar start) of each slot. */
export function slotStarts(bar: Bar): number[] {
  const starts: number[] = [];
  let acc = 0;
  for (const s of bar.slots) {
    starts.push(acc);
    acc += s.beats;
  }
  return starts;
}

/** Reshape a bar to the given beat weights, preserving existing chords by slot index. */
export function applyWeights(bar: Bar, weights: number[], total: number): Bar {
  const beats = weights.reduce((a, b) => a + b, 0) === total ? weights : distributeBeats(weights, total);
  const chords = bar.slots.map(chordOf);
  return {
    ...bar,
    slots: beats.map((b, i): Slot =>
      chords[i] ? { kind: "chord", chord: chords[i]!, beats: b } : { kind: "rest", beats: b },
    ),
  };
}

/** Insert a slot boundary at `beat`, splitting the containing slot (right portion becomes a rest). */
export function splitAtBeat(bar: Bar, beat: number, total: number): Bar {
  if (beat <= 0 || beat >= total) return bar;
  const starts = slotStarts(bar);
  for (let i = 0; i < bar.slots.length; i++) {
    const start = starts[i];
    const end = start + bar.slots[i].beats;
    if (beat === start) return bar; // boundary already exists
    if (beat > start && beat < end) {
      const left: Slot = { ...bar.slots[i], beats: beat - start };
      const right: Slot = { kind: "rest", beats: end - beat };
      return { ...bar, slots: [...bar.slots.slice(0, i), left, right, ...bar.slots.slice(i + 1)] };
    }
  }
  return bar;
}

/** Remove the boundary starting at `beat`, merging that slot into the previous one. */
export function mergeAtBeat(bar: Bar, beat: number): Bar {
  const idx = slotStarts(bar).indexOf(beat);
  if (idx <= 0) return bar;
  const prev = bar.slots[idx - 1];
  const cur = bar.slots[idx];
  const merged: Slot = { ...prev, beats: prev.beats + cur.beats };
  return { ...bar, slots: [...bar.slots.slice(0, idx - 1), merged, ...bar.slots.slice(idx + 1)] };
}

/** True if a slot boundary starts at `beat`. */
export function hasBoundaryAt(bar: Bar, beat: number): boolean {
  return slotStarts(bar).includes(beat);
}

export function setSlotChord(bar: Bar, idx: number, chord: Chord): Bar {
  return { ...bar, slots: bar.slots.map((s, i) => (i === idx ? { kind: "chord", chord, beats: s.beats } : s)) };
}

export function clearSlot(bar: Bar, idx: number): Bar {
  return { ...bar, slots: bar.slots.map((s, i) => (i === idx ? { kind: "rest", beats: s.beats } : s)) };
}

/** Curated quick partitions for a bar of `total` beats. */
export function commonPatterns(total: number): number[][] {
  const out: number[][] = [[total]];
  if (total % 2 === 0) out.push([total / 2, total / 2]);
  if (total >= 2) out.push([total - 1, 1], [1, total - 1]);
  if (total === 4) out.push([2, 1, 1], [1, 1, 2], [1, 2, 1]);
  if (total === 6) out.push([3, 3], [2, 2, 2], [4, 2], [2, 4]);
  out.push(Array.from({ length: total }, () => 1)); // every beat
  const seen = new Set<string>();
  return out.filter((p) => {
    const key = p.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const FRACTIONS: Record<string, string> = {
  "1/1": "1", "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾",
  "1/6": "⅙", "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** A beat count as a fraction of the bar, e.g. 3 of 4 → "¾". */
export function fractionLabel(beats: number, total: number): string {
  const g = gcd(beats, total) || 1;
  const n = beats / g;
  const d = total / g;
  return FRACTIONS[`${n}/${d}`] ?? `${n}/${d}`;
}

/** A whole-pattern label, e.g. [3,1] of 4 → "¾ ¼". */
export function patternLabel(weights: number[], total: number): string {
  return weights.map((w) => fractionLabel(w, total)).join(" ");
}
