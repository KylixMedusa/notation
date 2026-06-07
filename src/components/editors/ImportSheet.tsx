import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { BottomSheet } from "../ui/BottomSheet";
import { extractChart, fileToDownscaledDataUrl } from "../../lib/extractChart";
import { extractedToSong } from "../../lib/extractionToSong";
import { saveSong } from "../../lib/db";
import type { Song } from "../../types";

const PASS_KEY = "notation:ai-passphrase";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (firstSong: Song) => void;
}

export function ImportSheet({ open, onClose, onImported }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState(() => localStorage.getItem(PASS_KEY) ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setPreview(await fileToDownscaledDataUrl(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read image");
    }
  }

  async function run() {
    if (!preview || !passphrase) return;
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem(PASS_KEY, passphrase);
      const { songs } = await extractChart(preview, passphrase);
      const created = songs.map(extractedToSong);
      await Promise.all(created.map(saveSong));
      onImported(created[0]);
      // reset
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Import from photo">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-sm text-muted">
          Snap or upload a photo of a chord chart and AI will transcribe it into an editable song.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-8 text-muted transition-colors hover:border-accent/40 hover:bg-surface"
        >
          {preview ? (
            <img src={preview} alt="chart preview" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <>
              <Camera size={28} className="text-accent" />
              <span className="font-medium">Take or choose a photo</span>
            </>
          )}
        </button>

        <label className="flex flex-col gap-1 text-sm text-muted">
          AI passphrase
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter the shared passphrase"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={run}
          disabled={!preview || !passphrase || busy}
          className="flex items-center justify-center gap-2 rounded-full bg-accent py-4 font-semibold text-accent-foreground transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          {busy ? "Transcribing…" : "Transcribe with AI"}
        </button>
      </div>
    </BottomSheet>
  );
}
