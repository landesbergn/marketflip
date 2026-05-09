import { describe, it, expect } from "vitest";
import { simulate } from "@/lib/simulate";
import { createRng } from "@/lib/rng";

describe("simulate", () => {
  it("returns SimResult with correct counts that sum to n", () => {
    const r = simulate(0.5, 1000, createRng(42));
    expect(r.n).toBe(1000);
    expect(r.yesCount + r.noCount).toBe(1000);
    expect(r.impliedProbability).toBe(0.5);
    expect(r.observedProbability).toBeCloseTo(r.yesCount / 1000, 10);
  });

  it("p=0 yields 0 yes counts", () => {
    const r = simulate(0, 500, createRng(1));
    expect(r.yesCount).toBe(0);
    expect(r.noCount).toBe(500);
    expect(r.observedProbability).toBe(0);
  });

  it("p=1 yields n yes counts", () => {
    const r = simulate(1, 500, createRng(1));
    expect(r.yesCount).toBe(500);
    expect(r.noCount).toBe(0);
    expect(r.observedProbability).toBe(1);
  });

  it("observed probability converges toward implied at large n", () => {
    const r = simulate(0.7, 10000, createRng(11));
    expect(Math.abs(r.observedProbability - 0.7)).toBeLessThan(0.025);
  });

  it("is deterministic with same seed", () => {
    const a = simulate(0.42, 1000, createRng(2026));
    const b = simulate(0.42, 1000, createRng(2026));
    expect(a).toEqual(b);
  });

  it("n=1 returns a single trial", () => {
    const r = simulate(0.5, 1, createRng(1));
    expect(r.n).toBe(1);
    expect(r.yesCount + r.noCount).toBe(1);
  });
});
