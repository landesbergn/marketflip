// lib/rng.ts

/** A function returning a pseudo-random value in [0, 1). */
export type Rng = () => number;

/** Production default — uses Math.random. Acceptable for entertainment use. */
export const defaultRng: Rng = () => Math.random();

/**
 * Mulberry32 — small, fast, deterministic 32-bit PRNG.
 * Used in tests to make flip/simulate behavior reproducible.
 */
export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
