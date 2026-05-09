import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMarketBySlug } from "@/lib/polymarket";

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
