import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nameplate } from "@/components/Nameplate";

// next/link needs no special mock in modern Next; it renders as <a>.

describe("<Nameplate>", () => {
  it("renders the MarketFlip wordmark and About trigger", () => {
    render(<Nameplate />);
    expect(screen.getByText(/Market/)).toBeInTheDocument();
    expect(screen.getByText(/Flip/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /about/i })).toBeInTheDocument();
  });

  it("renders the default back link when showBack is true", () => {
    render(<Nameplate showBack />);
    expect(
      screen.getByRole("link", { name: /← Today/ })
    ).toBeInTheDocument();
  });

  it("respects a custom backHref + backLabel", () => {
    render(
      <Nameplate
        showBack
        backHref="/m/election-2028"
        backLabel="← The field"
      />
    );
    const back = screen.getByRole("link", { name: /← The field/ });
    expect(back).toBeInTheDocument();
    expect(back).toHaveAttribute("href", "/m/election-2028");
  });

  it("hides the back link by default", () => {
    render(<Nameplate />);
    expect(screen.queryByRole("link", { name: /← Today/ })).toBeNull();
  });
});
