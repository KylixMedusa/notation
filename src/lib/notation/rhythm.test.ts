import { describe, it, expect } from "vitest";
import { parseBar } from "./chords";
import {
  applyWeights,
  commonPatterns,
  fractionLabel,
  mergeAtBeat,
  patternLabel,
  slotStarts,
  splitAtBeat,
} from "./rhythm";
import { DEFAULT_TIME_SIGNATURE } from "../../types/music";

const TS = DEFAULT_TIME_SIGNATURE; // 4/4

describe("applyWeights", () => {
  it("reshapes to a partition, preserving chords by index", () => {
    const bar = parseBar("G - Em", TS); // [G:2, Em:2]
    const quarters = applyWeights(bar, [1, 1, 1, 1], 4);
    expect(quarters.slots.map((s) => s.beats)).toEqual([1, 1, 1, 1]);
    expect(quarters.slots[0]).toMatchObject({ kind: "chord" });
    expect(quarters.slots[1]).toMatchObject({ kind: "chord" }); // Em kept at index 1
    expect(quarters.slots[2].kind).toBe("rest");
  });
  it("supports ¾ ¼ and ¼ ¾", () => {
    const bar = parseBar("C", TS);
    expect(applyWeights(bar, [3, 1], 4).slots.map((s) => s.beats)).toEqual([3, 1]);
    expect(applyWeights(bar, [1, 3], 4).slots.map((s) => s.beats)).toEqual([1, 3]);
  });
});

describe("splitAtBeat / mergeAtBeat", () => {
  it("splits a whole bar at beat 2 into 2+2", () => {
    const bar = parseBar("C", TS);
    const split = splitAtBeat(bar, 2, 4);
    expect(split.slots.map((s) => s.beats)).toEqual([2, 2]);
    expect(slotStarts(split)).toEqual([0, 2]);
  });
  it("ignores a boundary that already exists", () => {
    const bar = parseBar("G - Em", TS);
    expect(splitAtBeat(bar, 2, 4).slots).toHaveLength(2);
  });
  it("merges a boundary back", () => {
    const bar = applyWeights(parseBar("C", TS), [1, 1, 1, 1], 4);
    const merged = mergeAtBeat(bar, 2); // remove boundary at beat 2 → slots 1&2 combine
    expect(merged.slots.map((s) => s.beats)).toEqual([1, 2, 1]);
  });
});

describe("commonPatterns", () => {
  it("every pattern sums to the total", () => {
    for (const total of [2, 3, 4, 6]) {
      for (const p of commonPatterns(total)) {
        expect(p.reduce((a, b) => a + b, 0)).toBe(total);
      }
    }
  });
  it("includes the user's 4/4 combinations", () => {
    const sigs = commonPatterns(4).map((p) => p.join(","));
    expect(sigs).toEqual(expect.arrayContaining(["4", "2,2", "3,1", "1,3", "1,1,1,1"]));
  });
});

describe("labels", () => {
  it("renders fractions", () => {
    expect(fractionLabel(4, 4)).toBe("1");
    expect(fractionLabel(2, 4)).toBe("½");
    expect(fractionLabel(3, 4)).toBe("¾");
    expect(fractionLabel(1, 4)).toBe("¼");
    expect(fractionLabel(1, 3)).toBe("⅓");
  });
  it("renders whole patterns", () => {
    expect(patternLabel([3, 1], 4)).toBe("¾ ¼");
    expect(patternLabel([1, 1, 1, 1], 4)).toBe("¼ ¼ ¼ ¼");
  });
});
