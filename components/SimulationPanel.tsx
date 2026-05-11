"use client";

import { useEffect, useRef, useState } from "react";
import type { SimResult } from "@/lib/types";
import { Histogram } from "./Histogram";

type Props = {
  slug: string;
  question: string;
  yesProbability: number;
  onSimulationComplete?: (r: SimResult) => void;
};

const TOTAL_TRIALS = 1000;
const TRIAL_SIZE = 100; // each trial is 100 flips
const BURST = Math.max(8, Math.ceil(TOTAL_TRIALS / 90));

export function SimulationPanel({ yesProbability, onSimulationComplete }: Props) {
  const [active, setActive] = useState(false);
  const [running, setRunning] = useState(false);
  const [observations, setObservations] = useState<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const start = () => {
    setObservations([]);
    setRunning(true);
  };

  const hide = () => {
    setActive(false);
    setRunning(false);
    setObservations([]);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let done = 0;
    const all: number[] = [];

    const step = () => {
      if (cancelled) return;
      for (let i = 0; i < BURST && done < TOTAL_TRIALS; i++) {
        let y = 0;
        for (let k = 0; k < TRIAL_SIZE; k++) {
          if (Math.random() < yesProbability) y++;
        }
        all.push((y / TRIAL_SIZE) * 100);
        done++;
      }
      setObservations([...all]);
      if (done < TOTAL_TRIALS) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setRunning(false);
        const yesCount = all.reduce(
          (sum, pct) => sum + Math.round((pct / 100) * TRIAL_SIZE),
          0
        );
        const totalFlips = TOTAL_TRIALS * TRIAL_SIZE;
        onSimulationComplete?.({
          n: totalFlips,
          yesCount,
          noCount: totalFlips - yesCount,
          impliedProbability: yesProbability,
          observedProbability: yesCount / totalFlips,
        });
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, yesProbability, onSimulationComplete]);

  // Public trigger so the parent can wire this from the result block.
  if (!active) {
    return (
      <button
        className="btn-link"
        onClick={() => {
          setActive(true);
          setTimeout(start, 60);
        }}
      >
        Run 1,000 &rarr;
      </button>
    );
  }

  const yesPct = Math.round(yesProbability * 100);
  const meanObs =
    observations.length > 0
      ? observations.reduce((s, v) => s + v, 0) / observations.length
      : null;
  const done = observations.length >= TOTAL_TRIALS;

  return (
    <section className="mt-10 pt-10 border-t border-[var(--rule)]">
      <p className="eyebrow">
        Distribution &middot; {observations.length.toLocaleString()} of {TOTAL_TRIALS.toLocaleString()} trials
      </p>
      <p className="mt-3 text-xl leading-snug max-w-2xl">
        {done ? (
          <>
            Across {TOTAL_TRIALS.toLocaleString()} trials of {TRIAL_SIZE} flips each, YES came up an
            average of{" "}
            <span className="text-[var(--accent)] font-semibold">
              {meanObs?.toFixed(1)}%
            </span>{" "}
            — Implied was{" "}
            <span className="text-[var(--accent)] font-semibold">
              {yesPct}%
            </span>{" "}
            (Observed: {meanObs?.toFixed(1)}%).
          </>
        ) : (
          <>
            Each trial is {TRIAL_SIZE} flips. We&rsquo;re plotting how many came up YES.
            Implied: {yesPct}%. Observed: building&hellip;
          </>
        )}
      </p>

      <div className="mt-6 max-w-3xl">
        <Histogram data={observations} peak={yesProbability} />
        <div
          className="figure flex justify-between mt-1 text-[10px] tracking-[0.1em] text-[var(--ink-mono)]"
          aria-hidden="true"
        >
          <span>0% YES</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {done && (
        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <button
            className="btn-outline"
            onClick={() => {
              setObservations([]);
              setTimeout(start, 50);
            }}
          >
            Run 1,000
          </button>
          <button className="btn-link" onClick={hide}>
            Hide &uarr;
          </button>
        </div>
      )}
    </section>
  );
}
