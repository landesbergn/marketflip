import { Suspense } from "react";
import { TrendingGrid } from "@/components/TrendingGrid";
import { SearchInput } from "@/components/SearchInput";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Nameplate } from "@/components/Nameplate";

export const metadata = {
  title: "MarketFlip — Flip a market",
  description:
    "Each market is a coin weighted to its live odds. Pull one for a flip, or a thousand.",
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[1024px] px-14">
      <PageViewTracker event={{ name: "home_viewed" }} />

      <Nameplate />
      <hr className="border-0 border-t border-[var(--rule)] m-0" />

      {/* Tagline */}
      <section className="rise rise-1 pt-6 pb-7">
        <p className="max-w-[520px] text-[18px] leading-relaxed text-[var(--ink-soft)] italic">
          Each market is a coin weighted to its live odds.
        </p>
      </section>

      {/* Search */}
      <section className="rise rise-2">
        <SearchInput />
      </section>

      {/* Today's list */}
      <section className="rise rise-3 mt-8 pb-12">
        <p className="eyebrow mb-3.5">Today &middot; by 24h volume</p>
        <hr className="border-0 border-t border-[var(--ink)] m-0" />
        <Suspense
          fallback={
            <p className="eyebrow text-[var(--ink-faint)] py-6">
              Drawing the card&hellip;
            </p>
          }
        >
          <TrendingGrid />
        </Suspense>
      </section>
    </main>
  );
}
