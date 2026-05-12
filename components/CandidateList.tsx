"use client";

import { useState } from "react";
import { MarketFlipClient } from "@/app/m/[slug]/MarketFlipClient";
import type { ParentEvent, FlippableMarket } from "@/lib/types";
import { extractCandidateName } from "@/lib/fmt";

export function CandidateList({ event }: { event: ParentEvent }) {
  const [selected, setSelected] = useState<string | null>(null);

  const sub = event.subMarkets.find((s) => s.slug === selected) ?? null;

  // Re-shape the picked sub-market into a binary FlippableMarket so the
  // same MarketFlipClient that powers the binary market page renders
  // here — same Reading + flip + history layout.
  const synthetic: FlippableMarket | null = sub
    ? {
        id: sub.slug,
        slug: sub.slug,
        question: sub.question,
        description: event.description,
        outcomes: [
          {
            label: extractCandidateName(sub.question),
            probability: sub.yesProbability,
          },
          {
            label: "Someone else",
            probability: Math.max(0, 1 - sub.yesProbability),
          },
        ],
        endDate: event.endDate,
        volume24h: 0,
        url: event.url,
      }
    : null;

  return (
    <div>
      <section className="pt-10 pb-6">
        <p className="eyebrow">The field</p>
        <p className="mt-4 text-xl leading-snug max-w-2xl">
          Each candidate is its own coin. Probabilities sum below 100% — the
          market keeps room for what it doesn&rsquo;t know.
        </p>
      </section>

      <section className="pb-10">
        <p className="eyebrow mb-3">Pick one to flip</p>
        <hr className="border-0 border-t border-[var(--ink)] m-0" />
        <ul className="m-0 p-0 list-none">
          {event.subMarkets.map((s) => {
            const pct = Math.round(s.yesProbability * 100);
            const isSelected = selected === s.slug;
            return (
              <li key={s.slug} className="border-b border-[var(--rule)]">
                <button
                  onClick={() => setSelected(s.slug)}
                  className="row-hover w-full text-left grid items-center gap-6 px-3 py-5"
                  style={{
                    gridTemplateColumns: "220px 1fr 80px",
                    background: isSelected ? "var(--paper-soft)" : undefined,
                  }}
                >
                  <span className="text-[20px] leading-snug">
                    {extractCandidateName(s.question)}
                  </span>
                  <span className="block h-2 bg-[var(--rule-soft)] relative">
                    <span
                      className="absolute inset-0 block"
                      style={{
                        width: `${pct}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </span>
                  <span
                    className="text-right text-[28px] italic"
                    style={{ color: "var(--accent)", lineHeight: 1 }}
                  >
                    {pct}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {synthetic && sub && (
        <section className="pt-2 mt-2 border-t-2 border-[var(--ink)]">
          {/* `key` ensures MarketFlipClient remounts cleanly when the user
              picks a different candidate so its internal state resets. */}
          <MarketFlipClient key={sub.slug} market={synthetic} />
        </section>
      )}
    </div>
  );
}
