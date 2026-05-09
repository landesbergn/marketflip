// lib/types.ts

export type Outcome = {
  /** Display label, e.g. "Yes", "No", or a candidate name. */
  label: string;
  /** Implied probability in [0, 1]. */
  probability: number;
};

export type FlippableMarket = {
  id: string;
  slug: string;
  question: string;
  outcomes: Outcome[]; // length 2 in v1; >2 reserved for v2 wheel
  endDate: string;
  volume24h: number;
  url: string;
  /** Present when this market is a sub-market of a multi-outcome event. */
  parentEvent?: ParentEventSummary;
};

export type ParentEventSummary = {
  slug: string;
  question: string;
};

export type ParentEvent = {
  slug: string;
  question: string;
  endDate: string;
  url: string;
  subMarkets: SubMarketSummary[];
};

export type SubMarketSummary = {
  slug: string;
  question: string;
  yesProbability: number;
};

export type SimResult = {
  n: number;
  yesCount: number;
  noCount: number;
  impliedProbability: number;
  observedProbability: number;
};

export type FlipOutcome = "YES" | "NO";

export type ResolvedSlug =
  | { kind: "market"; slug: string }
  | { kind: "event"; slug: string };

export type HistoryEntry = {
  slug: string;
  question: string;
  outcomeLabel: string; // e.g., "YES" for binary, candidate name for sub-market
  flippedTo: FlipOutcome;
  impliedProbability: number;
  timestamp: number;
};
