# The Acoustic Notebook — Build Plan

A mobile-first songwriter's journal for guitarists. This plan is written from the
perspective of *someone holding a guitar* — hands busy, phone on a stand, often
offline. Every feature is weighed against that reality.

---

## 1. Product principles (guitarist-first)

1. **Hands are on the guitar.** Anything needed mid-play must work without precise
   taps: large targets, auto-scroll, screen-stays-awake, foot-pedal/keyboard support.
2. **Capture must be instant.** An idea is fleeting. `+` goes straight to writing,
   not a long form. Title and metadata are optional and editable later.
3. **Never lose a sketch.** Autosave everything, offline-first, easy export/backup.
4. **Notation must be *correct*.** Real songs have slash chords, odd meters, repeats,
   multi-digit frets, alternate tunings. The data model handles these or the app is a toy.
5. **Performance ≠ editing.** Reading/playing is a distinct, locked mode; edits are explicit.
6. **It's a notebook, not a DAW.** Resist feature bloat; favour quiet, tactile focus.

---

## 2. Stack & architecture

- **React + TypeScript + Vite.**
- **HeroUI** (React Aria + Tailwind) as the design system, themed to the parchment/
  terracotta tokens. Framer Motion (bundled) for sheet/drawer motion.
- **Persistence: IndexedDB** (via `idb` or Dexie), **not** LocalStorage.
  Tabs/progressions can be large; LocalStorage's ~5 MB cap and string-only storage
  are a liability. IndexedDB gives structured records, larger quota, and async writes.
- **PWA / offline-first.** Installable, service-worker cached, fully usable with no
  network (garage, stage, plane). "Add to Home Screen."
- **State:** lightweight store (Zustand) for the active song + editor; IndexedDB is the
  source of truth, store is the working copy with debounced autosave.
- **Routing:** screen-per-route so back/forward and deep links behave.

### Layering
```
tokens (CSS vars + HeroUI theme)
  └─ primitives (HeroUI components, themed)
       └─ domain components (ChordGrid, TabStaff, TabKeyboard, ChordPicker)
            └─ screens
```
The **notation engines** (chord parser/renderer, tab column engine) are framework-agnostic
TypeScript modules with their own unit tests — they are the heart of the app and must be
correct independent of the UI.

---

## 3. Data model

Store data, render from structure. Never store the raw shorthand string as the source of truth.

```ts
type Song = {
  id: string;
  title: string;            // may be "" → shows auto-name "Untitled #N"
  subtitle?: string;        // artist/band/"extra info"
  key?: string;             // e.g. "G", "Am"
  tempo?: number;           // BPM
  timeSignature: [number, number]; // default [4,4] — drives all rhythm math
  capo?: number;            // fret; 0/undefined = none
  tuning: Tuning;           // affects tab string labels + transpose
  tags: string[];           // "fingerstyle", custom
  favorite?: boolean;
  createdAt: number;
  updatedAt: number;
  sections: Section[];
};

type Section = {
  id: string;
  label: string;            // "Verse 1", "Chorus", "Outro Fingerpicking"
  // A section can hold chords AND/OR a tab block AND/OR a note.
  chords?: ChordProgression;
  tab?: TabBlock;
  note?: string;            // free-text cue (lyric line, "let ring", etc.)
  repeatOf?: string;        // sectionId — "Chorus 2 = Chorus" reference, not a copy
};

type Tuning = {
  name: string;             // "Standard", "Drop D", "DADGAD", "Eb"
  strings: string[];        // low→high or high→low (pick one convention; see §5)
};
```

### Chord progression (beat-based, shorthand is just input)
```ts
type ChordProgression = { bars: Bar[]; };
type Bar = {
  slots: Slot[];            // chords + their durations within the bar
  repeat?: { start?: boolean; end?: boolean; count?: number; ending?: 1|2; };
  isRepeatPrevious?: boolean; // the "%" symbol
};
type Slot =
  | { kind: "chord"; chord: Chord; beats: number; }
  | { kind: "rest";  beats: number; }
  | { kind: "nc";    beats: number; }; // N.C. (no chord)

type Chord = {
  root: Note;               // C, C#, Db... key-aware spelling
  quality: string;          // see quality set in §4
  bass?: Note;              // slash chord D/F#
};
```
`beats` always sum to the bar's beat count (from `timeSignature`). The `-`/`//`/`///`
shorthand is a fast way to *set* beats; internally it's always explicit beats so timing
is unambiguous in any meter.

