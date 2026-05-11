import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CoinFlip } from "@/components/CoinFlip";

describe("<CoinFlip>", () => {
  it("renders the idle CTA and exposes odds via aria-label", () => {
    render(
      <CoinFlip
        slug="x"
        question="Will the Fed cut rates?"
        yesProbability={0.56}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
      />
    );
    expect(
      screen.getByRole("button", { name: /flip the coin/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Implied odds: Yes 56%, No 44%/)
    ).toBeInTheDocument();
  });

  it("clicking Flip reveals YES and calls onFlipComplete", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        question="Q?"
        yesProbability={1}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /flip/i }));
    });
    expect(screen.getByRole("status")).toHaveTextContent(/YES/);
    expect(onFlipComplete).toHaveBeenCalledWith("YES");
  });

  it("p=0 always lands NO", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        question="Q?"
        yesProbability={0}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /flip/i }));
    });
    expect(onFlipComplete).toHaveBeenCalledWith("NO");
  });
});
