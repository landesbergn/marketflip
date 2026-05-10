// lib/polymarket-internal.ts
// Raw shapes returned by Polymarket's Gamma API. Internal — do not export from `polymarket.ts` directly.

export type GammaMarket = {
  id: string;
  slug: string;
  question: string;
  description?: string;
  /** JSON string, e.g. '["Yes","No"]'. */
  outcomes: string;
  /** JSON string, e.g. '["0.56","0.44"]'. */
  outcomePrices: string;
  endDate?: string;
  volume24hr?: number;
  active?: boolean;
  closed?: boolean;
  events?: GammaEventSummary[];
};

export type GammaEventSummary = {
  id: string;
  slug: string;
  title: string;
};

export type GammaEvent = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  markets: GammaMarket[];
};

/**
 * A binary market is "decided" when its YES side rounds to 0% or 100%.
 * Decided markets aren't fun to flip on (the result is determined),
 * so we filter them out of trending/search/event sub-market lists.
 */
export function isDecidedBinary(yesProbability: number): boolean {
  const pct = Math.round(yesProbability * 100);
  return pct === 0 || pct === 100;
}

export const GAMMA_BASE = "https://gamma-api.polymarket.com";
export const POLYMARKET_BASE = "https://polymarket.com";

export function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
