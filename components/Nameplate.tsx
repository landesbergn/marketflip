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
    <header className="mf-nameplate sticky top-0 z-30">
      <div className="mf-nameplate__inner mx-auto max-w-[1024px] px-5 sm:px-8 lg:px-14 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile-only back affordance: icon with a 44px tap zone. The full
              text back link lives on the right next to About on desktop. */}
          {showBack && (
            <Link
              href={backHref}
              aria-label={backLabel.replace(/^←\s*/, "") || "Back"}
              className="mf-back-mobile inline-flex items-center justify-center text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors sm:hidden"
            >
              <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>←</span>
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 sm:gap-3 text-[19px] sm:text-[26px] min-w-0"
            style={{
              lineHeight: 1,
              letterSpacing: "-0.022em",
              color: "var(--ink)",
              fontWeight: 600,
            }}
          >
            <span className="flex-none mf-headercoin">
              <HeaderCoin />
            </span>
            <span
              className="whitespace-nowrap"
              style={{
                display: "inline-block",
                lineHeight: 1,
                paddingRight: "0.06em",
              }}
            >
              Market<span style={{ fontStyle: "italic", color: "var(--accent)" }}>Flip</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 flex-none">
          {showBack && (
            <Link
              href={backHref}
              className="eyebrow hidden sm:inline-flex items-center whitespace-nowrap"
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
