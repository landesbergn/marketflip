import { NextResponse } from "next/server";
import { getMarketBySlug, getEventBySlug } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  try {
    const market = await getMarketBySlug(slug, { cache: "no-store" });
    if (market) return NextResponse.json({ kind: "market", market });

    const event = await getEventBySlug(slug, { cache: "no-store" });
    if (event) return NextResponse.json({ kind: "event", event });

    return NextResponse.json({ error: "not_found" }, { status: 404 });
  } catch (err) {
    console.error(`[slug] route error for ${slug}:`, err);
    return NextResponse.json({ error: "upstream_failure" }, { status: 502 });
  }
}
