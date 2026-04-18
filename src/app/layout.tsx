import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import "@/styles/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://final-project-three-lime-79.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "EcoPlate",
  description: "Reduce food waste and connect restaurants with charities through one modern donation platform.",
  openGraph: {
    title: "EcoPlate",
    description:
      "Reduce food waste and connect restaurants with charities through one modern donation platform.",
    url: "/",
    siteName: "EcoPlate",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EcoPlate"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoPlate",
    description:
      "Reduce food waste and connect restaurants with charities through one modern donation platform.",
    images: ["/og-image.jpg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} min-h-screen`}>
        <div id="top" className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="hero-orb left-[-10rem] top-[-8rem] h-80 w-80 bg-emerald-400/16" />
            <div className="hero-orb right-[-6rem] top-16 h-[26rem] w-[26rem] bg-cyan-400/10" />
            <div className="hero-orb bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] bg-emerald-500/10" />
            <div className="grid-pattern absolute inset-0 opacity-[0.22]" />
            <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-emerald-400/8 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-950/70 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_42%)]" />
          </div>

          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
