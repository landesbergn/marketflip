import { describe, it, expect } from "vitest";
import {
  formatSingleFlipShare,
  formatSimulationShare,
} from "@/lib/share";

describe("formatSingleFlipShare", () => {
  it("renders the canonical single-flip share string", () => {
    const out = formatSingleFlipShare({
      question: "Will the Fed cut rates in June?",
      yesProbability: 0.56,
      flipped: "NO",
      url: "https://marketflip.app/m/fed-rates-june-2026",
    });
    expect(out).toBe(
      [
        '"Will the Fed cut rates in June?"',
        "Market said: 56% YES",
        "I flipped: 🚨 NO",
        "https://marketflip.app/m/fed-rates-june-2026",
      ].join("\n")
    );
  });

  it("uses 🎉 for YES outcomes", () => {
    const out = formatSingleFlipShare({
      question: "Q?",
      yesProbability: 0.7,
      flipped: "YES",
      url: "https://x/y",
    });
    expect(out).toContain("I flipped: 🎉 YES");
  });

  it("rounds probability to a whole percent", () => {
    const out = formatSingleFlipShare({
      question: "Q?",
      yesProbability: 0.5621,
      flipped: "NO",
      url: "https://x/y",
    });
    expect(out).toContain("56% YES");
  });
});

describe("formatSimulationShare", () => {
  it("renders the canonical simulation share string", () => {
    const out = formatSimulationShare({
      question: "Will the Fed cut rates in June?",
      yesProbability: 0.56,
      n: 1000,
      yesCount: 562,
      noCount: 438,
      url: "https://marketflip.app/m/fed-rates-june-2026",
    });
    expect(out).toBe(
      [
        '"Will the Fed cut rates in June?"',
        "1,000 sims · Implied: 56% · Observed: 56.2%",
        "YES 562 · NO 438",
        "https://marketflip.app/m/fed-rates-june-2026",
      ].join("\n")
    );
  });

  it("formats large n with thousands separators", () => {
    const out = formatSimulationShare({
      question: "Q?",
      yesProbability: 0.5,
      n: 10000,
      yesCount: 5012,
      noCount: 4988,
      url: "u",
    });
    expect(out).toContain("10,000 sims");
  });
});
