import { NextResponse } from "next/server";
import { getTrendingMarkets } from "@/lib/polymarket";

export const revalidate = 60;

export async function GET() {
  try {
    const markets = await getTrendingMarkets(12, { next: { revalidate: 60 } });
    return NextResponse.json({ markets });
  } catch (err) {
    console.error("trending route error:", err);
    return NextResponse.json(
      { markets: [], error: "upstream_failure" },
      { status: 502 }
    );
  }
}
