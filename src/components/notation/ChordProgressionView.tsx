import { Fragment } from "react";
import { formatChord } from "../../lib/notation";
import type { Bar, BarMark, ChordProgression } from "../../types";

const MARK_SYMBOL: Record<BarMark, string> = {
  segno: "𝄋",
  coda: "𝄌",
  "to-coda": "→𝄌",
  fine: "Fine",
};

/**
 * Minimal inline rendering with the rhythm-slash standard plus roadmap symbols:
 * repeat barlines `|: :|` (with ×count), 1st/2nd ending brackets, simile `%`, and navigation
 * marks (Segno/Coda/Fine) and directives (D.C./D.S. variants). Meter-agnostic.
 */
export function ChordProgressionView({
  prog,
  barsPerRow,
}: {
  prog: ChordProgression;
  /** When set, lay the chart out in fixed rows of N bars (e.g. 4) instead of free-wrapping. */
  barsPerRow?: number;
}) {
  const bars = prog.bars;
  if (bars.length === 0) return null;

  if (barsPerRow) {
    const rows: Bar[][] = [];
    for (let i = 0; i < bars.length; i += barsPerRow) rows.push(bars.slice(i, i + barsPerRow));
    return (
      <div className="flex flex-col gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {rows.map((row, r) => (
          <div key={r} className="flex w-max items-center gap-x-2 font-mono text-lg">
            {row.map((bar, j) => {
              const index = r * barsPerRow + j;
              return (
                <Fragment key={j}>
                  <span className="text-muted">{dividerBefore(bars, index)}</span>
                  <BarUnit bar={bar} />
                </Fragment>
              );
            })}
            <span className="text-muted">{(row[row.length - 1].repeatEnd ? ":" : "") + "|"}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 font-mono text-lg">
      {bars.map((bar, i) => (
        <Fragment key={i}>
          <span className="text-muted">{dividerBefore(bars, i)}</span>
          <BarUnit bar={bar} />
        </Fragment>
      ))}
      <span className="text-muted">{(bars[bars.length - 1].repeatEnd ? ":" : "") + "|"}</span>
    </div>
  );
}

function dividerBefore(bars: Bar[], i: number): string {
  const left = i > 0 && bars[i - 1].repeatEnd ? ":" : "";
  const right = bars[i].repeatStart ? ":" : "";
  return left + "|" + right;
}

function BarUnit({ bar }: { bar: Bar }) {
  return (
    <span className="inline-flex items-center gap-2">
      {bar.mark && <Badge>{MARK_SYMBOL[bar.mark]}</Badge>}
      {bar.ending && <Badge>{bar.ending}.</Badge>}
      {bar.repeatPrevious ? (
        <span className="text-muted">%</span>
      ) : (
        barTokens(bar).map((t, i) => (
          <span key={i} className={t.chord ? "font-semibold text-notation" : "text-muted"}>
            {t.text}
          </span>
        ))
      )}
      {bar.repeatEnd && (bar.repeatCount ?? 2) > 1 && (
        <span className="text-sm text-muted">×{bar.repeatCount ?? 2}</span>
      )}
      {bar.jump && <Badge>{bar.jump}</Badge>}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
      {children}
    </span>
  );
}

interface Token {
  text: string;
  chord: boolean;
}

/** Beat-by-beat tokens: chord onsets carry the symbol, held beats are `/`. */
function barTokens(bar: Bar): Token[] {
  if (bar.slots.length === 1 && bar.slots[0].kind !== "rest") {
    const s = bar.slots[0];
    return [{ text: s.kind === "chord" ? formatChord(s.chord) : "N.C.", chord: s.kind === "chord" }];
  }
  const out: Token[] = [];
  for (const s of bar.slots) {
    if (s.kind === "chord") out.push({ text: formatChord(s.chord), chord: true });
    else if (s.kind === "nc") out.push({ text: "N.C.", chord: false });
    else out.push({ text: "/", chord: false });
    for (let k = 1; k < s.beats; k++) out.push({ text: "/", chord: false });
  }
  return out;
}
