/**
 * SVG stave renderer — ported from my-guitar-tabs (tablature-renderer.ts + theme.ts),
 * adapted to our warm palette.
 *
 * Reference theme → our palette:
 *   stave color  gray-400 #bababa  → warm gray #c4bdb0 (selected string → #7a7264, disabled → #e0dacd)
 *   note text    --text-color      → charcoal #2c2a26 (18px)
 *   markings     #1f1f1f           → charcoal #2c2a26
 *   selection    --primary-color   → terracotta #d45211
 *   knockout bg  --surface         → parchment #FDFBF7
 *
 * Constants (theme.ts): note textSize 18 / w 16 / h 13; barline stroke 1, bold 3, gap 4,
 * repeat radius 2.5, repeat gap 8; vibrato gap 11; palmMuting gap 35 / textKerning 18 / lineHeight 12;
 * annotations gap 42; tuning gap 12; downstroke/upstroke gap 10 / w 10 / h 10; slur height 12;
 * slide height 8; bend height 14 / width 8 / kerningBottom 8 / triangle 4.
 */
import { useMemo, useState } from "react";
import {
  TabGeometry, EXTRA_ROWS,
  type NotePosition, type StyleConstants, DEFAULT_STYLE,
} from "../../lib/tab/geometry";
import {
  isBarline, isChord, hasMarking, getNoteMarkings, getEventMarkings,
} from "../../types/tablature";
import type { TEvent, TTablature } from "../../types/tablature";

interface Props {
  tablature: TTablature;
  containerWidth: number;
  styleOverride?: Partial<StyleConstants>;
  cursor?: NotePosition;
  readonly?: boolean;
  /** Background color the stave sits on — used for the note-number knockout so it blends in. */
  background?: string;
  onClickPosition?: (pos: NotePosition) => void;
}

const C = {
  stave:         "#c4bdb0",
  staveActive:   "#7a7264",
  staveDisabled: "#e0dacd",
  note:          "#2c2a26",
  marking:       "#2c2a26",
  knockout:      "#FDFBF7",
  cursorStroke:  "#d45211",
  hoverFill:     "rgba(212,82,17,0.16)",
  noteSel:       "rgba(212,82,17,0.30)",
};

// Theme constants (unscaled).
const T = {
  noteText: 13, noteW: 13, noteH: 13,
  barlineStroke: 1, barlineBold: 3, barlineGap: 4, repeatRadius: 2.5, repeatGap: 8,
  vibratoGap: 11, pmGap: 35, pmKerning: 18, pmLineH: 12, annotGap: 42, tuningGap: 12,
  strokeGap: 10, strokeW: 10, strokeH: 10,
  slurH: 12, slideH: 8,
  bendH: 14, bendW: 8, bendKerningBottom: 8, triangle: 4,
};

function fretText(fret: number | "x", harmonic: boolean, ghost: boolean): string {
  if (fret === "x") return "X";
  const n = String(fret);
  if (harmonic) return `<${n}>`;
  if (ghost) return `(${n})`;
  return n;
}

