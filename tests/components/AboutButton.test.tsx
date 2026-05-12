import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AboutButton } from "@/components/AboutButton";

// jsdom doesn't implement <dialog>.showModal()/close() so polyfill them.
beforeAll(() => {
  if (typeof HTMLDialogElement !== "undefined") {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute("open", "");
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      };
    }
  }
});

describe("<AboutButton>", () => {
  it("renders an About trigger", () => {
    render(<AboutButton />);
    expect(screen.getByRole("button", { name: /about/i })).toBeInTheDocument();
  });

  it("opens the dialog when the trigger is clicked", () => {
    const { container } = render(<AboutButton />);
    const dialog = container.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: /about/i }));

    expect(dialog).toHaveAttribute("open");
  });

  it("links to the GitHub source", () => {
    render(<AboutButton />);
    fireEvent.click(screen.getByRole("button", { name: /about/i }));
    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/landesbergn/marketflip"
    );
  });
});
