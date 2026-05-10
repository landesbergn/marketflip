// components/CandidateList.tsx
"use client";

import { useState } from "react";
import { CoinFlip } from "./CoinFlip";
import type { ParentEvent, FlipOutcome } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";

export function CandidateList({ event }: { event: ParentEvent }) {
  const [selected, setSelected] = useState<string | null>(null);

  const sub = event.subMarkets.find((s) => s.slug === selected) ?? null;

  return (
    <div>
      <h1 className="text-xl font-bold">{event.question}</h1>
      <p className="text-sm text-zinc-500 mt-1">
        {event.subMarkets.length} candidates · pick one to flip
      </p>
      <ul className="mt-4 space-y-2">
        {event.subMarkets.map((s) => (
          <li key={s.slug}>
            <button
              onClick={() => setSelected(s.slug)}
              className={`w-full text-left rounded-md border px-3 py-2 text-sm flex justify-between items-center transition ${
                selected === s.slug
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="font-semibold">{s.question}</span>
              <span className="font-mono text-zinc-600">
                {Math.round(s.yesProbability * 100)}% → flip
              </span>
            </button>
          </li>
        ))}
      </ul>
      {sub ? (
        <div className="mt-6">
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
    </div>
  );
}
