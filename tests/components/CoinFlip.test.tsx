import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CoinFlip } from "@/components/CoinFlip";

describe("<CoinFlip>", () => {
  it("renders the question and odds", () => {
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
    expect(screen.getByText(/Will the Fed cut rates/)).toBeInTheDocument();
    expect(screen.getByText(/56%/)).toBeInTheDocument();
  });

  it("clicking Flip reveals a result and calls onFlipComplete", async () => {
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
    const button = screen.getByRole("button", { name: /flip/i });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByText(/YES/i)).toBeInTheDocument();
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
