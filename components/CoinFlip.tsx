"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { flip } from "@/lib/flip";
import { displayLabel, verdictCopy, verdictFor } from "@/lib/fmt";
import type { FlipOutcome } from "@/lib/types";

export type CoinFlipProps = {
  slug: string;
  yesProbability: number;
  outcomeYesLabel: string;
  outcomeNoLabel: string;
  /** Total flip animation duration. 0 means instant (used in tests). */
  flipDurationMs?: number;
  onFlipComplete?: (outcome: FlipOutcome) => void;
  /**
   * Hide the built-in idle CTA + "drawing…" label. Use when the parent
   * renders its own flip controls (e.g. the mobile sticky bottom bar).
   */
  hideButton?: boolean;
  /** Hide the built-in landed verdict block. Use when the parent renders
   *  the verdict copy itself (mobile: in-place where the reading sentence was). */
  hideVerdict?: boolean;
  /** Coin size in px. Lets the mobile layout shrink the disc. */
  coinScale?: number;
  /** Notifies parent of phase transitions: idle → flipping → landed. */
  onPhaseChange?: (phase: Phase) => void;
};

type Phase = "idle" | "flipping" | "landed";

export type CoinFlipHandle = {
  /** Trigger a flip from outside (e.g. mobile sticky bottom bar). */
  flip: () => void;
};

const FLIP_TURNS = 8; // even number of half-turns — same face returns to camera

export const CoinFlip = forwardRef<CoinFlipHandle, CoinFlipProps>(function CoinFlip(
  props,
  ref
) {
  const {
    yesProbability,
    outcomeYesLabel,
    outcomeNoLabel,
    flipDurationMs = 1500,
    onFlipComplete,
    hideButton = false,
    hideVerdict = false,
    coinScale,
    onPhaseChange,
  } = props;

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FlipOutcome | null>(null);
  const [rotation, setRotation] = useState(0); // accumulating rotateX
  const [flipCount, setFlipCount] = useState(0);

  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;

  // Keep latest phase reachable inside the imperative `flip()` handle so
  // the parent's ref callback never sees a stale closure.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const handleFlip = useCallback(() => {
    if (phaseRef.current === "flipping") return;
    const outcome = flip(yesProbability);
    setResult((prev) => {
      const previousFace: FlipOutcome = prev ?? "YES";
      const sameFace = previousFace === outcome;
      setRotation((r) => r + FLIP_TURNS * 180 + (sameFace ? 0 : 180));
      return outcome;
    });
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
  }, [yesProbability, flipDurationMs, onFlipComplete]);

  useImperativeHandle(ref, () => ({ flip: handleFlip }), [handleFlip]);

  const stageStyle: React.CSSProperties | undefined =
    coinScale != null
      ? ({
          width: coinScale,
          height: Math.round(coinScale * 1.14),
          // Toss arc scales with the coin so the animation still feels right.
          "--toss-peak": `${Math.round(coinScale * 0.55)}px`,
          "--toss-mid": `${Math.round(coinScale * 0.85)}px`,
          "--toss-overshoot": `${Math.round(coinScale * 0.1)}px`,
        } as React.CSSProperties)
      : undefined;

  const faceFontSize =
    coinScale != null ? Math.round(coinScale * 0.4) : undefined;

  const bothHidden = hideButton && hideVerdict;
  return (
    <section
      className={`flex flex-col items-center text-center ${bothHidden ? "gap-1" : "gap-6"}`}
    >
      <button
        type="button"
        onClick={handleFlip}
        disabled={phase === "flipping"}
        aria-label={phase === "landed" ? "Flip again" : "Flip the coin"}
        className="bg-transparent border-0 p-0 disabled:cursor-not-allowed"
        style={{ cursor: phase === "flipping" ? "default" : "pointer" }}
      >
        <div className="coin-stage" style={stageStyle}>
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
              <div
                className="coin-face coin-face--yes"
                style={faceFontSize ? { fontSize: faceFontSize } : undefined}
              >
                {phase === "landed" && result === "YES"
                  ? "YES"
                  : phase === "idle"
                  ? "?"
                  : ""}
              </div>
              <div
                className="coin-face coin-face--no"
                style={faceFontSize ? { fontSize: faceFontSize } : undefined}
              >
                {phase === "landed" && result === "NO" ? "NO" : ""}
              </div>
            </div>
          </div>
        </div>
      </button>

      <div
        className="w-full flex flex-col items-center"
        aria-label={`Implied odds: ${outcomeYesLabel} ${yesPct}%, ${outcomeNoLabel} ${noPct}%`}
        // When the parent owns both the CTA and the verdict (mobile), the
        // implied-odds region is announce-only and stays out of the flow.
        style={bothHidden ? { position: "absolute", width: 0, height: 0, overflow: "hidden", clip: "rect(0 0 0 0)" } : undefined}
      >
        {!hideButton && phase === "idle" && (
          <>
            <button onClick={handleFlip} className="btn-primary">
              Flip the coin
            </button>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
              One odds-weighted flip.
            </p>
          </>
        )}

        {!hideButton && phase === "flipping" && (
          <p className="text-2xl italic text-[var(--ink-faint)]">drawing&hellip;</p>
        )}

        {!hideVerdict && phase === "landed" && result && (
          <Result
            result={result}
            yesPct={yesPct}
            outcomeYesLabel={outcomeYesLabel}
            outcomeNoLabel={outcomeNoLabel}
            onAgain={handleFlip}
          />
        )}
      </div>
    </section>
  );
});

function Result({
  result,
  yesPct,
  outcomeYesLabel,
  outcomeNoLabel,
  onAgain,
}: {
  result: FlipOutcome;
  yesPct: number;
  outcomeYesLabel: string;
  outcomeNoLabel: string;
  onAgain: () => void;
}) {
  const noPct = 100 - yesPct;
  const landedOdds = result === "YES" ? yesPct : noPct;
  const landedLabel = displayLabel(result, outcomeYesLabel, outcomeNoLabel);
  const verdict = verdictFor(result, yesPct / 100);
  const verdictMsg = verdictCopy(verdict, landedLabel.toUpperCase(), landedOdds);

  return (
    <div className="flex flex-col items-center text-center">
      <p
        role="status"
        className="display"
        style={{
          fontSize: 38,
          color:
            verdict === "SURPRISE" ? "var(--accent)" : "var(--ink)",
          lineHeight: 1,
          letterSpacing: "-0.025em",
          fontStyle: "italic",
        }}
      >
        {verdict}.
      </p>
      <p className="mt-3 text-[16px] leading-relaxed max-w-md text-[var(--ink-soft)]">
        {verdictMsg}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        <button onClick={onAgain} className="btn-outline">
          Flip again
        </button>
      </div>
    </div>
  );
}
