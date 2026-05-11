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
 * Turn a Polymarket-style question into a declarative statement.
 * "Will the Fed cut rates in June?" -> "The Fed cut rates in June."
 *
 * Pairs with a big YES./NO. header to communicate the outcome contextually
 * without needing hand-written yes/no copy per market.
 */
export function questionToStatement(question: string): string {
  if (!question) return "";
  let s = question.trim();
  // Strip leading "Will " (case-insensitive) and trailing "?"s.
  s = s.replace(/^Will\s+/i, "").replace(/\?+\s*$/, "").trim();
  if (!s) return question.trim();
  // Capitalize first letter, ensure trailing period.
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += ".";
  return s;
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

/**
 * Declarative statement for a matchup outcome.
 * "Pistons beat Cavaliers." — plural verb is the natural form for
 * most sports-team labels and reads acceptably for singular ones.
 */
export function matchupStatement(
  winnerLabel: string,
  loserLabel: string
): string {
  return `${winnerLabel} beat ${loserLabel}.`;
}
