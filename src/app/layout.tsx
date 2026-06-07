// Purpose: Root Next.js layout that wires global styles, metadata, and shared shell UI.
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import ExpirationService from "@/components/ExpirationService";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

// ✅ FIX: use localhost for development
const siteUrl = "https://final-project-flax-xi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "EcoPlate",
  description:
    "Reduce food waste and connect restaurants with charities through one modern donation platform.",

  openGraph: {
    title: "EcoPlate",
    description:
      "Reduce food waste and connect restaurants with charities through one modern donation platform.",
    url: siteUrl,
    siteName: "EcoPlate",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "EcoPlate",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "EcoPlate",
    description:
      "Reduce food waste and connect restaurants with charities through one modern donation platform.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} min-h-screen`}>
        <div id="top" className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[#FAFAF8]">
            <div className="grid-pattern absolute inset-0 opacity-60" />
          </div>

          <AppShell>{children}</AppShell>
          <ExpirationService />
        </div>
      </body>
    </html>
  );
}
