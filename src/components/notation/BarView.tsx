import { formatChord } from "../../lib/notation";
import type { Bar } from "../../types";

interface Props {
  bar: Bar;
  /** When provided, slots become selectable (editor mode). */
  selectedSlot?: number;
  onSelectSlot?: (i: number) => void;
}

/** Renders one bar's slots with widths proportional to their beats — a true rhythm grid. */
export function BarView({ bar, selectedSlot, onSelectSlot }: Props) {
  const interactive = !!onSelectSlot;
  return (
    <div className="flex h-12 items-stretch overflow-hidden rounded-lg border border-border bg-background font-mono">
      {bar.slots.map((s, i) => {
        const label = s.kind === "chord" ? formatChord(s.chord) : s.kind === "nc" ? "N.C." : "/";
        const cls = [
          "grid place-items-center border-l border-border px-1 text-sm first:border-l-0",
          s.kind === "chord" ? "font-semibold text-notation" : "text-muted/50",
          interactive && selectedSlot === i ? "bg-accent/10 ring-1 ring-inset ring-accent" : "",
        ].join(" ");
        const style = { flexGrow: s.beats, flexBasis: 0 };
        return interactive ? (
          <button key={i} style={style} className={cls} onClick={() => onSelectSlot!(i)}>
            {label}
          </button>
        ) : (
          <div key={i} style={style} className={cls}>
            {label}
          </div>
        );
      })}
    </div>
  );
}
