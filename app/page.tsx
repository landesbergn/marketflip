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
    <main className="mx-auto max-w-[880px] px-14">
      <PageViewTracker event={{ name: "home_viewed" }} />

      <Nameplate />
      <hr className="border-0 border-t border-[var(--rule)] m-0" />

      {/* Headline */}
      <section className="rise rise-1 pt-12 pb-7">
        <h1
          className="display"
          style={{ fontSize: 64, lineHeight: 1 }}
        >
          Flip a{" "}
          <span style={{ fontStyle: "italic", color: "var(--accent)" }}>
            market
          </span>
          .
        </h1>
        <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Each market is a coin weighted to its live odds.
        </p>
      </section>

      {/* Search */}
      <section className="rise rise-2">
        <SearchInput />
      </section>

      {/* Today's list */}
      <section className="rise rise-3 mt-7 pb-12">
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
