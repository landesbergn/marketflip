export function StaleBanner() {
  return (
    <div className="flex items-center gap-3 border-y border-[var(--ink)] px-3 py-2">
      <span className="eyebrow text-[var(--ink)]">Late edition</span>
      <span className="figure text-xs text-[var(--ink-soft)]">
        showing recent results — wire is unreachable.
      </span>
    </div>
  );
}
