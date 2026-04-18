"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Boxes,
  Building2,
  HandHeart,
  HeartHandshake,
  Leaf,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Truck,
  Users2
} from "lucide-react";
import AdCard from "@/components/AdCard";
import HomepageAds from "@/components/HomepageAds";
import { getPublishedPaidAds } from "@/services/ads";
import type { Ad } from "@/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut" as const
    }
  }
};

const viewport = { once: true, amount: 0.2 } as const;

const heroHighlights = [
  {
    value: "Fast setup",
    label: "Launch restaurant and charity coordination in a clean shared workflow."
  },
  {
    value: "Trusted flow",
    label: "Approvals, logistics, and public visibility stay structured and clear."
  },
  {
    value: "AI-ready",
    label: "Food safety and donation guidance are available when teams need help."
  }
];

const features = [
  {
    title: "Donate Surplus Food",
    description:
      "Restaurants can list available meals with collection windows, freshness notes, and clear operational details.",
    icon: Boxes
  },
  {
    title: "Request Donations",
    description:
      "Charities can find suitable donations, submit requests quickly, and keep conversations focused on action.",
    icon: HeartHandshake
  },
  {
    title: "AI Assistance",
    description:
      "EcoPlate Assistant helps with safety guidance, packing suggestions, and the everyday questions teams ask most.",
    icon: Bot
  },
  {
    title: "Real-Time Coordination",
    description:
      "Status updates, approvals, and logistics all stay visible so every handoff feels reliable and easy to follow.",
    icon: Truck
  }
];

const steps = [
  {
    step: "01",
    title: "Restaurant posts donation",
    description:
      "Share surplus food details, pickup windows, quantities, and handling notes in a few clear steps.",
    icon: Building2
  },
  {
    step: "02",
    title: "Charity requests support",
    description:
      "Eligible charities review live listings, request what they need, and move quickly without messy back-and-forth.",
    icon: HandHeart
  },
  {
    step: "03",
    title: "Approval and logistics",
    description:
      "The platform keeps approvals, timing, and coordination transparent so both sides know what happens next.",
    icon: ShieldCheck
  },
  {
    step: "04",
    title: "Delivery completed",
    description:
      "Pickup or delivery is confirmed with a cleaner record of community impact and platform activity.",
    icon: BadgeCheck
  }
];

const platformBenefits = [
  {
    label: "Restaurants connected",
    value: "Growing network",
    note: "Built for restaurants that want a professional way to manage surplus food responsibly."
  },
  {
    label: "Charities supported",
    value: "Community-first",
    note: "Designed to help nonprofits discover relevant food donations with less friction."
  },
  {
    label: "Donations handled",
    value: "Structured workflow",
    note: "Every donation moves through a cleaner operational flow from posting to completion."
  },
  {
    label: "AI help available",
    value: "24/7 guidance",
    note: "Teams can access food safety and coordination support whenever questions come up."
  }
];