export function TablatureStave({
  tablature, containerWidth, styleOverride, cursor, readonly, background = "#FDFBF7", onClickPosition,
}: Props) {
  const style: StyleConstants = { ...DEFAULT_STYLE, ...styleOverride };
  const { events, tuning } = tablature;
  const stringCount = tuning.strings.length;
  const [hover, setHover] = useState<NotePosition | null>(null);

  // Append one extra row of empty events in edit mode (EXTRA_ROWS_IN_TABLATURE = 1).
  const displayEvents = useMemo<TEvent[]>(() => {
    if (readonly) return events;
    const cols = Math.max(8, Math.floor((containerWidth - style.paddingLeft - style.paddingRight) / (style.eventWidth * style.scale)));
    return [...events, ...Array.from({ length: EXTRA_ROWS * cols }, (): TEvent => ({ kind: "default", markings: [] }))];
  }, [events, readonly, containerWidth, style]);

  const geo = useMemo(
    () => new TabGeometry(displayEvents, stringCount, containerWidth, style),
    [displayEvents, stringCount, containerWidth, style],
  );

  const sc = style.scale;
  const sg = geo.sg();
  const ew = geo.ew();
  const dash = readonly ? undefined : `${(style.eventWidth / 8) * sc}`;
  const rows = geo.getRows();

  // Palm-muting spans.
  const pmSpans = useMemo(() => {
    const m = new Map<number, number>();
    let start = -1, len = 0;
    for (let i = 0; i < displayEvents.length; i++) {
      if (hasMarking(displayEvents[i], "palm-muting")) { if (start < 0) start = i; len++; }
      else if (start >= 0) { m.set(start, len); start = -1; len = 0; }
    }
    if (start >= 0) m.set(start, len);
    return m;
  }, [displayEvents]);

  function clickPos(e: React.MouseEvent<SVGSVGElement>): NotePosition | null {
    const rect = e.currentTarget.getBoundingClientRect();
    return geo.pointToNotePosition(e.clientX - rect.left, e.clientY - rect.top);
  }

  return (
    <svg
      width={containerWidth}
      height={geo.totalHeight()}
      style={{ display: "block", width: "100%", overflow: "visible", cursor: readonly ? "default" : "crosshair" }}
      onMouseMove={readonly ? undefined : (e) => setHover(clickPos(e))}
      onMouseLeave={() => setHover(null)}
      onClick={readonly ? undefined : (e) => { const p = clickPos(e); if (p) onClickPosition?.(p); }}
    >
      {/* ── Stave lines + tuning labels, per row ── */}
      {rows.map((rowEvents, r) => {
        const rp = geo.rowPoint(r);
        const endX = geo.staveEndX();
        const lastContentCol = rowEvents.length;
        const contentEndX = geo.pl() + lastContentCol * ew; // where real events end
        return (
          <g key={`row-${r}`}>
            {tuning.strings.map((label, s) => {
              const y = rp.y + s * sg;
              const isActiveLine = !readonly && cursor?.stringIndex === s && cursor?.eventIndex !== undefined
                && rows[r].includes(cursor.eventIndex);
              return (
                <g key={s}>
                  <text
                    x={geo.pl() - T.tuningGap} y={y}
                    textAnchor="end" dominantBaseline="middle"
                    fontSize={(style.stringGap - 2) * sc}
                    fontFamily="JetBrains Mono, monospace" fill={C.staveActive}
                  >
                    {label}
                  </text>
                  {/* active portion */}
                  <line
                    x1={rp.x} y1={y} x2={readonly ? endX : contentEndX} y2={y}
                    stroke={isActiveLine ? C.staveActive : C.stave}
                    strokeWidth={1 * sc} strokeDasharray={dash}
                  />
                  {/* disabled tail (after a short row in edit mode) */}
                  {!readonly && contentEndX < endX && (
                    <line x1={contentEndX} y1={y} x2={endX} y2={y}
                      stroke={C.staveDisabled} strokeWidth={1 * sc} strokeDasharray={dash} />
                  )}
                </g>
              );
            })}
            {/* End barline at the right of the row */}
            <line
              x1={endX} y1={rp.y} x2={endX} y2={rp.y + geo.innerRowHeight()}
              stroke={C.marking} strokeWidth={T.barlineStroke * sc}
            />
          </g>
        );
      })}

      {/* ── Events ── */}
      {displayEvents.map((ev, ei) => {
        const ep = geo.eventPoint(ei);
        if (!ep) return null;
        const cx = ep.x;
        const top = ep.y;
        const innerH = geo.innerRowHeight();
        const nextEp = geo.eventPoint(ei + 1);
        const sameRowNext = nextEp && geo.eventLayout(ei + 1)?.row === geo.eventLayout(ei)?.row ? nextEp : null;

        return (
          <g key={`ev-${ei}`}>
            {/* Barline */}
            {isBarline(ev) && <Barline ev={ev} cx={cx} top={top} bottom={top + innerH} sc={sc} />}

            {/* Hover rect */}
            {!readonly && hover?.eventIndex === ei && !isBarline(ev) && (
              <rect
                x={cx - (ew - 10 * sc) / 2} y={top - sg}
                width={ew - 10 * sc} height={sg * (stringCount + 1)}
                rx={8 * sc} fill={C.hoverFill}
              />
            )}

            {/* Notes */}
            {isChord(ev) && ev.notes.map((note) => {
              const ny = top + note.stringIndex * sg;
              const harmonic = getNoteMarkings(ev, "harmonic").some((m) => m.data.stringIndex === note.stringIndex);
              const ghost = getNoteMarkings(ev, "ghost").some((m) => m.data.stringIndex === note.stringIndex);
              const label = fretText(note.fret, harmonic, ghost);
              const w = Math.max(T.noteW, label.length * 7.5) * sc;
              return (
                <g key={note.stringIndex}>
                  <rect x={cx - w / 2} y={ny - (T.noteH / 2) * sc} width={w} height={T.noteH * sc} fill={background} />
                  <text x={cx} y={ny} textAnchor="middle" dominantBaseline="middle"
                    fontSize={T.noteText * sc} fontFamily="JetBrains Mono, monospace" fontWeight={500} fill={C.note}>
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Cursor selection circle + (string line handled above) */}
            {!readonly && cursor?.eventIndex === ei && !isBarline(ev) && (
              <circle cx={cx} cy={top + cursor.stringIndex * sg} r={sg / 1.3} fill={C.noteSel} pointerEvents="none" />
            )}

            {/* Annotations */}
            {getEventMarkings(ev, "annotation").map((m, i) => (
              <text key={i} x={cx} y={top - T.annotGap * sc} textAnchor="middle"
                fontSize={12 * sc} fontFamily="Inter, sans-serif" fill={C.marking}>
                {m.data.text}
              </text>
            ))}

            {/* Palm muting */}
            {hasMarking(ev, "palm-muting") && pmSpans.has(ei) && (() => {
              const len = pmSpans.get(ei)!;
              const y = top - T.pmGap * sc;
              const endEp = geo.eventPoint(ei + len - 1);
              return (
                <g>
                  <text x={cx} y={y} textAnchor="middle" fontSize={11 * sc}
                    fontFamily="Inter, sans-serif" fontStyle="italic" fill={C.marking}>P.M.</text>
                  {len > 1 && endEp && geo.eventLayout(ei + len - 1)?.row === geo.eventLayout(ei)?.row && (
                    <>
                      <line x1={cx + T.pmKerning * sc} y1={y} x2={endEp.x} y2={y}
                        stroke={C.marking} strokeWidth={1 * sc} strokeDasharray={`${4 * sc} ${2 * sc}`} />
                      <line x1={endEp.x} y1={y - (T.pmLineH / 2) * sc} x2={endEp.x} y2={y + (T.pmLineH / 2) * sc}
                        stroke={C.marking} strokeWidth={1 * sc} />
                    </>
                  )}
                </g>
              );
            })()}

            {/* Vibrato — exact wavy ribbon above the top string (from getVibrato) */}
            {hasMarking(ev, "vibrato") && (
              <path
                transform={`translate(${cx - 12 * sc}, ${top - T.vibratoGap * sc}) scale(${sc})`}
                d="M0 0 Q2 -5, 4 -2 Q6 1, 8 -2 Q10 -5,12 -2 Q14 1,16 -2 Q18 -5,20 -2 Q22 1,24 -2 Q22 3,20 0 Q18 -3,16 0 Q14 3,12 0 Q10 -3, 8 0 Q6 3, 4 0 Q2 -3, 0 0"
                fill={C.marking}
              />
            )}

            {/* Downstroke — staple (⊓) below event */}
            {hasMarking(ev, "downstroke") && (() => {
              const y0 = top + innerH + T.strokeGap * sc;
              const hw = (T.strokeW / 2) * sc, h = T.strokeH * sc;
              return (
                <g stroke={C.marking} fill="none">
                  <line x1={cx - hw} y1={y0} x2={cx + hw} y2={y0} strokeWidth={T.barlineBold * sc} />
                  <line x1={cx - hw} y1={y0} x2={cx - hw} y2={y0 + h} strokeWidth={1 * sc} />
                  <line x1={cx + hw} y1={y0} x2={cx + hw} y2={y0 + h} strokeWidth={1 * sc} />
                </g>
              );
            })()}

            {/* Upstroke — V below event */}
            {hasMarking(ev, "upstroke") && (() => {
              const y0 = top + innerH + T.strokeGap * sc;
              const hw = (T.strokeW / 2) * sc, h = T.strokeH * sc;
              return (
                <path d={`M ${cx - hw} ${y0} L ${cx} ${y0 + h} L ${cx + hw} ${y0}`}
                  fill="none" stroke={C.marking} strokeWidth={1 * sc} />
              );
            })()}

            {/* Slur (hammer/pull) — arc to next note */}
            {isChord(ev) && sameRowNext && getNoteMarkings(ev, "slur").map((m, i) => {
              const sy = top + m.data.stringIndex * sg;
              const fromX = cx + (T.noteW / 2) * sc;
              const toX = sameRowNext.x - (T.noteW / 2) * sc;
              const midX = (fromX + toX) / 2;
              return (
                <path key={i} d={`M ${fromX} ${sy} Q ${midX} ${sy - T.slurH * sc} ${toX} ${sy}`}
                  fill="none" stroke={C.marking} strokeWidth={1.5 * sc} />
              );
            })}

            {/* Slide — diagonal to next note */}
            {isChord(ev) && sameRowNext && getNoteMarkings(ev, "slide").map((m, i) => {
              const sy = top + m.data.stringIndex * sg;
              const hh = (T.slideH / 2) * sc;
              const fromX = cx + (T.noteW / 2) * sc;
              const toX = sameRowNext.x - (T.noteW / 2) * sc;
              return (
                <line key={i} x1={fromX} y1={sy + hh} x2={toX} y2={sy - hh}
                  stroke={C.marking} strokeWidth={1.2 * sc} />
              );
            })}

            {/* Bend — up / down / pre, each rendered distinctly (per tablature-renderer.ts) */}
            {isChord(ev) && getNoteMarkings(ev, "bend").map((m, i) => (
              <BendMark key={i} bend={m.data} cx={cx} top={top} sg={sg} sc={sc} />
            ))}

            {/* Line-break marker */}
            {!readonly && hasMarking(ev, "line-break") && (
              <g>
                <circle cx={cx} cy={top + innerH / 2} r={11 * sc} fill={C.hoverFill} stroke={C.cursorStroke} strokeWidth={1} />
                <text x={cx} y={top + innerH / 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={12 * sc} fill={C.cursorStroke}>↵</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BendMark({
  bend, cx, top, sg, sc,
}: {
  bend: { value: string; type: "up" | "down" | "pre"; stringIndex: number };
  cx: number; top: number; sg: number; sc: number;
}) {
  const sy = top + bend.stringIndex * sg;
  const tri = T.triangle * sc;
  const bendTopY = top - T.bendH * sc;
  const valText = (x: number, y: number) => (
    <text x={x} y={y} textAnchor="middle" stroke="none" fill={C.note}
      fontSize={11 * sc} fontFamily="Inter, sans-serif">{bend.value}</text>
  );

  if (bend.type === "pre") {
    // Vertical line from the note up to above the top string, arrow up + value.
    const x = cx;
    const fromY = sy - T.bendKerningBottom * sc;
    return (
      <g stroke={C.note} fill={C.note}>
        <line x1={x} y1={fromY} x2={x} y2={bendTopY} strokeWidth={1.2 * sc} />
        <polygon points={`${x - tri},${bendTopY} ${x + tri},${bendTopY} ${x},${bendTopY - tri}`} />
        {valText(x, bendTopY - tri - 3 * sc)}
      </g>
    );
  }

  if (bend.type === "down") {
    // Curve descending into the note from above-left, arrow pointing down at the note.
    const toY = sy - T.bendKerningBottom * sc;
    const fromX = cx - T.bendW * sc;
    return (
      <g stroke={C.note} fill={C.note}>
        <path d={`M ${fromX} ${bendTopY} Q ${cx} ${bendTopY} ${cx} ${toY}`} fill="none" strokeWidth={1.2 * sc} />
        <polygon points={`${cx - tri},${toY} ${cx + tri},${toY} ${cx},${toY + tri}`} />
        {valText(fromX, bendTopY - 3 * sc)}
      </g>
    );
  }

  // up (default): curve rising up-right from the note, arrow up + value.
  const fromX = cx + (T.noteW / 2 + 1) * sc;
  const fromY = sy - T.bendKerningBottom * sc;
  const toX = cx + (T.noteW / 2 + 1 + T.bendW) * sc;
  return (
    <g stroke={C.note} fill={C.note}>
      <path d={`M ${fromX} ${fromY} Q ${toX} ${fromY} ${toX} ${bendTopY}`} fill="none" strokeWidth={1.2 * sc} />
      <polygon points={`${toX - tri},${bendTopY} ${toX + tri},${bendTopY} ${toX},${bendTopY - tri}`} />
      {valText(toX, bendTopY - tri - 3 * sc)}
    </g>
  );
}

function Barline({
  ev, cx, top, bottom, sc,
}: { ev: Extract<TEvent, { kind: "barline" }>; cx: number; top: number; bottom: number; sc: number }) {
  const thin = T.barlineStroke * sc, bold = T.barlineBold * sc;
  const halfGap = (T.barlineGap / 2) * sc;
  const r = T.repeatRadius * sc, gap = T.repeatGap * sc;
  const h = bottom - top;
  const dot = (x: number) => (
    <>
      <circle cx={x} cy={top + h / 3} r={r} fill={C.marking} />
      <circle cx={x} cy={top + (2 * h) / 3} r={r} fill={C.marking} />
    </>
  );
  switch (ev.barlineType) {
    case "double":
      return <g stroke={C.marking}>
        <line x1={cx - halfGap} y1={top} x2={cx - halfGap} y2={bottom} strokeWidth={thin} />
        <line x1={cx + halfGap} y1={top} x2={cx + halfGap} y2={bottom} strokeWidth={bold} />
      </g>;
    case "repeat-start":
      return <g stroke={C.marking}>
        <line x1={cx - halfGap} y1={top} x2={cx - halfGap} y2={bottom} strokeWidth={bold} />
        <line x1={cx + halfGap} y1={top} x2={cx + halfGap} y2={bottom} strokeWidth={thin} />
        {dot(cx + halfGap + gap)}
      </g>;
    case "repeat-end":
      return <g stroke={C.marking}>
        <line x1={cx - halfGap} y1={top} x2={cx - halfGap} y2={bottom} strokeWidth={thin} />
        <line x1={cx + halfGap} y1={top} x2={cx + halfGap} y2={bottom} strokeWidth={bold} />
        {dot(cx - halfGap - gap)}
      </g>;
    default:
      return <line x1={cx} y1={top} x2={cx} y2={bottom} stroke={C.marking} strokeWidth={thin} />;
  }
}
