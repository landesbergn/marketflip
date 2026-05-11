export function fmtVol(n: number): string {
  if (n >= 10_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

export function fmtResolveDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Try to extract a candidate's name from a "Will X win Y?" style question.
 * Falls back to the whole question if the pattern doesn't match.
 */
export function extractCandidateName(question: string): string {
  const m = question.match(/^Will (.+?) (win|be|become|secure|take|defeat)\b/i);
  return m ? m[1].trim() : question;
}
