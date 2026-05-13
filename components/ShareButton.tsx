"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export function ShareButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ text })
    ) {
      try {
        // No title — some share targets concatenate title + text and
        // we don't want a leading "MarketFlip" line glued to the share.
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // even if clipboard fails, show "Copied" briefly so the user gets feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={onClick}
      className="btn-link inline-flex items-center gap-2"
      aria-live="polite"
      style={{ color: copied ? "var(--ink)" : undefined }}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
            <polyline
              points="1.5,6 4.5,9 9.5,2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            style={{ marginTop: -1 }}
            aria-hidden="true"
          >
            <path
              d="M5.5,7.5 L5.5,1.5 M3,4 L5.5,1.5 L8,4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2,7 L2,9.5 L9,9.5 L9,7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share flip
        </>
      )}
    </button>
  );
}
