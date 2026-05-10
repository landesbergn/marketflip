import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMarketBySlug,
  getEventBySlug,
  getTrendingMarkets,
  searchMarkets,
  resolvePolymarketUrl,
} from "@/lib/polymarket";

const sampleGammaMarket = {
  id: "0x123",
  slug: "fed-rates-june-2026",
  question: "Will the Fed cut rates in June 2026?",
  outcomes: '["Yes","No"]',
  outcomePrices: '["0.56","0.44"]',
  endDate: "2026-06-15T00:00:00Z",
  volume24hr: 12345,
  active: true,
  closed: false,
  events: [],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getMarketBySlug", () => {
  it("normalizes a Gamma market into a FlippableMarket", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [sampleGammaMarket],
      })) as unknown as typeof fetch
    );

    const m = await getMarketBySlug("fed-rates-june-2026");
    expect(m).not.toBeNull();
    expect(m!.slug).toBe("fed-rates-june-2026");
    expect(m!.question).toBe("Will the Fed cut rates in June 2026?");
    expect(m!.outcomes).toEqual([
      { label: "Yes", probability: 0.56 },
      { label: "No", probability: 0.44 },
    ]);
    expect(m!.url).toBe("https://polymarket.com/market/fed-rates-june-2026");
    expect(m!.volume24h).toBe(12345);
  });

  it("returns null for closed/resolved markets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ ...sampleGammaMarket, closed: true }],
      })) as unknown as typeof fetch
    );

    expect(await getMarketBySlug("x")).toBeNull();
  });

  it("returns null for already-decided binary markets (0/100)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { ...sampleGammaMarket, outcomePrices: '["0.998","0.002"]' },
        ],
      })) as unknown as typeof fetch
    );

    expect(await getMarketBySlug("x")).toBeNull();
  });

  it("includes resolution-criteria description when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            ...sampleGammaMarket,
            description: "Resolves YES if the Fed cuts rates by June 30.",
          },
        ],
      })) as unknown as typeof fetch
    );

    const m = await getMarketBySlug("x");
    expect(m!.description).toBe(
      "Resolves YES if the Fed cuts rates by June 30."
    );
  });

  it("returns null when slug not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [],
      })) as unknown as typeof fetch
    );

    expect(await getMarketBySlug("missing")).toBeNull();
  });

  it("throws on non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
      })) as unknown as typeof fetch
    );

    await expect(getMarketBySlug("x")).rejects.toThrow(/Gamma/i);
  });
});

const sampleGammaEvent = {
  id: "ev1",
  slug: "presidential-election-winner-2028",
  title: "2028 US Presidential Election",
  endDate: "2028-11-07T00:00:00Z",
  active: true,
  closed: false,
  markets: [
    {
      id: "m1",
      slug: "will-vance-win-2028",
      question: "Will JD Vance win the 2028 election?",
      outcomes: '["Yes","No"]',
      outcomePrices: '["0.28","0.72"]',
      active: true,
      closed: false,
    },
    {
      id: "m2",
      slug: "will-newsom-win-2028",
      question: "Will Gavin Newsom win the 2028 election?",
      outcomes: '["Yes","No"]',
      outcomePrices: '["0.18","0.82"]',
      active: true,
      closed: false,
    },
  ],
};

