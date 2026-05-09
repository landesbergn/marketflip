// components/MarketCard.tsx
import Link from "next/link";
import type { FlippableMarket } from "@/lib/types";

export function MarketCard({ market }: { market: FlippableMarket }) {
  const yes = market.outcomes[0];
  const no = market.outcomes[1];
  const yesPct = Math.round((yes?.probability ?? 0) * 100);
  const noPct = 100 - yesPct;

  return (
    <Link
      href={`/m/${market.slug}`}
      className="block rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 transition"
    >
      <p className="font-semibold text-sm leading-snug line-clamp-3">
        {market.question}
      </p>
      <div className="mt-2 flex gap-2 text-xs">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
          {yes?.label ?? "Y"} {yesPct}%
        </span>
        <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-800">
          {no?.label ?? "N"} {noPct}%
        </span>
      </div>
    </Link>
  );
}
