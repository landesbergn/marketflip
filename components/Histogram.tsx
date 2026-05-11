"use client";

import { useMemo } from "react";

type Props = {
  /** Array of YES-percentages observed across trials (each value 0–100). */
  data: number[];
  /** Implied probability marker (0–1). */
  peak: number;
  width?: number;
  height?: number;
};

export function Histogram({ data, peak, width = 720, height = 140 }: Props) {
  const buckets = 50;
  const counts = useMemo(() => {
    const c = new Array(buckets).fill(0);
    data.forEach((v) => {
      const b = Math.min(buckets - 1, Math.floor((v / 100) * buckets));
      c[b]++;
    });
    return c;
  }, [data]);

  const max = Math.max(1, ...counts);
  const bw = width / buckets;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", width: "100%", height }}
      preserveAspectRatio="none"
    >
      {counts.map((v, i) => {
        const bh = (v / max) * (height - 12);
        return (
          <rect
            key={i}
            x={i * bw + 0.5}
            y={height - bh - 2}
            width={Math.max(1, bw - 1)}
            height={bh}
            fill="var(--accent)"
            opacity={0.85}
          />
        );
      })}
      <line
        x1={peak * width}
        x2={peak * width}
        y1={0}
        y2={height - 2}
        stroke="#0a0a0a"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.6}
      />
    </svg>
  );
}
