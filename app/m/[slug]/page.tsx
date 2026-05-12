import { notFound } from "next/navigation";
import { getMarketBySlug, getEventBySlug } from "@/lib/polymarket";
import { CandidateList } from "@/components/CandidateList";
import { Nameplate } from "@/components/Nameplate";
import { MarketDescription } from "@/components/MarketDescription";
import { MarketFlipClient } from "./MarketFlipClient";
import type { FlippableMarket } from "@/lib/types";
import { fmtResolveDate } from "@/lib/fmt";

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
      <>
        <Nameplate showBack backHref={backHref} backLabel={backLabel} />
        <main className="mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-12">
          <MarketFlipClient market={market} />
        </main>
      </>
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
        <>
          <Nameplate showBack />
          <main className="mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-12">
            <MarketFlipClient market={synthetic} />
          </main>
        </>
      );
    }

    return (
      <>
        <Nameplate showBack />
        <main className="mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14 pb-12">
          <section className="pt-5 sm:pt-10 pb-3 sm:pb-6">
            <p className="eyebrow">
              {[fmtResolveDate(event.endDate) ? `resolves ${fmtResolveDate(event.endDate)}` : null]
                .filter(Boolean)
                .join(" · ") || "Live event"}
            </p>
            <h1
              className="display mt-2.5 sm:mt-3.5 text-[28px] sm:text-[40px] md:text-[48px]"
              style={{ lineHeight: 1.06 }}
            >
              {event.question}
            </h1>
            <MarketDescription text={event.description} />
          </section>
          <hr className="border-0 border-t border-[var(--rule)] m-0" />
          <CandidateList event={event} />
        </main>
      </>
    );
  }

  notFound();
}
