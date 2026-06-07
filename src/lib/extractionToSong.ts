/**
 * Converts an AI-extracted song (shorthand bar strings) into our structured `Song`,
 * reusing the chord shorthand parser.
 */
import { parseProgression } from "./notation";
import { createNewSong } from "./songFactory";
import { DEFAULT_TIME_SIGNATURE, NOTES } from "../types";
import type { Key, Mode, Note, Section, Song, TimeSignature } from "../types";
import type { ExtractedSongT } from "./extractionSchema";

function parseKey(input?: string): Key | undefined {
  if (!input) return undefined;
  const m = input.trim().match(/^([A-G][#b]?)\s*(m|min|minor|maj|major)?/i);
  if (!m) return undefined;
  const tonic = (m[1][0].toUpperCase() + (m[1][1] ?? "")) as Note;
  if (!NOTES.includes(tonic)) return undefined;
  const suffix = (m[2] ?? "").toLowerCase();
  const mode: Mode = suffix.startsWith("m") && !suffix.startsWith("maj") ? "minor" : "major";
  return { tonic, mode };
}

function parseTimeSig(input?: string): TimeSignature {
  const m = (input ?? "").match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return DEFAULT_TIME_SIGNATURE;
  return { numerator: Number(m[1]), denominator: Number(m[2]) };
}

export function extractedToSong(e: ExtractedSongT): Song {
  const song = createNewSong();
  song.title = e.title?.trim() || "Untitled";
  if (e.subtitle?.trim()) song.subtitle = e.subtitle.trim();
  const key = parseKey(e.key);
  if (key) song.key = key;
  if (e.tempo) song.tempo = e.tempo;
  if (e.capo) song.capo = e.capo;
  song.tags = ["AI import"];

  song.sections = e.sections.map((s): Section => {
    const ts = parseTimeSig(s.timeSignature);
    const chords = s.bars.length
      ? parseProgression(`| ${s.bars.join(" | ")} |`, ts)
      : { bars: [] };
    return {
      id: crypto.randomUUID(),
      label: s.label || "Section",
      timeSignature: ts,
      feel: s.feel === "straight" ? undefined : s.feel,
      repeatCount: s.repeatCount > 1 ? s.repeatCount : undefined,
      chords,
    };
  });

  song.timeSignature = song.sections[0]?.timeSignature ?? DEFAULT_TIME_SIGNATURE;
  return song;
}
