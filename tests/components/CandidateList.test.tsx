import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CandidateList } from "@/components/CandidateList";
import type { ParentEvent } from "@/lib/types";

const event: ParentEvent = {
  slug: "ca-gov-2026",
  question: "California Governor 2026",
  endDate: "2026-11-03T00:00:00Z",
  url: "https://polymarket.com/event/ca-gov-2026",
  subMarkets: [
    {
      slug: "ca-gov-steyer",
      question: "Will Tom Steyer be the CA Governor winner?",
      yesProbability: 0.22,
    },
    {
      slug: "ca-gov-newsom",
      question: "Will Gavin Newsom be the CA Governor winner?",
      yesProbability: 0.41,
    },
  ],
};

describe("<CandidateList>", () => {
  it("renders a link row per sub-market with extracted candidate names", () => {
    render(<CandidateList event={event} />);
    const steyer = screen.getByRole("link", { name: /Tom Steyer/i });
    const newsom = screen.getByRole("link", { name: /Gavin Newsom/i });
    expect(steyer).toHaveAttribute("href", "/m/ca-gov-steyer");
    expect(newsom).toHaveAttribute("href", "/m/ca-gov-newsom");
  });

  it("renders rounded percentage labels", () => {
    render(<CandidateList event={event} />);
    expect(screen.getByText(/22%/)).toBeInTheDocument();
    expect(screen.getByText(/41%/)).toBeInTheDocument();
  });
});
