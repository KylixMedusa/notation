import type { ExtractionResultT } from "./extractionSchema";

/** POST an image data-URL to the extraction function. Throws with a readable message on failure. */
export async function extractChart(image: string, passphrase: string): Promise<ExtractionResultT> {
  const res = await fetch("/api/extract-chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, passphrase }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Extraction failed (${res.status})`);
  }
  return res.json() as Promise<ExtractionResultT>;
}

/** Read an image File and downscale it to a JPEG data-URL (longest side ≤ maxPx) to keep payloads small. */
export function fileToDownscaledDataUrl(file: File, maxPx = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
