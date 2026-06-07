/**
 * Tab rendering engine. The column model guarantees alignment: every column has a single
 * width (the widest token across all strings, e.g. a `12` makes the column 2 wide), and each
 * string's cell is padded with `-` to that width. Multi-digit frets therefore never push the
 * other strings out of vertical alignment — the class of bug that plagues text-based tabs.
 */
import type { TabBlock, TabCell, Technique } from "../../types/tab";

/** Inline connector symbol placed before a fret (e.g. the `h` in `5h7`). */
const CONNECTOR: Partial<Record<Technique, string>> = {
  h: "h", p: "p", "/": "/", "\\": "\\", b: "b", r: "r", "~": "~", t: "t", tr: "tr",
};

/** The visible token for a cell, without padding (e.g. "12", "x", "(7)", "h5"). "" if empty. */
export function cellToken(cell: TabCell | null): string {
  if (!cell) return "";
  const fret = cell.fret === "x" ? "x" : String(cell.fret);
  const body = cell.ghost ? `(${fret})` : fret;
  const connector = cell.connectorBefore ? (CONNECTOR[cell.connectorBefore] ?? "") : "";
  return connector + body;
}

/**
 * Render a tab block to monospaced lines, one per string, high string on top (tab convention).
 * Every returned line has identical length, so they stack perfectly in a `<pre>`/mono block.
 */
export function renderTabLines(block: TabBlock): string[] {
  const { stringCount, columns, tuning } = block;

  // Token grid [string][column] and per-column width.
  const widths = columns.map((col) => {
    let w = 1;
    for (let s = 0; s < stringCount; s++) {
      w = Math.max(w, cellToken(col.cells[s] ?? null).length);
    }
    return w;
  });

  // String labels (high→low). tuning.strings is low→high; reverse for display.
  const labels: string[] = [];
  for (let s = stringCount - 1; s >= 0; s--) {
    labels.push((tuning.strings[s] ?? "").padStart(2, " "));
  }

  const lines: string[] = [];
  for (let display = 0; display < stringCount; display++) {
    const stringIndex = stringCount - 1 - display; // map display row → low→high index
    let line = `${labels[display]}|`;
    columns.forEach((col, c) => {
      const token = cellToken(col.cells[stringIndex] ?? null);
      // Pad the token with trailing dashes to the column width, plus a leading dash separator.
      line += "-" + token + "-".repeat(widths[c] - token.length);
    });
    line += "-|";
    lines.push(line);
  }
  return lines;
}

/** Convenience: render to a single newline-joined string. */
export function renderTab(block: TabBlock): string {
  return renderTabLines(block).join("\n");
}

/** An empty column for a given string count (all strings silent). */
export function emptyColumn(stringCount: number) {
  return { cells: Array.from({ length: stringCount }, () => null) as (TabCell | null)[] };
}
