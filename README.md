# MarketFlip

A weighted coin, drawn from the live odds.

MarketFlip takes a real Polymarket market, reads its current implied probabilities, and lets you simulate a coin flip weighted by those odds — once for theatre, or 1,000 times for the math. The single dramatic flip is the entertainment hook; the inline distribution and "Editor's Note" are the substance.

**Live:** [marketflip.vercel.app](https://marketflip.vercel.app) *(or whatever Vercel assigned the project)*

---

## What it does

- **Today's Card** — a server-rendered grid of the most-traded live Polymarket markets, refreshed every 60 seconds at the edge.
- **Search** — fuzzy search across active Polymarket events via the `/public-search` endpoint.
- **Binary flip** — every market page presents a 3D gold coin, the implied YES/NO odds, and a chunky FLIP CTA. The coin actually rotates 7 times and lands on the result; YES gets 🎉, NO gets 🚨.
- **Run the Numbers** — three preset simulations (100 / 1,000 / 10,000 flips) render an inline YES/NO distribution bar plus a one-paragraph plain-language explanation of what the implied probability really means.
- **Multi-outcome events** — events with several sub-markets (e.g. "2028 Presidential Election Winner") render as a candidate ledger; pick one and that candidate becomes a binary flip.
- **Resolution criteria** — Polymarket's full description ("resolves YES if X by Y") sits beneath the flip in a "Resolution Criteria" block.
- **Wordle-style share** — copy a clean text snippet of any flip or simulation result to the clipboard.
- **Local history** — the last 50 flips per browser are kept in `localStorage` and surfaced in a per-market "ledger" drawer. No accounts, no server-side tracking.

## Filters and quirks

- **Decided markets are hidden.** If a market rounds to 0%/100%, it's filtered out everywhere — trending, search, and event candidate lists. Those are no longer real wagers.
- **0% candidates are hidden** in multi-outcome events to keep the candidate list legible (Polymarket events sometimes carry 50+ technically-open candidates with 0% odds).
- **Single-market events flatten** to the binary flip UI rather than a one-item candidate list.

---

## Stack

- **Next.js 16** (App Router) on Vercel — server components for trending/search/market pages, client components for everything interactive.
- **TypeScript** throughout, strict mode.
- **Tailwind v4** with a custom CSS design system in `app/globals.css` (paper/ink/oxblood/gold palette, "Racing Form Almanac" aesthetic).
- **Fraunces** (serif display) and **IBM Plex Mono** (numbers) via `next/font/google`.
- **Polymarket Gamma API** — `gamma-api.polymarket.com`, no auth required:
  - `/markets?slug=…` for binary markets
  - `/events?slug=…` for multi-outcome events
  - `/public-search?q=…` for fuzzy search
  - `/markets?active=true&closed=false&order=volume24hr` for trending
- **PostHog** client SDK for product analytics — captures `home_viewed`, `market_viewed`, `flip_executed`, `simulation_run`, `result_shared`, `market_searched`, `flip_again_clicked`, `market_url_pasted`. No PII, no server-side identification.
- **Vitest** + React Testing Library for unit/component tests; **Playwright** for one happy-path E2E.

### Key project paths

```
app/
  page.tsx                       Home (search + trending grid)
  m/[slug]/page.tsx              Market or event page (handles both)
  m/[slug]/MarketFlipClient.tsx  Client wrapper wiring CoinFlip + Sim + Share
  api/markets/{trending,search,[slug],resolve-url}/route.ts
  layout.tsx                     Fonts, metadata, providers
  providers.tsx                  PostHog init (client)
  globals.css                    Design system
components/
  CoinFlip.tsx                   3D animated gold coin
  SimulationPanel.tsx            Distribution bar + Editor's Note
  CandidateList.tsx              Multi-outcome event field
  MarketCard.tsx                 Trending ticket
  MarketDescription.tsx          Resolution criteria block
  ShareButton.tsx                Wordle-style clipboard share
  History.tsx                    Per-market localStorage ledger
  PageViewTracker.tsx            PostHog page-view fire-and-forget
  …
lib/
  polymarket.ts                  Gamma client + normalization
  flip.ts                        Pure: flip(p) → "YES" | "NO"
  simulate.ts                    Pure: simulate(p, n) → SimResult
  share.ts                       Format share strings
  storage.ts                     localStorage history (50-cap, corruption-safe)
  rng.ts                         Injectable RNG for deterministic tests
  types.ts                       Shared types
  posthog.ts                     Typed track() helper
tests/                           Vitest unit + RTL component tests
tests/e2e/                       Playwright happy-path
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

This is the same code path Vercel runs. Build takes ~60s on first run, then `npm start` boots in 3s. Use this for clicking around the live UI.

**Dev mode with hot reload** — slow first compile, fast after:

```bash
npm run dev                     # http://localhost:3000
```

Note: Turbopack's first-request compile takes 30-60 seconds on a clean cache (especially with `next/font/google` fetching font subsets). Browsers may show "this site can't be reached" if you hit the page before the compile finishes — **just wait it out** the first time. Subsequent requests are sub-50ms.

If `~/package-lock.json` exists outside any project, Next will print a "multiple lockfiles" warning. The repo's `next.config.ts` pins `turbopack.root` to silence that, but you can also just delete the stray file: it's only created by an accidental `npm` invocation in your home directory.

### Tests

```bash
npm test                        # Vitest unit + component
npm run test:e2e                # Playwright happy-path (mocks Polymarket, runs against dev server)
```

---

## Deployment

`main` is auto-deployed by Vercel. Required env var:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Your PostHog project API key (`phc_…`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` *(default)* |

Both are public/client-side keys — safe to expose. Without them, PostHog silently no-ops.

## Aesthetic notes

The visual language is "Racing Form Almanac" — late-19th-century financial broadside crossed with modern editorial. Cream parchment background with a subtle SVG noise overlay, deep ink typography, oxblood for emphasis, antique gold for the coin. Numbers always tabular and mono. Hairline rules between sections. Decorative `❦` fleurons. Buttons are weighty with offset hard shadows that compress on click.

Specifically not: zinc gradients, generic Tailwind defaults, neon, glassmorphism.

## Design and plan history

The original spec and implementation plan live in:

- [`docs/superpowers/specs/2026-05-09-marketflip-design.md`](docs/superpowers/specs/2026-05-09-marketflip-design.md)
- [`docs/superpowers/plans/2026-05-09-marketflip-v1.md`](docs/superpowers/plans/2026-05-09-marketflip-v1.md)

Treat them as historical: behavior may have evolved since. This README reflects the current implementation.

## Roadmap (out of scope for v1)

- **Weighted-wheel UI** for multi-outcome events — instead of a candidate list, a single spinning wheel weighted by all candidates' odds.
- **Additional platforms** — Kalshi, Manifold, PredictIt.
- **OG image generation** for richer link unfurls on social media.
- **"Famous Misses"** gallery — curated resolved markets where the implied probability was dramatically off.
