import { DEFAULT_TIME_SIGNATURE, STANDARD_TUNING, type Section, type Song } from "../types";

export function createNewSong(): Song {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "",
    timeSignature: DEFAULT_TIME_SIGNATURE,
    tuning: STANDARD_TUNING,
    tags: [],
    sections: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createSection(type: "chords" | "tab", label: string, song: Song): Section {
  const base = { id: crypto.randomUUID(), label: label || (type === "tab" ? "Tab" : "Section") };
  return type === "tab"
    ? { ...base, tab: { stringCount: 6, tuning: song.tuning, columns: [] } }
    : { ...base, chords: { bars: [] } };
}
