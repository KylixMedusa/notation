/**
 * AI chart extraction — Vercel serverless function (server-side only).
 *
 * Self-contained: imports ONLY from node_modules (Vercel's function builder doesn't bundle
 * cross-directory `../src` imports, so the schema + prompt are inlined here). The matching
 * TS types for the frontend live in `src/lib/extractionSchema.ts` — keep the shapes in sync.
 *
 * Uses the OpenAI-compatible LLM gateway via LangChain `ChatOpenAI`. Key + base URL come from
 * env vars and never reach the browser. Gated by a shared passphrase.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

const ExtractedSection = z.object({
  label: z.string().default("Section"),
  timeSignature: z.string().default("4/4"),
  feel: z.enum(["straight", "shuffle", "swing"]).default("straight"),
  repeatCount: z.number().int().min(1).max(16).default(1),
  bars: z.array(z.string()).default([]),
});

const ExtractedSong = z.object({
  title: z.string().default("Untitled"),
  subtitle: z.string().optional(),
  key: z.string().optional(),
  tempo: z.number().optional(),
  capo: z.number().optional(),
  sections: z.array(ExtractedSection).default([]),
});

const ExtractionResult = z.object({ songs: z.array(ExtractedSong).min(1) });

const SYSTEM_PROMPT = `You transcribe photos/screenshots of guitar chord charts into JSON.

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

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, passphrase } = (req.body ?? {}) as { image?: string; passphrase?: string };

  if (!process.env.AI_IMPORT_PASSPHRASE || passphrase !== process.env.AI_IMPORT_PASSPHRASE) {
    return res.status(401).json({ error: "Invalid passphrase" });
  }
  if (!image || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Missing or invalid image" });
  }
  if (image.length > MAX_IMAGE_BYTES) {
    return res.status(413).json({ error: "Image too large" });
  }
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_BASE_URL) {
    return res.status(500).json({ error: "AI gateway not configured" });
  }

  const model = new ChatOpenAI({
    model: process.env.NOTATION_AI_MODEL ?? "sonnet-4.5",
    apiKey: process.env.OPENAI_API_KEY,
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
    temperature: 0,
  });

  try {
    const response = await model.invoke(
      [
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage({
          content: [
            { type: "text", text: "Transcribe every chord chart in this image." },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        }),
      ],
      { response_format: { type: "json_object" } },
    );

    const raw = typeof response.content === "string"
      ? response.content
      : (response.content as Array<{ text?: string }>).map((c) => c.text ?? "").join("");

    const parsed = ExtractionResult.safeParse(JSON.parse(stripFences(raw)));
    if (!parsed.success) {
      return res.status(422).json({ error: "Could not parse the chart", detail: parsed.error.message });
    }
    return res.status(200).json(parsed.data);
  } catch (e) {
    return res.status(502).json({ error: e instanceof Error ? e.message : "Extraction failed" });
  }
}
