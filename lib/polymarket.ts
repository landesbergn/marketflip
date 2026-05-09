// lib/polymarket.ts
import type { FlippableMarket, ParentEvent, ResolvedSlug } from "./types";
import {
  GAMMA_BASE,
  POLYMARKET_BASE,
  parseJsonArray,
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

  return {
    id: m.id,
    slug: m.slug,
    question: m.question,
    outcomes: labels.map((label, i) => ({
      label,
      probability: prices[i] ?? 0,
    })),
    endDate: m.endDate ?? "",
    volume24h: m.volume24hr ?? 0,
    url: `${POLYMARKET_BASE}/market/${m.slug}`,
    parentEvent: m.events && m.events[0]
      ? { slug: m.events[0].slug, question: m.events[0].title }
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
      return m.closed === true
        ? null
        : { slug: m.slug, question: m.question, yesProbability };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.yesProbability - a.yesProbability);

  return {
    slug: e.slug,
    question: e.title,
    endDate: e.endDate ?? "",
    url: `${POLYMARKET_BASE}/event/${e.slug}`,
    subMarkets,
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
  const url =
    `/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${limit}`;
  const list = await gammaFetch<GammaMarket[]>(url, init);
  return list
    .map(normalizeMarket)
    .filter((m): m is FlippableMarket => m !== null)
    .slice(0, limit);
}

export async function searchMarkets(
  query: string,
  init?: RequestInit
): Promise<FlippableMarket[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const url =
    `/markets?active=true&closed=false&q=${encodeURIComponent(q)}&limit=20`;
  const list = await gammaFetch<GammaMarket[]>(url, init);
  return list
    .map(normalizeMarket)
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
