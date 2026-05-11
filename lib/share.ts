// lib/share.ts
import type { FlipOutcome } from "./types";

type SingleFlipShare = {
  question: string;
  yesProbability: number;
  flipped: FlipOutcome;
  url: string;
};

type SimulationShare = {
  question: string;
  yesProbability: number;
  n: number;
  yesCount: number;
  noCount: number;
  url: string;
};

const fmtPct = (p: number, decimals = 0) =>
  `${(p * 100).toFixed(decimals)}%`;

const fmtInt = (n: number) => n.toLocaleString("en-US");

export function formatSingleFlipShare(s: SingleFlipShare): string {
  const emoji = s.flipped === "YES" ? "🎉" : "🚨";
  return [
    `"${s.question}"`,
    `Market said: ${fmtPct(s.yesProbability)} YES`,
    `I flipped: ${emoji} ${s.flipped}`,
    s.url,
  ].join("\n");
}

export function formatSimulationShare(s: SimulationShare): string {
  const observed = s.yesCount / s.n;
  return [
    `"${s.question}"`,
    `${fmtInt(s.n)} sims · Implied: ${fmtPct(s.yesProbability)} · Observed: ${fmtPct(observed, 1)}`,
    `YES ${fmtInt(s.yesCount)} · NO ${fmtInt(s.noCount)}`,
    s.url,
  ].join("\n");
}
