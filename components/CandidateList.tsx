"use client";

import { useState } from "react";
import { CoinFlip } from "./CoinFlip";
import { MarketDescription } from "./MarketDescription";
import { ShareButton } from "./ShareButton";
import { SimulationPanel } from "./SimulationPanel";
import type { ParentEvent, FlipOutcome, SimResult } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";
import { extractCandidateName } from "@/lib/fmt";
import {
  formatSingleFlipShare,
  formatSimulationShare,
} from "@/lib/share";

export function CandidateList({ event }: { event: ParentEvent }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [lastFlip, setLastFlip] = useState<FlipOutcome | null>(null);
  const [lastSim, setLastSim] = useState<SimResult | null>(null);

  const sub = event.subMarkets.find((s) => s.slug === selected) ?? null;
  const subUrl =
    typeof window !== "undefined" && sub
      ? window.location.href
      : sub?.slug ?? "";

  return (
    <div>
      <section className="pt-10 pb-6">
        <p className="eyebrow">The field</p>
        <p className="mt-4 text-xl leading-snug max-w-2xl">
          Each candidate is its own coin. Probabilities sum below 100% — the
          market keeps room for what it doesn&rsquo;t know.
        </p>
      </section>

      <section className="pb-12">
        <p className="eyebrow mb-3">Pick one to flip</p>
        <hr className="border-0 border-t border-[var(--ink)] m-0" />
        <ul className="m-0 p-0 list-none">
          {event.subMarkets.map((s) => {
            const pct = Math.round(s.yesProbability * 100);
            const isSelected = selected === s.slug;
            return (
              <li key={s.slug} className="border-b border-[var(--rule)]">
                <button
                  onClick={() => {
                    setSelected(s.slug);
                    setLastFlip(null);
                    setLastSim(null);
                  }}
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
                    style={{
                      color: "var(--accent)",
                      lineHeight: 1,
                    }}
                  >
                    {pct}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {sub && (
        <section className="pt-10 mt-10 border-t-2 border-[var(--ink)]">
          <CoinFlip
            slug={sub.slug}
            question={extractCandidateName(sub.question) + " wins."}
            yesProbability={sub.yesProbability}
            outcomeYesLabel={extractCandidateName(sub.question)}
            outcomeNoLabel="Someone else"
            onFlipComplete={(o: FlipOutcome) => {
              setLastFlip(o);
              setLastSim(null);
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

          {lastFlip && (
            <div className="flex flex-wrap gap-4 -mt-4 mb-4">
              <ShareButton
                slug={sub.slug}
                mode="single"
                text={formatSingleFlipShare({
                  question: sub.question,
                  yesProbability: sub.yesProbability,
                  flipped: lastFlip,
                  url: subUrl,
                })}
              />
              <SimulationPanel
                slug={sub.slug}
                question={sub.question}
                yesProbability={sub.yesProbability}
                onSimulationComplete={(r) => {
                  setLastSim(r);
                  track({
                    name: "simulation_run",
                    props: {
                      slug: sub.slug,
                      n: r.n,
                      observed_yes_count: r.yesCount,
                    },
                  });
                }}
              />
            </div>
          )}

          {lastSim && (
            <ShareButton
              slug={sub.slug}
              mode="sim"
              text={formatSimulationShare({
                question: sub.question,
                yesProbability: sub.yesProbability,
                n: lastSim.n,
                yesCount: lastSim.yesCount,
                noCount: lastSim.noCount,
                url: subUrl,
              })}
            />
          )}
        </section>
      )}

      <MarketDescription text={event.description} />
    </div>
  );
}
