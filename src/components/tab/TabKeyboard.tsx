/**
 * Custom guitar-tab keyboard — matches the my-guitar-tabs layout & icons exactly.
 *
 *   Row 1: [123/•••] [h/p] [slide] [bend] [vib] [|]                (shortcut techniques)
 *   default rows: [0..7][⏎break]  /  [⇧][8..12][X][⌫]
 *   shift rows:   [13..20][⏎break] / [⇧][21..25][X][⌫]
 *   markings rows:[|][||][:|:][↑][↓][P.M.] / [harm][(x)][h/p][slide][vib][bend][bend↓][pre]
 *   Row 4: [cut][copy][paste][space][undo][redo][enter]
 *
 * Keys fill the row width equally (flex-1), like simple-keyboard.
 */
import { useState } from "react";
import {
  Delete, CornerDownLeft, Scissors, Copy, ClipboardPaste, Undo, Redo, ChevronUp,
} from "lucide-react";
import {
  IconHammerPull, IconSlide, IconBend, IconBendDown, IconPreBend, IconVibrato,
  IconDownstroke, IconUpstroke, IconHarmonic, IconGhost, IconBarLine,
  IconRepeatBarLine, IconDoubleBarLine,
} from "./tabIcons";
import type { NoteMarkingType, EventMarkingType, BarlineType } from "../../types/tablature";

export type TabKeyboardCommand =
  | { type: "fret";          fret: number }
  | { type: "mute" }
  | { type: "backspace" }
  | { type: "space" }
  | { type: "enter" }
  | { type: "move";          dir: "up" | "down" | "left" | "right" }
  | { type: "next-event" }
  | { type: "insert-barline"; barlineType: BarlineType }
  | { type: "line-break" }
  | { type: "note-marking";  marking: Exclude<NoteMarkingType, "bend"> }
  | { type: "bend";          bendType: "up" | "down" | "pre" }
  | { type: "event-marking"; marking: EventMarkingType }
  | { type: "undo" } | { type: "redo" }
  | { type: "cut" } | { type: "copy" } | { type: "paste" };

export type DisabledKey =
  | NoteMarkingType | EventMarkingType | "line-break"
  | "bar-line" | "double-bar" | "repeat-bar" | "pre-bend" | "bend-down";

type Layout = "default" | "shift" | "markings";

interface Props {
  onCommand: (cmd: TabKeyboardCommand) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  disabledKeys?: DisabledKey[];
}

const ICON = 22;

function Key({
  children, onClick, disabled, variant = "neutral", active, flex = 1,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "neutral" | "accent" | "technique" | "toggle";
  active?: boolean;
  flex?: number;
}) {
  const base = "flex h-12 min-w-0 items-center justify-center rounded-lg border text-sm font-medium transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none";
  const styles =
    active                  ? "border-accent bg-accent text-accent-foreground"
    : variant === "accent"    ? "border-border bg-background text-accent font-semibold text-base"
    : variant === "technique" ? "border-border bg-background text-foreground"
    : variant === "toggle"    ? "border-border bg-surface text-foreground"
    : "border-border bg-background text-foreground";
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      disabled={disabled}
      style={{ flexGrow: flex, flexBasis: 0 }}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5">{children}</div>;
}

