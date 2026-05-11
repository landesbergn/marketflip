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
    <div className="mt-12 pt-8 border-t border-[var(--rule)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="eyebrow"
        style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
      >
        {open ? "− Hide ledger" : "+ Show flip history for this market"}
      </button>
      {open ? (
        <div className="mt-4">
          {entries.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)] italic">
              No flips yet for this market.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none border-t border-[var(--rule)]">
              {entries.map((e, i) => (
                <li
                  key={i}
                  className="flex justify-between items-baseline py-3 border-b border-[var(--rule)]"
                >
                  <span className="text-sm">
                    <span
                      className="figure font-medium mr-3"
                      style={{
                        color:
                          e.flippedTo === "YES"
                            ? "var(--accent)"
                            : "var(--ink)",
                      }}
                    >
                      {e.flippedTo}.
                    </span>
                    <span className="text-[var(--ink-soft)]">
                      {e.outcomeLabel}
                    </span>
                  </span>
                  <span className="figure text-[10px] tabular-nums text-[var(--ink-faint)]">
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
              className="btn-link mt-4"
              style={{ color: "var(--ink-faint)" }}
            >
              Clear all history
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
