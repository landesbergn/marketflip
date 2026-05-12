import { describe, it, expect } from "vitest";
import {
  displayLabel,
  extractCandidateName,
  fmtResolveDate,
  fmtVol,
  isLiteralYesNo,
  matchupStatement,
  questionToStatement,
  reframeQuestion,
  verdictCopy,
  verdictFor,
} from "@/lib/fmt";

describe("fmtVol", () => {
  it("compacts millions with one decimal", () => {
    expect(fmtVol(4_200_000)).toBe("$4.2M");
  });

  it("drops the decimal once volume crosses $10M", () => {
    expect(fmtVol(24_400_000)).toBe("$24M");
  });

  it("compacts thousands without decimals", () => {
    expect(fmtVol(740_000)).toBe("$740K");
    expect(fmtVol(1_000)).toBe("$1K");
  });

  it("uses raw notation below $1K", () => {
    expect(fmtVol(412)).toBe("$412");
  });
});

describe("fmtResolveDate", () => {
  it("formats an ISO date in US short form", () => {
    expect(fmtResolveDate("2026-06-15T00:00:00Z")).toMatch(
      /Jun \d{1,2}, 2026/
    );
  });

  it("returns an empty string for missing / invalid dates", () => {
    expect(fmtResolveDate("")).toBe("");
    expect(fmtResolveDate("not-a-date")).toBe("");
  });
});

describe("extractCandidateName", () => {
  it("pulls the subject out of a 'Will X win Y?' question", () => {
    expect(
      extractCandidateName("Will JD Vance win the 2028 election?")
    ).toBe("JD Vance");
    expect(
      extractCandidateName("Will Gavin Newsom be the next CA governor?")
    ).toBe("Gavin Newsom");
  });

  it("falls back to the full question when the pattern doesn't match", () => {
    expect(extractCandidateName("Pistons vs. Cavaliers")).toBe(
      "Pistons vs. Cavaliers"
    );
  });
});

describe("questionToStatement", () => {
  it("strips leading 'Will ' and trailing '?'", () => {
    expect(questionToStatement("Will the Fed cut rates in June?")).toBe(
      "The Fed cut rates in June."
    );
  });

  it("preserves declarative input", () => {
    expect(questionToStatement("Bitcoin clears $200k")).toBe(
      "Bitcoin clears $200k."
    );
  });

  it("returns empty string for empty input", () => {
    expect(questionToStatement("")).toBe("");
  });
});

describe("isLiteralYesNo", () => {
  it("is true for the canonical Yes / No pair", () => {
    expect(isLiteralYesNo("Yes", "No")).toBe(true);
    expect(isLiteralYesNo("yes", "no")).toBe(true);
    expect(isLiteralYesNo(undefined, undefined)).toBe(true);
  });

  it("is false when either label is meaningful", () => {
    expect(isLiteralYesNo("Pistons", "Cavaliers")).toBe(false);
    expect(isLiteralYesNo("Yes", "Cavaliers")).toBe(false);
    expect(isLiteralYesNo("JD Vance", "No")).toBe(false);
  });
});

describe("displayLabel", () => {
  it("returns the literal outcome for Yes/No markets", () => {
    expect(displayLabel("YES", "Yes", "No")).toBe("YES");
    expect(displayLabel("NO", "Yes", "No")).toBe("NO");
  });

  it("returns the actual label for matchup-style markets", () => {
    expect(displayLabel("YES", "Pistons", "Cavaliers")).toBe("Pistons");
    expect(displayLabel("NO", "Pistons", "Cavaliers")).toBe("Cavaliers");
  });
});

describe("reframeQuestion", () => {
  it("reframes 'X vs. Y' matchups as 'Will X beat Y?'", () => {
    expect(
      reframeQuestion("Pistons vs. Cavaliers", "Pistons", "Cavaliers")
    ).toBe("Will Pistons beat Cavaliers?");
    expect(
      reframeQuestion("Real Madrid vs Liverpool", "Real Madrid", "Liverpool")
    ).toBe("Will Real Madrid beat Liverpool?");
  });

  it("leaves non-matchup questions alone", () => {
    expect(
      reframeQuestion("Will the Fed cut rates?", "Yes", "No")
    ).toBe("Will the Fed cut rates?");
  });

  it("doesn't reframe when labels are literal Yes/No", () => {
    expect(
      reframeQuestion("Pistons vs. Cavaliers", "Yes", "No")
    ).toBe("Pistons vs. Cavaliers");
  });
});

describe("matchupStatement", () => {
  it("forms 'X beat Y.'", () => {
    expect(matchupStatement("Pistons", "Cavaliers")).toBe(
      "Pistons beat Cavaliers."
    );
  });
});

describe("verdictFor", () => {
  it("classifies a high-probability outcome as AS EXPECTED", () => {
    expect(verdictFor("YES", 0.91)).toBe("AS EXPECTED");
    expect(verdictFor("NO", 0.05)).toBe("AS EXPECTED");
    // Borderline: 70% landed-probability is the threshold.
    expect(verdictFor("YES", 0.7)).toBe("AS EXPECTED");
  });

  it("classifies a low-probability outcome as SURPRISE", () => {
    expect(verdictFor("YES", 0.09)).toBe("SURPRISE");
    expect(verdictFor("NO", 0.91)).toBe("SURPRISE");
    // Borderline: 30% landed-probability is the threshold.
    expect(verdictFor("YES", 0.3)).toBe("SURPRISE");
  });

  it("classifies near-even flips as A TOSS-UP", () => {
    expect(verdictFor("YES", 0.5)).toBe("A TOSS-UP");
    expect(verdictFor("NO", 0.55)).toBe("A TOSS-UP");
    expect(verdictFor("YES", 0.69)).toBe("A TOSS-UP");
  });
});

describe("verdictCopy", () => {
  it("composes AS EXPECTED copy from the landed label and odds", () => {
    expect(verdictCopy("AS EXPECTED", "YES", 91)).toBe(
      "The market priced YES at 91% — the coin agreed."
    );
  });

  it("composes SURPRISE copy", () => {
    expect(verdictCopy("SURPRISE", "PISTONS", 9)).toBe(
      "The market gave PISTONS just 9% — and yet, here we are."
    );
  });

  it("composes A TOSS-UP copy", () => {
    expect(verdictCopy("A TOSS-UP", "NO", 55)).toBe(
      "Almost a coin flip — the market gave NO 55%."
    );
  });
});
