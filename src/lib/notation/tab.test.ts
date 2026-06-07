import { describe, it, expect } from "vitest";
import { cellToken, renderTabLines } from "./tab";
import { STANDARD_TUNING, type TabBlock } from "../../types/tab";

describe("cellToken", () => {
  it("renders frets, dead notes, ghosts, and connectors", () => {
    expect(cellToken({ fret: 12 })).toBe("12");
    expect(cellToken({ fret: "x" })).toBe("x");
    expect(cellToken({ fret: 5, ghost: true })).toBe("(5)");
    expect(cellToken({ fret: 7, connectorBefore: "h" })).toBe("h7");
    expect(cellToken(null)).toBe("");
  });
});

describe("renderTabLines alignment", () => {
  // cells index: 0 = low E (6th string) ... 5 = high e (1st string)
  const block: TabBlock = {
    stringCount: 6,
    tuning: STANDARD_TUNING,
    columns: [
      { cells: [null, null, null, null, null, { fret: 3 }] }, // high e: 3
      { cells: [null, null, null, { fret: 12 }, null, null] }, // G string: 12 (multi-digit)
      { cells: [{ fret: 0 }, null, null, null, null, null] }, // low E: 0
    ],
  };

  it("returns one line per string, all equal length (multi-digit stays aligned)", () => {
    const lines = renderTabLines(block);
    expect(lines).toHaveLength(6);
    const len = lines[0].length;
    expect(lines.every((l) => l.length === len)).toBe(true);
  });

  it("places frets on the correct strings with high e on top", () => {
    const lines = renderTabLines(block);
    expect(lines[0]).toContain("3"); // top line = high e
    expect(lines[0].trimStart().startsWith("e|") || lines[0].includes("E|")).toBe(true);
    expect(lines.some((l) => l.includes("12"))).toBe(true); // the 12 is present
    expect(lines[5]).toContain("0"); // bottom line = low E
  });
});
