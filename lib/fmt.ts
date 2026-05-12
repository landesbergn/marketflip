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

/**
 * Whether the market's outcome labels are the literal "Yes"/"No" pair.
 * When false, the labels carry meaning (e.g. team names, candidate names)
 * and should be displayed in place of "YES"/"NO" throughout the UI.
 */
export function isLiteralYesNo(yesLabel?: string, noLabel?: string): boolean {
  const y = (yesLabel ?? "Yes").trim().toLowerCase();
  const n = (noLabel ?? "No").trim().toLowerCase();
  return y === "yes" && n === "no";
}

/**
 * Display token for an outcome — "YES"/"NO" for literal markets,
 * otherwise the outcome's actual label (e.g. "Pistons", "Cavaliers").
 */
export function displayLabel(
  outcome: "YES" | "NO",
  yesLabel?: string,
  noLabel?: string
): string {
  if (isLiteralYesNo(yesLabel, noLabel)) return outcome;
  return outcome === "YES" ? yesLabel ?? "Yes" : noLabel ?? "No";
}

/**
 * Reframe a matchup-style question ("Pistons vs. Cavaliers") as a
 * proper Yes/No proposition ("Will Pistons beat Cavaliers?") whenever
 * the outcome labels carry meaning. Falls back to the original
 * question otherwise.
 */
export function reframeQuestion(
  question: string,
  yesLabel?: string,
  noLabel?: string
): string {
  if (!question) return question;
  if (isLiteralYesNo(yesLabel, noLabel)) return question;
  if (!yesLabel || !noLabel) return question;
  if (!/\bvs\.?\b/i.test(question)) return question;
  return `Will ${yesLabel} beat ${noLabel}?`;
}

export type Verdict = "AS EXPECTED" | "A TOSS-UP" | "SURPRISE";

/**
 * Classify a flip result by how the landed outcome compares to its
 * implied probability. The product's whole point is teaching that
 * a 91% market doesn't always resolve YES — verdicts surface that
 * relationship for the user on every flip.
 */
export function verdictFor(
  outcome: "YES" | "NO",
  yesProbability: number
): Verdict {
  const landedProb = outcome === "YES" ? yesProbability : 1 - yesProbability;
  if (landedProb >= 0.7) return "AS EXPECTED";
  if (landedProb <= 0.3) return "SURPRISE";
  return "A TOSS-UP";
}

/**
 * Contextual sentence beneath the verdict.
 * `outcomeLabel` should already be uppercased / team-cased as it'll display.
 * `landedOdds` is an integer 0-100.
 */
export function verdictCopy(
  verdict: Verdict,
  outcomeLabel: string,
  landedOdds: number
): string {
  switch (verdict) {
    case "AS EXPECTED":
      return `The market priced ${outcomeLabel} at ${landedOdds}% — the coin agreed.`;
    case "A TOSS-UP":
      return `Almost a coin flip — the market gave ${outcomeLabel} ${landedOdds}%.`;
    case "SURPRISE":
      return `The market gave ${outcomeLabel} just ${landedOdds}% — and yet, here we are.`;
  }
}
