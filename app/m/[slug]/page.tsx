import { notFound } from "next/navigation";
import { getMarketBySlug, getEventBySlug } from "@/lib/polymarket";
import { CandidateList } from "@/components/CandidateList";
import { Nameplate } from "@/components/Nameplate";
import { MarketDescription } from "@/components/MarketDescription";
import { MarketFlipClient } from "./MarketFlipClient";
import type { FlippableMarket } from "@/lib/types";
import { fmtVol, fmtResolveDate, reframeQuestion } from "@/lib/fmt";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function MarketPage({ params }: PageProps) {
  const { slug } = await params;

  const market = await getMarketBySlug(slug, { cache: "no-store" }).catch(
    () => null
  );

  if (market) {
    // Only show a "← The field" back link when the parent event actually
    // has multiple sub-markets. Every Polymarket binary market technically
    // belongs to an event, but most events are single-market wrappers
    // with no "field" to navigate back to.
    const parent = market.parentEvent;
    let backHref = "/";
    let backLabel = "← Today";
    if (parent) {
      const parentEvent = await getEventBySlug(parent.slug, {
        next: { revalidate: 300 },
      }).catch(() => null);
      if (parentEvent && parentEvent.subMarkets.length > 1) {
        backHref = `/m/${parent.slug}`;
        backLabel = "← The field";
      }
    }
    return (
      <main className="mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14">
        <Nameplate showBack backHref={backHref} backLabel={backLabel} />
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <MarketHeader market={market} />
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <MarketFlipClient market={market} />
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
        <main className="mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14">
          <Nameplate showBack />
          <hr className="border-0 border-t border-[var(--rule)] m-0" />
          <MarketHeader market={synthetic} />
          <hr className="border-0 border-t border-[var(--rule)] m-0" />
          <MarketFlipClient market={synthetic} />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14">
        <Nameplate showBack />
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <section className="pt-8 sm:pt-11 pb-6">
          <p className="eyebrow">
            {[fmtResolveDate(event.endDate) ? `resolves ${fmtResolveDate(event.endDate)}` : null]
              .filter(Boolean)
              .join(" · ") || "Live event"}
          </p>
          <h1
            className="display mt-3 sm:mt-3.5 text-[34px] sm:text-[40px] md:text-[48px]"
            style={{ lineHeight: 1.05, maxWidth: 760 }}
          >
            {event.question}
          </h1>
          <MarketDescription text={event.description} />
        </section>
        <hr className="border-0 border-t border-[var(--rule)] m-0" />
        <CandidateList event={event} />
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
  const displayQuestion = reframeQuestion(
    market.question,
    market.outcomes[0]?.label,
    market.outcomes[1]?.label
  );

  return (
    <section className="pt-8 sm:pt-11 pb-6">
      <p className="eyebrow">{parts.join(" · ") || "Live market"}</p>
      <h1
        className="display mt-3 sm:mt-3.5 text-[34px] sm:text-[40px] md:text-[48px]"
        style={{ lineHeight: 1.05, maxWidth: 760 }}
      >
        {displayQuestion}
      </h1>
      <MarketDescription text={market.description} />
    </section>
  );
}
