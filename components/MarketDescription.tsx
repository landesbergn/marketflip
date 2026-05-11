type Props = {
  text?: string | null;
};

export function MarketDescription({ text }: Props) {
  if (!text || !text.trim()) return null;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="mt-12 pt-10 border-t border-[var(--rule)]">
      <p className="eyebrow mb-4">Resolution criteria</p>
      <div className="text-[15px] leading-relaxed text-[var(--ink-soft)] space-y-3 max-w-prose">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
