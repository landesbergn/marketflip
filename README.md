# MarketFlip

*Each market is a coin weighted to its live odds.*

MarketFlip pulls a real Polymarket market, reads its current implied probabilities, and lets you flip a coin weighted to those odds — once, or a hundred times. The point is small but unintuitive: a market at "91% YES" doesn't always resolve YES. Flipping it shows you the other 9% in motion. Running 100 flips lets the law of large numbers play out in front of you.

**Live:** [marketflip.vercel.app](https://marketflip.vercel.app)

**Source:** this repo, [github.com/landesbergn/marketflip](https://github.com/landesbergn/marketflip)

---

## What it does

- **Today's list** — single-column, server-rendered list of the most-traded live Polymarket markets, refreshed every 60s at the edge. Click a card → market page.
- **Search** — live underline-style search that hits Polymarket's `/public-search` endpoint and filters as you type (250ms debounce).
- **Binary market page** — two-column layout (`lg+`): the coin + flip CTA on the left, the implied probability as a 100-dot grid + the user's personal flip history below it on the right. Both grids use identical dot styling so they read as a visual pair.
- **The coin** — flat 2D disc, two-face rotateX flip with a real toss arc (scaleY squish on land, ground shadow that compresses, motion blur during flight). Tap the coin or the FLIP THE COIN button. Toss-arc keyframes use CSS variables so the animation scales with the coin's responsive size.
- **Result block** — instead of restating "NO" three times, the result is classified by how it compares to its implied probability:
  - `AS EXPECTED` — outcome side was favored (≥ 70%)
  - `A TOSS-UP` — both sides between 30–70%
  - `SURPRISE` — outcome side was the long shot (≤ 30%) — rendered in accent color
- **Run 100** — the post-flip link runs 100 single weighted flips and appends them to the user's flip-history grid (via `requestAnimationFrame`, 4 flips/frame ≈ 400ms). The grid grows on the page, persisted in `localStorage`. With each flip the history copy updates: *"You saw YES in 47 of 100 flips (47%)."*
- **Multi-outcome events** (e.g. *2028 Presidential Election Winner*) render as a candidate ledger with a bar chart per row. Each candidate is a real `<Link>` to its own `/m/<sub-slug>` page — which is just a binary market with a `← The field` back link.
- **Resolution criteria** — Polymarket's full description sits in a collapsible toggle directly below the market title.
- **Share flip** — wordle-style copy-text via `navigator.share` (mobile) with clipboard fallback.
- **About modal** — top-right ABOUT button opens a native `<dialog>` describing the project and linking the source.

## Filters and edge cases

- **Decided markets are dropped.** If either outcome rounds to 0% or 100%, the market is filtered out of trending, search, and event candidate lists. Already-decided markets aren't fun to flip on.
- **0% candidates are dropped** from multi-outcome event ledgers so the page isn't flooded with dead candidates.
- **Single-market events flatten** to the binary flip UI rather than a one-item candidate list.
- **Meaningful outcome labels carry through.** For sports/election markets where outcomes are `["Pistons", "Cavaliers"]` instead of `["Yes", "No"]`, the result block reads *"The market priced PISTONS at 41% — the coin agreed."* The matchup question `"Pistons vs. Cavaliers"` is even reframed at display time as *"Will Pistons beat Cavaliers?"* so the binary nature is explicit.
- **Question text is trimmed at normalization** — Polymarket occasionally returns whitespace-prefixed questions; we strip them once at the data layer so neither share text nor the UI shows leading spaces.

---

## Stack

- **Next.js 16** (App Router) on Vercel — server components for trending/search/market pages, client components for everything interactive.
- **TypeScript** throughout, strict mode.
- **Tailwind v4** with a custom CSS design system in `app/globals.css` (paper/ink/accent navy palette).
- **Geist Sans + Geist Mono** via `next/font/google`.
- **Polymarket Gamma API** — `gamma-api.polymarket.com`, no auth required:
  - `/markets?slug=…` for binary markets
  - `/events?slug=…` for multi-outcome events
  - `/public-search?q=…` for fuzzy search
  - `/markets?active=true&closed=false&order=volume24hr` for trending
- **PostHog** client SDK for product analytics — captures `home_viewed`, `market_viewed`, `market_searched`, `flip_executed`, `simulation_run`, `result_shared`. No PII, no server-side identification. Disabled gracefully when no key is set.
- **Vitest** + React Testing Library for unit/component tests; **Playwright** for a smoke E2E.

### Key project paths

```
app/
  page.tsx                       Home (search + trending list)
  m/[slug]/page.tsx              Market or event page (resolves either)
  m/[slug]/MarketFlipClient.tsx  Client wrapper: coin + reading + history
  api/markets/{trending,search,[slug]}/route.ts
  layout.tsx                     Geist font loading, metadata, providers
  providers.tsx                  PostHog init (client-only)
  globals.css                    Design system + coin animation keyframes
  icon.svg                       Gold-coin favicon
components/
  CoinFlip.tsx                   2D toss-arc coin with verdict-driven result
  CandidateList.tsx              Multi-outcome event field (list of links)
  DotGrid.tsx                    Implied 100-dot probability grid
  History.tsx                    Personal flip-history grid + caption
  MarketCard.tsx                 Today-list row
  MarketDescription.tsx          Collapsible resolution-criteria block
  Nameplate.tsx                  Header (logo + back link + About)
  AboutButton.tsx                About modal trigger + <dialog>
  HeaderCoin.tsx                 Animated tiny gold coin in the header
  SearchInput.tsx                Underline search field with live results
  ShareButton.tsx                Wordle-style copy/share button
  TrendingGrid.tsx               Server component that fetches + renders today
  PageViewTracker.tsx            PostHog page-view fire-and-forget
  StaleBanner.tsx                Renders when trending fetch failed
  RefreshOddsButton.tsx          (Unused on current pages, kept available)
lib/
  polymarket.ts                  Gamma client + market/event normalization
  polymarket-internal.ts         Raw Gamma response types + helpers
  flip.ts                        Pure: flip(p, rng?) → "YES" | "NO"
  simulate.ts                    Pure: simulate(p, n, rng?) → SimResult
  rng.ts                         Injectable mulberry32 RNG for tests
  fmt.ts                         Display helpers (questionToStatement,
                                 verdictFor, isLiteralYesNo, displayLabel,
                                 reframeQuestion, matchupStatement,
                                 extractCandidateName, fmtVol, fmtResolveDate)
  share.ts                       Format share-text strings
  storage.ts                     localStorage flip history (1000-cap,
                                 corruption-safe, bulk-append helper)
  posthog.ts                     Typed track() helper + AnalyticsEvent union
  types.ts                       Shared TypeScript types
tests/
  fmt.test.ts                    Helper functions
  flip.test.ts                   Single weighted flip
  simulate.test.ts               N-flip distribution
  rng.test.ts                    Seeded RNG determinism
  share.test.ts                  Share string formatting
  storage.test.ts                localStorage history
  polymarket.test.ts             Gamma client normalization & filters
  components/CoinFlip.test.tsx
  components/Nameplate.test.tsx
  components/AboutButton.test.tsx
  components/CandidateList.test.tsx
  e2e/happy-path.spec.ts         Playwright happy-path
```

---

## Local development

```bash
git clone https://github.com/landesbergn/marketflip.git
cd marketflip
npm install
cp .env.example .env.local      # optional — fill in NEXT_PUBLIC_POSTHOG_KEY
```

### Two ways to run locally

**Production-style (recommended for casual hacking)** — fast, no hot reload:

```bash
npm run build && npm start      # http://localhost:3000
```

This is the same code path Vercel runs. Build takes ~60s on first run, then `npm start` boots in seconds.

**Dev mode with hot reload** — slow first compile, fast after:

```bash
npm run dev                     # http://localhost:3000
```

Note: Turbopack's first-request compile can take 30–60 seconds on a clean cache, mostly due to `next/font/google` fetching font subsets. Browsers may show "this site can't be reached" if you hit the page before that compile finishes — wait it out the first time. Subsequent requests are sub-50ms.

If `~/package-lock.json` exists outside any project, Next will print a "multiple lockfiles" warning. `next.config.ts` pins `turbopack.root` to silence it.

### Tests

```bash
npm test                        # Vitest unit + component tests
npm run test:e2e                # Playwright happy-path
```

The Vitest suite covers:
- `lib/fmt.ts` — all display helpers (verdict classification, question reframing, label switching, formatting)
- `lib/flip.ts` + `lib/simulate.ts` — pure probability math with a seeded RNG
- `lib/polymarket.ts` — Gamma response normalization (binary markets, events, search, decided-market filtering, description passthrough, URL resolution)
- `lib/share.ts` — share-string formatting for single flips and simulations
- `lib/storage.ts` — `localStorage` history (append, cap, ordering, corruption tolerance)
- `lib/rng.ts` — seeded mulberry32 determinism
- React components — `CoinFlip` (verdict-driven result block), `Nameplate` (logo + back link + About), `AboutButton` (dialog opens, GitHub link), `CandidateList` (renders one `<Link>` per sub-market with extracted candidate name)

Playwright runs one happy-path spec against the dev server.

---

## Deployment

`main` is auto-deployed by Vercel. Required env vars:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Your PostHog project API key (`phc_…`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` *(default if unset)* |

Both are public/client-side keys — safe to expose. Without them, PostHog silently no-ops.

---

## Aesthetic notes

Visual language is **minimal ink-on-paper** with a navy accent. Cream paper background (`#fafaf7`), deep ink (`#0a0a0a`), navy (`#1a3a6b`) for emphasis, and a true-gold animated header coin (radial gradient + 56 reeded teeth + specular highlight) as the brand mark. Geist sans throughout; Geist Mono for figures and eyebrow labels.

The page is mobile-friendly: padding, headlines, dot grids, and the coin all scale below the `640px` and `1024px` breakpoints. The market-page two-column grid collapses to a single column on tablets and phones.

---

## Roadmap

- Weighted-wheel UI for multi-outcome events (one spinning wheel instead of a candidate ledger)
- Additional platforms — Kalshi, Manifold, PredictIt
- OG-image generation for richer link unfurls on social media
- Curated "Famous Misses" gallery — resolved markets where the implied probability was dramatically off

## Design and plan history

Historical, kept for context:

- [`docs/superpowers/specs/2026-05-09-marketflip-design.md`](docs/superpowers/specs/2026-05-09-marketflip-design.md)
- [`docs/superpowers/plans/2026-05-09-marketflip-v1.md`](docs/superpowers/plans/2026-05-09-marketflip-v1.md)

This README reflects the current state of the implementation; the spec/plan documents capture v1's original scope before the redesign rounds.
