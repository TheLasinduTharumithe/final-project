"use client";

// Purpose: Public homepage that explains EcoPlate flows and highlights published ads.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  HandHeart,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  TrendingDown,
  Users2
} from "lucide-react";
import AdCard from "@/components/AdCard";
import HomepageAds from "@/components/HomepageAds";
import { StatePanel } from "@/components/WorkspaceUI";
import { getPublishedPaidAds } from "@/services/ads";
import type { Ad } from "@/types";

function unsplash(photoId: string, width = 1400) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=76`;
}

const images = {
  hero: unsplash("photo-1767562678474-c92cec881bc3", 1800),
  impact: unsplash("photo-1599059813005-11265ba4b4ce", 1400),
  restaurantUpload: unsplash("photo-1771574207826-02f0d845e3a7", 1000),
  charityRequest: unsplash("photo-1742836875995-738584294250", 1000),
  collection: unsplash("photo-1755599629285-91cc09a185c7", 1000),
  statsProduce: unsplash("photo-1738618140037-09e11c8e644a", 900),
  statsBoxes: unsplash("photo-1514792368985-f80e9d482a02", 900),
  assistant: unsplash("photo-1665686306265-c52ee9054479", 1200),
  restaurantAd: unsplash("photo-1762113246607-4299ec3f3214", 1000),
  footer: unsplash("photo-1593113646773-028c64a8f1b8", 1400)
};

const rolePaths = [
  {
    title: "Restaurants donate food",
    description: "Post surplus meals with quantity, freshness, pickup time, and collection notes.",
    href: "/register",
    action: "Register restaurant",
    icon: Building2
  },
  {
    title: "Charities collect safely",
    description: "Find suitable donations, request pickup, and coordinate approved collections.",
    href: "/register",
    action: "Register charity",
    icon: HandHeart
  },
  {
    title: "Teams track every handoff",
    description: "Use dashboards for requests, approvals, schedules, ads, and admin oversight.",
    href: "/login",
    action: "Open workspace",
    icon: LayoutDashboard
  }
];

const steps = [
  {
    step: "01",
    title: "Restaurant uploads surplus food",
    description: "Kitchen teams add practical donation details, safe pickup windows, and location guidance.",
    image: images.restaurantUpload,
    alt: "Restaurant kitchen staff preparing food behind a counter"
  },
  {
    step: "02",
    title: "Charity submits pickup request",
    description: "Coordinators review details and request the quantity their team can collect.",
    image: images.charityRequest,
    alt: "A person using a restaurant point of sale screen to coordinate an order"
  },
  {
    step: "03",
    title: "Food is collected and distributed",
    description: "Approved pickups move food from restaurants to community support teams.",
    image: images.collection,
    alt: "Volunteers stacking boxes of food for distribution"
  }
];

const stats = [
  {
    label: "Less waste",
    value: "Surplus redirected",
    note: "Food that would be discarded becomes a coordinated donation.",
    icon: TrendingDown
  },
  {
    label: "Faster pickup",
    value: "Clear requests",
    note: "Restaurants and charities see status, timing, and next actions.",
    icon: ClipboardCheck
  },
  {
    label: "Safer handoff",
    value: "Better context",
    note: "Pickup notes, locations, and quantities reduce day-of confusion.",
    icon: PackageCheck
  }
];

const platformChecks = [
  "Restaurants create donation listings with real pickup details.",
  "Charities request food and track approved collection schedules.",
  "Admins review accounts and advertisements before public visibility."
];

export default function HomePage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAds() {
      try {
        const publishedAds = await getPublishedPaidAds();
        setAds(publishedAds);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Could not load published ads.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadAds();
  }, []);

  return (
    <div className="pb-10">
      {!loading && !error && ads.length ? <HomepageAds ads={ads} /> : null}

      <section className="page-shell">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)] xl:items-stretch">
          <div className="rounded-lg border border-[#E5E7EB] bg-[#F8F6F0] p-5 shadow-sm sm:p-6 lg:p-8">
            <p className="page-eyebrow">EcoPlate platform</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#1F2937] sm:text-5xl">
              Restaurants donate food. Charities collect it. Communities benefit.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#6B7280]">
              EcoPlate connects restaurant surplus with trusted charity pickup teams so food
              rescue work feels organized, safe, and dependable from the first listing to the
              final handoff.
            </p>
          </div>

          <div className="relative min-h-[24rem] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <Image
              src={images.hero}
              alt="Restaurant staff preparing packaged food in a busy kitchen for community pickup"
              fill
              priority
              sizes="(min-width: 1280px) 48vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-5 sm:p-6">
              <div className="max-w-xl rounded-lg border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D32]">
                  Food rescue in motion
                </p>
                <p className="mt-2 text-sm leading-6 text-[#374151]">
                  Real coordination starts in practical places: kitchens, packed meals, collection
                  counters, and volunteer schedules.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {rolePaths.map((path) => {
            const Icon = path.icon;

            return (
              <Link
                key={path.title}
                href={path.href}
                className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#A5D6A7] hover:bg-[#F8F6F0]"
              >
                <div className="feature-icon-wrap">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold leading-snug text-[#1F2937]">
                  {path.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{path.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32]">
                  {path.action}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="relative min-h-[22rem] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <Image
              src={images.impact}
              alt="Volunteers sorting food donations for community support"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="card">
            <p className="page-eyebrow">Real-world impact</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#1F2937]">
              Food reaches people faster when every handoff is visible.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6B7280] sm:text-base">
              EcoPlate is designed around the people doing the work: kitchen staff preparing safe
              donations, charity coordinators planning pickup routes, and volunteers distributing
              food where it is needed.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {platformChecks.map((item) => (
                <div key={item} className="rounded-md border border-[#E5E7EB] bg-[#F8F6F0] p-3 text-sm leading-6 text-[#374151]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">How it works</p>
            <h2 className="page-title">A clean three-step flow from surplus to support.</h2>
            <p className="page-description">
              The homepage shows the actual user journey: restaurants list food, charities request
              pickup, and volunteers complete the handoff.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {steps.map((step) => (
            <article key={step.step} className="card overflow-hidden p-0">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-[#E5E7EB]">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(min-width: 1024px) 31vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <span className="status-badge border-[#A5D6A7] bg-[#E8F5E9] text-[#1F5A24]">
                  Step {step.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#1F2937]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="stat-card">
                  <Icon className="h-5 w-5 text-[#2E7D32]" />
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#1F2937]">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{stat.note}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative min-h-[12rem] overflow-hidden rounded-lg border border-[#E5E7EB]">
              <Image
                src={images.statsProduce}
                alt="Canned food donations prepared for a food pantry"
                fill
                sizes="180px"
                className="object-cover"
              />
            </div>
            <div className="relative min-h-[12rem] overflow-hidden rounded-lg border border-[#E5E7EB]">
              <Image
                src={images.statsBoxes}
                alt="Stacked food donation boxes and pantry supplies"
                fill
                sizes="180px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="card">
            <p className="page-eyebrow">AI assistant</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#1F2937]">
              Practical support for food safety and coordination questions.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#6B7280] sm:text-base">
              The assistant should feel like a useful operations tool, not a character. It helps
              users clarify pickup instructions, safe packaging notes, and donation questions while
              staying inside the EcoPlate workflow.
            </p>
            <Link href="/chat" className="btn-primary mt-6">
              Open AI Assistant
              <MessageSquareText className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-[22rem] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <Image
              src={images.assistant}
              alt="A user reviewing a support interface on a laptop"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">Local restaurant visibility</p>
            <h2 className="page-title">Published promotions stay connected to the community.</h2>
            <p className="page-description">
              Advertisements use the same trust model as donations: submitted by restaurants,
              reviewed by admins, and shown only when paid and published.
            </p>
          </div>
          <Link href="/ads" className="btn-secondary">
            View All Ads
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <div className="relative min-h-[18rem] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <Image
              src={images.restaurantAd}
              alt="A restaurant kitchen during service with staff preparing plates"
              fill
              sizes="(min-width: 1280px) 330px, 100vw"
              className="object-cover"
            />
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
              {[0, 1, 2].map((item) => (
                <div key={item} className="card p-0">
                  <div className="skeleton-line aspect-[16/9] rounded-none" />
                  <div className="space-y-3 p-5">
                    <div className="skeleton-line h-4 w-32" />
                    <div className="skeleton-line h-5 w-3/4" />
                    <div className="skeleton-line h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <StatePanel title="Could not load ads" message={error} tone="error" />
          ) : ads.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {ads.slice(0, 3).map((ad) => (
                <AdCard key={ad.id} ad={ad} showMeta={false} />
              ))}
            </div>
          ) : (
            <StatePanel
              title="No published ads"
              message="Restaurant promotions will appear here after admin approval and payment confirmation."
            />
          )}
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          <div className="relative min-h-[14rem]">
            <Image
              src={images.footer}
              alt="People standing near boxes of food donations"
              fill
              sizes="100vw"
              className="object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="absolute inset-0 flex items-end p-5 sm:p-6 lg:p-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="feature-icon-wrap">
                  <Users2 className="h-5 w-5" />
                </div>
                <p className="page-eyebrow">Sustainable community support</p>
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                EcoPlate makes food rescue easier to coordinate, easier to trust, and easier to repeat.
              </h2>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
