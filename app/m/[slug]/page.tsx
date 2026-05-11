import { notFound } from "next/navigation";
import { getMarketBySlug, getEventBySlug } from "@/lib/polymarket";
import { CandidateList } from "@/components/CandidateList";
import { History } from "@/components/History";
import { Nameplate } from "@/components/Nameplate";
import { MarketFlipClient } from "./MarketFlipClient";
import type { FlippableMarket } from "@/lib/types";
import { fmtVol, fmtResolveDate } from "@/lib/fmt";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function MarketPage({ params }: PageProps) {
  const { slug } = await params;

  const market = await getMarketBySlug(slug, { cache: "no-store" }).catch(
    () => null
  );

  if (market) {
    return (
      <main className="mx-auto max-w-[880px] px-14">
        <Nameplate showBack />
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <MarketHeader market={market} />
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <MarketFlipClient market={market} />
        <History slug={slug} />
      </main>
    );
  }

  const event = await getEventBySlug(slug, { cache: "no-store" }).catch(
    () => null
  );

  if (event) {
    // Single-market event: flatten directly into the binary flip UI.
    if (event.subMarkets.length === 1) {
      const sub = event.subMarkets[0];
      const synthetic: FlippableMarket = {
        id: event.slug,
        slug: event.slug,
        question: event.question,
        description: event.description,
        outcomes: [
          { label: "Yes", probability: sub.yesProbability },
          { label: "No", probability: 1 - sub.yesProbability },
        ],
        endDate: event.endDate,
        volume24h: 0,
        url: event.url,
      };
      return (
        <main className="mx-auto max-w-[880px] px-14">
          <Nameplate showBack />
          <hr className="border-0 border-t border-[var(--rule)] m-0" />
          <MarketHeader market={synthetic} />
          <hr className="border-0 border-t border-[var(--rule)] m-0" />
          <MarketFlipClient market={synthetic} />
          <History slug={slug} />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-[880px] px-14">
        <Nameplate showBack />
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <section className="pt-11 pb-6">
          <p className="eyebrow">
            {[fmtResolveDate(event.endDate) ? `resolves ${fmtResolveDate(event.endDate)}` : null]
              .filter(Boolean)
              .join(" · ") || "Live event"}
          </p>
          <h1
            className="display mt-3.5"
            style={{ fontSize: 48, lineHeight: 1.05, maxWidth: 760 }}
          >
            {event.question}
          </h1>
        </section>
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <CandidateList event={event} />
        <History slug={slug} />
      </main>
    );
  }

  notFound();
}

function MarketHeader({ market }: { market: FlippableMarket }) {
  const resolves = fmtResolveDate(market.endDate);
  const vol = market.volume24h > 0 ? fmtVol(market.volume24h) : null;
  const parts = [
    resolves ? `resolves ${resolves}` : null,
    vol ? `vol ${vol}` : null,
  ].filter(Boolean);

  return (
    <section className="pt-11 pb-6">
      <p className="eyebrow">{parts.join(" · ") || "Live market"}</p>
      <h1
        className="display mt-3.5"
        style={{ fontSize: 48, lineHeight: 1.05, maxWidth: 760 }}
      >
        {market.question}
      </h1>
    </section>
  );
}
