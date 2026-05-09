# MarketFlip — Design Spec

**Status:** Draft
**Date:** 2026-05-09
**Author:** Noah Landesberg

---

## What it is

MarketFlip takes a live Polymarket market, reads its current implied probabilities, and lets users simulate a single weighted coin flip — or run thousands of simulated flips — to see what the market is "saying" probabilistically. The single flip is the entertainment hook; the simulation panel is the educational payoff.

## Goals

- Make implied probabilities feel concrete by acting them out as coin flips.
- Be entertaining enough to share, substantive enough to teach.
- Ship a working v1 against a single platform (Polymarket) before generalizing.

## Non-goals (v1)

- Real money, accounts, or any wagering features.
- Multi-platform aggregation (Kalshi, PredictIt, Manifold are out for v1).
- Resolved-market history or "the market was wrong" features.
- Multi-outcome wheel/spinner UI (planned for v2; data model must not preclude it).
- Server-side persistence of user data.

---

## User experience

### Three primary surfaces

1. **Home (`/`)** — three stacked entry points, ordered by user intent:
   1. Paste-a-Polymarket-URL input
   2. Search bar
   3. "Trending now" grid of ~12 market cards (server-rendered, edge-cached 60s)

2. **Market page (`/m/[slug]`)** —
   - Binary markets: question, current odds, big coin, "Flip" CTA.
   - Multi-outcome events: question, list of candidate sub-markets; user picks one to flip on.
   - After a flip: result with two follow-up CTAs — "Flip Again" (single) and "Run 1,000 Simulations" (distribution + education).
   - Simulation expands inline with a YES/NO bar, observed vs implied probability, and an education card.
   - "Refresh odds" button hits live API to grab updated prices without page reload.

3. **Local flip history** — surfaced as a sidebar/drawer on the market page (rendered from `localStorage`), not a separate route.

### Single-flip animation

- Phase 1 — charge-up (~300ms): coin starts spinning, page subtly dims.
- Phase 2 — spin (~1.2s): fast `rotateY` on a 3D-transformed div with two faces.
- Phase 3 — land (~400ms): rotation lands on the resulting face, small bounce.
- Total ~1.9s. Result is computed before the animation starts; animation is theater.
- CSS transforms only — no animation library.

### Sharing

Wordle-style copy-text via `navigator.clipboard.writeText()`. No image generation in v1.

Single flip:
```
🪙 MarketFlip
"Will the Fed cut rates in June?"
Market said: 56% YES
I flipped: 🚨 NO
marketflip.app/m/fed-rates-june-2026
```

Simulation:
```
🪙 MarketFlip — 1,000 sims
"Will the Fed cut rates in June?"
Implied: 56% · Observed: 56.2%
YES 562 · NO 438
marketflip.app/m/fed-rates-june-2026
```

### Education panel content (sketch — copy fine-tuned during implementation)

Three short sections shown after a simulation completes:
1. What "the market thinks 56% Yes" actually means (implied probability).
2. Your simulation said Yes 562/1,000 times — observed frequency converges to implied probability as n grows.
3. Calibration intuition: 50/50 markets are barely "saying" anything; 90/10 markets are strongly committed and being wrong is meaningful.

---

## Architecture

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · React Server Components · Vercel.

**Approach:** Server-rendered with edge cache for hot reads (chosen over static-first and DB-cached alternatives for v1 simplicity + fast first paint).

### Pages

| Route | Type | Caching |
|---|---|---|
| `/` | Server component | Trending block edge-cached 60s |
| `/m/[slug]` | Server component | No cache (live odds on every load) |

The `/m/[slug]` route accepts either a market slug (binary) or an event slug (multi-outcome). `lib/polymarket.ts` resolves the slug to one of two shapes — a single `FlippableMarket` or a `ParentEvent` containing sub-markets — and the page renders the appropriate component (binary coin vs candidate list).

### API routes

| Route | Purpose | Caching |
|---|---|---|
| `GET /api/markets/trending` | Top ~12 active markets by 24h volume | Edge cache, 60s revalidate, SWR |
| `GET /api/markets/search?q=...` | Search Polymarket markets | Edge cache by query, 30s revalidate |
| `GET /api/markets/[slug]` | Live odds for one market | `cache: 'no-store'` |
| `POST /api/markets/resolve-url` | Validate + resolve a Polymarket URL → slug | Not cached |

### Module layout

```
app/
  page.tsx                    # Home
  m/[slug]/page.tsx           # Market page
  api/markets/
    trending/route.ts
    search/route.ts
    [slug]/route.ts
    resolve-url/route.ts
  providers.tsx               # PostHog provider
lib/
  polymarket.ts               # All external API calls
  flip.ts                     # Pure: flip(p) -> "YES"|"NO"
  simulate.ts                 # Pure: simulate(p, n) -> SimResult
  share.ts                    # Format share strings
  storage.ts                  # localStorage history wrapper
  types.ts                    # FlippableMarket, Outcome, SimResult, ...
components/
  CoinFlip.tsx                # Animation + result state (client)
  MarketCard.tsx              # Used in trending grid
  CandidateList.tsx           # Multi-outcome event view
  SimulationPanel.tsx         # Distribution bar + education
  ShareButton.tsx
  History.tsx                 # localStorage drawer
  RefreshOddsButton.tsx
tests/
  flip.test.ts
  simulate.test.ts
  share.test.ts
  e2e/happy-path.spec.ts      # Playwright
```

