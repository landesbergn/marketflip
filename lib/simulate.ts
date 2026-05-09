// lib/simulate.ts
import { defaultRng, type Rng } from "./rng";
import type { SimResult } from "./types";

export function simulate(
  probabilityYes: number,
  n: number,
  rng: Rng = defaultRng
): SimResult {
  let yesCount = 0;
  for (let i = 0; i < n; i++) {
    if (rng() < probabilityYes) yesCount++;
  }
  return {
    n,
    yesCount,
    noCount: n - yesCount,
    impliedProbability: probabilityYes,
    observedProbability: yesCount / n,
  };
}
