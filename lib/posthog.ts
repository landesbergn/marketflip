// lib/posthog.ts
import posthog from "posthog-js";

export type AnalyticsEvent =
  | { name: "home_viewed"; props?: Record<string, never> }
  | { name: "market_searched"; props: { query: string } }
  | { name: "market_url_pasted"; props: { host: string; valid: boolean } }
  | { name: "market_viewed"; props: { slug: string; source: "trending" | "search" | "paste" | "direct" } }
  | { name: "flip_executed"; props: { slug: string; outcome: "YES" | "NO"; implied_probability: number } }
  | { name: "simulation_run"; props: { slug: string; n: number; observed_yes_count: number } }
  | { name: "result_shared"; props: { slug: string; mode: "single" | "sim" } }
  | { name: "flip_again_clicked"; props: { slug: string } };

export function track<E extends AnalyticsEvent>(event: E): void {
  if (typeof window === "undefined") return;
  posthog.capture(event.name, event.props as Record<string, unknown>);
}
