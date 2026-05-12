"use client";

import { useRef, useState } from "react";
import { CoinFlip, type CoinFlipHandle } from "@/components/CoinFlip";
import { ShareButton } from "@/components/ShareButton";
import { PageViewTracker } from "@/components/PageViewTracker";
import { DotGrid } from "@/components/DotGrid";
import { GaugeBar } from "@/components/GaugeBar";
import { History } from "@/components/History";
import { MarketDescription } from "@/components/MarketDescription";
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
import {
  displayLabel,
  fmtResolveDate,
  fmtVol,
  isLiteralYesNo,
  reframeQuestion,
  verdictCopy,
  verdictFor,
} from "@/lib/fmt";

const RUN_COUNT = 100;

type Phase = "idle" | "flipping" | "landed";

export function MarketFlipClient({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const [lastFlip, setLastFlip] = useState<FlipOutcome | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [historyKey, setHistoryKey] = useState(0);
  const [running, setRunning] = useState(false);
  const [futuresOpen, setFuturesOpen] = useState(false);
  const runningRef = useRef(false);
  const coinRef = useRef<CoinFlipHandle>(null);

  const yesProbability = yes?.probability ?? 0;
  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;
  const url =
    typeof window !== "undefined" ? window.location.href : market.url;
  const literal = isLiteralYesNo(yes?.label, no?.label);
  const yesToken = literal ? "YES" : yes?.label ?? "YES";
  const noToken = literal ? "NO" : no?.label ?? "NO";
  const displayQuestion = reframeQuestion(
    market.question,
    yes?.label,
    no?.label
  );

  const yesLabelText = yes?.label ?? "Yes";
  const noLabelText = no?.label ?? "No";

  const resolves = fmtResolveDate(market.endDate);
  const vol = market.volume24h > 0 ? fmtVol(market.volume24h) : null;
  const metaParts = [
    resolves ? `resolves ${resolves}` : null,
    vol ? `vol ${vol}` : null,
  ].filter(Boolean);

  const landed = phase === "landed" && lastFlip !== null;
  const verdictKind = landed
    ? verdictFor(lastFlip!, yesProbability)
    : null;
  const landedOdds = landed ? (lastFlip === "YES" ? yesPct : noPct) : null;
  const landedLabel = landed
    ? displayLabel(lastFlip!, yesLabelText, noLabelText).toUpperCase()
    : "";
  const verdictMsg =
    landed && verdictKind && landedOdds !== null
      ? verdictCopy(verdictKind, landedLabel, landedOdds)
      : "";
  const verdictAccent = verdictKind === "SURPRISE" ? "var(--accent)" : "var(--ink)";

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
    const perFrame = 4;

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

  // ─────────────────────────────────────────────────────────────
  // Mobile sticky bottom-bar contents
  // ─────────────────────────────────────────────────────────────
  const renderMobileBarBody = () => {
    if (phase === "flipping") {
      return (
        <button className="btn-primary w-full mf-flip-btn" disabled>
          Drawing&hellip;
        </button>
      );
    }
    if (!landed) {
      return (
        <button
          className="btn-primary w-full mf-flip-btn"
          onClick={() => coinRef.current?.flip()}
        >
          Flip the coin
        </button>
      );
    }
    return (
      <div
        className="grid items-center gap-3"
        style={{ gridTemplateColumns: "1fr auto auto" }}
      >
        <button
          className="btn-primary w-full mf-flip-btn"
          onClick={() => coinRef.current?.flip()}
        >
          Flip again
        </button>
        <IconAction
          label="Run 100"
          icon="↻"
          onClick={handleRunHundred}
          disabled={running}
        />
        <IconAction
          label="Share"
          icon="↗"
          onClick={async () => {
            const text = formatSingleFlipShare({
              question: displayQuestion,
              yesProbability,
              flipped: lastFlip!,
              yesLabel: yes?.label,
              noLabel: no?.label,
              url,
            });
            track({ name: "result_shared", props: { slug: market.slug, mode: "single" } });
            if (
              typeof navigator !== "undefined" &&
              navigator.share &&
              navigator.canShare &&
              navigator.canShare({ text })
            ) {
              try {
                await navigator.share({ text });
                return;
              } catch {
                // fall through
              }
            }
            try {
              await navigator.clipboard.writeText(text);
            } catch {
              // best-effort
            }
          }}
        />
      </div>
    );
  };

  return (
    <>
      <PageViewTracker
        event={{
          name: "market_viewed",
          props: { slug: market.slug, source: "direct" },
        }}
      />

      {/* ── Header: meta + question ────────────────────────────── */}
      <section className="pt-5 sm:pt-10 pb-3 sm:pb-6">
        <p className="eyebrow">{metaParts.join(" · ") || "Live market"}</p>
        <h1
          className="display mt-2.5 sm:mt-3.5 text-[28px] sm:text-[40px] md:text-[48px]"
          style={{
            lineHeight: 1.06,
            maxWidth: 760,
            // Only YES "answers" the question — strike through to show the
            // market resolved in its favor. A NO outcome leaves the
            // question intact (the proposition didn't happen).
            textDecoration: landed && lastFlip === "YES" ? "line-through" : "none",
            textDecorationColor:
              landed && lastFlip === "YES" ? "rgba(10,10,10,0.4)" : undefined,
            textDecorationThickness:
              landed && lastFlip === "YES" ? "1.2px" : undefined,
            color: landed && lastFlip === "YES" ? "var(--ink-faint)" : "var(--ink)",
            transition: "color 360ms ease",
          }}
        >
          {displayQuestion}
        </h1>
        {/* Description: visible on desktop here; on mobile we render it
            below the flip flow so the gauge + coin own the fold. */}
        <div className="hidden lg:block">
          <MarketDescription text={market.description} />
        </div>
      </section>

      <hr className="border-0 border-t border-[var(--rule)] m-0" />

      {/* ── Mobile: reading-or-verdict + gauge ─────────────────── */}
      <section className="lg:hidden pt-4 pb-2">
        {!landed ? (
          <>
            <p
              className="text-[19px] italic leading-snug m-0"
              style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}
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
            <div className="mt-4">
              <GaugeBar
                yesProb={yesProbability}
                yesLabel={yesToken}
                noLabel={noToken}
              />
            </div>
          </>
        ) : (
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              The coin landed on
            </p>
            <p
              className="display"
              style={{
                fontStyle: "italic",
                fontSize: 60,
                lineHeight: 0.95,
                letterSpacing: "-0.035em",
                color: lastFlip === "YES" ? "var(--accent)" : "var(--ink)",
                margin: 0,
              }}
            >
              {landedLabel}.
            </p>
            <p
              className="figure"
              style={{
                marginTop: 6,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: verdictAccent,
              }}
            >
              {verdictKind} ·{" "}
              {(lastFlip === "YES" ? yesLabelText : noLabelText).toLowerCase()}{" "}
              priced at {landedOdds}%
            </p>
            <div className="mt-4">
              <GaugeBar
                yesProb={yesProbability}
                yesLabel={yesToken}
                noLabel={noToken}
                landed={lastFlip}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Coin + desktop side panel ──────────────────────────── */}
      <section className="pt-4 sm:pt-8 pb-3 sm:pb-6 lg:grid lg:gap-12 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col items-center lg:items-stretch">
          <CoinFlip
            ref={coinRef}
            slug={market.slug}
            question={displayQuestion}
            yesProbability={yesProbability}
            outcomeYesLabel={yesLabelText}
            outcomeNoLabel={noLabelText}
            onFlipComplete={handleFlipComplete}
            onPhaseChange={setPhase}
            hideButton
            hideVerdict
          />

          {/* Desktop CTA / verdict + post-flip actions */}
          <div className="hidden lg:flex flex-col items-center mt-6">
            {phase === "idle" && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => coinRef.current?.flip()}
                >
                  Flip the coin
                </button>
                <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                  One odds-weighted flip.
                </p>
              </>
            )}
            {phase === "flipping" && (
              <p className="text-2xl italic text-[var(--ink-faint)]">
                drawing&hellip;
              </p>
            )}
            {landed && (
              <DesktopVerdict
                verdictKind={verdictKind!}
                verdictMsg={verdictMsg}
                onAgain={() => coinRef.current?.flip()}
              />
            )}
          </div>

          {landed && (
            <div className="hidden lg:flex mt-4 flex-wrap items-center justify-center gap-5">
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

        {/* Desktop right rail: reading + dot grid + history */}
        <div className="hidden lg:flex flex-col gap-6">
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

          <History
            slug={market.slug}
            refreshKey={historyKey}
            yesProbability={yesProbability}
            yesLabel={yes?.label}
            noLabel={no?.label}
          />
        </div>
      </section>

      {/* ── Mobile-only: "See 100 futures" expandable + history ─ */}
      <section className="lg:hidden pb-6">
        <button
          onClick={() => setFuturesOpen((o) => !o)}
          className={`mf-disclosure${futuresOpen ? " mf-disclosure--open" : ""}`}
          aria-expanded={futuresOpen}
        >
          <span>
            {futuresOpen ? "− See the 100 futures" : "+ See the 100 futures"}
          </span>
          <span style={{ color: "var(--accent)" }}>{yesPct} in</span>
        </button>
        {futuresOpen && (
          <div className="pt-3 pb-2">
            <DotGrid yesProb={yesProbability} cols={20} />
            <div className="flex gap-6 mt-4">
              <LegendDot solid label={`${yesPct} ${yesLabelText}`} />
              <LegendDot solid={false} label={`${noPct} ${noLabelText}`} />
            </div>
          </div>
        )}

        <div className="mt-2">
          <History
            slug={market.slug}
            refreshKey={historyKey}
            yesProbability={yesProbability}
            yesLabel={yes?.label}
            noLabel={no?.label}
          />
        </div>

        <div className="mt-6">
          <MarketDescription text={market.description} />
        </div>
      </section>

      {/* ── Mobile sticky bottom bar ───────────────────────────── */}
      <div className="mf-bottombar lg:hidden">
        <div className="mx-auto max-w-[1024px] px-5">
          {renderMobileBarBody()}
        </div>
      </div>
    </>
  );
}

function DesktopVerdict({
  verdictKind,
  verdictMsg,
  onAgain,
}: {
  verdictKind: "AS EXPECTED" | "A TOSS-UP" | "SURPRISE";
  verdictMsg: string;
  onAgain: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <p
        role="status"
        className="display"
        style={{
          fontSize: 38,
          color:
            verdictKind === "SURPRISE" ? "var(--accent)" : "var(--ink)",
          lineHeight: 1,
          letterSpacing: "-0.025em",
          fontStyle: "italic",
        }}
      >
        {verdictKind}.
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

function IconAction({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="mf-icon-action"
    >
      <span aria-hidden style={{ fontSize: 16, lineHeight: 1, marginBottom: 2 }}>
        {icon}
      </span>
      <span className="mf-icon-action__label">{label}</span>
    </button>
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
