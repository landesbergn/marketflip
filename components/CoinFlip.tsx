"use client";

import { useState } from "react";
import { flip } from "@/lib/flip";
import type { FlipOutcome } from "@/lib/types";

export type CoinFlipProps = {
  slug: string;
  question: string;
  yesProbability: number;
  outcomeYesLabel: string;
  outcomeNoLabel: string;
  /** Total flip animation duration. 0 means instant (used in tests). */
  flipDurationMs?: number;
  onFlipComplete?: (outcome: FlipOutcome) => void;
  /** Render the inline result panel right under the coin. Default true. */
  renderResult?: boolean;
};

type Phase = "idle" | "flipping" | "landed";

const FLIP_TURNS = 8; // even number of half-turns — front returns to camera

export function CoinFlip(props: CoinFlipProps) {
  const {
    question,
    yesProbability,
    outcomeYesLabel,
    outcomeNoLabel,
    flipDurationMs = 1500,
    onFlipComplete,
    renderResult = true,
  } = props;

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FlipOutcome | null>(null);

  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;

  const handleFlip = () => {
    if (phase === "flipping") return;
    const outcome = flip(yesProbability);
    setResult(outcome);
    if (flipDurationMs <= 0) {
      setPhase("landed");
      onFlipComplete?.(outcome);
      return;
    }
    setPhase("flipping");
    setTimeout(() => {
      setPhase("landed");
      onFlipComplete?.(outcome);
    }, flipDurationMs);
  };

  const handleAgain = () => {
    setPhase("idle");
    setResult(null);
  };

  const finalDeg =
    phase === "idle" ? 0 : FLIP_TURNS * 180 + (result === "YES" ? 0 : 180);

  return (
    <section
      className="py-10 grid gap-14 items-center"
      style={{ gridTemplateColumns: "220px 1fr" }}
    >
      <div className="grid place-items-end justify-self-center">
        <div className="coin-stage">
          <div className="coin-shadow" data-state={phase} />
          <div className="coin-arc" data-state={phase}>
            <div
              className="coin-spin"
              data-state={phase}
              style={{ transform: `rotateX(${finalDeg}deg)` }}
            >
              <div className="coin-face coin-face--yes">
                {phase === "landed" && result === "YES"
                  ? "YES"
                  : phase === "idle"
                  ? "?"
                  : ""}
              </div>
              <div className="coin-face coin-face--no">
                {phase === "landed" && result === "NO" ? "NO" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div aria-label={`Implied odds: ${outcomeYesLabel} ${yesPct}%, ${outcomeNoLabel} ${noPct}%`}>
        {phase === "idle" && (
          <>
            <h2 className="text-3xl font-semibold tracking-tight">
              Draw one future.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)] max-w-sm">
              One flip, weighted to the odds.
            </p>
            <button onClick={handleFlip} className="btn-primary mt-6">
              Flip the coin
            </button>
          </>
        )}

        {phase === "flipping" && (
          <p className="text-2xl italic text-[var(--ink-faint)]">drawing&hellip;</p>
        )}

        {phase === "landed" && result && renderResult && (
          <Result
            result={result}
            question={question}
            yesPct={yesPct}
            outcomeYesLabel={outcomeYesLabel}
            outcomeNoLabel={outcomeNoLabel}
            onAgain={handleAgain}
          />
        )}
      </div>
    </section>
  );
}

function Result({
  result,
  question,
  yesPct,
  outcomeYesLabel,
  outcomeNoLabel,
  onAgain,
}: {
  result: FlipOutcome;
  question: string;
  yesPct: number;
  outcomeYesLabel: string;
  outcomeNoLabel: string;
  onAgain: () => void;
}) {
  const noPct = 100 - yesPct;
  const landedOdds = result === "YES" ? yesPct : noPct;
  const label = result === "YES" ? outcomeYesLabel : outcomeNoLabel;

  return (
    <div>
      <p className="eyebrow">The coin landed on</p>
      <p
        role="status"
        className="display mt-1"
        style={{
          fontSize: 84,
          color: result === "YES" ? "var(--accent)" : "var(--ink)",
          lineHeight: 0.95,
        }}
      >
        {result}.
      </p>
      <p className="mt-3 text-xl leading-snug max-w-md">
        {question}{" "}
        <span className="text-[var(--ink-soft)]">
          ({label})
        </span>
      </p>
      <p className="figure mt-2 text-[11px] tracking-[0.15em] uppercase text-[var(--ink-mono)]">
        Market priced {result} at {landedOdds}%.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button onClick={onAgain} className="btn-outline">
          Flip again
        </button>
        {/* Run-sim & share buttons are injected by the parent client component */}
        <span data-slot="result-actions" />
      </div>
    </div>
  );
}
