# MarketFlip v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship MarketFlip v1 — a Next.js site that fetches a Polymarket market, displays its odds, simulates a weighted coin flip, and shows distribution + education for repeated simulations.

**Architecture:** Next.js 15 App Router on Vercel. Server components fetch Polymarket Gamma API server-side; trending list edge-cached 60s, individual markets fetched live. Pure flip/simulate logic in `lib/` (Vitest unit tests). Client components handle the flip animation and simulation panel. PostHog client SDK for analytics. localStorage for flip history.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, React Testing Library, Playwright, PostHog JS, Polymarket Gamma API.

**Spec:** [`docs/superpowers/specs/2026-05-09-marketflip-design.md`](../specs/2026-05-09-marketflip-design.md)

---

## File Structure (target end state)

```
app/
  layout.tsx                       # Root layout, fonts, PostHog provider
  page.tsx                         # Home (paste-URL, search, trending)
  providers.tsx                    # Client-only PostHog provider
  globals.css                      # Tailwind directives + base styles
  m/[slug]/
    page.tsx                       # Market page (binary or event)
    not-found.tsx                  # When market/event slug doesn't resolve
  api/markets/
    trending/route.ts
    search/route.ts
    [slug]/route.ts
    resolve-url/route.ts
components/
  CoinFlip.tsx                     # Client: animation + result
  MarketCard.tsx                   # Server: trending/search results card
  CandidateList.tsx                # Client: pickable sub-markets
  SimulationPanel.tsx              # Client: distribution + education
  ShareButton.tsx                  # Client: copy-text share
  History.tsx                      # Client: localStorage drawer
  RefreshOddsButton.tsx            # Client: refetch live odds
  PasteUrlInput.tsx                # Client: paste-URL home input
  SearchInput.tsx                  # Client: search home input
  TrendingGrid.tsx                 # Server: renders MarketCards
  StaleBanner.tsx                  # Renders when trending fetch failed
lib/
  types.ts                         # Shared types
  flip.ts                          # Pure: flip(p) -> "YES"|"NO"
  simulate.ts                      # Pure: simulate(p, n) -> SimResult
  share.ts                         # Format share strings
  storage.ts                       # localStorage history wrapper
  polymarket.ts                    # Gamma API client
  rng.ts                           # Injectable RNG (testability)
  posthog.ts                       # PostHog event helpers (typed)
tests/
  flip.test.ts
  simulate.test.ts
  share.test.ts
  storage.test.ts
  rng.test.ts
  polymarket.test.ts
  components/
    CoinFlip.test.tsx
    SimulationPanel.test.tsx
    PasteUrlInput.test.tsx
  e2e/
    happy-path.spec.ts
vitest.config.ts
playwright.config.ts
next.config.ts
tsconfig.json
tailwind.config.ts                 # (or v4 inline config in globals.css)
postcss.config.mjs
.env.example
.env.local                         # gitignored
```

---

## Phase 0 — Project bootstrap

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `eslint.config.mjs`, `next-env.d.ts`
- Modify: `.gitignore` (verify Next.js ignores already present)

- [ ] **Step 1: Run create-next-app in the existing repo**

The repo already has files (`README.md`, `.gitignore`, `docs/`). `create-next-app` cannot scaffold into a non-empty directory without `--force` or scaffolding into a subdir and moving up.

Run from `/Users/noah/Desktop/prediction-coin-flip`:

```bash
npx --yes create-next-app@latest _scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

If `create-next-app` interactively asks about Turbopack, accept the default. The plan does not depend on Turbopack either way.

Expected: `_scaffold/` created with a fresh Next.js 15 app.

- [ ] **Step 2: Move scaffolded files up one level, preserving the existing repo files**

```bash
shopt -s dotglob
mv _scaffold/* .
mv _scaffold/.* . 2>/dev/null || true
rmdir _scaffold
```

If the merge complains about `.gitignore` or `README.md`, leave the existing repo versions in place (they were customized in the brainstorm). Manually merge any new ignores from the scaffold's `.gitignore` into the existing one — the existing `.gitignore` already has Next.js ignores, so no merge needed.

Expected files present after move: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `public/`.

- [ ] **Step 3: Install runtime dependencies**

```bash
npm install posthog-js
```

- [ ] **Step 4: Install dev dependencies for testing**

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node
```

- [ ] **Step 5: Verify the app builds**

```bash
npm run build
```

Expected: build succeeds with no errors. There will be one route (`/`) showing "Welcome to Next.js."

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold Next.js 15 app with TypeScript, Tailwind, PostHog and Vitest deps"
```

---

### Task 2: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (add `test` script), `tsconfig.json` (add Vitest globals to types)

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Create `tests/setup.ts`**

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add `test` script to `package.json`**

In the `scripts` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Add Vitest globals to `tsconfig.json`**

In `compilerOptions.types` (create if missing):

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 5: Sanity check — write and run a trivial test**

Create `tests/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:

```bash
npm test
```

Expected: 1 passed.

- [ ] **Step 6: Delete `tests/sanity.test.ts` and commit**

```bash
rm tests/sanity.test.ts
git add -A
git commit -m "Configure Vitest with jsdom environment and Testing Library"
```

---

### Task 3: Configure Playwright (deferred config; install only)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps chromium
```

Note: this skips Firefox/WebKit since v1 only needs one happy-path test.

- [ ] **Step 2: Add `test:e2e` script to `package.json`**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 3: Commit (config file added later in Task 32)**

```bash
git add -A
git commit -m "Install Playwright for E2E tests"
```

---

## Phase 1 — Core types

### Task 4: Define shared types in `lib/types.ts`

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the type definitions**

```ts
// lib/types.ts

export type Outcome = {
  /** Display label, e.g. "Yes", "No", or a candidate name. */
  label: string;
  /** Implied probability in [0, 1]. */
  probability: number;
};

export type FlippableMarket = {
  id: string;
  slug: string;
  question: string;
  outcomes: Outcome[]; // length 2 in v1; >2 reserved for v2 wheel
  endDate: string;
  volume24h: number;
  url: string;
  /** Present when this market is a sub-market of a multi-outcome event. */
  parentEvent?: ParentEventSummary;
};

export type ParentEventSummary = {
  slug: string;
  question: string;
};

export type ParentEvent = {
  slug: string;
  question: string;
  endDate: string;
  url: string;
  subMarkets: SubMarketSummary[];
};

export type SubMarketSummary = {
  slug: string;
  question: string;
  yesProbability: number;
};

export type SimResult = {
  n: number;
  yesCount: number;
  noCount: number;
  impliedProbability: number;
  observedProbability: number;
};

export type FlipOutcome = "YES" | "NO";

export type ResolvedSlug =
  | { kind: "market"; slug: string }
  | { kind: "event"; slug: string };

