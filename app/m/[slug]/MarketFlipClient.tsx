"use client";

import { useRef, useState } from "react";
import { CoinFlip } from "@/components/CoinFlip";
import { ShareButton } from "@/components/ShareButton";
import { PageViewTracker } from "@/components/PageViewTracker";
import { DotGrid } from "@/components/DotGrid";
import { History } from "@/components/History";
import type {
  FlippableMarket,
  FlipOutcome,
  HistoryEntry,
} from "@/lib/types";
import { track } from "@/lib/posthog";
import {
  addFlipToHistory,
  addFlipsToHistory,
} from "@/lib/storage";
import { flip as flipOnce } from "@/lib/flip";
import { formatSingleFlipShare } from "@/lib/share";
import { isLiteralYesNo, reframeQuestion } from "@/lib/fmt";

const RUN_COUNT = 100;

export function MarketFlipClient({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const [lastFlip, setLastFlip] = useState<FlipOutcome | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

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

  const yesLabelText = yes?.label ?? "Yes";
  const noLabelText = no?.label ?? "No";

  const handleFlipComplete = (o: FlipOutcome) => {
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
      outcomeLabel: o === "YES" ? yesLabelText : noLabelText,
      flippedTo: o,
      impliedProbability: yesProbability,
      timestamp: Date.now(),
    });
    setHistoryKey((k) => k + 1);
  };

  const handleRunHundred = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    let done = 0;
    let yesInRun = 0;
    const base = Date.now();
    const perFrame = 4; // 100 / 4 = 25 frames ≈ 420ms at 60fps

    const tick = () => {
      const batch: HistoryEntry[] = [];
      for (let i = 0; i < perFrame && done < RUN_COUNT; i++) {
        const outcome = flipOnce(yesProbability);
        if (outcome === "YES") yesInRun++;
        batch.push({
          slug: market.slug,
          question: market.question,
          outcomeLabel: outcome === "YES" ? yesLabelText : noLabelText,
          flippedTo: outcome,
          impliedProbability: yesProbability,
          // Tiny per-flip offset preserves ordering within a single ms.
          timestamp: base + done,
        });
        done++;
      }
      addFlipsToHistory(batch);
      setHistoryKey((k) => k + 1);

      if (done < RUN_COUNT) {
        requestAnimationFrame(tick);
      } else {
        runningRef.current = false;
        setRunning(false);
        track({
          name: "simulation_run",
          props: {
            slug: market.slug,
            n: RUN_COUNT,
            observed_yes_count: yesInRun,
          },
        });
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <>
      <PageViewTracker
        event={{
          name: "market_viewed",
          props: { slug: market.slug, source: "direct" },
        }}
      />

      <section className="pt-8 pb-6 grid gap-12 lg:grid-cols-2 items-start">
        {/* Left: Flip */}
        <div>
          <CoinFlip
            slug={market.slug}
            question={displayQuestion}
            yesProbability={yesProbability}
            outcomeYesLabel={yesLabelText}
            outcomeNoLabel={noLabelText}
            onFlipComplete={handleFlipComplete}
          />

          {lastFlip && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
              <button
                className="btn-link"
                onClick={handleRunHundred}
                disabled={running}
              >
                {running ? "Running…" : "Run 100 →"}
              </button>
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

        {/* Right: The Reading + Your Flips */}
        <div className="flex flex-col gap-6">
          <p
            className="text-[20px] sm:text-[24px] italic leading-snug m-0"
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

          <div>
            <DotGrid yesProb={yesProbability} cols={20} />
            <div className="flex gap-6 mt-5">
              <LegendDot solid label={`${yesPct} ${yesLabelText}`} />
              <LegendDot solid={false} label={`${noPct} ${noLabelText}`} />
            </div>
          </div>

          {/* Personal flip distribution — alongside the implied one */}
          <History
            slug={market.slug}
            refreshKey={historyKey}
            yesProbability={yesProbability}
            yesLabel={yes?.label}
            noLabel={no?.label}
          />
        </div>
      </section>
    </>
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
