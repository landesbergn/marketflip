// Small animated gold coin for the header — perpetual rotateY, no letters.
// Reeded teeth, beveled rim, specular highlight.

type CoinFaceProps = { id: string; deep?: boolean };

function CoinFace({ id, deep = false }: CoinFaceProps) {
  const teethCount = 56;
  return (
    <svg
      viewBox="-15 -15 30 30"
      width="100%"
      height="100%"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`g-${id}`} cx="32%" cy="26%" r="82%">
          <stop offset="0%" stopColor={deep ? "#e8c560" : "#fae28a"} />
          <stop offset="45%" stopColor={deep ? "#b8870e" : "#d4a017"} />
          <stop offset="100%" stopColor={deep ? "#5e4204" : "#7a5605"} />
        </radialGradient>
        <radialGradient id={`r-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="rgba(255,225,140,0)" />
          <stop offset="86%" stopColor="rgba(255,235,170,0.55)" />
          <stop offset="92%" stopColor="rgba(110,70,8,0.5)" />
          <stop offset="100%" stopColor="rgba(60,40,4,0.85)" />
        </radialGradient>
        <radialGradient id={`h-${id}`} cx="28%" cy="22%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <circle r="12.8" fill={`url(#g-${id})`} />

      <g stroke="#4a3202" strokeWidth="0.55" strokeLinecap="butt">
        {Array.from({ length: teethCount }).map((_, i) => {
          const ang = (i * 360) / teethCount;
          return (
            <line
              key={i}
              x1="0"
              y1="-12.85"
              x2="0"
              y2="-11.55"
              transform={`rotate(${ang})`}
            />
          );
        })}
      </g>

      <circle r="12.8" fill={`url(#r-${id})`} />
      <circle r="10.4" fill="none" stroke="rgba(110,70,8,0.55)" strokeWidth="0.5" />
      <circle r="9.85" fill="none" stroke="rgba(255,225,140,0.55)" strokeWidth="0.35" />
      <circle r="12.8" fill={`url(#h-${id})`} />
    </svg>
  );
}

export function HeaderCoin({ size = 26 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        perspective: 140,
        verticalAlign: "middle",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          animation: "mf-header-coin 3.6s linear infinite",
          filter: "drop-shadow(0 1px 1.2px rgba(80,55,5,0.22))",
        }}
      >
        <span style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
          <CoinFace id="hf" />
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CoinFace id="hb" deep />
        </span>
      </span>
    </span>
  );
}
