// lib/polymarket-internal.ts
// Raw shapes returned by Polymarket's Gamma API. Internal — do not export from `polymarket.ts` directly.

export type GammaMarket = {
  id: string;
  slug: string;
  question: string;
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
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  markets: GammaMarket[];
};

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
