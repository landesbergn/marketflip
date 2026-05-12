"use client";

import { useState } from "react";
import { flip } from "@/lib/flip";
import {
  displayLabel,
  isLiteralYesNo,
  matchupStatement,
  questionToStatement,
} from "@/lib/fmt";
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
};

type Phase = "idle" | "flipping" | "landed";

const FLIP_TURNS = 8; // even number of half-turns — same face returns to camera

export function CoinFlip(props: CoinFlipProps) {
  const {
    question,
    yesProbability,
    outcomeYesLabel,
    outcomeNoLabel,
    flipDurationMs = 1500,
    onFlipComplete,
  } = props;

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FlipOutcome | null>(null);
  const [rotation, setRotation] = useState(0); // accumulating rotateX
  const [flipCount, setFlipCount] = useState(0);

  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;

  const handleFlip = () => {
    if (phase === "flipping") return;
    const outcome = flip(yesProbability);
    const previousFace: FlipOutcome = result ?? "YES";
    const sameFace = previousFace === outcome;
    const nextRotation =
      rotation + FLIP_TURNS * 180 + (sameFace ? 0 : 180);

    setResult(outcome);
    setRotation(nextRotation);
    setFlipCount((c) => c + 1);

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

  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <button
        type="button"
        onClick={handleFlip}
        disabled={phase === "flipping"}
        aria-label={phase === "landed" ? "Flip again" : "Flip the coin"}
        className="bg-transparent border-0 p-0 disabled:cursor-not-allowed"
        style={{ cursor: phase === "flipping" ? "default" : "pointer" }}
      >
        <div className="coin-stage">
          <div className="coin-shadow" data-state={phase} />
          <div
            className="coin-arc"
            data-state={phase}
            data-parity={flipCount % 2}
          >
            <div
              className="coin-spin"
              data-state={phase}
              style={{ transform: `rotateX(${rotation}deg)` }}
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
      </button>

      <div
        className="w-full flex flex-col items-center"
        aria-label={`Implied odds: ${outcomeYesLabel} ${yesPct}%, ${outcomeNoLabel} ${noPct}%`}
      >
        {phase === "idle" && (
          <>
            <button onClick={handleFlip} className="btn-primary">
              Flip the coin
            </button>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
              One odds-weighted flip.
            </p>
          </>
        )}

        {phase === "flipping" && (
          <p className="text-2xl italic text-[var(--ink-faint)]">drawing&hellip;</p>
        )}

        {phase === "landed" && result && (
          <Result
            result={result}
            question={question}
            yesPct={yesPct}
            outcomeYesLabel={outcomeYesLabel}
            outcomeNoLabel={outcomeNoLabel}
            onAgain={handleFlip}
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
  const literal = isLiteralYesNo(outcomeYesLabel, outcomeNoLabel);
  const landedLabel = displayLabel(result, outcomeYesLabel, outcomeNoLabel);
  const winnerLabel =
    result === "YES" ? outcomeYesLabel : outcomeNoLabel;
  const loserLabel =
    result === "YES" ? outcomeNoLabel : outcomeYesLabel;
  const statement = literal
    ? questionToStatement(question)
    : matchupStatement(winnerLabel, loserLabel);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="eyebrow">The coin landed on</p>
      <p
        role="status"
        className="display mt-1"
        style={{
          fontSize: 64,
          color: result === "YES" ? "var(--accent)" : "var(--ink)",
          lineHeight: 0.95,
          fontStyle: "italic",
        }}
      >
        {landedLabel.toUpperCase()}.
      </p>
      {statement && (
        <p className="mt-2 text-[20px] leading-snug max-w-md">
          {literal && result === "NO" ? (
            <span
              className="italic text-[var(--ink-soft)]"
              style={{
                textDecoration: "line-through",
                textDecorationThickness: "1.5px",
              }}
            >
              {statement}
            </span>
          ) : (
            <span className="italic">{statement}</span>
          )}
        </p>
      )}
      <p className="figure mt-2 text-[11px] tracking-[0.15em] uppercase text-[var(--ink-mono)]">
        Market priced {landedLabel.toUpperCase()} at {landedOdds}%.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <button onClick={onAgain} className="btn-outline">
          Flip again
        </button>
      </div>
    </div>
  );
}
