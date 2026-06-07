/**
 * Tab keyboard technique icons — reproduced exactly from the my-guitar-tabs CSS
 * (`.marking-key` data-URI SVGs), 30×30 viewBox, using currentColor so they inherit
 * the button text color.
 */
type IconProps = { size?: number; className?: string };

function Svg({ size = 22, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconHammerPull = (p: IconProps) => (
  <Svg {...p}>
    <g transform="translate(1,18)">
      <path d="M0 0 Q13 -9, 27 0 Q13 -11,0 0Z" fill="currentColor" />
    </g>
  </Svg>
);

export const IconSlide = (p: IconProps) => (
  <Svg {...p}>
    <line x1="5" y1="20" x2="25" y2="10" stroke="currentColor" strokeWidth="1.5" />
  </Svg>
);

export const IconBend = (p: IconProps) => (
  <Svg {...p}>
    <g transform="translate(5,29)">
      <path d="M12 -28 L8 -24 L16 -24Z" fill="currentColor" />
      <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M0 0 Q12 0,12 -26" />
    </g>
  </Svg>
);

export const IconPreBend = (p: IconProps) => (
  <Svg {...p}>
    <g transform="translate(3,29)">
      <path d="M12 -28 L8 -24 L16 -24Z" fill="currentColor" />
      <line x1="12" y1="-24" x2="12" y2="0" stroke="currentColor" strokeWidth="1.2" />
    </g>
  </Svg>
);

export const IconBendDown = (p: IconProps) => (
  <Svg {...p}>
    <g transform="translate(5,29)">
      <path d="M12 0 L8 -4 L16 -4Z" fill="currentColor" />
      <path fill="none" stroke="currentColor" strokeWidth="1.2" d="M0 -26 Q12 -26,12 0" />
    </g>
  </Svg>
);

export const IconVibrato = (p: IconProps) => (
  <Svg {...p}>
    <g transform="translate(3,15)">
      <path
        fill="currentColor"
        d="M0 0 Q2 -5, 4 -2 Q6 1, 8 -2 Q10 -5,12 -2 Q14 1,16 -2 Q18 -5,20 -2 Q22 1,24 -2 Q22 3,20 0 Q18 -3,16 0 Q14 3,12 0 Q10 -3, 8 0 Q6 3, 4 0 Q2 -3, 0 0"
      />
    </g>
  </Svg>
);

export const IconDownstroke = (p: IconProps) => (
  <Svg {...p}>
    <line x1="10" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="4" />
    <line x1="10" y1="8" x2="10" y2="20" stroke="currentColor" strokeWidth="1" />
    <line x1="20" y1="8" x2="20" y2="20" stroke="currentColor" strokeWidth="1" />
  </Svg>
);

export const IconUpstroke = (p: IconProps) => (
  <Svg {...p}>
    <path d="M 10 8 L 15 24 L 20 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </Svg>
);

export const IconHarmonic = (p: IconProps) => (
  <Svg {...p}>
    <line x1="6" y1="15" x2="14" y2="10" stroke="currentColor" strokeWidth="1" />
    <line x1="24" y1="15" x2="16" y2="10" stroke="currentColor" strokeWidth="1" />
    <line x1="6" y1="15" x2="14" y2="20" stroke="currentColor" strokeWidth="1" />
    <line x1="24" y1="15" x2="16" y2="20" stroke="currentColor" strokeWidth="1" />
  </Svg>
);

export const IconGhost = (p: IconProps) => (
  <Svg {...p}>
    <path d="M 10 5 Q 8 10, 8 15 Q 8 20, 10 25" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M 20 5 Q 22 10, 22 15 Q 22 20, 20 25" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </Svg>
);

export const IconTremolo = (p: IconProps) => (
  <Svg {...p}>
    <line x1="5" y1="10" x2="18" y2="4" stroke="currentColor" strokeWidth="4" />
    <line x1="5" y1="16" x2="18" y2="10" stroke="currentColor" strokeWidth="4" />
    <line x1="5" y1="22" x2="18" y2="16" stroke="currentColor" strokeWidth="4" />
  </Svg>
);

export const IconBarLine = (p: IconProps) => (
  <Svg {...p}>
    <line x1="15" y1="2" x2="15" y2="28" stroke="currentColor" strokeWidth="1.5" />
  </Svg>
);

export const IconRepeatBarLine = (p: IconProps) => (
  <Svg {...p}>
    <line x1="7" y1="2" x2="7" y2="28" stroke="currentColor" strokeWidth="3" />
    <line x1="13" y1="2" x2="13" y2="28" stroke="currentColor" strokeWidth="1" />
    <circle cx="20" cy="10" r="2" fill="currentColor" />
    <circle cx="20" cy="20" r="2" fill="currentColor" />
  </Svg>
);

export const IconDoubleBarLine = (p: IconProps) => (
  <Svg {...p}>
    <line x1="10" y1="2" x2="10" y2="28" stroke="currentColor" strokeWidth="1" />
    <line x1="20" y1="2" x2="20" y2="28" stroke="currentColor" strokeWidth="2.5" />
  </Svg>
);
