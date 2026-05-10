"use client";

import { useState } from "react";
import { CoinFlip } from "./CoinFlip";
import { MarketDescription } from "./MarketDescription";
import type { ParentEvent, FlipOutcome } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";

export function CandidateList({ event }: { event: ParentEvent }) {
  const [selected, setSelected] = useState<string | null>(null);

  const sub = event.subMarkets.find((s) => s.slug === selected) ?? null;

  return (
    <div>
      <header className="text-center mb-8">
        <p className="eyebrow text-[var(--ink-faint)]">The Field</p>
        <h1 className="headline text-3xl sm:text-4xl mt-2">{event.question}</h1>
        <p className="figure mt-2 text-sm text-[var(--ink-soft)]">
          {event.subMarkets.length} candidates ·{" "}
          <span className="italic">pick one to flip</span>
        </p>
        <hr className="rule mx-auto mt-4 w-24" />
      </header>

      <ul className="space-y-1.5 border-y border-[var(--rule)] divide-y divide-[var(--rule-soft)]">
        {event.subMarkets.map((s, idx) => (
          <li key={s.slug}>
            <button
              onClick={() => setSelected(s.slug)}
              className={`w-full text-left px-3 py-3 text-sm flex justify-between items-baseline gap-4 transition-colors ${
                selected === s.slug
                  ? "bg-[var(--paper-bright)]"
                  : "hover:bg-[var(--paper-bright)]"
              }`}
            >
              <span className="flex items-baseline gap-3 min-w-0">
                <span className="eyebrow text-[var(--ink-faint)] tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold truncate">{s.question}</span>
              </span>
              <span className="figure text-[var(--ink)] whitespace-nowrap">
                <span
                  className={`${
                    selected === s.slug
                      ? "text-[var(--oxblood)]"
                      : "text-[var(--ink-soft)]"
                  }`}
                >
                  {Math.round(s.yesProbability * 100)}%
                </span>{" "}
                <span className="text-[var(--ink-faint)]">→</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {sub ? (
        <div className="mt-10 pt-10 border-t-2 border-[var(--ink)]">
          <CoinFlip
            slug={sub.slug}
            question={sub.question}
            yesProbability={sub.yesProbability}
            outcomeYesLabel="Yes"
            outcomeNoLabel="No"
            onFlipComplete={(o: FlipOutcome) => {
              track({
                name: "flip_executed",
                props: {
                  slug: sub.slug,
                  outcome: o,
                  implied_probability: sub.yesProbability,
                },
              });
              addFlipToHistory({
                slug: sub.slug,
                question: sub.question,
                outcomeLabel: sub.question,
                flippedTo: o,
                impliedProbability: sub.yesProbability,
                timestamp: Date.now(),
              });
            }}
          />
        </div>
      ) : null}

      <MarketDescription text={event.description} />
    </div>
  );
}
