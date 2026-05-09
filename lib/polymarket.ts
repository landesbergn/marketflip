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
