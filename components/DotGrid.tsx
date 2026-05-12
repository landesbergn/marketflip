type Props = {
  yesProb: number;
  /** Columns in the grid. Default 20 (so 5 rows × 20 cols = 100). */
  cols?: number;
  /** Optional pixel cap on the grid width (responsive otherwise). */
  maxWidth?: number;
};

/**
 * 100-dot probability grid. Filled accent dots = YES count, hollow ink rings = NO count.
 * Dots are sized via 1fr columns + aspect-ratio so the grid fits any
 * container width down to mobile.
 */
export function DotGrid({ yesProb, cols = 20, maxWidth = 420 }: Props) {
  const yesCount = Math.round(yesProb * 100);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 3,
        width: "100%",
        maxWidth,
      }}
    >
      {Array.from({ length: 100 }).map((_, i) => {
        const filled = i < yesCount;
        return (
          <div
            key={i}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              background: filled ? "var(--accent)" : "transparent",
              border: filled ? "none" : "1.25px solid var(--ink)",
              opacity: filled ? 1 : 0.55,
            }}
          />
        );
      })}
    </div>
  );
}
