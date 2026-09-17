/**
 * Holographic HUD core: concentric SVG rings with counter-rotating arcs.
 */
export function ArcReactor({ active }: { active: boolean }) {
  const stroke = "currentColor";
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto aspect-square w-full max-w-[22rem] text-primary ${
        active ? "opacity-100" : "opacity-70"
      }`}
    >
      <div className="absolute inset-[18%] rounded-full bg-primary/10 blur-2xl" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full hud-drop">
        {/* outer tick ring */}
        <g className="spin-slow" style={{ transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="100" r="94" fill="none" stroke={stroke} strokeOpacity="0.25" />
          {Array.from({ length: 72 }).map((_, i) => (
            <line
              key={i}
              x1="100"
              y1="6"
              x2="100"
              y2={i % 6 === 0 ? 16 : 11}
              stroke={stroke}
              strokeOpacity={i % 6 === 0 ? 0.7 : 0.3}
              strokeWidth="1"
              transform={`rotate(${i * 5} 100 100)`}
            />
          ))}
        </g>

        {/* broken arc ring, reverse */}
        <g className="spin-rev" style={{ transformOrigin: "100px 100px" }}>
          {[0, 90, 180, 270].map((a) => (
            <path
              key={a}
              d="M 100 22 A 78 78 0 0 1 155 45"
              fill="none"
              stroke={stroke}
              strokeOpacity="0.8"
              strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${a} 100 100)`}
            />
          ))}
        </g>

        {/* segmented ring */}
        <g className="spin-med" style={{ transformOrigin: "100px 100px" }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <rect
              key={i}
              x="99"
              y="32"
              width="2"
              height={i % 3 === 0 ? 12 : 6}
              fill={stroke}
              fillOpacity={i % 3 === 0 ? 0.85 : 0.35}
              transform={`rotate(${i * 15} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="58" fill="none" stroke={stroke} strokeOpacity="0.35" />
        </g>

        {/* dashed inner */}
        <circle
          cx="100"
          cy="100"
          r="46"
          fill="none"
          stroke={stroke}
          strokeOpacity="0.6"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          className="spin-rev-slow"
          style={{ transformOrigin: "100px 100px" }}
        />

        {/* core */}
        <circle cx="100" cy="100" r="34" fill="none" stroke={stroke} strokeOpacity="0.5" />
        <circle cx="100" cy="100" r="22" className="reactor" fill="currentColor" fillOpacity="0.18" />
        <circle cx="100" cy="100" r="12" fill="currentColor" fillOpacity="0.55" className="reactor" />
      </svg>
    </div>
  );
}
