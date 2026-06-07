/**
 * Chord + rhythmic-shorthand engine. Data-first: the structured `ChordProgression` is the
 * source of truth; the `|`-delimited shorthand is parsed into / rendered from it.
 *
 * Shorthand (within a bar, whitespace-separated):
 *   `G`        one chord, whole bar
 *   `G - Em`   even split (the `-` separates two chords evenly)
 *   `G // D`   weighted 3:1 — `G` gets 3/4, `D` gets 1/4
 *   `G //`     `G` 3/4 then a 1/4 rest
 *   `//`       empty bar (full rest)
 *   `N.C.`     no chord
 * Timing is stored as explicit integer `beats` per slot, summing to the time signature's
 * numerator, so it is unambiguous in any meter.
 */
import { QUALITIES } from "../../types/music";
import type { Bar, ChordProgression, Slot } from "../../types/song";
import type { Chord, Note, Quality, TimeSignature } from "../../types/music";

/** Quality → display suffix (e.g. min → "m", maj → ""). */
const QUALITY_SUFFIX: Record<Quality, string> = {
  maj: "", min: "m", dim: "dim", aug: "aug", "5": "5", "6": "6", "7": "7",
  maj7: "maj7", m7: "m7", m7b5: "m7b5", dim7: "dim7", sus2: "sus2", sus4: "sus4",
  "7sus4": "7sus4", add9: "add9", "6/9": "6/9", "9": "9", maj9: "maj9", m9: "m9",
  "11": "11", "13": "13", "7b9": "7b9", "7#9": "7#9", "7#5": "7#5", "7b5": "7b5",
};

/** Suffixes sorted longest-first so e.g. "m7b5" wins over "m" / "m7" when parsing. */
const SUFFIX_TO_QUALITY: Array<[string, Quality]> = QUALITIES
  .map((q) => [QUALITY_SUFFIX[q], q] as [string, Quality])
  .sort((a, b) => b[0].length - a[0].length);

const NOTE_RE = /^[A-G][#b]?$/;

/** Render a chord to its display string, e.g. `{root:"D",quality:"maj",bass:"F#"}` → "D/F#". */
export function formatChord(chord: Chord): string {
  const base = chord.root + QUALITY_SUFFIX[chord.quality];
  return chord.bass ? `${base}/${chord.bass}` : base;
}

/** Parse a chord token, e.g. "Am7", "D/F#", "Bdim7", "C6/9". Returns null if unrecognized. */
export function parseChord(token: string): Chord | null {
  let body = token.trim();
  if (!body) return null;

  // Slash bass: a trailing "/<Note>". Done before quality parsing so "6/9" isn't mistaken
  // for a bass (9 is not a note).
  let bass: Note | undefined;
  const slash = body.lastIndexOf("/");
  if (slash > 0) {
    const maybeBass = body.slice(slash + 1);
    if (NOTE_RE.test(maybeBass)) {
      bass = maybeBass as Note;
      body = body.slice(0, slash);
    }
  }

  const rootMatch = body.match(/^[A-G][#b]?/);
  if (!rootMatch) return null;
  const root = rootMatch[0] as Note;
  const suffix = body.slice(root.length);

  const found = SUFFIX_TO_QUALITY.find(([s]) => s === suffix);
  if (!found) return null;
  return { root, quality: found[1], bass };
}

/** Largest-remainder apportionment: split `total` integer beats by `weights`, summing exactly. */
export function distributeBeats(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const beats = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    beats[order[k].i] += 1;
  }
  return beats;
}

const WEIGHT_EVEN = [1, 1];
const WEIGHT_3_1 = [3, 1];

/** Parse one bar's inner content (no surrounding `|`) into a structured `Bar`. */
export function parseBar(content: string, ts: TimeSignature): Bar {
  const full = ts.numerator;
  const tokens = content.trim().split(/\s+/).filter(Boolean);
  const chords: Chord[] = [];
  const seps: Array<"-" | "//"> = [];
  let nc = false;

  for (const t of tokens) {
    if (t === "-") seps.push("-");
    else if (t === "//") seps.push("//");
    else if (t === "N.C." || t === "NC" || t === "n.c.") nc = true;
    else {
      const c = parseChord(t);
      if (c) chords.push(c);
    }
  }

  const trailingSlash = tokens[tokens.length - 1] === "//";

  let slots: Slot[];
  if (chords.length === 0) {
    slots = nc ? [{ kind: "nc", beats: full }] : [{ kind: "rest", beats: full }];
  } else if (chords.length === 1) {
    if (trailingSlash) {
      const [b0, b1] = distributeBeats(WEIGHT_3_1, full);
      slots = [{ kind: "chord", chord: chords[0], beats: b0 }, { kind: "rest", beats: b1 }];
    } else {
      slots = [{ kind: "chord", chord: chords[0], beats: full }];
    }
  } else if (chords.length === 2) {
    const weights = seps[0] === "//" ? WEIGHT_3_1 : WEIGHT_EVEN;
    const [b0, b1] = distributeBeats(weights, full);
    slots = [
      { kind: "chord", chord: chords[0], beats: b0 },
      { kind: "chord", chord: chords[1], beats: b1 },
    ];
  } else {
    const beats = distributeBeats(chords.map(() => 1), full);
    slots = chords.map((chord, i) => ({ kind: "chord", chord, beats: beats[i] }));
  }

  return { slots };
}

/** Render a structured `Bar` back to shorthand (inner content, no surrounding `|`). */
export function formatBar(bar: Bar): string {
  const { slots } = bar;
  if (slots.length === 0) return "//";
  if (slots.length === 1) {
    const s = slots[0];
    if (s.kind === "rest") return "//";
    if (s.kind === "nc") return "N.C.";
    return formatChord(s.chord);
  }
  if (slots.length === 2) {
    const [a, b] = slots;
    // chord + trailing rest → "C //"
    if (a.kind === "chord" && b.kind === "rest") return `${formatChord(a.chord)} //`;
    if (a.kind === "chord" && b.kind === "chord") {
      const sep = a.beats > b.beats ? "//" : "-";
      return `${formatChord(a.chord)} ${sep} ${formatChord(b.chord)}`;
    }
  }
  // Fallback: list chords/markers evenly.
  return slots
    .map((s) => (s.kind === "chord" ? formatChord(s.chord) : s.kind === "nc" ? "N.C." : "//"))
    .join(" - ");
}

/** Parse a full `|`-delimited progression string into a `ChordProgression`. */
export function parseProgression(input: string, ts: TimeSignature): ChordProgression {
  const bars = input
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((content) => parseBar(content, ts));
  return { bars };
}

/** Render a `ChordProgression` to its `| ... | ... |` shorthand string. */
export function formatProgression(prog: ChordProgression): string {
  if (prog.bars.length === 0) return "";
  return `| ${prog.bars.map(formatBar).join(" | ")} |`;
}
