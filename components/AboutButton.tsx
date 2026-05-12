"use client";

import { useEffect, useRef } from "react";

export function AboutButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  // Click the backdrop (the dialog element itself, outside the content
  // wrapper) to dismiss.
  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) close();
  };

  // Restore scroll when dialog closes (some browsers retain lock).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handle = () => {
      document.body.style.removeProperty("overflow");
    };
    dialog.addEventListener("close", handle);
    return () => dialog.removeEventListener("close", handle);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="eyebrow"
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        About
      </button>
      <dialog
        ref={dialogRef}
        className="about-dialog"
        onClick={onBackdropClick}
      >
        <div className="about-dialog-content">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="about-dialog-close"
          >
            ×
          </button>

          <p className="eyebrow">About</p>
          <h2
            className="display mt-2"
            style={{ fontSize: 36, lineHeight: 1.05 }}
          >
            Market<span style={{ fontStyle: "italic", color: "var(--accent)" }}>Flip</span>
          </h2>

          <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-[var(--ink-soft)]">
            <p>
              MarketFlip takes a live{" "}
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ink-link"
                style={{ color: "var(--accent)" }}
              >
                Polymarket
              </a>{" "}
              market, reads its implied probabilities, and lets you flip a coin
              weighted to those odds — once, or a hundred times.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-5">
            <a
              href="https://github.com/landesbergn/marketflip"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-link"
            >
              Source on GitHub &rarr;
            </a>
            <a
              href="https://github.com/landesbergn/marketflip/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="eyebrow"
              style={{ color: "var(--ink-faint)", textDecoration: "underline", textUnderlineOffset: 4 }}
            >
              Feedback
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
