// lib/storage.ts
import type { HistoryEntry } from "./types";

export const HISTORY_KEY = "marketflip:history";
export const HISTORY_CAP = 50;

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addFlipToHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  const current = readHistory();
  const next = [entry, ...current].slice(0, HISTORY_CAP);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HISTORY_KEY);
}
