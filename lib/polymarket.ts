// lib/polymarket.ts
import type { FlippableMarket, ParentEvent, ResolvedSlug } from "./types";
import {
  GAMMA_BASE,
  POLYMARKET_BASE,
  parseJsonArray,
  isDecidedBinary,
  type GammaMarket,
  type GammaEvent,
} from "./polymarket-internal";

async function gammaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GAMMA_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`Gamma API error ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

function normalizeMarket(m: GammaMarket): FlippableMarket | null {
  const labels = parseJsonArray<string>(m.outcomes);
  const prices = parseJsonArray<string>(m.outcomePrices).map((s) => Number(s));
  if (labels.length < 2 || prices.length < 2) return null;
  if (m.closed === true) return null;
  // Drop already-decided markets (one side at 0/100 — not fun to flip on).
  if (isDecidedBinary(prices[0])) return null;

  return {
    id: m.id,
    slug: m.slug,
    question: (m.question ?? "").trim(),
    description: m.description?.trim(),
    outcomes: labels.map((label, i) => ({
      label: label.trim(),
      probability: prices[i] ?? 0,
    })),
    endDate: m.endDate ?? "",
    volume24h: m.volume24hr ?? 0,
    url: `${POLYMARKET_BASE}/market/${m.slug}`,
    parentEvent: m.events && m.events[0]
      ? {
          slug: m.events[0].slug,
          question: (m.events[0].title ?? "").trim(),
        }
      : undefined,
  };
}

export async function getMarketBySlug(
  slug: string,
  init?: RequestInit
): Promise<FlippableMarket | null> {
  const list = await gammaFetch<GammaMarket[]>(
    `/markets?slug=${encodeURIComponent(slug)}`,
    init
  );
  if (!Array.isArray(list) || list.length === 0) return null;
  return normalizeMarket(list[0]);
}

function normalizeEvent(e: GammaEvent): ParentEvent | null {
  if (e.closed === true) return null;
  const subMarkets = e.markets
    .map((m) => {
      const prices = parseJsonArray<string>(m.outcomePrices).map(Number);
      const yesProbability = prices[0] ?? 0;
      if (m.closed === true) return null;
      // Drop candidates rounding to 0% — they're noise that breaks the UI.
      if (isDecidedBinary(yesProbability) && yesProbability < 0.5) return null;
      return { slug: m.slug, question: m.question, yesProbability };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.yesProbability - a.yesProbability);

  if (subMarkets.length === 0) return null;

  return {
    slug: e.slug,
    question: (e.title ?? "").trim(),
    description: e.description?.trim(),
    endDate: e.endDate ?? "",
    url: `${POLYMARKET_BASE}/event/${e.slug}`,
    subMarkets: subMarkets.map((s) => ({
      ...s,
      question: s.question.trim(),
    })),
  };
}

export async function getEventBySlug(
  slug: string,
  init?: RequestInit
): Promise<ParentEvent | null> {
  const list = await gammaFetch<GammaEvent[]>(
    `/events?slug=${encodeURIComponent(slug)}`,
    init
  );
  if (!Array.isArray(list) || list.length === 0) return null;
  return normalizeEvent(list[0]);
}

export async function getTrendingMarkets(
  limit = 12,
  init?: RequestInit
): Promise<FlippableMarket[]> {
  // Over-fetch so we still hit `limit` after filtering decided markets.
  const fetchLimit = limit * 3;
  const url =
    `/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${fetchLimit}`;
  const list = await gammaFetch<GammaMarket[]>(url, init);
  return list
    .map(normalizeMarket)
    .filter((m): m is FlippableMarket => m !== null)
    .slice(0, limit);
}

type GammaPublicSearchResponse = {
  events?: (GammaEvent & { volume24hr?: number })[];
};

function normalizeEventAsSearchHit(
  e: GammaEvent & { volume24hr?: number }
): FlippableMarket | null {
  if (e.closed === true || e.active === false) return null;
  // Only "live" sub-markets — open and not already decided.
  const live = (e.markets ?? []).filter((m) => {
    if (m.closed === true) return false;
    const yes = parseJsonArray<string>(m.outcomePrices).map(Number)[0] ?? 0;
    if (isDecidedBinary(yes) && yes < 0.5) return false;
    return true;
  });
  if (live.length === 0) return null;

  // Use the highest-priced market's odds for the search-result pill display.
  const top = [...live].sort((a, b) => {
    const ap = parseJsonArray<string>(a.outcomePrices).map(Number)[0] ?? 0;
    const bp = parseJsonArray<string>(b.outcomePrices).map(Number)[0] ?? 0;
    return bp - ap;
  })[0];

  const labels = parseJsonArray<string>(top.outcomes);
  const prices = parseJsonArray<string>(top.outcomePrices).map(Number);
  if (labels.length < 2 || prices.length < 2) return null;
  if (isDecidedBinary(prices[0])) return null;

  return {
    id: e.id,
    slug: e.slug,
    question: (e.title ?? "").trim(),
    description: e.description?.trim(),
    outcomes: labels.map((label, i) => ({
      label: label.trim(),
      probability: prices[i] ?? 0,
    })),
    endDate: e.endDate ?? "",
    volume24h: e.volume24hr ?? 0,
    url: `${POLYMARKET_BASE}/event/${e.slug}`,
  };
}

export async function searchMarkets(
  query: string,
  init?: RequestInit
): Promise<FlippableMarket[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const data = await gammaFetch<GammaPublicSearchResponse>(
    `/public-search?q=${encodeURIComponent(q)}&limit_per_type=20`,
    init
  );
  const events = Array.isArray(data?.events) ? data.events : [];
  return events
    .map(normalizeEventAsSearchHit)
    .filter((m): m is FlippableMarket => m !== null);
}

export function resolvePolymarketUrl(input: string): ResolvedSlug | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "polymarket.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [type, slug] = segments;
  if (type === "market") return { kind: "market", slug };
  if (type === "event") return { kind: "event", slug };
  return null;
}
