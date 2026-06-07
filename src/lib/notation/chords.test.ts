import { describe, it, expect } from "vitest";
import {
  parseChord,
  formatChord,
  parseBar,
  formatBar,
  parseProgression,
  formatProgression,
  distributeBeats,
} from "./chords";
import { DEFAULT_TIME_SIGNATURE, type TimeSignature } from "../../types/music";

const TS = DEFAULT_TIME_SIGNATURE; // 4/4
const THREE_FOUR: TimeSignature = { numerator: 3, denominator: 4 };

describe("parseChord / formatChord", () => {
  it("parses and round-trips common chords", () => {
    expect(parseChord("G")).toEqual({ root: "G", quality: "maj", bass: undefined });
    expect(parseChord("Am7")).toEqual({ root: "A", quality: "m7", bass: undefined });
    expect(parseChord("Bdim7")).toEqual({ root: "B", quality: "dim7", bass: undefined });
    expect(parseChord("Csus4")).toEqual({ root: "C", quality: "sus4", bass: undefined });
    expect(formatChord({ root: "A", quality: "m7" })).toBe("Am7");
    expect(formatChord({ root: "B", quality: "dim7" })).toBe("Bdim7");
    expect(formatChord({ root: "G", quality: "maj" })).toBe("G");
  });

  it("handles slash chords without confusing the 6/9 quality", () => {
    expect(parseChord("D/F#")).toEqual({ root: "D", quality: "maj", bass: "F#" });
    expect(formatChord({ root: "D", quality: "maj", bass: "F#" })).toBe("D/F#");
    expect(parseChord("C6/9")).toEqual({ root: "C", quality: "6/9", bass: undefined });
    expect(formatChord({ root: "C", quality: "6/9" })).toBe("C6/9");
  });

  it("returns null for non-chords", () => {
    expect(parseChord("H")).toBeNull();
    expect(parseChord("xyz")).toBeNull();
    expect(parseChord("")).toBeNull();
  });
});

describe("distributeBeats", () => {
  it("apportions integer beats summing exactly to the total", () => {
    expect(distributeBeats([3, 1], 4)).toEqual([3, 1]);
    expect(distributeBeats([1, 1], 4)).toEqual([2, 2]);
    expect(distributeBeats([1, 1], 3)).toEqual([2, 1]); // front-loaded remainder
    expect(distributeBeats([3, 1], 3)).toEqual([2, 1]);
    expect(distributeBeats([1, 1, 1], 4)).toEqual([2, 1, 1]);
  });
});

describe("parseBar", () => {
  it("one chord fills the bar", () => {
    expect(parseBar("G", TS).slots).toEqual([{ kind: "chord", chord: parseChord("G"), beats: 4 }]);
  });
  it("even split with -", () => {
    const { slots } = parseBar("G - Em", TS);
    expect(slots.map((s) => s.beats)).toEqual([2, 2]);
    expect(slots.every((s) => s.kind === "chord")).toBe(true);
  });
  it("weighted 3:1 with //", () => {
    expect(parseBar("G // D", TS).slots.map((s) => s.beats)).toEqual([3, 1]);
  });
  it("trailing // = chord 3/4 then rest", () => {
    const { slots } = parseBar("G //", TS);
    expect(slots).toEqual([
      { kind: "chord", chord: parseChord("G"), beats: 3 },
      { kind: "rest", beats: 1 },
    ]);
  });
  it("// alone = full-bar rest (empty bar)", () => {
    expect(parseBar("//", TS).slots).toEqual([{ kind: "rest", beats: 4 }]);
  });
  it("N.C. = no chord", () => {
    expect(parseBar("N.C.", TS).slots).toEqual([{ kind: "nc", beats: 4 }]);
  });
  it("respects a non-4/4 time signature", () => {
    expect(parseBar("Am - D", THREE_FOUR).slots.map((s) => s.beats)).toEqual([2, 1]);
  });
});

describe("formatBar round-trips", () => {
  for (const s of ["G", "G - Em", "G // D", "G //", "//", "Am7", "D/F#"]) {
    it(`"${s}"`, () => {
      expect(formatBar(parseBar(s, TS))).toBe(s);
    });
  }
});

describe("progression round-trip (the whiteboard 'I Me Mine' bars)", () => {
  it("parses and re-renders", () => {
    const input = "| Am | Am7 | D | D7 | G | E |";
    const prog = parseProgression(input, TS);
    expect(prog.bars).toHaveLength(6);
    expect(formatProgression(prog)).toBe(input);
  });
  it("handles empty bars and weighted bars together", () => {
    const input = "| Am7 // D7 | G | // |";
    const prog = parseProgression(input, TS);
    expect(prog.bars).toHaveLength(3);
    expect(prog.bars[2].slots).toEqual([{ kind: "rest", beats: 4 }]);
    expect(formatProgression(prog)).toBe(input);
  });
});
