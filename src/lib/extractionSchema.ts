/**
 * Shared between the frontend and the `api/extract-chart` serverless function.
 * Zod only — no app/browser imports — so the Vercel function can bundle it safely.
 *
 * The model returns chord bars as SHORTHAND STRINGS (e.g. "Am7 // D7", "//"); the client
 * converts them to the structured model with the existing `parseProgression` engine.
 */
import { z } from "zod";

export const ExtractedSection = z.object({
  label: z.string().default("Section"),
  /** e.g. "4/4", "3/4", "6/8". */
  timeSignature: z.string().default("4/4"),
  feel: z.enum(["straight", "shuffle", "swing"]).default("straight"),
  repeatCount: z.number().int().min(1).max(16).default(1),
  /** Each entry = one bar of shorthand. "//" alone = empty bar; "C // D" = weighted. */
  bars: z.array(z.string()).default([]),
});

export const ExtractedSong = z.object({
  title: z.string().default("Untitled"),
  subtitle: z.string().optional(),
  /** e.g. "G major", "A minor", "Am", "G". */
  key: z.string().optional(),
  tempo: z.number().optional(),
  capo: z.number().optional(),
  sections: z.array(ExtractedSection).default([]),
});

/** A screenshot may contain more than one chart. */
export const ExtractionResult = z.object({
  songs: z.array(ExtractedSong).min(1),
});

export type ExtractedSongT = z.infer<typeof ExtractedSong>;
export type ExtractionResultT = z.infer<typeof ExtractionResult>;

export const SYSTEM_PROMPT = `You transcribe photos/screenshots of guitar chord charts into JSON.

Return ONLY a JSON object of this exact shape (no markdown, no commentary):
{
  "songs": [
    {
      "title": string,
      "subtitle": string (optional, e.g. artist),
      "key": string (optional, e.g. "G major" or "Am"),
      "tempo": number (optional, BPM),
      "capo": number (optional),
      "sections": [
        {
          "label": string,
          "timeSignature": string (e.g. "4/4", "3/4"),
          "feel": "straight" | "shuffle" | "swing",
          "repeatCount": number (how many times the whole section repeats; 1 if not noted),
          "bars": string[]
        }
      ]
    }
  ]
}

Rules for "bars": each array entry is ONE bar written as chord shorthand.
- One chord held a whole bar: "G"
- Two chords split evenly: "G - Em"
- Weighted (first chord ~3/4): "G // D"
- An empty/rest bar: "//"
- No chord: "N.C."
Use chord names exactly as written (e.g. "Am7", "D/F#", "Bdim7").
If a phrase is marked "x2"/"×2", set repeatCount accordingly instead of duplicating bars.
Detect the time signature and feel (e.g. "shuffle", "swing") from any annotations on the chart.
If there are multiple distinct charts/songs, return each as a separate entry in "songs".`;
