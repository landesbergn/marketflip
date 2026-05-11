type Props = {
  yesProb: number;
  /** Columns in the grid. Default 20 (so 5 rows × 20 cols = 100). */
  cols?: number;
  /** Pixel size of each dot. */
  size?: number;
  gap?: number;
};

/**
 * 100-dot probability grid. Filled accent dots = YES count, hollow ink dots = NO count.
 * Reads as: "the market sees yes in N of 100 futures".
 */
export function DotGrid({ yesProb, cols = 20, size = 18, gap = 5 }: Props) {
  const yesCount = Math.round(yesProb * 100);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap,
        justifyContent: "start",
      }}
    >
      {Array.from({ length: 100 }).map((_, i) => {
        const filled = i < yesCount;
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
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
