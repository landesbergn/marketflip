// app/m/[slug]/MarketFlipClient.tsx
"use client";

import { useState } from "react";
import { CoinFlip } from "@/components/CoinFlip";
import { SimulationPanel } from "@/components/SimulationPanel";
import { ShareButton } from "@/components/ShareButton";
import { PageViewTracker } from "@/components/PageViewTracker";
import { MarketDescription } from "@/components/MarketDescription";
import type { FlippableMarket, FlipOutcome, SimResult } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";
import { formatSingleFlipShare, formatSimulationShare } from "@/lib/share";

export function MarketFlipClient({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const [lastFlip, setLastFlip] = useState<FlipOutcome | null>(null);
  const [lastSim, setLastSim] = useState<SimResult | null>(null);

  const yesProbability = yes?.probability ?? 0;
  const url = typeof window !== "undefined" ? window.location.href : market.url;

  return (
    <>
      <PageViewTracker event={{ name: "market_viewed", props: { slug: market.slug, source: "direct" } }} />
      <CoinFlip
        slug={market.slug}
        question={market.question}
        yesProbability={yesProbability}
        outcomeYesLabel={yes?.label ?? "Yes"}
        outcomeNoLabel={no?.label ?? "No"}
        onFlipComplete={(o) => {
          setLastFlip(o);
          track({
            name: "flip_executed",
            props: {
              slug: market.slug,
              outcome: o,
              implied_probability: yesProbability,
            },
          });
          addFlipToHistory({
            slug: market.slug,
            question: market.question,
            outcomeLabel: o === "YES" ? yes?.label ?? "Yes" : no?.label ?? "No",
            flippedTo: o,
            impliedProbability: yesProbability,
            timestamp: Date.now(),
          });
        }}
      />

      {lastFlip ? (
        <div className="mt-4 flex justify-center">
          <ShareButton
            slug={market.slug}
            mode="single"
            text={formatSingleFlipShare({
              question: market.question,
              yesProbability,
              flipped: lastFlip,
              url,
            })}
          />
        </div>
      ) : null}

      <SimulationPanel
        slug={market.slug}
        question={market.question}
        yesProbability={yesProbability}
        onSimulationComplete={(r) => {
          setLastSim(r);
          track({
            name: "simulation_run",
            props: {
              slug: market.slug,
              n: r.n,
              observed_yes_count: r.yesCount,
            },
          });
        }}
      />

      {lastSim ? (
        <div className="mt-4 flex justify-center">
          <ShareButton
            slug={market.slug}
            mode="sim"
            text={formatSimulationShare({
              question: market.question,
              yesProbability,
              n: lastSim.n,
              yesCount: lastSim.yesCount,
              noCount: lastSim.noCount,
              url,
            })}
          />
        </div>
      ) : null}

      <MarketDescription text={market.description} />
    </>
  );
}