### Tab block (column model — critical, see §5)
```ts
type TabBlock = {
  stringCount: number;      // 6 default; 4 (bass), 7, 8
  tuning: Tuning;
  columns: TabColumn[];     // each column = one horizontal time position
};
type TabColumn = {
  cells: (TabCell | null)[];        // index = string; null = "-" (no event)
  barline?: "single" | "double" | "repeat-start" | "repeat-end";
  annotation?: TabAnnotation[];     // above-staff: P.M., let ring, harmonic span
};
type TabCell = {
  fret: number | "x";               // x = dead/muted
  connectorBefore?: Technique;      // h, p, /, \, b, r, ~, t ... links to prev column
  ghost?: boolean;                  // (x)
};
```
**Why columns, not text:** a `12` on one string must keep all six strings aligned at that
beat. A column-based model pads dashes automatically on render so alignment never breaks,
and copy/paste/insert operate on whole columns. Raw-text tab editors are exactly where
alignment bugs come from — we avoid that class of bug entirely.

---

## 4. Rhythmic shorthand — precise spec

Bars are delimited by `|`. Within a bar, chords are distributed across the bar's beats
(from the song's time signature; default 4/4 = 4 beats/bar).

| Input | Meaning | Beats in 4/4 |
|---|---|---|
| `\| G \|` | one chord, whole bar | G=4 |
| `\| G  Em \|` or `\| G - Em \|` | even split (the `-` is an explicit even separator) | G=2, Em=2 |
| `\| G  Em  C \|` | even three-way split | G=2, Em=1, C=1 *(see rule)* |
| `\| G // D \|` | **weighted 3:1**, chord before the slashes is longer | G=3, D=1 |
| `\| G // \|` | chord ¾, then ¼ rest | G=3, rest=1 |
| `\| // \|` | full-bar rest | rest=4 |
| `\| % \|` | repeat previous bar | (same as prev) |
| `\| N.C. \|` | no chord (silence/free) | — |

**Even-split rule for N chords:** beats are distributed as evenly as possible, front-loaded
when not divisible (4 beats ÷ 3 chords → 2,1,1). The bar builder always lets you override
to exact beats, so the shorthand is a *fast default*, not a constraint.

**Repeats & endings:** `||:` … `:||` with optional `x2`/`x4`, and `1.`/`2.` endings —
because real songs repeat sections and "play verse 4×" must be expressible without
copy-pasting bars.

### `//` weighting — DECIDED
`//` = 3:1 weighting. **`///` is dropped** to avoid ambiguity. The two shorthand modifiers
are `-` (even split) and `//` (3:1). For anything finer, the **bar builder sets explicit
beats per chord** — unambiguous in any time signature. The Rhythm & Weight toolbar therefore
exposes `-`, `//`, and an "explicit beats" control (no `///` button).

### Chord quality set (must be richer than the mockup's 6)
maj, min, dim, aug, **5** (power), 6, 7, maj7, m7, **m7b5** (half-dim), dim7, sus2, sus4,
7sus4, add9, 6/9, 9, maj9, m9, 11, 13, and altered tensions (7b9, 7#9, 7#5, 7b5).
Plus a **slash/bass-note selector** for D/F#, C/G, etc.

### Chord rendering edge cases
- **Enharmonic spelling is key-aware** (show Bb in F, A# in B). Default to the song's key;
  let the user flip a chord's spelling.
- **Bar wrapping** happens only at bar boundaries (never mid-bar), 4 bars/line on phones,
  fewer when narrow; proportional cell widths reflect beats.
- **Transpose** moves roots *and* bass notes; respects target-key spelling.
- **Invalid/partial input** (modifier with a missing neighbour) degrades to a rest, never crashes.

---

## 5. Tab engine — guitarist-critical detail

### Alignment (the hard problem)
- Column model guarantees all strings advance together. On render, each column's width =
  width of its widest cell (so `12` doesn't shove one string out of line); other strings
  pad with `-`. This is the single most important correctness requirement of the tab editor.

### Tunings & strings
- Support **Standard, Drop D, DADGAD, Open G/D, Eb (half-step down), Drop C**, plus custom.
- String labels reflect tuning (Drop D shows low `D`, not `E`). 7/8-string and **4-string
  bass** supported via `stringCount`.
- **Convention:** strings stored low→high internally; rendered high→low (tab standard:
  high e on top). Pick once, document, never mix.
- Capo applies to tabs too (affects sounding pitch / transpose suggestions).

### Techniques (the palette)
Inline connectors between frets: hammer-on `h`, pull-off `p`, slide up `/`, slide down `\`,
bend `b` (with amount: ½, full, 1½), release `r`, pre-bend, vibrato `~`, tap `t`,
trill `tr`, slap/pop (bass).
Above-staff annotations spanning columns: **P.M.** (palm mute), **let ring**,
**natural/pinch harmonic** `<n>`, tremolo.
Per-cell: dead note `x`, ghost note `(x)`.
→ The model supports *both* inline connectors (`connectorBefore`) and column-spanning
annotations, because techniques live in two different places visually.

### Multi-string / chord entry
- A strummed chord = several cells in one column. After typing a fret, **string up/down**
  keys move within the same column to stack notes; **left/right** move columns.
- Long-press a string position to place the cursor there directly.

### Editing model
- **Insert vs overwrite:** default overwrite the dash at the cursor; an explicit "insert
  column" pushes content right. Define clearly in UI (most tab editors overwrite).
- **Backspace** clears the current cell; on an empty cell, removes the column (shifts left)
  with confirmation if the column has content on other strings.
- **Multi-digit frets:** entering `1` then `2` on the same cell makes `12` (with a short
  commit window / explicit second-tap), not two columns.
- **Selection / copy / paste / duplicate measure:** select a column range across all
  strings; copy/cut/paste; one-tap **"duplicate measure"** (the riff-repeat case).
- **Undo / redo** stack, robust, survives within a session; autosave snapshots.

### Wrapping & zoom
- Tab flows into **stacked 6-line systems** that wrap at the column width (like staff lines),
  not one infinite horizontal line. Editing works across wrap boundaries.
- **Zoom** (the `100%` control) changes cell size and therefore columns-per-system;
  re-flows wrapping. Pinch-to-zoom on touch.

### Custom keyboard
- **Suppress the native keyboard** for the staff so spacing stays monospaced; all fret/
  technique entry is via the on-screen keyboard.
- **Numeric keypad:** frets 0–25 across two pages (shift toggles 0–12 / 13–25) + `x`,
  backspace, and a "next position" advance key.
- **Technique palette:** glyph-labelled buttons, mode-toggled with the keypad (`123` ⇄ `•••`).
- **Edit row:** Cut / Copy / Paste / space / Undo / Redo.
- Title / note fields *do* use the native keyboard (they're prose).

---

## 6. Screens — states & edge cases

### A. Songs List ("Your Journal")
- States: **empty** (warm first-run prompt + sample songs), populated, search-active, filtered.
- Card shows title (auto-name if blank), subtitle, relative time, metadata chips, favorite star.
- **Sort/filter** (the header icon): by updated/created/title/key/tuning/tag/favorite.
- **Search** across title, subtitle, and notation content.
- Long-press / swipe: favorite, duplicate, delete (**with undo toast** — destructive, reversible).
- `+` FAB → instant capture (new untitled song straight into the writer).

### B. Detail / Performance Mode
- Locked for reading; **Edit** is explicit (opens the edit sheet).
- **Transpose** ± semitones (live, non-destructive view) + **capo-aware suggestion**
  ("play these shapes, capo 2, sounds in A"). Clarify chords = *shapes you finger*.
  **(v1 — the one performance feature shipping first.)**
- **Font-size / zoom** for stand reading; **dark/stage theme** for low light.
- **Section nav / minimap** for long songs; jump to Chorus etc.
- Landscape supported (tabs are wide).
- `repeatOf` sections render inline ("Chorus" again) without duplicating data.
- **Deferred (post-v1):** Wake Lock (keep-awake), auto-scroll, foot-pedal/keyboard nav,
  metronome + count-in, section loop. Modeled in the architecture but not built in v1.

### C. Metadata Editor (bottom sheet)
- Title, subtitle, **Key**, **Tempo** (+ tap-tempo), **Time signature**, **Capo**,
  **Tuning** (preset + custom), **Tags**, favorite.
- Validation: tempo numeric/range, capo 0–12, sensible key list. All fields optional.
- Changing time signature or tuning **warns** if it would re-interpret existing bars/tabs.

### D. Chords Writer
- Live **preview** (renders from structure), **bar builder** with active bar (split/clear),
  collapsed bars, add bar.
- Drawer: **Rhythm & Weight** (`-` `//` and explicit-beats override), **Root**, **Quality**
  (full set), **Bass note** (slash), **rest / N.C. / % repeat**, **repeat barlines & endings**.
- Edge cases: empty bar, over-filled bar (beats > meter → warn/clamp), reorder bars,
  delete bar with undo, duplicate bar, paste a bar range.

### E. Advanced Tabs Writer
- Per §5. States: empty staff, mid-edit with cursor, selection active, zoomed, wrapped systems.
- Inline title + "extra info" edit (pencil), zoom strip, custom keyboard, edit row.

---

## 7. Cross-cutting concerns

- **Autosave** (debounced) + **draft/crash recovery**; "saved" is implicit, never a data-loss risk.
- **Import / Export** — the killer feature for guitarists:
  - Export **plain-text ASCII tab** and **text chord sheet** (the universal shareable format).
  - **Import** by pasting ASCII tab → parse into the column model (best-effort, with review).
  - **PDF export** for printing / music stand.
  - **JSON backup/restore** of the whole library (no cloud → device-loss insurance).
  - Copy-to-clipboard everywhere.
- **PWA / offline:** service worker, installable, offline-complete.
- **Accessibility & contrast:** verify terracotta `#d45211` on `#F5F2EB` meets WCAG AA for
  the chord text (it's borderline — may need a slightly darker chord ink); full keyboard nav;
  respect reduced-motion; dynamic type.
- **Responsive / orientation:** portrait-first; landscape and tablet layouts for tabs.
- **Multi-tab/window safety:** single source of truth via IndexedDB + storage events to
  avoid clobbering edits across browser tabs.
- **Performance:** virtualize long lists/progressions; tab systems render lazily; debounce
  parse/render on input.

---

## 8. Consolidated edge-case catalog

**Chords/rhythm:** slash chords; extensions & altered tensions; enharmonic spelling;
non-4/4 meters (3/4, 6/8, 5/4, 7/8); half/quarter-bar math per meter; rests; `%` repeat-bar;
N.C.; repeat barlines + x-counts + 1st/2nd endings; over-filled bars; partial/invalid input;
100+ bar progressions; bar wrapping only at boundaries; transpose incl. bass notes; capo vs concert.

**Tabs:** multi-digit fret alignment; alternate tunings & string labels; 4/6/7/8 strings;
capo on tab; technique connectors vs above-staff annotations; bend amounts; multi-string chord
entry; insert vs overwrite; backspace on multi-digit/empty cells; selection/copy/paste/duplicate
measure; undo/redo; wrapping systems; zoom re-flow; suppressed native keyboard; long tabs perf.

**Data/app:** empty states; untitled/duplicate titles; section with no content; delete with
undo; autosave + crash recovery; IndexedDB quota; multi-window conflicts; import malformed
text; export round-trip fidelity; offline; orientation; accessibility/contrast; reduced motion.

**Performance mode:** wake-lock; auto-scroll; foot-pedal/keyboard; transpose live;
font scaling; dark/stage mode; metronome + count-in + meter; section loop; section nav.

---

## 9. Build phases

1. **Foundations:** Vite + HeroUI theme + tokens + fonts + IndexedDB + routing + PWA shell.
2. **Notation engines (headless, tested):** chord parser/renderer; tab column engine
   (alignment, techniques, tunings) — with unit tests. *Do this before UI.*
3. **Read path:** Songs List + Detail/Performance Mode rendering from seed data.
4. **Chords Writer** + Metadata editor.
5. **Tabs Writer** + custom keyboard.
6. **Performance-mode UX (v1):** transpose/capo + dark/stage mode + font scaling + section nav.
   *Deferred to a later phase:* wake-lock, auto-scroll, metronome, foot-pedal keys.
7. **Import/Export/Backup** (ASCII tab + chord sheet + PDF + JSON).
8. **Polish:** empty states, undo toasts, accessibility/contrast pass, responsive/landscape,
   performance/virtualization.

---

## 10. Out of scope (notebook, not DAW)

Audio recording, full playback/synthesis of tabs, real-time collaboration, cloud sync/accounts
(beyond JSON backup), social sharing feeds. Revisit only after the core sketching loop is loved.

---

## 11. Decisions (resolved)

1. **`///` dropped.** Shorthand = `-` (even) + `//` (3:1); finer timing via explicit beats
   in the bar builder. (See §4.)
2. **Time signature modeled now** (default 4/4), drives all rhythm math; UI exposed when ready.
3. **Optional per-section `note` field — YES.** Free-text cue (lyric line, "let ring",
   reminder), hidden when empty so Performance Mode stays clean.
4. **Performance-mode v1 = Transpose + capo only.** Wake-lock, auto-scroll, metronome/loop,
   and foot-pedal nav are modeled but deferred to a later phase.
5. **Accent colour = terracotta `#d45211` primary + saddle-brown `#8A5A44` secondary**, with
   the chord ink darkened as needed to meet WCAG-AA on parchment.

### Still to confirm

- **Drag-to-dismiss sheets:** pure HeroUI Drawer, or add **Vaul** for the iOS rubber-band feel?
