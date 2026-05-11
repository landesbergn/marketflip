import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SimulationPanel } from "@/components/SimulationPanel";

describe("<SimulationPanel>", () => {
  it("renders only the run link before the simulation is started", () => {
    render(<SimulationPanel slug="x" question="Q?" yesProbability={0.5} />);
    expect(
      screen.getByRole("button", { name: /run 1,000/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Distribution/i)).not.toBeInTheDocument();
  });

  it("clicking Run 1,000 opens the distribution panel", () => {
    render(<SimulationPanel slug="x" question="Q?" yesProbability={0.5} />);
    fireEvent.click(screen.getByRole("button", { name: /run 1,000/i }));
    expect(screen.getByText(/Distribution/i)).toBeInTheDocument();
  });
});
