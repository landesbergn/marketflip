"use client";

import { useEffect, useState } from "react";
import { readHistory, clearHistory } from "@/lib/storage";
import { isLiteralYesNo } from "@/lib/fmt";
import type { HistoryEntry } from "@/lib/types";

type Props = {
  slug: string;
  /**
   * Bumped by the parent every time a new flip lands so the component
   * re-reads localStorage and re-renders the distribution.
   */
  refreshKey?: number;
  /** Implied YES probability — kept for parity with the implied dot grid. */
  yesProbability: number;
  /** Outcome label for the YES side (e.g. "Pistons", "Yes"). */
  yesLabel?: string;
  /** Outcome label for the NO side (e.g. "Cavaliers", "No"). */
  noLabel?: string;
};

export function History({
  slug,
  refreshKey = 0,
  yesProbability,
  yesLabel,
  noLabel,
}: Props) {
  const [open, setOpen] = useState(true);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(readHistory().filter((e) => e.slug === slug));
  }, [slug, refreshKey]);

  if (entries.length === 0) return null;

  const yesCount = entries.filter((e) => e.flippedTo === "YES").length;
  const noCount = entries.length - yesCount;
  const literal = isLiteralYesNo(yesLabel, noLabel);
  const yesToken = literal ? "YES" : yesLabel ?? "YES";
  const noToken = literal ? "NO" : noLabel ?? "NO";
  void yesProbability;

  return (
    <section className="mt-2 pt-6 border-t border-[var(--rule)]">
      <div className="flex items-baseline justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="eyebrow"
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
          aria-expanded={open}
        >
          {open
            ? "− Your flips for this market"
            : `+ Your flips · ${entries.length}`}
        </button>
        {open && entries.length > 0 && (
          <button
            onClick={() => {
              clearHistory();
              setEntries([]);
            }}
            className="figure text-[10px] tracking-[0.15em] uppercase text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
            style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <>
          <p
            className="mt-3 text-[24px] italic leading-snug m-0"
            style={{ color: "var(--ink)" }}
          >
            You saw{" "}
            <span className="not-italic" style={{ color: "var(--accent)" }}>
              {yesToken}
            </span>{" "}
            in{" "}
            <span className="not-italic" style={{ color: "var(--accent)" }}>
              {yesCount}
            </span>{" "}
            of{" "}
            <span className="not-italic" style={{ color: "var(--accent)" }}>
              {entries.length}
            </span>{" "}
            {entries.length === 1 ? "flip" : "flips"}
            <span className="not-italic text-[var(--ink-soft)]">
              {" "}({Math.round((yesCount / entries.length) * 100)}%)
            </span>
            .
          </p>

          <div className="mt-5">
            <FlipDots entries={entries} />
            <div className="flex gap-6 mt-5">
              <LegendDot solid label={`${yesCount} ${yesToken}`} />
              <LegendDot solid={false} label={`${noCount} ${noToken}`} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function FlipDots({ entries }: { entries: HistoryEntry[] }) {
  // Cap the visualization at the most recent 100 flips so the column
  // mirrors the 100-dot implied grid above, regardless of how many
  // total flips the user has accumulated.
  const window = entries.slice(0, 100);
  // Chronological within the window: oldest → top-left, newest → bottom-right.
  const ordered = [...window].reverse();
  const size = 18;
  const gap = 3;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap,
        maxWidth: "100%",
      }}
    >
      {ordered.map((e, i) => {
        const filled = e.flippedTo === "YES";
        return (
          <div
            key={`${e.timestamp}-${i}`}
            title={`${e.flippedTo} · ${new Date(e.timestamp).toLocaleString()}`}
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

function LegendDot({ solid, label }: { solid: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: solid ? "var(--accent)" : "transparent",
          border: solid ? "none" : "1.5px solid var(--ink)",
        }}
      />
      <span
        className="figure"
        style={{
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 500,
          color: "var(--ink)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
