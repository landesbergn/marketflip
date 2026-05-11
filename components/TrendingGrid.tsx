import { getTrendingMarkets } from "@/lib/polymarket";
import type { FlippableMarket } from "@/lib/types";
import { MarketCard } from "./MarketCard";
import { StaleBanner } from "./StaleBanner";

export const revalidate = 60;

export async function TrendingGrid() {
  let markets: FlippableMarket[] = [];
  let stale = false;
  try {
    markets = await getTrendingMarkets(20, { next: { revalidate: 60 } });
  } catch {
    markets = [];
    stale = true;
  }

  if (markets.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="eyebrow">No live markets</p>
        <p className="figure mt-2 text-xs text-[var(--ink-soft)]">
          Try again in a minute.
        </p>
      </div>
    );
  }

  return (
    <>
      {stale ? <StaleBanner /> : null}
      <ul className="m-0 p-0 list-none">
        {markets.map((m) => (
          <MarketCard key={m.slug} market={m} />
        ))}
      </ul>
    </>
  );
}
