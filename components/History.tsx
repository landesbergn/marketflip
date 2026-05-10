// components/History.tsx
"use client";

import { useEffect, useState } from "react";
import { readHistory, clearHistory } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

export function History({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    setEntries(readHistory().filter((e) => e.slug === slug));
  }, [open, slug]);

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-zinc-600 underline-offset-2 hover:underline"
      >
        {open ? "Hide history" : "Show flip history for this market"}
      </button>
      {open ? (
        <div className="mt-3 rounded-md border border-zinc-200 p-3 text-sm">
          {entries.length === 0 ? (
            <p className="text-zinc-500">No flips yet for this market.</p>
          ) : (
            <ul className="space-y-1">
              {entries.map((e, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {e.flippedTo === "YES" ? "🎉" : "🚨"} {e.flippedTo}{" "}
                    <span className="text-zinc-500">— {e.outcomeLabel}</span>
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {entries.length > 0 ? (
            <button
              onClick={() => {
                clearHistory();
                setEntries([]);
              }}
              className="mt-2 text-xs text-rose-700 underline-offset-2 hover:underline"
            >
              Clear all history
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
