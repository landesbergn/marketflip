"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FlippableMarket } from "@/lib/types";

/**
 * Underlined search input that filters/searches live as you type.
 * Hits /api/markets/search after a short debounce.
 */
export function SearchInput() {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
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
      try {
        const res = await fetch(
          `/api/markets/search?q=${encodeURIComponent(q.trim())}`
        );
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

  const borderColor = focused ? "var(--accent)" : "var(--ink)";
  const iconColor = focused ? "var(--accent)" : "var(--ink-faint)";

  return (
    <div>
      <div
        className="flex items-center gap-3 transition-colors"
        style={{
          borderBottom: `1.25px solid ${borderColor}`,
          padding: "14px 4px 12px",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{ flex: "0 0 auto", color: iconColor, transition: "color 140ms" }}
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <line
            x1="10.6"
            y1="10.6"
            x2="14"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search markets, categories…"
          aria-label="Search markets"
          className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[17px] sm:text-[20px] text-[var(--ink)]"
          style={{ padding: 0 }}
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              setResults(null);
            }}
            className="bg-transparent border-0 cursor-pointer p-0 font-mono text-[11px] tracking-[0.13em] uppercase text-[var(--ink-faint)]"
          >
            clear
          </button>
        )}
      </div>

      {q.trim() && (
        <div className="mt-3">
          {loading ? (
            <p className="eyebrow text-[var(--ink-faint)]">Searching&hellip;</p>
          ) : results && results.length === 0 ? (
            <p className="eyebrow text-[var(--ink-faint)]">No markets match &ldquo;{q}&rdquo;.</p>
          ) : results ? (
            <ul className="m-0 p-0 list-none border-t border-[var(--rule)]">
              {results.slice(0, 8).map((m) => (
                <li key={m.slug} className="border-b border-[var(--rule)]">
                  <Link
                    href={`/m/${m.slug}`}
                    className="row-hover block px-3 py-3 text-[16px]"
                  >
                    {m.question}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