const liveAdSignals = [
  "Only paid and published ads appear in the public feed.",
  "Promotions fit naturally into the wider donation ecosystem.",
  "The section stays useful even when no ads are currently live."
];

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Register", href: "/register" },
      { label: "Login", href: "/login" },
      { label: "AI Assistant", href: "/chat" }
    ]
  },
  {
    title: "Explore",
    links: [
      { label: "Public Ads", href: "/ads" },
      { label: "Donations", href: "/donations" },
      { label: "Requests", href: "/requests" }
    ]
  }
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
    <div className="pb-16 sm:pb-20">
      {!loading && !error && ads.length ? <HomepageAds ads={ads} /> : null}

      <section className="page-shell pt-8 sm:pt-12 lg:pt-16">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,27,43,0.94),rgba(6,18,28,0.98))] shadow-[0_36px_120px_rgba(2,6,23,0.42)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-[linear-gradient(90deg,rgba(255,255,255,0.03),transparent)] lg:block" />
          <div className="pointer-events-none absolute left-[-10%] top-[-14%] h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 grid gap-14 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12 lg:py-16 xl:px-16"
          >
            <div className="max-w-2xl">
              <motion.div variants={itemVariants} className="section-kicker">
                <Sparkles className="h-4 w-4" />
                Trusted Surplus Food Coordination
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="mt-6 text-4xl font-semibold leading-[0.96] tracking-tight text-white sm:text-5xl lg:text-[4.5rem]"
              >
                Reduce Food Waste.{" "}
                <span className="text-gradient">Feed Communities.</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg"
              >
                EcoPlate gives restaurants, charities, and coordinators one polished platform to
                manage surplus food donations, respond faster, and keep every handoff clear.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              >
                <Link href="/register" className="btn-primary">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#learn-more" className="btn-secondary">
                  Learn More
                </Link>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="mt-10 grid gap-3 sm:grid-cols-3"
              >
                {heroHighlights.map((highlight) => (
                  <div
                    key={highlight.value}
                    className="rounded-[24px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_18px_50px_rgba(2,6,23,0.18)] backdrop-blur-xl"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      {highlight.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{highlight.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="relative mx-auto w-full max-w-[34rem]">
              <div className="absolute inset-x-10 top-6 h-32 rounded-full bg-emerald-400/12 blur-3xl" />
              <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-[28px] border border-white/10 bg-white/[0.05] backdrop-blur-xl lg:block" />
              <div className="absolute -right-3 bottom-16 hidden h-28 w-28 rounded-full border border-cyan-300/20 bg-cyan-400/10 backdrop-blur-xl lg:block" />

              <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[rgba(16,34,53,0.78)] p-5 shadow-[0_28px_100px_rgba(2,6,23,0.4)] backdrop-blur-2xl sm:p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">
                      Operations Overview
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">EcoPlate Dashboard</h2>
                  </div>
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Live coordination
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-300">Today&apos;s active flow</p>
                        <p className="mt-2 text-3xl font-semibold text-white">18 open pickups</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-emerald-400/10 text-emerald-300">
                        <Leaf className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-[20px] border border-white/10 bg-[#0B1B2B] px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">Fresh meal boxes</span>
                          <span className="font-medium text-white">Ready in 20 min</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10">
                          <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                        </div>
                      </div>
                      <div className="rounded-[20px] border border-white/10 bg-[#0B1B2B] px-4 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">Charity response rate</span>
                          <span className="font-medium text-white">Real-time updates</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10">
                          <div className="h-2 w-[66%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                      <div className="flex items-center gap-3">
                        <div className="feature-icon-wrap h-11 w-11 rounded-[18px]">
                          <Users2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-300">Network health</p>
                          <p className="text-lg font-semibold text-white">Restaurants and charities aligned</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-emerald-400/14 to-cyan-400/14 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                        Assistant
                      </p>
                      <p className="mt-3 text-base font-semibold text-white">
                        Packing guidance, donation safety, and response support in one place.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-200">
                        <MessageSquareText className="h-4 w-4 text-emerald-300" />
                        AI help available
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Post</p>
                    <p className="mt-2 text-sm font-semibold text-white">Restaurant shares donation details</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approve</p>
                    <p className="mt-2 text-sm font-semibold text-white">Requests and logistics stay organized</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Deliver</p>
                    <p className="mt-2 text-sm font-semibold text-white">Communities receive food with confidence</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="learn-more" className="home-section">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-10"
        >
          <motion.div variants={itemVariants} className="section-kicker">
            <Boxes className="h-4 w-4" />
            Core Features
          </motion.div>
          <motion.h2 variants={itemVariants} className="section-title">
            Purpose-built features for cleaner donation workflows and better coordination.
          </motion.h2>
          <motion.p variants={itemVariants} className="section-copy">
            Every section is designed to feel professional and easy to trust, with just enough
            polish to present EcoPlate like a real modern SaaS platform.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="glass-card p-6"
              >
                <div className="feature-icon-wrap">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="home-section">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-10"
        >
          <motion.div variants={itemVariants} className="section-kicker">
            <Truck className="h-4 w-4" />
            How It Works
          </motion.div>
          <motion.h2 variants={itemVariants} className="section-title">
            A simple four-step flow that keeps donors, charities, and coordinators in sync.
          </motion.h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid gap-5 lg:grid-cols-4"
        >
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.step}
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {step.step}
                  </span>
                  <div className="feature-icon-wrap h-11 w-11 rounded-[18px]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="home-section">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-10 grid gap-6 lg:grid-cols-[1fr_0.78fr] lg:items-start"
        >
          <div>
            <motion.div variants={itemVariants} className="section-kicker">
              <Megaphone className="h-4 w-4" />
              Live Ads And Community
            </motion.div>
            <motion.h2 variants={itemVariants} className="section-title">
              Public promotions that feel curated, trustworthy, and naturally part of the platform.
            </motion.h2>
            <motion.p variants={itemVariants} className="section-copy">
              Approved promotions appear in an auto-show featured widget while the full published
              set remains easy to browse below.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="surface-panel-soft p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
              Why this works
            </p>
            <div className="mt-4 space-y-3">
              {liveAdSignals.map((signal) => (
                <div
                  key={signal}
                  className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                >
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
            <Link href="/ads" className="btn-secondary mt-6 w-full sm:w-auto">
              View All Ads
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="card animate-pulse overflow-hidden border-white/10 bg-white/[0.04] p-0"
              >
                <div className="h-56 bg-white/[0.06]" />
                <div className="space-y-4 p-6">
                  <div className="h-3 w-28 rounded-full bg-white/[0.08]" />
                  <div className="h-6 w-3/4 rounded-full bg-white/[0.08]" />
                  <div className="h-16 rounded-[20px] bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-8">
            <p className="text-base text-slate-200">{error}</p>
          </div>
        ) : ads.length ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {ads.slice(0, 3).map((ad, index) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
              >
                <AdCard ad={ad} showMeta={false} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                  Placeholder ready
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  No live ads yet, but the community section is ready to showcase them beautifully.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  When promotions are published, they will appear here in the same premium layout
                  without any extra homepage changes.
                </p>
              </div>
              <Link href="/ads/new" className="btn-primary">
                Create An Ad
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="home-section">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-10"
        >
          <motion.div variants={itemVariants} className="section-kicker">
            <Users2 className="h-4 w-4" />
            Platform Benefits
          </motion.div>
          <motion.h2 variants={itemVariants} className="section-title">
            Stronger trust, clearer operations, and a platform that feels ready for real teams.
          </motion.h2>
        </motion.div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="grid gap-5 sm:grid-cols-2"
          >
            {platformBenefits.map((benefit) => (
              <motion.div key={benefit.label} variants={itemVariants} className="glass-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {benefit.label}
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">{benefit.value}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{benefit.note}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="surface-panel relative overflow-hidden p-8 sm:p-10"
          >
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Why teams choose EcoPlate
            </p>
            <h3 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Better visibility across every donation touchpoint.
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-300">
              EcoPlate is easier to trust because the experience is focused: restaurants can post,
              charities can respond, teams can coordinate, and the platform can stay polished while
              doing it.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <div className="feature-icon-wrap h-11 w-11 rounded-[18px]">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Waste reduction with clarity</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Keep sustainability goals visible through a cleaner and more usable product
                      experience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <div className="feature-icon-wrap h-11 w-11 rounded-[18px]">
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">Communication that stays actionable</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Clear interfaces help teams move from discovery to delivery without visual
                      noise or operational confusion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="home-section">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,197,94,0.18),rgba(16,34,53,0.88),rgba(6,182,212,0.16))] px-6 py-10 shadow-[0_26px_90px_rgba(2,6,23,0.34)] backdrop-blur-xl sm:px-8 lg:px-12 lg:py-12"
        >
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-cyan-300/12 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="section-kicker">
                <Sparkles className="h-4 w-4" />
                Ready To Start
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-white sm:text-4xl">
                Build a cleaner donation experience for restaurants and communities.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-200">
                Sign up for EcoPlate and bring food donation coordination, public visibility, and
                AI support into one modern workflow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/chat" className="btn-secondary">
                Open AI Assistant
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="page-shell pt-4">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] px-6 py-8 shadow-[0_20px_70px_rgba(2,6,23,0.24)] backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06]">
                  <Image
                    src="/og-image.jpg"
                    alt="EcoPlate logo"
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">EcoPlate</p>
                  <p className="text-sm text-slate-400">Modern food donation coordination</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                A premium platform for reducing restaurant food waste, supporting charities, and
                making community impact easier to coordinate.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {group.title}
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
