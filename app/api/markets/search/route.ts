import { NextRequest, NextResponse } from "next/server";
import { searchMarkets } from "@/lib/polymarket";

export const revalidate = 30;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  try {
    const results = await searchMarkets(q, { next: { revalidate: 30 } });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("search route error:", err);
    return NextResponse.json(
      { results: [], error: "upstream_failure" },
      { status: 502 }
    );
  }
}
