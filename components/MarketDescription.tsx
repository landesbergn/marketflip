type Props = {
  text?: string | null;
};

export function MarketDescription({ text }: Props) {
  if (!text || !text.trim()) return null;

  // Polymarket descriptions are plain text with double-newlines between paragraphs.
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="mt-12">
      <hr className="rule mb-4" />
      <p className="eyebrow mb-3">Resolution Criteria</p>
      <div className="text-[0.95rem] leading-relaxed text-[var(--ink-soft)] space-y-3 max-w-prose">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
