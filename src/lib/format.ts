import type { Key, Song, TimeSignature } from "../types";

export function formatKey(key: Key): string {
  return `${key.tonic} ${key.mode === "major" ? "Major" : "Minor"}`;
}

export function formatTimeSignature(ts: TimeSignature): string {
  return `${ts.numerator}/${ts.denominator}`;
}

/** Short metadata chips for a song card / header (Key, Capo, Tempo, then tags). */
export function songChips(song: Song): string[] {
  const chips: string[] = [];
  if (song.key) chips.push(`Key ${song.key.tonic}${song.key.mode === "minor" ? "m" : ""}`);
  if (song.capo) chips.push(`Capo ${song.capo}`);
  if (song.tempo) chips.push(`${song.tempo} BPM`);
  chips.push(...song.tags);
  return chips;
}

const DAY = 86_400_000;

/** Casual relative time for the journal list ("2 days ago", "Last week", or a date). */
export function relativeTime(epochMs: number, nowMs = Date.now()): string {
  const diff = nowMs - epochMs;
  if (diff < DAY) return "Today";
  const days = Math.floor(diff / DAY);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return new Date(epochMs).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
