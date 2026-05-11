import Link from "next/link";
import { HeaderCoin } from "./HeaderCoin";

type Props = {
  /** Show the "← Today" link on the right (used on non-home pages). */
  showBack?: boolean;
};

export function Nameplate({ showBack = false }: Props) {
  return (
    <header className="pt-9 pb-6">
      <div
        className="flex justify-between items-center"
        style={{ minHeight: 32 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-3"
          style={{
            fontSize: 22,
            lineHeight: 1,
            letterSpacing: "-0.018em",
            color: "var(--ink)",
            fontWeight: 600,
          }}
        >
          <HeaderCoin />
          <span style={{ display: "inline-block", lineHeight: 1 }}>
            Market<span style={{ fontStyle: "italic", color: "var(--accent)" }}>Flip</span>
          </span>
        </Link>
        {showBack && (
          <Link href="/" className="eyebrow inline-flex items-center">
            ← Today
          </Link>
        )}
      </div>
    </header>
  );
}