export type HistoryEntry = {
  slug: string;
  question: string;
  outcomeLabel: string; // e.g., "YES" for binary, candidate name for sub-market
  flippedTo: FlipOutcome;
  impliedProbability: number;
  timestamp: number;
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "Define core types: FlippableMarket, ParentEvent, SimResult, etc."
```

---

## Phase 2 — Pure logic (TDD)

### Task 5: Injectable RNG (`lib/rng.ts`)

**Files:**
- Create: `tests/rng.test.ts`, `lib/rng.ts`

- [ ] **Step 1: Write the failing test**

`tests/rng.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/rng.test.ts
```

Expected: fails with module-not-found / cannot import `@/lib/rng`.

- [ ] **Step 3: Implement `lib/rng.ts`**

```ts
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
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/rng.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/rng.ts tests/rng.test.ts
git commit -m "Add seeded RNG (mulberry32) for deterministic flip/sim tests"
```

---

### Task 6: `lib/flip.ts` — single weighted flip

**Files:**
- Create: `tests/flip.test.ts`, `lib/flip.ts`

- [ ] **Step 1: Write the failing test**

`tests/flip.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { flip } from "@/lib/flip";
import { createRng } from "@/lib/rng";

describe("flip", () => {
  it("returns YES when rng draw < probability", () => {
    const rng = () => 0.3;
    expect(flip(0.5, rng)).toBe("YES"); // 0.3 < 0.5
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
    // Just ensure it runs and returns one of two values.
    const result = flip(0.5);
    expect(["YES", "NO"]).toContain(result);
  });
});
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/flip.test.ts
```

Expected: fails — `lib/flip` not found.

- [ ] **Step 3: Implement `lib/flip.ts`**

```ts
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
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/flip.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/flip.ts tests/flip.test.ts
git commit -m "Add weighted single-flip pure function with injectable RNG"
```

---

### Task 7: `lib/simulate.ts` — distribution over N flips

**Files:**
- Create: `tests/simulate.test.ts`, `lib/simulate.ts`

- [ ] **Step 1: Write the failing test**

`tests/simulate.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/simulate.test.ts
```

- [ ] **Step 3: Implement `lib/simulate.ts`**

```ts
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
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/simulate.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/simulate.ts tests/simulate.test.ts
git commit -m "Add weighted simulation (N flips) returning yes/no counts"
```

---

### Task 8: `lib/share.ts` — share string formatting

**Files:**
- Create: `tests/share.test.ts`, `lib/share.ts`

- [ ] **Step 1: Write the failing test**

`tests/share.test.ts`:

```ts
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
        "🪙 MarketFlip",
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
        "🪙 MarketFlip — 1,000 sims",
        '"Will the Fed cut rates in June?"',
        "Implied: 56% · Observed: 56.2%",
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
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/share.test.ts
```

- [ ] **Step 3: Implement `lib/share.ts`**

```ts
// lib/share.ts
import type { FlipOutcome } from "./types";

type SingleFlipShare = {
  question: string;
  yesProbability: number;
  flipped: FlipOutcome;
  url: string;
};

type SimulationShare = {
  question: string;
  yesProbability: number;
  n: number;
  yesCount: number;
  noCount: number;
  url: string;
};

const fmtPct = (p: number, decimals = 0) =>
  `${(p * 100).toFixed(decimals)}%`;

const fmtInt = (n: number) => n.toLocaleString("en-US");

export function formatSingleFlipShare(s: SingleFlipShare): string {
  const emoji = s.flipped === "YES" ? "🎉" : "🚨";
  return [
    "🪙 MarketFlip",
    `"${s.question}"`,
    `Market said: ${fmtPct(s.yesProbability)} YES`,
    `I flipped: ${emoji} ${s.flipped}`,
    s.url,
  ].join("\n");
}

export function formatSimulationShare(s: SimulationShare): string {
  const observed = s.yesCount / s.n;
  return [
    `🪙 MarketFlip — ${fmtInt(s.n)} sims`,
    `"${s.question}"`,
    `Implied: ${fmtPct(s.yesProbability)} · Observed: ${fmtPct(observed, 1)}`,
    `YES ${fmtInt(s.yesCount)} · NO ${fmtInt(s.noCount)}`,
    s.url,
  ].join("\n");
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/share.test.ts
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/share.ts tests/share.test.ts
git commit -m "Add share-string formatters for single-flip and simulation results"
```

---

### Task 9: `lib/storage.ts` — localStorage history

**Files:**
- Create: `tests/storage.test.ts`, `lib/storage.ts`

- [ ] **Step 1: Write the failing test**

`tests/storage.test.ts`:

```ts
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
    // newest is s{HISTORY_CAP+4}, oldest retained is s{5}
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
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/storage.test.ts
```

- [ ] **Step 3: Implement `lib/storage.ts`**

```ts
// lib/storage.ts
import type { HistoryEntry } from "./types";

export const HISTORY_KEY = "marketflip:history";
export const HISTORY_CAP = 50;

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addFlipToHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  const current = readHistory();
  const next = [entry, ...current].slice(0, HISTORY_CAP);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/storage.test.ts
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts tests/storage.test.ts
git commit -m "Add localStorage flip-history helpers (50-entry cap, corruption-safe)"
```

---

## Phase 3 — Polymarket integration

### Task 10: `lib/polymarket.ts` — fetch & normalize a single market

The Gamma API base is `https://gamma-api.polymarket.com`. Markets are at `/markets?slug=<slug>`. Each market has `outcomes` (JSON-stringified array of two strings, typically `["Yes","No"]`) and `outcomePrices` (JSON-stringified array of two stringified numbers, e.g., `["0.56","0.44"]`).

**Files:**
- Create: `tests/polymarket.test.ts`, `lib/polymarket.ts`, `lib/polymarket-internal.ts` (raw API types)

- [ ] **Step 1: Write the failing test for `getMarketBySlug`**

`tests/polymarket.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/polymarket.test.ts
```

- [ ] **Step 3: Implement raw API types in `lib/polymarket-internal.ts`**

```ts
// lib/polymarket-internal.ts
// Raw shapes returned by Polymarket's Gamma API. Internal — do not export from `polymarket.ts` directly.

export type GammaMarket = {
  id: string;
  slug: string;
  question: string;
  /** JSON string, e.g. '["Yes","No"]'. */
  outcomes: string;
  /** JSON string, e.g. '["0.56","0.44"]'. */
  outcomePrices: string;
  endDate?: string;
  volume24hr?: number;
  active?: boolean;
  closed?: boolean;
  events?: GammaEventSummary[];
};

export type GammaEventSummary = {
  id: string;
  slug: string;
  title: string;
};

export type GammaEvent = {
  id: string;
  slug: string;
  title: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  markets: GammaMarket[];
};

export const GAMMA_BASE = "https://gamma-api.polymarket.com";
export const POLYMARKET_BASE = "https://polymarket.com";

export function parseJsonArray<T>(raw: string): T[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Implement `lib/polymarket.ts` with `getMarketBySlug`**

```ts
// lib/polymarket.ts
import type { FlippableMarket, ParentEvent, ResolvedSlug } from "./types";
import {
  GAMMA_BASE,
  POLYMARKET_BASE,
  parseJsonArray,
  type GammaMarket,
  type GammaEvent,
} from "./polymarket-internal";

async function gammaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GAMMA_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`Gamma API error ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

function normalizeMarket(m: GammaMarket): FlippableMarket | null {
  const labels = parseJsonArray<string>(m.outcomes);
  const prices = parseJsonArray<string>(m.outcomePrices).map((s) => Number(s));
  if (labels.length < 2 || prices.length < 2) return null;
  if (m.closed === true) return null;

  return {
    id: m.id,
    slug: m.slug,
    question: m.question,
    outcomes: labels.map((label, i) => ({
      label,
      probability: prices[i] ?? 0,
    })),
    endDate: m.endDate ?? "",
    volume24h: m.volume24hr ?? 0,
    url: `${POLYMARKET_BASE}/market/${m.slug}`,
    parentEvent: m.events && m.events[0]
      ? { slug: m.events[0].slug, question: m.events[0].title }
      : undefined,
  };
}

export async function getMarketBySlug(
  slug: string,
  init?: RequestInit
): Promise<FlippableMarket | null> {
  const list = await gammaFetch<GammaMarket[]>(
    `/markets?slug=${encodeURIComponent(slug)}`,
    init
  );
  if (!Array.isArray(list) || list.length === 0) return null;
  return normalizeMarket(list[0]);
}
```

- [ ] **Step 5: Run test (expect PASS)**

```bash
npx vitest run tests/polymarket.test.ts
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/polymarket.ts lib/polymarket-internal.ts tests/polymarket.test.ts
git commit -m "Add Polymarket Gamma client: getMarketBySlug + normalization"
```

---

### Task 11: `lib/polymarket.ts` — fetch a multi-outcome event

**Files:**
- Modify: `lib/polymarket.ts`, `tests/polymarket.test.ts`

- [ ] **Step 1: Add the failing test for `getEventBySlug`**

Append to `tests/polymarket.test.ts`:

```ts
import { getEventBySlug } from "@/lib/polymarket";

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
});
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/polymarket.test.ts
```

- [ ] **Step 3: Add `getEventBySlug` to `lib/polymarket.ts`**

Append to `lib/polymarket.ts`:

```ts
function normalizeEvent(e: GammaEvent): ParentEvent | null {
  if (e.closed === true) return null;
  const subMarkets = e.markets
    .map((m) => {
      const prices = parseJsonArray<string>(m.outcomePrices).map(Number);
      const yesProbability = prices[0] ?? 0;
      return m.closed === true
        ? null
        : { slug: m.slug, question: m.question, yesProbability };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.yesProbability - a.yesProbability);

  return {
    slug: e.slug,
    question: e.title,
    endDate: e.endDate ?? "",
    url: `${POLYMARKET_BASE}/event/${e.slug}`,
    subMarkets,
  };
}

export async function getEventBySlug(
  slug: string,
  init?: RequestInit
): Promise<ParentEvent | null> {
  const list = await gammaFetch<GammaEvent[]>(
    `/events?slug=${encodeURIComponent(slug)}`,
    init
  );
  if (!Array.isArray(list) || list.length === 0) return null;
  return normalizeEvent(list[0]);
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/polymarket.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/polymarket.ts tests/polymarket.test.ts
git commit -m "Add getEventBySlug for multi-outcome event normalization"
```

---

### Task 12: `lib/polymarket.ts` — trending list + search

**Files:**
- Modify: `lib/polymarket.ts`, `tests/polymarket.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `tests/polymarket.test.ts`:

```ts
import { getTrendingMarkets, searchMarkets } from "@/lib/polymarket";

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
  it("normalizes search results, filtering closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { ...sampleGammaMarket, slug: "fed", question: "Fed rates?" },
        ],
      })) as unknown as typeof fetch
    );

    const results = await searchMarkets("fed");
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe("fed");
  });

  it("returns [] for empty query", async () => {
    expect(await searchMarkets("")).toEqual([]);
    expect(await searchMarkets("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/polymarket.test.ts
```

- [ ] **Step 3: Implement `getTrendingMarkets` and `searchMarkets`**

Append to `lib/polymarket.ts`:

```ts
export async function getTrendingMarkets(
  limit = 12,
  init?: RequestInit
): Promise<FlippableMarket[]> {
  // Gamma supports `?active=true&closed=false&order=volume24hr&ascending=false&limit=N`
  const url =
    `/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${limit}`;
  const list = await gammaFetch<GammaMarket[]>(url, init);
  return list
    .map(normalizeMarket)
    .filter((m): m is FlippableMarket => m !== null)
    .slice(0, limit);
}

export async function searchMarkets(
  query: string,
  init?: RequestInit
): Promise<FlippableMarket[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const url =
    `/markets?active=true&closed=false&q=${encodeURIComponent(q)}&limit=20`;
  const list = await gammaFetch<GammaMarket[]>(url, init);
  return list
    .map(normalizeMarket)
    .filter((m): m is FlippableMarket => m !== null);
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/polymarket.test.ts
```

Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/polymarket.ts tests/polymarket.test.ts
git commit -m "Add getTrendingMarkets and searchMarkets to Polymarket client"
```

---

### Task 13: `lib/polymarket.ts` — resolve a Polymarket URL → slug

**Files:**
- Modify: `lib/polymarket.ts`, `tests/polymarket.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `tests/polymarket.test.ts`:

```ts
import { resolvePolymarketUrl } from "@/lib/polymarket";

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
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/polymarket.test.ts
```

- [ ] **Step 3: Implement `resolvePolymarketUrl`**

Append to `lib/polymarket.ts`:

```ts
export function resolvePolymarketUrl(input: string): ResolvedSlug | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "polymarket.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [type, slug] = segments;
  if (type === "market") return { kind: "market", slug };
  if (type === "event") return { kind: "event", slug };
  return null;
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/polymarket.test.ts
```

Expected: 15 passed (cumulative).

- [ ] **Step 5: Commit**

```bash
git add lib/polymarket.ts tests/polymarket.test.ts
git commit -m "Add resolvePolymarketUrl for paste-URL flow"
```

---

## Phase 4 — API routes

### Task 14: `/api/markets/trending` route

**Files:**
- Create: `app/api/markets/trending/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// app/api/markets/trending/route.ts
import { NextResponse } from "next/server";
import { getTrendingMarkets } from "@/lib/polymarket";

export const revalidate = 60;

export async function GET() {
  try {
    const markets = await getTrendingMarkets(12, { next: { revalidate: 60 } });
    return NextResponse.json({ markets });
  } catch (err) {
    console.error("trending route error:", err);
    return NextResponse.json(
      { markets: [], error: "upstream_failure" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Smoke test the route**

Run the dev server in a separate terminal:

```bash
npm run dev
```

Then in this shell:

```bash
curl -s http://localhost:3000/api/markets/trending | head -c 800
```

Expected: a JSON object with a `markets` array of up to 12 items, each containing `slug`, `question`, `outcomes`, etc. If Polymarket is down, you'll see `{"markets":[],"error":"upstream_failure"}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/markets/trending/route.ts
git commit -m "Add /api/markets/trending route (60s edge cache)"
```

---

### Task 15: `/api/markets/[slug]` route (live, no cache)

**Files:**
- Create: `app/api/markets/[slug]/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// app/api/markets/[slug]/route.ts
import { NextResponse } from "next/server";
import { getMarketBySlug, getEventBySlug } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  try {
    const market = await getMarketBySlug(slug, { cache: "no-store" });
    if (market) return NextResponse.json({ kind: "market", market });

    const event = await getEventBySlug(slug, { cache: "no-store" });
    if (event) return NextResponse.json({ kind: "event", event });

    return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (err) {
    console.error(`[slug] route error for ${slug}:`, err);
    return NextResponse.json({ error: "upstream_failure" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Smoke test**

Find a known live market slug from `/api/markets/trending` and:

```bash
curl -s http://localhost:3000/api/markets/<some-slug> | head -c 500
```

Expected: `{"kind":"market","market":{...}}` or `{"kind":"event","event":{...}}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/markets/\[slug\]/route.ts
git commit -m "Add /api/markets/[slug] route resolving market or event"
```

---

### Task 16: `/api/markets/search` route

**Files:**
- Create: `app/api/markets/search/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// app/api/markets/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchMarkets } from "@/lib/polymarket";

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    const results = await searchMarkets(q, { next: { revalidate: 30 } });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("search route error:", err);
    return NextResponse.json(
      { results: [], error: "upstream_failure" },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 2: Smoke test**

```bash
curl -s "http://localhost:3000/api/markets/search?q=fed" | head -c 500
```

- [ ] **Step 3: Commit**

```bash
git add app/api/markets/search/route.ts
git commit -m "Add /api/markets/search route (30s edge cache)"
```

---

### Task 17: `/api/markets/resolve-url` route

**Files:**
- Create: `app/api/markets/resolve-url/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// app/api/markets/resolve-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { resolvePolymarketUrl } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const url = (body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "missing_url" }, { status: 400 });

  const resolved = resolvePolymarketUrl(url);
  if (!resolved) {
    return NextResponse.json({ error: "unrecognized_url" }, { status: 400 });
  }

  return NextResponse.json({
    kind: resolved.kind,
    slug: resolved.slug,
    redirect: `/m/${resolved.slug}`,
  });
}
```

- [ ] **Step 2: Smoke test**

```bash
curl -s -X POST http://localhost:3000/api/markets/resolve-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://polymarket.com/market/fed-rates-june-2026"}'
```

Expected: `{"kind":"market","slug":"fed-rates-june-2026","redirect":"/m/fed-rates-june-2026"}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/markets/resolve-url/route.ts
git commit -m "Add /api/markets/resolve-url for paste-URL flow"
```

---

## Phase 5 — Analytics & PostHog

### Task 18: PostHog provider + typed event helpers

**Files:**
- Create: `lib/posthog.ts`, `app/providers.tsx`, `.env.example`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create `.env.example`**

```
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Note: also create a local `.env.local` mirroring `.env.example` and fill in your PostHog key. Do not commit `.env.local` (already gitignored).

- [ ] **Step 2: Create `lib/posthog.ts` with typed events**

```ts
// lib/posthog.ts
import posthog from "posthog-js";

export type AnalyticsEvent =
  | { name: "home_viewed"; props?: Record<string, never> }
  | { name: "market_searched"; props: { query: string } }
  | { name: "market_url_pasted"; props: { host: string; valid: boolean } }
  | { name: "market_viewed"; props: { slug: string; source: "trending" | "search" | "paste" | "direct" } }
  | { name: "flip_executed"; props: { slug: string; outcome: "YES" | "NO"; implied_probability: number } }
  | { name: "simulation_run"; props: { slug: string; n: number; observed_yes_count: number } }
  | { name: "result_shared"; props: { slug: string; mode: "single" | "sim" } }
  | { name: "flip_again_clicked"; props: { slug: string } };

export function track<E extends AnalyticsEvent>(event: E): void {
  if (typeof window === "undefined") return;
  posthog.capture(event.name, event.props as Record<string, unknown>);
}
```

- [ ] **Step 3: Create `app/providers.tsx`**

```tsx
// app/providers.tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (posthog.__loaded) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      autocapture: true,
      person_profiles: "identified_only",
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

- [ ] **Step 4: Install `posthog-js/react` peer (already a sub-export of `posthog-js`, no additional install)**

Verify by running:

```bash
npm ls posthog-js
```

- [ ] **Step 5: Wrap the app in `<Providers>` in `app/layout.tsx`**

Open `app/layout.tsx` and modify it:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MarketFlip",
  description: "Take a Polymarket market. Flip a weighted coin. See what the odds were saying.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the dev server still starts**

```bash
npm run dev
```

Open http://localhost:3000. Expected: no console errors. Without a PostHog key set, `posthog.init` is skipped and the app behaves normally.

- [ ] **Step 7: Commit**

```bash
git add lib/posthog.ts app/providers.tsx app/layout.tsx .env.example
git commit -m "Wire up PostHog provider and typed track() helper"
```

---

## Phase 6 — Components (TDD where it pays)

### Task 19: `<CoinFlip>` component (logic, no animation yet)

**Files:**
- Create: `tests/components/CoinFlip.test.tsx`, `components/CoinFlip.tsx`

- [ ] **Step 1: Write the failing test**

`tests/components/CoinFlip.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CoinFlip } from "@/components/CoinFlip";

describe("<CoinFlip>", () => {
  it("renders the question and odds", () => {
    render(
      <CoinFlip
        slug="x"
        question="Will the Fed cut rates?"
        yesProbability={0.56}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
      />
    );
    expect(screen.getByText(/Will the Fed cut rates/)).toBeInTheDocument();
    expect(screen.getByText(/56%/)).toBeInTheDocument();
  });

  it("clicking Flip reveals a result and calls onFlipComplete", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        question="Q?"
        yesProbability={1} // forces YES
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    const button = screen.getByRole("button", { name: /flip/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByText(/YES/i)).toBeInTheDocument();
    expect(onFlipComplete).toHaveBeenCalledWith("YES");
  });

  it("p=0 always lands NO", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        question="Q?"
        yesProbability={0}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /flip/i }));
    });
    expect(onFlipComplete).toHaveBeenCalledWith("NO");
  });
});
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/components/CoinFlip.test.tsx
```

- [ ] **Step 3: Implement `components/CoinFlip.tsx` (logic, no animation)**

```tsx
// components/CoinFlip.tsx
"use client";

import { useState } from "react";
import { flip } from "@/lib/flip";
import type { FlipOutcome } from "@/lib/types";

export type CoinFlipProps = {
  slug: string;
  question: string;
  yesProbability: number; // [0,1]
  outcomeYesLabel: string;
  outcomeNoLabel: string;
  /** Total flip animation duration. 0 means instant (used in tests). */
  flipDurationMs?: number;
  onFlipComplete?: (outcome: FlipOutcome) => void;
};

type Phase = "idle" | "flipping" | "revealed";

export function CoinFlip(props: CoinFlipProps) {
  const {
    question,
    yesProbability,
    outcomeYesLabel,
    outcomeNoLabel,
    flipDurationMs = 1900,
    onFlipComplete,
  } = props;

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<FlipOutcome | null>(null);

  const handleFlip = () => {
    if (phase === "flipping") return;
    const outcome = flip(yesProbability);
    setResult(outcome);
    setPhase("flipping");
    setTimeout(() => {
      setPhase("revealed");
      onFlipComplete?.(outcome);
    }, flipDurationMs);
  };

  const yesPct = Math.round(yesProbability * 100);
  const noPct = 100 - yesPct;
  const shownLabel =
    result === "YES" ? outcomeYesLabel : result === "NO" ? outcomeNoLabel : "";

  return (
    <section className="flex flex-col items-center text-center gap-4 py-6">
      <h1 className="text-2xl font-bold">{question}</h1>
      <div className="flex gap-2 text-sm">
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
          {outcomeYesLabel} {yesPct}%
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-800">
          {outcomeNoLabel} {noPct}%
        </span>
      </div>
      <Coin phase={phase} result={result} />
      {phase === "revealed" && result ? (
        <p className="text-xl font-semibold">
          {result === "YES" ? "🎉" : "🚨"} {result} ({shownLabel})
        </p>
      ) : null}
      <button
        onClick={handleFlip}
        disabled={phase === "flipping"}
        className="rounded-md bg-zinc-900 px-5 py-2 font-semibold text-white disabled:opacity-50"
      >
        {phase === "idle" ? "Flip the coin" : phase === "flipping" ? "Flipping…" : "Flip again"}
      </button>
    </section>
  );
}

function Coin({ phase, result }: { phase: Phase; result: FlipOutcome | null }) {
  return (
    <div
      data-phase={phase}
      data-result={result ?? ""}
      className="h-28 w-28 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-md flex items-center justify-center text-3xl font-extrabold text-white"
      style={{
        transition: "transform 1.2s ease-out",
        transform: phase === "flipping" ? "rotateY(1080deg)" : "rotateY(0deg)",
      }}
    >
      {phase === "revealed" && result ? (result === "YES" ? "Y" : "N") : "?"}
    </div>
  );
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/components/CoinFlip.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add components/CoinFlip.tsx tests/components/CoinFlip.test.tsx
git commit -m "Add CoinFlip component with flip-and-reveal phases"
```

---

### Task 20: `<SimulationPanel>` component

**Files:**
- Create: `tests/components/SimulationPanel.test.tsx`, `components/SimulationPanel.tsx`

- [ ] **Step 1: Write the failing test**

`tests/components/SimulationPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SimulationPanel } from "@/components/SimulationPanel";

describe("<SimulationPanel>", () => {
  it("renders nothing before run is clicked", () => {
    render(
      <SimulationPanel
        slug="x"
        question="Q?"
        yesProbability={0.5}
      />
    );
    expect(screen.queryByText(/observed/i)).not.toBeInTheDocument();
  });

  it("running 100 sims renders observed/implied bars", () => {
    render(
      <SimulationPanel
        slug="x"
        question="Q?"
        yesProbability={0.5}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /run 100/i }));
    expect(screen.getByText(/Implied:/i)).toBeInTheDocument();
    expect(screen.getByText(/Observed:/i)).toBeInTheDocument();
  });

  it("calls onSimulationComplete with the result", () => {
    const onComplete = vi.fn();
    render(
      <SimulationPanel
        slug="x"
        question="Q?"
        yesProbability={1} // every flip yes
        onSimulationComplete={onComplete}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /run 100/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const arg = onComplete.mock.calls[0][0];
    expect(arg.n).toBe(100);
    expect(arg.yesCount).toBe(100);
  });
});
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/components/SimulationPanel.test.tsx
```

- [ ] **Step 3: Implement `components/SimulationPanel.tsx`**

```tsx
// components/SimulationPanel.tsx
"use client";

import { useState } from "react";
import { simulate } from "@/lib/simulate";
import type { SimResult } from "@/lib/types";

type Props = {
  slug: string;
  question: string;
  yesProbability: number;
  onSimulationComplete?: (r: SimResult) => void;
};

const PRESETS = [100, 1000, 10000] as const;

export function SimulationPanel({
  yesProbability,
  onSimulationComplete,
}: Props) {
  const [result, setResult] = useState<SimResult | null>(null);

  const handleRun = (n: number) => {
    const r = simulate(yesProbability, n);
    setResult(r);
    onSimulationComplete?.(r);
  };

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-6">
      <div className="flex gap-2">
        {PRESETS.map((n) => (
          <button
            key={n}
            onClick={() => handleRun(n)}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium hover:bg-zinc-100"
          >
            Run {n.toLocaleString()}
          </button>
        ))}
      </div>
      {result ? <Distribution r={result} /> : null}
      {result ? <Education r={result} /> : null}
    </div>
  );
}

function Distribution({ r }: { r: SimResult }) {
  const yesPct = (r.yesCount / r.n) * 100;
  return (
    <div className="rounded-md border border-zinc-200 p-3">
      <div className="h-6 w-full overflow-hidden rounded bg-zinc-200 flex">
        <div className="bg-emerald-600" style={{ width: `${yesPct}%` }} />
        <div className="bg-rose-600 grow" />
      </div>
      <div className="mt-2 flex justify-between text-xs font-mono text-zinc-700">
        <span>YES {r.yesCount.toLocaleString()}</span>
        <span>
          Implied: {Math.round(r.impliedProbability * 100)}% · Observed:{" "}
          {(r.observedProbability * 100).toFixed(1)}%
        </span>
        <span>NO {r.noCount.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Education({ r }: { r: SimResult }) {
  const p = r.impliedProbability;
  const closeToFifty = Math.abs(p - 0.5) < 0.1;
  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm leading-relaxed">
      <p className="text-xs uppercase tracking-wider font-semibold text-amber-800">
        What this means
      </p>
      <p className="mt-1">
        The market said YES <strong>{Math.round(p * 100)}%</strong> of the time.{" "}
        {closeToFifty
          ? "That's barely better than a coin — outcomes near 50/50 mean the market isn't strongly committed either way."
          : `Out of ${r.n.toLocaleString()} flips, ${r.yesCount.toLocaleString()} landed YES (${(r.observedProbability * 100).toFixed(1)}%). As n grows, observed converges toward implied.`}
        {" "}A 90/10 market is strongly committed; being wrong there is a real signal.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/components/SimulationPanel.test.tsx
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add components/SimulationPanel.tsx tests/components/SimulationPanel.test.tsx
git commit -m "Add SimulationPanel with distribution bar and education card"
```

---

### Task 21: `<MarketCard>` (server component)

**Files:**
- Create: `components/MarketCard.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/MarketCard.tsx
import Link from "next/link";
import type { FlippableMarket } from "@/lib/types";

export function MarketCard({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const yesPct = Math.round((yes?.probability ?? 0) * 100);
  const noPct = 100 - yesPct;

  return (
    <Link
      href={`/m/${market.slug}`}
      className="block rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 transition"
    >
      <p className="font-semibold text-sm leading-snug line-clamp-3">
        {market.question}
      </p>
      <div className="mt-2 flex gap-2 text-xs">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
          {yes?.label ?? "Y"} {yesPct}%
        </span>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-800">
          {no?.label ?? "N"} {noPct}%
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/MarketCard.tsx
git commit -m "Add MarketCard server component for trending/search lists"
```

---

### Task 22: `<TrendingGrid>` and `<StaleBanner>` (server components)

**Files:**
- Create: `components/TrendingGrid.tsx`, `components/StaleBanner.tsx`

- [ ] **Step 1: Implement `components/TrendingGrid.tsx`**

```tsx
// components/TrendingGrid.tsx
import { getTrendingMarkets } from "@/lib/polymarket";
import { MarketCard } from "./MarketCard";
import { StaleBanner } from "./StaleBanner";

export const revalidate = 60;

export async function TrendingGrid() {
  let markets;
  let stale = false;
  try {
    markets = await getTrendingMarkets(12, { next: { revalidate: 60 } });
  } catch {
    markets = [];
    stale = true;
  }

  if (markets.length === 0) {
    return (
      <div className="rounded-md border border-zinc-200 p-6 text-center text-sm text-zinc-500">
        No live markets right now. Try again in a minute.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stale ? <StaleBanner /> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {markets.map((m) => (
          <MarketCard key={m.slug} market={m} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement `components/StaleBanner.tsx`**

```tsx
// components/StaleBanner.tsx
export function StaleBanner() {
  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
      Showing recent results — Polymarket is currently unreachable.
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/TrendingGrid.tsx components/StaleBanner.tsx
git commit -m "Add TrendingGrid (server) with StaleBanner fallback"
```

---

### Task 23: `<PasteUrlInput>` (client component)

**Files:**
- Create: `tests/components/PasteUrlInput.test.tsx`, `components/PasteUrlInput.tsx`

- [ ] **Step 1: Write the failing test**

`tests/components/PasteUrlInput.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasteUrlInput } from "@/components/PasteUrlInput";

describe("<PasteUrlInput>", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an input and submit button", () => {
    render(<PasteUrlInput />);
    expect(screen.getByPlaceholderText(/paste a polymarket url/i)).toBeInTheDocument();
  });

  it("posts to /api/markets/resolve-url and surfaces an error for unrecognized URLs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: "unrecognized_url" }),
      })) as unknown as typeof fetch
    );
    render(<PasteUrlInput />);
    const input = screen.getByPlaceholderText(/paste a polymarket url/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "https://kalshi.com/foo" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/Polymarket URL/i)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test (expect FAIL)**

```bash
npx vitest run tests/components/PasteUrlInput.test.tsx
```

- [ ] **Step 3: Implement `components/PasteUrlInput.tsx`**

```tsx
// components/PasteUrlInput.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/posthog";

export function PasteUrlInput() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/markets/resolve-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const host = (() => {
        try {
          return new URL(value).hostname;
        } catch {
          return "invalid";
        }
      })();
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        track({
          name: "market_url_pasted",
          props: { host, valid: false },
        });
        if (data.error === "unrecognized_url") {
          setError("We only support Polymarket URLs in v1. Try a polymarket.com link.");
        } else {
          setError("Couldn't parse that URL — make sure it's a Polymarket market or event link.");
        }
        return;
      }
      const data = (await res.json()) as { redirect: string };
      track({ name: "market_url_pasted", props: { host, valid: true } });
      router.push(data.redirect);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a Polymarket URL…"
          aria-label="Polymarket URL"
          className="grow rounded-md border-2 border-zinc-900 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Go
        </button>
      </div>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
```

- [ ] **Step 4: Run test (expect PASS)**

```bash
npx vitest run tests/components/PasteUrlInput.test.tsx
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add components/PasteUrlInput.tsx tests/components/PasteUrlInput.test.tsx
git commit -m "Add PasteUrlInput with /resolve-url integration and error states"
```

---

### Task 24: `<SearchInput>` (client component, debounced)

**Files:**
- Create: `components/SearchInput.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/SearchInput.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlippableMarket } from "@/lib/types";
import { track } from "@/lib/posthog";

export function SearchInput() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FlippableMarket[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      track({ name: "market_searched", props: { query: q.trim() } });
      try {
        const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { results: FlippableMarket[] };
        if (!cancelled) setResults(data.results);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Search markets…"
        aria-label="Search markets"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />
      {loading ? (
        <p className="mt-2 text-xs text-zinc-500">Searching…</p>
      ) : results && results.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">No matches.</p>
      ) : results ? (
        <ul className="mt-2 space-y-1">
          {results.slice(0, 8).map((m) => (
            <li key={m.slug}>
              <Link
                href={`/m/${m.slug}`}
                className="block rounded px-2 py-1 text-sm hover:bg-zinc-100"
              >
                {m.question}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/SearchInput.tsx
git commit -m "Add SearchInput (debounced) hitting /api/markets/search"
```

---

### Task 25: `<CandidateList>` (client component, multi-outcome event)

**Files:**
- Create: `components/CandidateList.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/CandidateList.tsx
"use client";

import { useState } from "react";
import { CoinFlip } from "./CoinFlip";
import type { ParentEvent } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";
import type { FlipOutcome } from "@/lib/types";

export function CandidateList({ event }: { event: ParentEvent }) {
  const [selected, setSelected] = useState<string | null>(null);

  const sub = event.subMarkets.find((s) => s.slug === selected) ?? null;

  return (
    <div>
      <h1 className="text-xl font-bold">{event.question}</h1>
      <p className="text-sm text-zinc-500 mt-1">
        {event.subMarkets.length} candidates · pick one to flip
      </p>
      <ul className="mt-4 space-y-2">
        {event.subMarkets.map((s) => (
          <li key={s.slug}>
            <button
              onClick={() => setSelected(s.slug)}
              className={`w-full text-left rounded-md border px-3 py-2 text-sm flex justify-between items-center transition ${
                selected === s.slug
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <span className="font-semibold">{s.question}</span>
              <span className="font-mono text-zinc-600">
                {Math.round(s.yesProbability * 100)}% → flip
              </span>
            </button>
          </li>
        ))}
      </ul>
      {sub ? (
        <div className="mt-6">
          <CoinFlip
            slug={sub.slug}
            question={sub.question}
            yesProbability={sub.yesProbability}
            outcomeYesLabel="Yes"
            outcomeNoLabel="No"
            onFlipComplete={(o: FlipOutcome) => {
              track({
                name: "flip_executed",
                props: {
                  slug: sub.slug,
                  outcome: o,
                  implied_probability: sub.yesProbability,
                },
              });
              addFlipToHistory({
                slug: sub.slug,
                question: sub.question,
                outcomeLabel: sub.question,
                flippedTo: o,
                impliedProbability: sub.yesProbability,
                timestamp: Date.now(),
              });
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/CandidateList.tsx
git commit -m "Add CandidateList for multi-outcome events with sub-market flip"
```

---

### Task 26: `<ShareButton>` (client component)

**Files:**
- Create: `components/ShareButton.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/ShareButton.tsx
"use client";

import { useState } from "react";
import { track } from "@/lib/posthog";

type Props = {
  text: string;
  slug: string;
  mode: "single" | "sim";
};

export function ShareButton({ text, slug, mode }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track({ name: "result_shared", props: { slug, mode } });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium hover:bg-zinc-100"
    >
      {copied ? "Copied!" : "Share result"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ShareButton.tsx
git commit -m "Add ShareButton with clipboard copy and copied-state feedback"
```

---

### Task 27: `<RefreshOddsButton>` (client component)

**Files:**
- Create: `components/RefreshOddsButton.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/RefreshOddsButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshOddsButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onClick = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      className="text-xs text-zinc-500 hover:text-zinc-900 underline-offset-2 hover:underline disabled:opacity-60"
    >
      {refreshing ? "Refreshing…" : "Refresh odds"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/RefreshOddsButton.tsx
git commit -m "Add RefreshOddsButton (re-runs server component fetch via router.refresh)"
```

---

### Task 28: `<History>` (client component, localStorage drawer)

**Files:**
- Create: `components/History.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/History.tsx
"use client";

import { useEffect, useState } from "react";
import { readHistory, clearHistory } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

export function History({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    setEntries(readHistory().filter((e) => e.slug === slug));
  }, [open, slug]);

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline"
      >
        {open ? "Hide history" : "Show flip history for this market"}
      </button>
      {open ? (
        <div className="mt-3 rounded-md border border-zinc-200 p-3 text-sm">
          {entries.length === 0 ? (
            <p className="text-zinc-500">No flips yet for this market.</p>
          ) : (
            <ul className="space-y-1">
              {entries.map((e, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {e.flippedTo === "YES" ? "🎉" : "🚨"} {e.flippedTo}{" "}
                    <span className="text-zinc-500">— {e.outcomeLabel}</span>
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {entries.length > 0 ? (
            <button
              onClick={() => {
                clearHistory();
                setEntries([]);
              }}
              className="mt-2 text-xs text-rose-700 underline-offset-2 hover:underline"
            >
              Clear all history
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/History.tsx
git commit -m "Add History drawer reading from localStorage"
```

---

## Phase 7 — Pages

### Task 29: Home page (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Replace the scaffolded `app/page.tsx`**

```tsx
// app/page.tsx
import { Suspense } from "react";
import { TrendingGrid } from "@/components/TrendingGrid";
import { PasteUrlInput } from "@/components/PasteUrlInput";
import { SearchInput } from "@/components/SearchInput";

export const metadata = {
  title: "MarketFlip — flip a coin against a Polymarket market",
  description:
    "Take a live Polymarket market, simulate a coin flip weighted by its odds, and see what the market is actually saying.",
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold tracking-tight">🪙 MarketFlip</h1>
        <p className="text-xs text-zinc-500">trending · search</p>
      </header>

      <section className="space-y-3 mb-6">
        <PasteUrlInput />
        <SearchInput />
      </section>

      <section>
        <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
          Trending now
        </p>
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading markets…</p>}>
          <TrendingGrid />
        </Suspense>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify `globals.css` has Tailwind directives**

If `app/globals.css` does not already include the Tailwind directives, ensure it starts with:

```css
@import "tailwindcss";
```

(Next 15 + Tailwind v4 ships with this single-line import; older configs may use `@tailwind base; @tailwind components; @tailwind utilities;`.)

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Visit http://localhost:3000. Expected: header, paste-URL input, search input, "Trending now" with up to 12 cards. If Polymarket is reachable, real markets appear; if not, you see the empty/stale state.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "Build home page: paste-URL, search, and trending grid"
```

---

### Task 30: Market page (`app/m/[slug]/page.tsx`)

**Files:**
- Create: `app/m/[slug]/page.tsx`, `app/m/[slug]/not-found.tsx`

- [ ] **Step 1: Implement `app/m/[slug]/not-found.tsx`**

```tsx
// app/m/[slug]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Market not found</h1>
      <p className="mt-2 text-zinc-600 text-sm">
        That slug doesn't match any active Polymarket market or event.
      </p>
      <Link href="/" className="mt-4 inline-block text-sm underline">
        ← Back to home
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Implement `app/m/[slug]/page.tsx`**

```tsx
// app/m/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getMarketBySlug, getEventBySlug } from "@/lib/polymarket";
import { CandidateList } from "@/components/CandidateList";
import { History } from "@/components/History";
import { RefreshOddsButton } from "@/components/RefreshOddsButton";
import { MarketFlipClient } from "./MarketFlipClient";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function MarketPage({ params }: PageProps) {
  const { slug } = await params;

  const market = await getMarketBySlug(slug, { cache: "no-store" }).catch(() => null);

  if (market) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Header />
        <MarketFlipClient market={market} />
        <History slug={slug} />
      </main>
    );
  }

  const event = await getEventBySlug(slug, { cache: "no-store" }).catch(() => null);

  if (event) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Header />
        <CandidateList event={event} />
        <History slug={slug} />
      </main>
    );
  }

  notFound();
}

function Header() {
  return (
    <header className="flex items-center justify-between mb-6 text-sm">
      <Link href="/" className="text-zinc-600 hover:text-zinc-900">← Back</Link>
      <RefreshOddsButton />
    </header>
  );
}
```

- [ ] **Step 3: Implement `app/m/[slug]/MarketFlipClient.tsx` (client wrapper that wires CoinFlip + sim + share + history)**

```tsx
// app/m/[slug]/MarketFlipClient.tsx
"use client";

import { useState } from "react";
import { CoinFlip } from "@/components/CoinFlip";
import { SimulationPanel } from "@/components/SimulationPanel";
import { ShareButton } from "@/components/ShareButton";
import type { FlippableMarket, FlipOutcome, SimResult } from "@/lib/types";
import { track } from "@/lib/posthog";
import { addFlipToHistory } from "@/lib/storage";
import { formatSingleFlipShare, formatSimulationShare } from "@/lib/share";

export function MarketFlipClient({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const [lastFlip, setLastFlip] = useState<FlipOutcome | null>(null);
  const [lastSim, setLastSim] = useState<SimResult | null>(null);

  const yesProbability = yes?.probability ?? 0;
  const url = typeof window !== "undefined" ? window.location.href : market.url;

  return (
    <>
      <CoinFlip
        slug={market.slug}
        question={market.question}
        yesProbability={yesProbability}
        outcomeYesLabel={yes?.label ?? "Yes"}
        outcomeNoLabel={no?.label ?? "No"}
        onFlipComplete={(o) => {
          setLastFlip(o);
          track({
            name: "flip_executed",
            props: {
              slug: market.slug,
              outcome: o,
              implied_probability: yesProbability,
            },
          });
          addFlipToHistory({
            slug: market.slug,
            question: market.question,
            outcomeLabel: o === "YES" ? yes?.label ?? "Yes" : no?.label ?? "No",
            flippedTo: o,
            impliedProbability: yesProbability,
            timestamp: Date.now(),
          });
        }}
      />

      {lastFlip ? (
        <div className="mt-4 flex justify-center">
          <ShareButton
            slug={market.slug}
            mode="single"
            text={formatSingleFlipShare({
              question: market.question,
              yesProbability,
              flipped: lastFlip,
              url,
            })}
          />
        </div>
      ) : null}

      <SimulationPanel
        slug={market.slug}
        question={market.question}
        yesProbability={yesProbability}
        onSimulationComplete={(r) => {
          setLastSim(r);
          track({
            name: "simulation_run",
            props: {
              slug: market.slug,
              n: r.n,
              observed_yes_count: r.yesCount,
            },
          });
        }}
      />

      {lastSim ? (
        <div className="mt-4 flex justify-center">
          <ShareButton
            slug={market.slug}
            mode="sim"
            text={formatSimulationShare({
              question: market.question,
              yesProbability,
              n: lastSim.n,
              yesCount: lastSim.yesCount,
              noCount: lastSim.noCount,
              url,
            })}
          />
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Visit http://localhost:3000, click a trending card, verify:
- Market page renders question, odds, coin
- Click "Flip the coin" → animation plays → result shown → share button appears
- Click "Run 1,000" → distribution + education renders → share button appears
- Click "Show flip history for this market" → past flips listed
- Click "Refresh odds" → page re-fetches without full reload

For multi-outcome events, paste a URL like `https://polymarket.com/event/<slug>` and verify candidate list renders.

- [ ] **Step 5: Commit**

```bash
git add "app/m/[slug]/page.tsx" "app/m/[slug]/not-found.tsx" "app/m/[slug]/MarketFlipClient.tsx"
git commit -m "Build market page: binary flip, multi-outcome candidates, sim, share, history"
```

---

## Phase 8 — Analytics polish & PostHog dashboards

### Task 31: Capture `home_viewed` and `market_viewed`

**Files:**
- Create: `components/PageViewTracker.tsx`
- Modify: `app/page.tsx`, `app/m/[slug]/MarketFlipClient.tsx`

- [ ] **Step 1: Create `components/PageViewTracker.tsx`**

```tsx
// components/PageViewTracker.tsx
"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/posthog";

export function PageViewTracker({ event }: { event: AnalyticsEvent }) {
  useEffect(() => {
    track(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
```

- [ ] **Step 2: Add `<PageViewTracker>` to home page**

In `app/page.tsx`, add inside `<main>`:

```tsx
import { PageViewTracker } from "@/components/PageViewTracker";

// inside the JSX:
<PageViewTracker event={{ name: "home_viewed" }} />
```

- [ ] **Step 3: Add `<PageViewTracker>` to market client wrapper**

In `app/m/[slug]/MarketFlipClient.tsx`, add at the top of returned JSX:

```tsx
import { PageViewTracker } from "@/components/PageViewTracker";

// inside the returned fragment:
<PageViewTracker event={{ name: "market_viewed", props: { slug: market.slug, source: "direct" } }} />
```

(Source is "direct" for now — refining attribution by referrer is post-v1.)

- [ ] **Step 4: Commit**

```bash
git add components/PageViewTracker.tsx app/page.tsx "app/m/[slug]/MarketFlipClient.tsx"
git commit -m "Track home_viewed and market_viewed via PageViewTracker"
```

---

## Phase 9 — E2E test

### Task 32: Playwright happy-path

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Create `playwright.config.ts`**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 2: Create `tests/e2e/happy-path.spec.ts`**

Note: this test mocks the Gamma API so it doesn't depend on Polymarket being reachable.

```ts
// tests/e2e/happy-path.spec.ts
import { test, expect } from "@playwright/test";

const TRENDING = [
  {
    id: "1",
    slug: "fed-rates-test",
    question: "Will the Fed cut rates in June?",
    outcomes: '["Yes","No"]',
    outcomePrices: '["0.56","0.44"]',
    endDate: "2026-06-15T00:00:00Z",
    volume24hr: 12345,
    active: true,
    closed: false,
    events: [],
  },
];

test("home → market → flip → simulate", async ({ page }) => {
  await page.route("**/gamma-api.polymarket.com/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/markets?slug=fed-rates-test")) {
      return route.fulfill({ status: 200, body: JSON.stringify(TRENDING) });
    }
    if (url.includes("/markets")) {
      return route.fulfill({ status: 200, body: JSON.stringify(TRENDING) });
    }
    return route.fulfill({ status: 200, body: "[]" });
  });

  await page.goto("/");
  await expect(page.getByText("Trending now")).toBeVisible();
  await page.getByText("Will the Fed cut rates in June?").first().click();

  await expect(page.getByRole("heading", { name: /Will the Fed cut rates/ })).toBeVisible();

  await page.getByRole("button", { name: /flip the coin/i }).click();
  await expect(page.getByText(/(YES|NO)/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: /share result/i })).toBeVisible();

  await page.getByRole("button", { name: /run 1,000/i }).click();
  await expect(page.getByText(/Implied:/)).toBeVisible();
  await expect(page.getByText(/Observed:/)).toBeVisible();
});
```

- [ ] **Step 3: Run the E2E**

```bash
npm run test:e2e
```

Expected: 1 passed.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/happy-path.spec.ts
git commit -m "Add Playwright happy-path test (Gamma API mocked at network layer)"
```

---

## Phase 10 — Final polish

### Task 33: Update README and run full test suite

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` content**

```md
# MarketFlip

Take a live Polymarket market, read its current implied probabilities, and flip a virtual coin weighted by those odds. The single dramatic flip is the entertainment hook; running 1,000 simulations with an inline education panel is the substance.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind
- Vercel (edge cache for trending; live fetch for individual markets)
- PostHog (client-side analytics)
- Polymarket Gamma API (no auth required)

## Local development

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_POSTHOG_KEY (or leave blank for analytics-disabled local runs)

npm install
npm run dev          # http://localhost:3000
```

## Tests

```bash
npm test             # Vitest unit + component tests
npm run test:e2e     # Playwright (mocks Polymarket at the network layer)
```

## Deploy

Push to `main` triggers a Vercel deploy. Set `NEXT_PUBLIC_POSTHOG_KEY` in Vercel project settings.

## Spec & plan

- Design spec: [`docs/superpowers/specs/2026-05-09-marketflip-design.md`](docs/superpowers/specs/2026-05-09-marketflip-design.md)
- v1 plan: [`docs/superpowers/plans/2026-05-09-marketflip-v1.md`](docs/superpowers/plans/2026-05-09-marketflip-v1.md)
```

- [ ] **Step 2: Run the full test suite**

```bash
npm test && npm run test:e2e && npm run build
```

Expected: all unit and component tests pass, Playwright E2E passes, production build succeeds.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "Update README with local dev and test instructions"
git push
```

---

## Done.

v1 is shippable: home with paste-URL/search/trending, binary and multi-outcome market pages, weighted flip with reveal animation, simulation with distribution + education, Wordle-style share, localStorage history, PostHog instrumentation, mocked-network E2E.

Deploy by connecting the GitHub repo to Vercel and setting `NEXT_PUBLIC_POSTHOG_KEY`.

### Roadmap (out of scope for v1)

- v2 — Multi-outcome weighted wheel UI
- v2+ — Kalshi, Manifold, PredictIt
- v2+ — OG image generation
- v2+ — "Hall of Fame / Famous Misses" curated resolved-market gallery
