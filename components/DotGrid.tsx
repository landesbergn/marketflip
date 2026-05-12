type Props = {
  yesProb: number;
  /** Columns in the grid. Default 20 (so 5 rows × 20 cols = 100). */
  cols?: number;
};

/**
 * 100-dot probability grid. Filled accent dots = YES count, hollow ink rings = NO count.
 * Visual sizing matches the FlipDots history grid so the two read as a pair.
 */
export function DotGrid({ yesProb, cols = 20 }: Props) {
  const yesCount = Math.round(yesProb * 100);

  return (
    <div
      className="dot-grid"
      style={
        cols !== 20 ? { gridTemplateColumns: `repeat(${cols}, 18px)` } : undefined
      }
    >
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className={`dot ${i < yesCount ? "dot--yes" : "dot--no"}`}
        />
      ))}
    </div>
  );
}
