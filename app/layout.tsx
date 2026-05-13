import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketflip.xyz";
const SITE_TITLE = "MarketFlip — Flip a market";
const SITE_DESCRIPTION =
  "Each market is a coin weighted to its live odds. Pull one for a flip, or a thousand.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // Per-page titles ("Will Bitcoin hit $150k?") get suffixed with the
    // brand so iMessage / share previews still read as MarketFlip.
    template: "%s · MarketFlip",
  },
  description: SITE_DESCRIPTION,
  applicationName: "MarketFlip",
  openGraph: {
    type: "website",
    siteName: "MarketFlip",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    // The branded image lives at app/opengraph-image.tsx — Next.js wires
    // it into the metadata automatically. Per-market routes can override
    // by colocating their own opengraph-image file.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
