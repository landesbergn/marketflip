import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CoinFlip } from "@/components/CoinFlip";

describe("<CoinFlip>", () => {
  it("renders the idle CTA and exposes odds via aria-label", () => {
    render(
      <CoinFlip
        slug="x"
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

  it("clicking Flip with yesProbability=1 shows YES verdict and fires onFlipComplete", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        yesProbability={1}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /flip the coin/i }));
    });
    expect(onFlipComplete).toHaveBeenCalledWith("YES");
    // Verdict (the role="status" element) classifies the flip relative
    // to its implied probability. A 100% YES flip lands AS EXPECTED.
    expect(screen.getByRole("status")).toHaveTextContent(/EXPECTED/);
    expect(
      screen.getByText(/market priced YES at 100%/i)
    ).toBeInTheDocument();
    // Flip Again button replaces Flip the Coin once landed.
    expect(
      screen.getByRole("button", { name: /flip again/i })
    ).toBeInTheDocument();
  });

  it("yesProbability=0 fires onFlipComplete with NO", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        yesProbability={0}
        outcomeYesLabel="Yes"
        outcomeNoLabel="No"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /flip the coin/i }));
    });
    expect(onFlipComplete).toHaveBeenCalledWith("NO");
    expect(
      screen.getByText(/market priced NO at 100%/i)
    ).toBeInTheDocument();
  });

  it("uses meaningful outcome labels when they're not literal Yes/No", async () => {
    const onFlipComplete = vi.fn();
    render(
      <CoinFlip
        slug="x"
        yesProbability={1}
        outcomeYesLabel="Pistons"
        outcomeNoLabel="Cavaliers"
        flipDurationMs={0}
        onFlipComplete={onFlipComplete}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /flip the coin/i }));
    });
    // For matchup-style markets the verdict copy uses the team labels,
    // not the literal "YES"/"NO" token.
    expect(
      screen.getByText(/market priced PISTONS at 100%/i)
    ).toBeInTheDocument();
  });
});
