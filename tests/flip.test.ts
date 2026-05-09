import { describe, it, expect } from "vitest";
import { flip } from "@/lib/flip";
import { createRng } from "@/lib/rng";

describe("flip", () => {
  it("returns YES when rng draw < probability", () => {
    const rng = () => 0.3;
    expect(flip(0.5, rng)).toBe("YES");
  });

  it("returns NO when rng draw >= probability", () => {
    const rng = () => 0.8;
    expect(flip(0.5, rng)).toBe("NO");
  });

  it("p=0 always returns NO", () => {
    const rng = createRng(123);
    for (let i = 0; i < 100; i++) expect(flip(0, rng)).toBe("NO");
  });

  it("p=1 always returns YES", () => {
    const rng = createRng(123);
    for (let i = 0; i < 100; i++) expect(flip(1, rng)).toBe("YES");
  });

  it("p=0.5 over 10k draws is roughly balanced", () => {
    const rng = createRng(99);
    let yes = 0;
    for (let i = 0; i < 10000; i++) if (flip(0.5, rng) === "YES") yes++;
    expect(yes).toBeGreaterThan(4700);
    expect(yes).toBeLessThan(5300);
  });

  it("uses defaultRng when no rng passed", () => {
    const result = flip(0.5);
    expect(["YES", "NO"]).toContain(result);
  });
});