export function TabKeyboard({ onCommand, canUndo, canRedo, disabledKeys = [] }: Props) {
  const [layout, setLayout] = useState<Layout>("default");

  const dis = (k: DisabledKey) => disabledKeys.includes(k);

  function toggleMarkings() {
    setLayout((l) => (l === "markings" ? "default" : "markings"));
  }

  const frets1 = layout === "shift" ? [13, 14, 15, 16, 17, 18, 19, 20] : [0, 1, 2, 3, 4, 5, 6, 7];
  const frets2 = layout === "shift" ? [21, 22, 23, 24, 25] : [8, 9, 10, 11, 12];

  return (
    <div className="border-t border-border bg-surface">
      <div>
        <div className="flex flex-col gap-1.5 px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.6rem)]">

          {/* Row 1 — markings toggle + shortcut techniques */}
          <Row>
            <Key variant="toggle" active={layout === "markings"} onClick={toggleMarkings} flex={1.2}>
              {layout === "markings" ? <span className="font-mono">123</span> : "•••"}
            </Key>
            <Key variant="technique" disabled={dis("slur")} onClick={() => onCommand({ type: "note-marking", marking: "slur" })}><IconHammerPull size={ICON} /></Key>
            <Key variant="technique" disabled={dis("slide")} onClick={() => onCommand({ type: "note-marking", marking: "slide" })}><IconSlide size={ICON} /></Key>
            <Key variant="technique" disabled={dis("bend")} onClick={() => onCommand({ type: "bend", bendType: "up" })}><IconBend size={ICON} /></Key>
            <Key variant="technique" onClick={() => onCommand({ type: "event-marking", marking: "vibrato" })}><IconVibrato size={ICON} /></Key>
            <Key variant="technique" onClick={() => onCommand({ type: "insert-barline", barlineType: "single" })}><IconBarLine size={ICON} /></Key>
          </Row>

          {layout === "markings" ? (
            <>
              {/* Markings row 1 — barlines + strokes + P.M. */}
              <Row>
                <Key variant="technique" onClick={() => onCommand({ type: "insert-barline", barlineType: "single" })}><IconBarLine size={ICON} /></Key>
                <Key variant="technique" onClick={() => onCommand({ type: "insert-barline", barlineType: "double" })}><IconDoubleBarLine size={ICON} /></Key>
                <Key variant="technique" onClick={() => onCommand({ type: "insert-barline", barlineType: "repeat-end" })}><IconRepeatBarLine size={ICON} /></Key>
                <Key variant="technique" onClick={() => onCommand({ type: "event-marking", marking: "upstroke" })}><IconUpstroke size={ICON} /></Key>
                <Key variant="technique" onClick={() => onCommand({ type: "event-marking", marking: "downstroke" })}><IconDownstroke size={ICON} /></Key>
                <Key variant="technique" onClick={() => onCommand({ type: "event-marking", marking: "palm-muting" })}><span className="text-xs font-semibold">P.M.</span></Key>
              </Row>
              {/* Markings row 2 — note techniques */}
              <Row>
                <Key variant="technique" disabled={dis("harmonic")} onClick={() => onCommand({ type: "note-marking", marking: "harmonic" })}><IconHarmonic size={ICON} /></Key>
                <Key variant="technique" disabled={dis("ghost")} onClick={() => onCommand({ type: "note-marking", marking: "ghost" })}><IconGhost size={ICON} /></Key>
                <Key variant="technique" disabled={dis("slur")} onClick={() => onCommand({ type: "note-marking", marking: "slur" })}><IconHammerPull size={ICON} /></Key>
                <Key variant="technique" disabled={dis("slide")} onClick={() => onCommand({ type: "note-marking", marking: "slide" })}><IconSlide size={ICON} /></Key>
                <Key variant="technique" onClick={() => onCommand({ type: "event-marking", marking: "vibrato" })}><IconVibrato size={ICON} /></Key>
                <Key variant="technique" disabled={dis("bend")} onClick={() => onCommand({ type: "bend", bendType: "up" })}><IconBend size={ICON} /></Key>
                <Key variant="technique" disabled={dis("bend-down")} onClick={() => onCommand({ type: "bend", bendType: "down" })}><IconBendDown size={ICON} /></Key>
                <Key variant="technique" disabled={dis("pre-bend")} onClick={() => onCommand({ type: "bend", bendType: "pre" })}><IconPreBend size={ICON} /></Key>
              </Row>
            </>
          ) : (
            <>
              {/* Fret row 1 + line-break */}
              <Row>
                {frets1.map((n) => (
                  <Key key={n} variant="accent" onClick={() => onCommand({ type: "fret", fret: n })}>{n}</Key>
                ))}
                <Key disabled={dis("line-break")} onClick={() => onCommand({ type: "line-break" })}><CornerDownLeft size={16} /></Key>
              </Row>
              {/* Fret row 2: shift + frets + X + backspace */}
              <Row>
                <Key variant="toggle" active={layout === "shift"} onClick={() => setLayout((l) => (l === "shift" ? "default" : "shift"))}><ChevronUp size={18} /></Key>
                {frets2.map((n) => (
                  <Key key={n} variant="accent" onClick={() => onCommand({ type: "fret", fret: n })}>{n}</Key>
                ))}
                <Key variant="accent" onClick={() => onCommand({ type: "mute" })}>X</Key>
                <Key onClick={() => onCommand({ type: "backspace" })}><Delete size={18} /></Key>
              </Row>
            </>
          )}

          {/* Row 4 — actions */}
          <Row>
            <Key onClick={() => onCommand({ type: "cut" })}><Scissors size={15} /></Key>
            <Key onClick={() => onCommand({ type: "copy" })}><Copy size={15} /></Key>
            <Key onClick={() => onCommand({ type: "paste" })}><ClipboardPaste size={15} /></Key>
            <Key flex={2} onClick={() => onCommand({ type: "space" })}>
              <span className="h-0.5 w-8 rounded bg-current opacity-50" />
            </Key>
            <Key disabled={!canUndo} onClick={() => onCommand({ type: "undo" })}><Undo size={15} /></Key>
            <Key disabled={!canRedo} onClick={() => onCommand({ type: "redo" })}><Redo size={15} /></Key>
            <Key onClick={() => onCommand({ type: "enter" })}><CornerDownLeft size={15} /></Key>
          </Row>
        </div>
      </div>
    </div>
  );
}
