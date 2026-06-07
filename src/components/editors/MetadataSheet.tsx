import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { BottomSheet } from "../ui/BottomSheet";
import { saveSong } from "../../lib/db";
import { createNewSong } from "../../lib/songFactory";
import { COMMON_TUNINGS, STANDARD_TUNING, type Mode, type Note, type Song } from "../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Existing song to edit; omit to create a new one. */
  song?: Song;
  onSaved: (song: Song) => void;
}

const KEY_TONICS: Note[] = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const TIME_SIGNATURES = ["4/4", "3/4", "6/8", "2/4", "5/4", "6/4", "7/8", "12/8"];

export function MetadataSheet({ open, onClose, song, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [keyTonic, setKeyTonic] = useState<string>("");
  const [keyMode, setKeyMode] = useState<Mode>("major");
  const [tempo, setTempo] = useState("");
  const [capo, setCapo] = useState("");
  const [timeSig, setTimeSig] = useState("4/4");
  const [tuningName, setTuningName] = useState(STANDARD_TUNING.name);
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync form state whenever the sheet opens.
  useEffect(() => {
    if (!open) return;
    setTitle(song?.title ?? "");
    setSubtitle(song?.subtitle ?? "");
    setKeyTonic(song?.key?.tonic ?? "");
    setKeyMode(song?.key?.mode ?? "major");
    setTempo(song?.tempo ? String(song.tempo) : "");
    setCapo(song?.capo ? String(song.capo) : "");
    setTimeSig(song ? `${song.timeSignature.numerator}/${song.timeSignature.denominator}` : "4/4");
    setTuningName(song?.tuning?.name ?? STANDARD_TUNING.name);
    setTagsText(song?.tags?.join(", ") ?? "");
  }, [open, song]);

  async function handleSave() {
    setSaving(true);
    const base = song ?? createNewSong();
    const [num, den] = timeSig.split("/").map(Number);
    const updated: Song = {
      ...base,
      title: title.trim() || "Untitled",
      subtitle: subtitle.trim() || undefined,
      key: keyTonic ? { tonic: keyTonic as Note, mode: keyMode } : undefined,
      tempo: tempo ? Number(tempo) : undefined,
      capo: capo ? Number(capo) : undefined,
      timeSignature: { numerator: num, denominator: den },
      tuning: COMMON_TUNINGS.find((t) => t.name === tuningName) ?? STANDARD_TUNING,
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      updatedAt: Date.now(),
    };
    try {
      await saveSong(updated);
      onSaved(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={song ? "Edit Song" : "New Song"}>
      <div className="flex flex-col gap-5 pb-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title…"
          className="border-b border-border bg-transparent pb-2 font-display text-3xl font-bold text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
        <input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Artist / band"
          className="bg-transparent text-muted placeholder:text-muted/50 focus:outline-none"
        />

        <Row label="Key">
          <div className="flex gap-2">
            <Select value={keyTonic} onChange={setKeyTonic}>
              <option value="">—</option>
              {KEY_TONICS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
            <Select value={keyMode} onChange={(v) => setKeyMode(v as Mode)}>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </Select>
          </div>
        </Row>

        <Row label="Tempo">
          <NumberInput value={tempo} onChange={setTempo} placeholder="BPM" min={20} max={320} />
        </Row>

        <Row label="Capo">
          <NumberInput value={capo} onChange={setCapo} placeholder="0" min={0} max={12} />
        </Row>

        <Row label="Time">
          <Select value={timeSig} onChange={setTimeSig}>
            {TIME_SIGNATURES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </Row>

        <Row label="Tuning">
          <Select value={tuningName} onChange={setTuningName}>
            {COMMON_TUNINGS.map((t) => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </Select>
        </Row>

        <Row label="Tags">
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Fingerstyle, Cover…"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </Row>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-accent py-4 font-semibold text-accent-foreground transition-opacity active:opacity-80 disabled:opacity-50"
        >
          <Check size={20} />
          {saving ? "Saving…" : "Save Song"}
        </button>
      </div>
    </BottomSheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground focus:border-accent focus:outline-none"
    >
      {children}
    </select>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 rounded-xl border border-border bg-surface px-3 py-2 text-right text-sm font-medium text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
    />
  );
}
