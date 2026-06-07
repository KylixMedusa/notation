/**
 * AI chart extraction — Vercel serverless function (server-side only).
 *
 * Uses the Sentinel/Medable OpenAI-compatible gateway via LangChain `ChatOpenAI`
 * (same pattern as the sentinel server). The API key + base URL live in env vars and are
 * NEVER shipped to the browser. Gated by a shared passphrase.
 *
 * Request:  POST { image: dataUrl, passphrase: string }
 * Response: { songs: ExtractedSong[] }  (validated with zod)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ExtractionResult, SYSTEM_PROMPT } from "../src/lib/extractionSchema";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // ~8MB data URL cap

function stripFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image, passphrase } = (req.body ?? {}) as { image?: string; passphrase?: string };

  // Passphrase gate (the only auth — keeps the paid endpoint from being hammered).
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
    const message = e instanceof Error ? e.message : "Extraction failed";
    return res.status(502).json({ error: message });
  }
}
