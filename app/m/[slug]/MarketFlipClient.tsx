"use client";

import { useState } from "react";
import { CoinFlip } from "@/components/CoinFlip";
import { SimulationPanel } from "@/components/SimulationPanel";
import { ShareButton } from "@/components/ShareButton";
import { PageViewTracker } from "@/components/PageViewTracker";
import { DotGrid } from "@/components/DotGrid";
import { MarketDescription } from "@/components/MarketDescription";
import { History } from "@/components/History";
import type { FlippableMarket, FlipOutcome, SimResult } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";
import { formatSingleFlipShare, formatSimulationShare } from "@/lib/share";
import { isLiteralYesNo, reframeQuestion } from "@/lib/fmt";

export function MarketFlipClient({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const [lastFlip, setLastFlip] = useState<FlipOutcome | null>(null);
  const [lastSim, setLastSim] = useState<SimResult | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const yesProbability = yes?.probability ?? 0;
  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;
  const url =
    typeof window !== "undefined" ? window.location.href : market.url;
  const literal = isLiteralYesNo(yes?.label, no?.label);
  const yesToken = literal ? "YES" : yes?.label ?? "YES";
  const displayQuestion = reframeQuestion(
    market.question,
    yes?.label,
    no?.label
  );

  return (
    <>
      <PageViewTracker
        event={{
          name: "market_viewed",
          props: { slug: market.slug, source: "direct" },
        }}
      />

      {/* Reading + Flip side-by-side on lg+, stacked below */}
      <section className="pt-8 pb-6 grid gap-12 lg:grid-cols-2 items-start">
        {/* Left: The Reading */}
        <div>
          <p className="eyebrow mb-3">The reading</p>
          <p
            className="text-[22px] italic leading-snug m-0"
            style={{ color: "var(--ink)" }}
          >
            The market sees{" "}
            <span className="not-italic" style={{ color: "var(--accent)" }}>
              {yesToken}
            </span>{" "}
            in{" "}
            <span className="not-italic" style={{ color: "var(--accent)" }}>
              {yesPct}
            </span>{" "}
            of{" "}
            <span className="not-italic" style={{ color: "var(--accent)" }}>
              100
            </span>{" "}
            futures.
          </p>

          <div className="mt-5">
            <DotGrid yesProb={yesProbability} cols={20} size={16} gap={4} />
            <div className="flex gap-5 mt-3">
              <LegendDot solid label={`${yesPct} ${yes?.label ?? "YES"}`} />
              <LegendDot solid={false} label={`${noPct} ${no?.label ?? "NO"}`} />
            </div>
          </div>
        </div>

        {/* Right: Flip */}
        <div>
          <CoinFlip
            slug={market.slug}
            question={displayQuestion}
            yesProbability={yesProbability}
            outcomeYesLabel={yes?.label ?? "Yes"}
            outcomeNoLabel={no?.label ?? "No"}
            onFlipComplete={(o) => {
              setLastFlip(o);
              setLastSim(null);
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
                outcomeLabel:
                  o === "YES" ? yes?.label ?? "Yes" : no?.label ?? "No",
                flippedTo: o,
                impliedProbability: yesProbability,
                timestamp: Date.now(),
              });
              setHistoryKey((k) => k + 1);
            }}
          />

          {lastFlip && (
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <SimulationPanel
                slug={market.slug}
                question={displayQuestion}
                yesProbability={yesProbability}
                yesLabel={yes?.label}
                noLabel={no?.label}
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
              <ShareButton
                slug={market.slug}
                mode="single"
                text={formatSingleFlipShare({
                  question: displayQuestion,
                  yesProbability,
                  flipped: lastFlip,
                  yesLabel: yes?.label,
                  noLabel: no?.label,
                  url,
                })}
              />
            </div>
          )}
        </div>
      </section>

      {/* Personal flip distribution */}
      <History
        slug={market.slug}
        refreshKey={historyKey}
        yesProbability={yesProbability}
        yesLabel={yes?.label}
        noLabel={no?.label}
      />

      {lastSim && (
        <div className="pt-4">
          <ShareButton
            slug={market.slug}
            mode="sim"
            text={formatSimulationShare({
              question: displayQuestion,
              yesProbability,
              n: lastSim.n,
              yesCount: lastSim.yesCount,
              noCount: lastSim.noCount,
              yesLabel: yes?.label,
              noLabel: no?.label,
              url,
            })}
          />
        </div>
      )}

      <MarketDescription text={market.description} />
    </>
  );
}

function LegendDot({ solid, label }: { solid: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: solid ? "var(--accent)" : "transparent",
          border: solid ? "none" : "1.25px solid var(--ink)",
          opacity: solid ? 1 : 0.55,
        }}
      />
      <span className="eyebrow" style={{ fontSize: 10 }}>
        {label}
      </span>
    </div>
  );
}
