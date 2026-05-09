// lib/flip.ts
import { defaultRng, type Rng } from "./rng";
import type { FlipOutcome } from "./types";

/**
 * Weighted coin flip. Returns "YES" with probability `probabilityYes`.
 * `probabilityYes` must be in [0, 1].
 */
export function flip(probabilityYes: number, rng: Rng = defaultRng): FlipOutcome {
  return rng() < probabilityYes ? "YES" : "NO";
}
