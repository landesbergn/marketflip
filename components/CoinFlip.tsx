// components/CoinFlip.tsx
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
};

type Phase = "idle" | "flipping" | "revealed";

export function CoinFlip(props: CoinFlipProps) {
  const {
    question,
    yesProbability,
    outcomeYesLabel,
    outcomeNoLabel,
    flipDurationMs = 1900,
    onFlipComplete,
  } = props;

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FlipOutcome | null>(null);

  const handleFlip = () => {
    if (phase === "flipping") return;
    const outcome = flip(yesProbability);
    setResult(outcome);
    if (flipDurationMs <= 0) {
      setPhase("revealed");
      onFlipComplete?.(outcome);
      return;
    }
    setPhase("flipping");
    setTimeout(() => {
      setPhase("revealed");
      onFlipComplete?.(outcome);
    }, flipDurationMs);
  };

  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;
  const shownLabel =
    result === "YES" ? outcomeYesLabel : result === "NO" ? outcomeNoLabel : "";

  return (
    <section className="flex flex-col items-center text-center gap-4 py-6">
      <h1 className="text-2xl font-bold">{question}</h1>
      <div className="flex gap-2 text-sm" aria-label={`Implied odds: ${outcomeYesLabel} ${yesPct}%, ${outcomeNoLabel} ${noPct}%`}>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
          {yesPct}%
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-800">
          {noPct}%
        </span>
      </div>
      <Coin phase={phase} result={result} />
      {phase === "revealed" && result ? (
        <p className="text-xl font-semibold">
          {result === "YES" ? "\u{1F389}" : "\u{1F6A8}"} {result} ({shownLabel})
        </p>
      ) : null}
      <button
        onClick={handleFlip}
        disabled={phase === "flipping"}
        className="rounded-md bg-zinc-900 px-5 py-2 font-semibold text-white disabled:opacity-50"
      >
        {phase === "idle" ? "Flip the coin" : phase === "flipping" ? "Flipping…" : "Flip again"}
      </button>
    </section>
  );
}

function Coin({ phase, result }: { phase: Phase; result: FlipOutcome | null }) {
  return (
    <div
      data-phase={phase}
      data-result={result ?? ""}
      className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-md flex items-center justify-center text-3xl font-extrabold text-white"
      style={{
        transition: "transform 1.2s ease-out",
        transform: phase === "flipping" ? "rotateY(1080deg)" : "rotateY(0deg)",
      }}
    >
      {phase === "revealed" && result ? (result === "YES" ? "Y" : "N") : "?"}
    </div>
  );
}
