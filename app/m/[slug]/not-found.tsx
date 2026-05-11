import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[880px] px-14 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4" style={{ fontSize: 48, lineHeight: 1.05 }}>
        No such market.
      </h1>
      <p className="mt-4 text-[var(--ink-soft)] max-w-md mx-auto">
        That slug doesn&rsquo;t match any active Polymarket market or event.
      </p>
      <Link
        href="/"
        className="btn-link mt-6 inline-block"
        style={{ color: "var(--accent)" }}
      >
        ← Back to today
      </Link>
    </main>
  );
}
