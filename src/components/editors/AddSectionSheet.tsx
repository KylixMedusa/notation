import { useEffect, useState } from "react";
import { Grid3x3, Guitar } from "lucide-react";
import { BottomSheet } from "../ui/BottomSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (type: "chords" | "tab", label: string) => void;
}

export function AddSectionSheet({ open, onClose, onAdd }: Props) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (open) setLabel("");
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Section">
      <div className="flex flex-col gap-5 pb-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Section name (e.g. Verse, Chorus, Riff)"
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <TypeButton icon={<Grid3x3 size={28} />} label="Chords" onClick={() => onAdd("chords", label)} />
          <TypeButton icon={<Guitar size={28} />} label="Tab" onClick={() => onAdd("tab", label)} />
        </div>
      </div>
    </BottomSheet>
  );
}

function TypeButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface py-6 text-foreground transition-transform active:scale-[0.98] hover:border-accent/40"
    >
      <span className="text-accent">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
