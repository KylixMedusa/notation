import { useRef, useState, useEffect } from "react";
import { TablatureStave } from "../tab/TablatureStave";
import type { TabBlock } from "../../types/tab";
import type { TTablature } from "../../types/tablature";
import { emptyTablature, STANDARD_6_TUNING } from "../../types/tablature";

interface Props {
  /** Accept either the new TTablature or the legacy TabBlock (bridged automatically). */
  block?: TabBlock;
  tablature?: TTablature;
}

function toTTablature(block?: TabBlock, tablature?: TTablature): TTablature {
  if (tablature) return tablature;
  if (!block) return emptyTablature();
  // New event format stored inside block — always render with the high→low standard tuning.
  const b = block as unknown as { events?: TTablature["events"] };
  if (b.events?.length) return { tuning: STANDARD_6_TUNING, events: b.events };
  // Legacy column model — no events to render.
  return emptyTablature();
}

/** Read-only tab view — auto-sizes to container width. */
export function TabView({ block, tablature }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);
  const tab = toTTablature(block, tablature);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!tab.events.length || tab.events.every((e) => e.kind === "default")) {
    return <p className="font-mono text-sm text-muted">Empty tab — tap edit to add notes.</p>;
  }

  return (
    <div ref={ref} className="w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      <TablatureStave
        tablature={tab}
        containerWidth={Math.max(width, 200)}
        readonly
        background="#F5F2EB"
      />
    </div>
  );
}
