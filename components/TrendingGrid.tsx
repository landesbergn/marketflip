// components/TrendingGrid.tsx
import { getTrendingMarkets } from "@/lib/polymarket";
import type { FlippableMarket } from "@/lib/types";
import { MarketCard } from "./MarketCard";
import { StaleBanner } from "./StaleBanner";

export const revalidate = 60;

export async function TrendingGrid() {
  let markets: FlippableMarket[] = [];
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
