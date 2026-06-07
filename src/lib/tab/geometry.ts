/**
 * Geometry engine for the guitar tab stave — ported 1:1 from the my-guitar-tabs source
 * (services/renderer/geometry.ts + tablature-style.ts).
 *
 * Conventions:
 * - stringIndex 0 = TOP string (high e). tuning.strings[0] is the top label. No reversal.
 * - EVERY event consumes one column, including barlines (matches LayoutEngine).
 * - Positions are measured from the top-left of the SVG.
 * - Scaling: event/string/row-padding scale with `scale`; global padding (top/left/right) does NOT.
 */
import type { TEvent } from "../../types/tablature";
import { hasMarking } from "../../types/tablature";

export interface StyleConstants {
  eventWidth: number;        // 30
  stringGap: number;         // 13  (center-to-center between strings)
  paddingLeft: number;       // 24  (tuning labels live here)
  paddingRight: number;      // 24
  paddingTop: number;        // 65  (room above the first row for annotations/P.M.)
  rowPaddingTop: number;     // 45  (per-row top padding)
  rowPaddingBottom: number;  // 30  (per-row bottom padding)
  scale: number;
}

export const DEFAULT_STYLE: StyleConstants = {
  eventWidth: 30,
  stringGap: 13,
  paddingLeft: 24,
  paddingRight: 24,
  paddingTop: 65,
  rowPaddingTop: 45,
  rowPaddingBottom: 30,
  scale: 1,
};

export const EXTRA_ROWS = 1;

export interface NotePosition {
  eventIndex: number;
  stringIndex: number;
}
export interface Point { x: number; y: number; }

export class TabGeometry {
  private rows: number[][];

  constructor(
    private readonly events: TEvent[],
    private readonly stringCount: number,
    private readonly containerWidth: number,
    private readonly style: StyleConstants = DEFAULT_STYLE,
  ) {
    this.rows = this.computeRows();
  }

  // Scaled dimensions.
  ew() { return this.style.eventWidth * this.style.scale; }
  sg() { return this.style.stringGap * this.style.scale; }
  rpt() { return this.style.rowPaddingTop * this.style.scale; }
  rpb() { return this.style.rowPaddingBottom * this.style.scale; }
  // Unscaled (global) paddings.
  pl() { return this.style.paddingLeft; }
  pr() { return this.style.paddingRight; }
  pt() { return this.style.paddingTop; }

  staveWidth() { return this.containerWidth - this.pl() - this.pr(); }
  innerRowHeight() { return this.sg() * (this.stringCount - 1); }
  totalRowHeight() { return this.innerRowHeight() + this.rpt() + this.rpb(); }
  maxEventsPerRow() { return Math.max(1, Math.floor(this.staveWidth() / this.ew())); }

  getRows() { return this.rows; }
  rowCount() { return this.rows.length; }

  /** Build rows: every event consumes a column; line-break or row overflow starts a new row. */
  private computeRows(): number[][] {
    const max = this.maxEventsPerRow();
    const rows: number[][] = [];
    let cur: number[] = [];
    for (let i = 0; i < this.events.length; i++) {
      cur.push(i);
      const lineBreak = hasMarking(this.events[i], "line-break");
      if (cur.length >= max || lineBreak) {
        rows.push(cur);
        cur = [];
      }
    }
    if (cur.length) rows.push(cur);
    if (rows.length === 0) rows.push([]);
    return rows;
  }

  /** Top-left of a row's first string. */
  rowPoint(row: number): Point {
    return { x: this.pl(), y: row * this.totalRowHeight() + this.pt() };
  }

  /** Row + index-within-row for an event. */
  eventLayout(eventIndex: number): { row: number; indexInRow: number } | null {
    for (let r = 0; r < this.rows.length; r++) {
      const idx = this.rows[r].indexOf(eventIndex);
      if (idx >= 0) return { row: r, indexInRow: idx };
    }
    return null;
  }

  /** Center x of an event column within its row, plus the row's string-0 y. */
  eventPoint(eventIndex: number): Point | null {
    const layout = this.eventLayout(eventIndex);
    if (!layout) return null;
    const rp = this.rowPoint(layout.row);
    const x = this.pl() + this.ew() / 2 + layout.indexInRow * this.ew();
    return { x, y: rp.y };
  }

  /** Center point of a note (event center x, string y). */
  notePoint(eventIndex: number, stringIndex: number): Point | null {
    const ep = this.eventPoint(eventIndex);
    if (!ep) return null;
    return { x: ep.x, y: ep.y + stringIndex * this.sg() };
  }

  /** End x of the stave (right edge minus right padding). */
  staveEndX() { return this.containerWidth - this.pr(); }

  totalHeight() {
    return this.rows.length * this.totalRowHeight() + this.pt();
  }

  /** Map a click point → NotePosition (or null). */
  pointToNotePosition(px: number, py: number): NotePosition | null {
    const normalizedY = py - this.pt() + this.rpt();
    const row = Math.floor(normalizedY / this.totalRowHeight());
    if (row < 0 || row >= this.rows.length) return null;

    const rp = this.rowPoint(row);
    const stringIndex = Math.round((py - rp.y) / this.sg());
    if (stringIndex < 0 || stringIndex > this.stringCount - 1) return null;

    const eventInRow = Math.floor((px - this.pl()) / this.ew());
    if (eventInRow < 0 || eventInRow > this.rows[row].length - 1) return null;

    return { eventIndex: this.rows[row][eventInRow], stringIndex };
  }
}
