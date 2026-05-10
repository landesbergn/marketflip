// components/SearchInput.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlippableMarket } from "@/lib/types";
import { track } from "@/lib/posthog";

export function SearchInput() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FlippableMarket[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      track({ name: "market_searched", props: { query: q.trim() } });
      try {
        const res = await fetch(`/api/markets/search?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { results: FlippableMarket[] };
        if (!cancelled) setResults(data.results);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 Search markets…"
        aria-label="Search markets"
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
      />
      {loading ? (
        <p className="mt-2 text-xs text-zinc-500">Searching…</p>
      ) : results && results.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">No matches.</p>
      ) : results ? (
        <ul className="mt-2 space-y-1">
          {results.slice(0, 8).map((m) => (
            <li key={m.slug}>
              <Link
                href={`/m/${m.slug}`}
                className="block rounded px-2 py-1 text-sm hover:bg-zinc-100"
              >
                {m.question}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
