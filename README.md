# MarketFlip

Take a live Polymarket market, read its current implied probabilities, and flip a virtual coin weighted by those odds. The single dramatic flip is the entertainment hook; running 1,000 simulations with an inline education panel is the substance.

## Stack

- Next.js (App Router) · TypeScript · Tailwind
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
npm run test:e2e     # Playwright happy-path against the dev server
```

## Deploy

Push to `main` triggers a Vercel deploy. Set `NEXT_PUBLIC_POSTHOG_KEY` in Vercel project settings.

## Spec & plan

- Design spec: [`docs/superpowers/specs/2026-05-09-marketflip-design.md`](docs/superpowers/specs/2026-05-09-marketflip-design.md)
- v1 plan: [`docs/superpowers/plans/2026-05-09-marketflip-v1.md`](docs/superpowers/plans/2026-05-09-marketflip-v1.md)
