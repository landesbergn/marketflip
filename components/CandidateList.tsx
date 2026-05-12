import Link from "next/link";
import type { ParentEvent } from "@/lib/types";
import { extractCandidateName } from "@/lib/fmt";

export function CandidateList({ event }: { event: ParentEvent }) {
  return (
    <div>
      <section className="pt-10 pb-6">
        <p className="eyebrow">The field</p>
        <p className="mt-4 text-xl leading-snug max-w-2xl">
          Each candidate is its own coin. Probabilities sum below 100% — the
          market keeps room for what it doesn&rsquo;t know. Pick one to flip.
        </p>
      </section>

      <section className="pb-10">
        <hr className="border-0 border-t border-[var(--ink)] m-0" />
        <ul className="m-0 p-0 list-none">
          {event.subMarkets.map((s) => {
            const pct = Math.round(s.yesProbability * 100);
            return (
              <li key={s.slug} className="border-b border-[var(--rule)]">
                <Link
                  href={`/m/${s.slug}`}
                  className="row-hover w-full text-left grid items-center gap-4 sm:gap-6 px-3 py-4 sm:py-5 candidate-row"
                >
                  <span className="text-[17px] sm:text-[20px] leading-snug truncate">
                    {extractCandidateName(s.question)}
                  </span>
                  <span className="block h-2 bg-[var(--rule-soft)] relative">
                    <span
                      className="absolute inset-0 block"
                      style={{
                        width: `${pct}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </span>
                  <span
                    className="text-right text-[22px] sm:text-[28px] italic whitespace-nowrap"
                    style={{ color: "var(--accent)", lineHeight: 1 }}
                  >
                    {pct}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
