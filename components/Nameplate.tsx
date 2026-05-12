import Link from "next/link";
import { HeaderCoin } from "./HeaderCoin";
import { AboutButton } from "./AboutButton";

type Props = {
  /** Show a "back" link on the right (used on non-home pages). */
  showBack?: boolean;
  /** Override the back link's href. Defaults to "/". */
  backHref?: string;
  /** Override the back link's label. Defaults to "← Today". */
  backLabel?: string;
};

export function Nameplate({
  showBack = false,
  backHref = "/",
  backLabel = "← Today",
}: Props) {
  return (
    <header className="pt-5 sm:pt-6 pb-4">
      <div
        className="flex justify-between items-center gap-3"
        style={{ minHeight: 32 }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 sm:gap-3 text-[20px] sm:text-[26px] min-w-0"
          style={{
            lineHeight: 1,
            letterSpacing: "-0.022em",
            color: "var(--ink)",
            fontWeight: 600,
          }}
        >
          <span className="flex-none">
            <HeaderCoin />
          </span>
          <span className="truncate" style={{ display: "inline-block", lineHeight: 1 }}>
            Market<span style={{ fontStyle: "italic", color: "var(--accent)" }}>Flip</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-5 flex-none">
          {showBack && (
            <Link
              href={backHref}
              className="eyebrow inline-flex items-center whitespace-nowrap"
            >
              {backLabel}
            </Link>
          )}
          <AboutButton />
        </div>
      </div>
    </header>
  );
}
