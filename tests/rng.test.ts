import { describe, it, expect } from "vitest";
import { createRng, defaultRng } from "@/lib/rng";

describe("createRng (seeded)", () => {
  it("produces a deterministic sequence for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("returns values in [0, 1)", () => {
    const rng = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("has reasonable spread (mean near 0.5 over 10k draws)", () => {
    const rng = createRng(7);
    let sum = 0;
    for (let i = 0; i < 10000; i++) sum += rng();
    expect(sum / 10000).toBeGreaterThan(0.45);
    expect(sum / 10000).toBeLessThan(0.55);
  });
});

describe("defaultRng", () => {
  it("returns values in [0, 1)", () => {
    const v = defaultRng();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });
});
