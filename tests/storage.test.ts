import { describe, it, expect, beforeEach } from "vitest";
import { addFlipToHistory, readHistory, clearHistory, HISTORY_KEY, HISTORY_CAP } from "@/lib/storage";

describe("flip history (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(readHistory()).toEqual([]);
  });

  it("appends a flip to history", () => {
    addFlipToHistory({
      slug: "fed-rates",
      question: "Will the Fed cut rates?",
      outcomeLabel: "YES",
      flippedTo: "NO",
      impliedProbability: 0.56,
      timestamp: 1000,
    });
    const h = readHistory();
    expect(h.length).toBe(1);
    expect(h[0].slug).toBe("fed-rates");
  });

  it("orders most recent first", () => {
    addFlipToHistory({
      slug: "a", question: "A?", outcomeLabel: "YES", flippedTo: "YES",
      impliedProbability: 0.5, timestamp: 1,
    });
    addFlipToHistory({
      slug: "b", question: "B?", outcomeLabel: "YES", flippedTo: "NO",
      impliedProbability: 0.5, timestamp: 2,
    });
    const h = readHistory();
    expect(h.map((e) => e.slug)).toEqual(["b", "a"]);
  });

  it("caps history at HISTORY_CAP entries (oldest evicted)", () => {
    for (let i = 0; i < HISTORY_CAP + 5; i++) {
      addFlipToHistory({
        slug: `s${i}`, question: "?", outcomeLabel: "YES", flippedTo: "YES",
        impliedProbability: 0.5, timestamp: i,
      });
    }
    const h = readHistory();
    expect(h.length).toBe(HISTORY_CAP);
    expect(h[0].slug).toBe(`s${HISTORY_CAP + 4}`);
    expect(h[h.length - 1].slug).toBe("s5");
  });

  it("clearHistory empties the store", () => {
    addFlipToHistory({
      slug: "a", question: "?", outcomeLabel: "YES", flippedTo: "YES",
      impliedProbability: 0.5, timestamp: 1,
    });
    clearHistory();
    expect(readHistory()).toEqual([]);
  });

  it("readHistory tolerates corrupt JSON", () => {
    localStorage.setItem(HISTORY_KEY, "{not json");
    expect(readHistory()).toEqual([]);
  });

  it("readHistory tolerates non-array JSON", () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ foo: 1 }));
    expect(readHistory()).toEqual([]);
  });
});