describe("getEventBySlug", () => {
  it("normalizes an event with sub-markets sorted by yes probability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [sampleGammaEvent],
      })) as unknown as typeof fetch
    );

    const ev = await getEventBySlug("presidential-election-winner-2028");
    expect(ev).not.toBeNull();
    expect(ev!.subMarkets.length).toBe(2);
    expect(ev!.subMarkets[0].slug).toBe("will-vance-win-2028");
    expect(ev!.subMarkets[0].yesProbability).toBeCloseTo(0.28);
    expect(ev!.subMarkets[1].slug).toBe("will-newsom-win-2028");
  });

  it("returns null for closed events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ ...sampleGammaEvent, closed: true }],
      })) as unknown as typeof fetch
    );

    expect(await getEventBySlug("x")).toBeNull();
  });

  it("filters out 0% candidates from the field", async () => {
    const eventWithZeros = {
      ...sampleGammaEvent,
      markets: [
        ...sampleGammaEvent.markets,
        {
          id: "m3",
          slug: "out-of-it",
          question: "Will some random person win?",
          outcomes: '["Yes","No"]',
          outcomePrices: '["0.001","0.999"]',
          active: true,
          closed: false,
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [eventWithZeros],
      })) as unknown as typeof fetch
    );

    const ev = await getEventBySlug("x");
    expect(ev!.subMarkets.map((s) => s.slug)).toEqual([
      "will-vance-win-2028",
      "will-newsom-win-2028",
    ]);
    expect(ev!.subMarkets.find((s) => s.slug === "out-of-it")).toBeUndefined();
  });

  it("includes event description when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            ...sampleGammaEvent,
            description: "The 2028 US Presidential Election.",
          },
        ],
      })) as unknown as typeof fetch
    );

    const ev = await getEventBySlug("x");
    expect(ev!.description).toBe("The 2028 US Presidential Election.");
  });
});

describe("getTrendingMarkets", () => {
  it("returns up to limit markets, filtering closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { ...sampleGammaMarket, slug: "a" },
          { ...sampleGammaMarket, slug: "b" },
          { ...sampleGammaMarket, slug: "closed-one", closed: true },
        ],
      })) as unknown as typeof fetch
    );

    const markets = await getTrendingMarkets(12);
    expect(markets.length).toBe(2);
    expect(markets.map((m) => m.slug)).toEqual(["a", "b"]);
  });
});

describe("searchMarkets", () => {
  it("normalizes search results from /public-search, surfacing event slug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          events: [
            {
              id: "ev-fed",
              slug: "fed-decision-in-june",
              title: "Fed Decision in June?",
              endDate: "2026-06-15T00:00:00Z",
              active: true,
              closed: false,
              volume24hr: 88888,
              markets: [sampleGammaMarket],
            },
          ],
        }),
      })) as unknown as typeof fetch
    );

    const results = await searchMarkets("fed");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("fed-decision-in-june");
    expect(results[0].question).toBe("Fed Decision in June?");
    expect(results[0].url).toBe(
      "https://polymarket.com/event/fed-decision-in-june"
    );
    expect(results[0].volume24h).toBe(88888);
  });

  it("filters out closed events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          events: [
            {
              id: "ev-closed",
              slug: "fed-closed",
              title: "Closed event",
              active: true,
              closed: true,
              markets: [sampleGammaMarket],
            },
          ],
        }),
      })) as unknown as typeof fetch
    );

    const results = await searchMarkets("fed");
    expect(results).toEqual([]);
  });

  it("returns [] for empty query", async () => {
    expect(await searchMarkets("")).toEqual([]);
    expect(await searchMarkets("   ")).toEqual([]);
  });
});

describe("resolvePolymarketUrl", () => {
  it("extracts a market slug from a /market/ URL", () => {
    const r = resolvePolymarketUrl("https://polymarket.com/market/fed-rates-june-2026");
    expect(r).toEqual({ kind: "market", slug: "fed-rates-june-2026" });
  });

  it("extracts an event slug from an /event/ URL", () => {
    const r = resolvePolymarketUrl("https://polymarket.com/event/2028-presidential-election");
    expect(r).toEqual({ kind: "event", slug: "2028-presidential-election" });
  });

  it("strips trailing slashes and query strings", () => {
    const r = resolvePolymarketUrl("https://polymarket.com/market/fed-rates-june-2026/?ref=twitter");
    expect(r).toEqual({ kind: "market", slug: "fed-rates-june-2026" });
  });

  it("accepts www. and http(s)", () => {
    expect(resolvePolymarketUrl("http://www.polymarket.com/event/foo")).toEqual({
      kind: "event",
      slug: "foo",
    });
  });

  it("returns null for non-polymarket hosts", () => {
    expect(resolvePolymarketUrl("https://kalshi.com/market/foo")).toBeNull();
  });

  it("returns null for malformed URLs", () => {
    expect(resolvePolymarketUrl("not a url")).toBeNull();
    expect(resolvePolymarketUrl("https://polymarket.com/")).toBeNull();
  });
});
