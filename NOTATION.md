# Notation reference — professional lead-sheet layer

Domain spec for the rhythm/roadmap notation Notation should eventually understand. Each item
notes what it is, how it maps to our data model (`src/types`), and its build tier.

Tiers: **A** = lightweight structured additions (no music-engraving renderer needed).
**B** = needs a real notation renderer (SMuFL font / VexFlow) — large architectural lift.

---

## 1. Stemless vs. stemmed slashes
- **Stemless (free):** `| G / / / |` — "play this chord for these beats, rhythm is the player's
  choice." This is what we render today (the rhythm-slash preview).
- **Stemmed (specific):** slash noteheads with stems/beams that carry exact rhythmic values
  (quarter, eighth…) — precise rhythm notated.
- **Model:** stemless = current `Slot.beats`. Stemmed needs per-slot rhythmic figures (note
  values + sub-beat placement) and engraved glyphs. **Tier B** (likely VexFlow). Default stays
  stemless for a songwriter's journal.

## 2. Ties on slashes / anticipations
- A curved line joining slashes = one continuous chord held through the tied beats. Anticipation
  = chord arrives on the "and" before the bar and ties over the downbeat.
- **Model:** `Slot.tie?: boolean` (tied into the next slot/bar) handles held ties — **Tier A**.
  True anticipations need a sub-beat (eighth) grid — **Tier B-lite**.

## 3. Kicks over time (band accents)
- Accent rhythm written above the slash staff (stems up) so the band hits a figure without
  stopping the groove. Distinct from stop-time (everyone silent except the figure).
- **Model:** an above-staff rhythmic figure attached to a bar/range. **Tier B** (rhythm
  rendering). Out of scope for v1.

## 4. Polychord (horizontal slash)
- A chord stacked over another (two triads at once), written with a **horizontal** divider —
  distinct from the **diagonal** `C/E` bass-note slash we already support.
- **Model:** add `Chord.over?: Chord` (this chord = `over` triad above the base). Render with a
  horizontal rule. **Tier A.**

## 5. Simile (bar repeat)
- Text/`𝄎` instruction: "repeat the previous bar." Used after a pattern is established.
- **Model:** `Bar.repeatPrevious?: boolean` (we removed this earlier — re-add). Render `%` / `𝄎`.
  **Tier A.**

## 6. Roadmap / navigation symbols
- Keep charts to one page: `|: :|` repeats, `1.`/`2.` endings, **D.C.** (da capo), **D.S.**
  (dal segno `𝄋`), **al Coda** (`𝄌`), **al Fine**, **Fine**, **Segno**, **Coda**.
- **Model:** `Bar.repeat` already carries start/end/count/ending. Add bar/section navigation
  markers: `segno`, `coda`, `fine` flags + a song-level `directive` (`D.C.`, `D.S. al Coda`,
  `D.S. al Fine`). A "playback expansion" helper unrolls them for Performance Mode. **Tier A.**

## 7. Solo / comp sections
- Time slashes with chord symbols above = solo section: soloists improvise, rhythm section
  comps freely. The most common use of slash notation in fake books.
- **Model:** `Section` flag e.g. `role?: "solo" | "comp"` (renders as slashes + "Solo" label).
  **Tier A.**

---

## Suggested build order
1. **Tier A structured set** (high value, fits a journal): roadmap/navigation, simile,
   polychord, ties-as-hold, solo/comp section flag.
2. **Tier B-lite:** sub-beat (eighth) grid → anticipations.
3. **Tier B engraving:** stemmed rhythmic slashes + kicks over time — only if we add a real
   notation renderer (VexFlow/SMuFL). This is a separate, large track and arguably beyond the
   "quick songwriting journal" scope.
