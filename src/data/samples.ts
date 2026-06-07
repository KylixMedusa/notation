import { parseProgression } from "../lib/notation";
import { DEFAULT_TIME_SIGNATURE, STANDARD_TUNING, type Song, type TimeSignature } from "../types";

const FOUR_FOUR = DEFAULT_TIME_SIGNATURE;
const THREE_FOUR: TimeSignature = { numerator: 3, denominator: 4 };
const now = Date.now();

/** Seed songs used until Firestore is wired. "I Me Mine" mirrors the example whiteboard. */
export const SAMPLE_SONGS: Song[] = [
  {
    id: "autumn-sketch",
    title: "Autumn Sketch",
    subtitle: "Original",
    key: { tonic: "G", mode: "major" },
    tempo: 120,
    timeSignature: FOUR_FOUR,
    capo: 2,
    tuning: STANDARD_TUNING,
    tags: ["Fingerstyle"],
    createdAt: now,
    updatedAt: now,
    sections: [
      {
        id: "v1",
        label: "Verse 1",
        chords: parseProgression("| G | Em | C | D | G | Em | C | D |", FOUR_FOUR),
      },
      {
        id: "ch",
        label: "Chorus",
        chords: parseProgression("| C | D | G | G | Am7 // D7 | G | // |", FOUR_FOUR),
      },
    ],
  },
  {
    id: "i-me-mine",
    title: "I Me Mine",
    subtitle: "The Beatles",
    key: { tonic: "A", mode: "minor" },
    tempo: 120,
    timeSignature: THREE_FOUR,
    feel: "straight",
    tuning: STANDARD_TUNING,
    tags: ["3/4", "Cover"],
    createdAt: now - 86_400_000,
    updatedAt: now - 86_400_000,
    sections: [
      {
        id: "verse",
        label: "Verse",
        timeSignature: THREE_FOUR,
        repeatCount: 2,
        chords: parseProgression("| Am | Am7 | D | D7 | G | E |", THREE_FOUR),
      },
      {
        id: "blues",
        label: "12 Bar Blues",
        timeSignature: FOUR_FOUR,
        feel: "shuffle",
        chords: parseProgression("| A | A | A | A | D | D | A | A | E | E |", FOUR_FOUR),
      },
    ],
  },
];

export function findSampleSong(id: string): Song | undefined {
  return SAMPLE_SONGS.find((s) => s.id === id);
}