### Data model

```ts
type FlippableMarket = {
  id: string;
  slug: string;
  question: string;
  outcomes: Outcome[];        // length 2 for binary; >2 reserved for v2 wheel
  endDate: string;
  volume24h: number;
  url: string;                // canonical Polymarket URL
  parentEvent?: ParentEvent;  // present when this is a sub-market of a multi-outcome event
};

type Outcome = {
  label: string;              // "Yes" / "No" or candidate name
  probability: number;        // 0..1
};

type ParentEvent = {
  slug: string;
  question: string;           // "2028 US Presidential Election"
  subMarkets: { slug: string; question: string; yesProbability: number }[];
};

type SimResult = {
  n: number;
  yesCount: number;
  noCount: number;
  impliedProbability: number;
  observedProbability: number;
};
```

The `parentEvent` field captures the multi-outcome event grouping. For v1, multi-outcome events render as a list of binary sub-market cards (auto-binarize). The data model already supports an `outcomes` array of any length so a v2 weighted-wheel can use it directly without a schema change.

### Polymarket integration

- Use the **Gamma API** (`gamma-api.polymarket.com`) exclusively for v1.
  - `/markets` — market metadata + `outcomePrices` (implied probabilities).
  - `/events` — multi-outcome event grouping with sub-markets.
  - Search via Gamma's existing query parameters.
- Avoid the CLOB API in v1 (auth headers + websockets unnecessary for our use case).
- All Polymarket calls happen server-side via `lib/polymarket.ts`. The client never calls Polymarket directly.

### Flip & simulation

```ts
// lib/flip.ts
export function flip(probabilityYes: number): "YES" | "NO" {
  return Math.random() < probabilityYes ? "YES" : "NO";
}

// lib/simulate.ts
export function simulate(probabilityYes: number, n: number): SimResult {
  let yesCount = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < probabilityYes) yesCount++;
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

`Math.random()` is acceptable — entertainment, not adversarial. Simulation presets: 100 / 1,000 / 10,000. No webworker needed (10k iterations runs in ~1ms).

### Persistence

- localStorage keyed by `marketflip:history` — array of `{ slug, question, outcome, impliedProbability, timestamp }`. Capped at last 50 flips.
- No server-side storage of user activity in v1.

### Analytics — PostHog

Client SDK initialized in `app/providers.tsx`. Events captured:

| Event | Properties |
|---|---|
| `home_viewed` | — |
| `market_searched` | `query` |
| `market_url_pasted` | `host`, `valid` |
| `market_viewed` | `slug`, `source` (trending/search/paste/direct) |
| `flip_executed` | `slug`, `outcome`, `implied_probability` |
| `simulation_run` | `slug`, `n`, `observed_yes_count` |
| `result_shared` | `slug`, `mode` (single/sim) |
| `flip_again_clicked` | `slug` |

PostHog autocapture enabled for incidental UI events. No PII captured.

### Error handling

| Failure | Behavior |
|---|---|
| Polymarket API down (trending) | Render last successful fetch with a "stale" banner |
| Polymarket API down (market page) | Soft error with retry button |
| Pasted URL not on polymarket.com | "We only support Polymarket URLs in v1" message |
| Pasted URL valid host but no market match | "Couldn't find that market — try another link" |
| Market resolved between fetch and click | Disable flip CTA, show resolution date |
| `/api/markets/[slug]` 4xx/5xx | Surfaced via toast, prior odds remain visible |

### Testing

- **Unit (Vitest):** `lib/flip.ts`, `lib/simulate.ts`, `lib/share.ts`, `lib/storage.ts`. Inject a seeded RNG into flip/simulate tests for determinism.
- **Component (Vitest + RTL):** `<CoinFlip>` (timing stubbed), `<SimulationPanel>` (renders correct totals).
- **E2E (Playwright, one happy path):** paste URL → market loads → flip → result appears → run sim → distribution renders. Polymarket API mocked at the network layer.
- E2E against the real Polymarket API is intentionally skipped (flaky, rate-limited).

---

## Out of scope for v1, on the roadmap

- **v2 — Multi-outcome wheel:** weighted spinner UI for multi-outcome events with concurrent simulation across all candidates (the "all three flipped Yes" quirk goes away).
- **v2+** Additional platforms (Kalshi, Manifold, PredictIt).
- **v2+** OG image generation for richer link unfurls.
- **v2+** "Hall of Fame / Famous Misses" — curated resolved markets where the simulation is especially funny or instructive.

---

## Open implementation details (decided during build, not blocking)

- Final education panel copy.
- Final share-string format details (emoji set, line breaks).
- Whether to surface flip history as a sidebar drawer or a `/history` page on the market route.
- Whether to add a "speed" toggle on the flip animation for repeat flippers.
- Exact "trending" sort: 24h volume vs. recent activity. Start with 24h volume.
