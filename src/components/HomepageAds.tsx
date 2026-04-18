"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Megaphone, Phone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Ad } from "@/types";

interface HomepageAdsProps {
  ads: Ad[];
}

const VISIBILITY_DURATION = 60_000;
const ROTATION_DURATION = 12_000;

export default function HomepageAds({ ads }: HomepageAdsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const featuredAds = useMemo(() => ads.slice(0, 5), [ads]);

  useEffect(() => {
    if (!featuredAds.length || dismissed) {
      return;
    }

    const visibilityInterval = window.setInterval(() => {
      setIsVisible((current) => !current);
    }, VISIBILITY_DURATION);

    return () => {
      window.clearInterval(visibilityInterval);
    };
  }, [dismissed, featuredAds.length]);

  useEffect(() => {
    if (!isVisible || dismissed || featuredAds.length <= 1) {
      return;
    }

    const rotationInterval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredAds.length);
    }, ROTATION_DURATION);

    return () => {
      window.clearInterval(rotationInterval);
    };
  }, [dismissed, featuredAds.length, isVisible]);

  useEffect(() => {
    setActiveIndex(0);
  }, [featuredAds.length]);

  if (!featuredAds.length || dismissed) {
    return null;
  }

  const activeAd = featuredAds[activeIndex] ?? featuredAds[0];
  const shortDescription =
    activeAd.description.length > 120
      ? `${activeAd.description.slice(0, 117).trimEnd()}...`
      : activeAd.description;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 sm:left-auto sm:right-4 sm:w-[24rem] lg:right-6 lg:top-[6.5rem] lg:bottom-auto lg:w-[25rem]">
      <AnimatePresence mode="wait">
        {isVisible ? (
          <motion.aside
            key={activeAd.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="pointer-events-auto group relative overflow-hidden rounded-[26px] border border-white/10 bg-[rgba(11,27,43,0.92)] shadow-[0_24px_80px_rgba(2,6,23,0.34)] backdrop-blur-2xl sm:rounded-[28px]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.12),transparent_36%,rgba(6,182,212,0.12))]" />

            <div className="relative">
              {activeAd.imageUrl ? (
                <img
                  src={activeAd.imageUrl}
                  alt={activeAd.title}
                  className="h-44 w-full object-cover sm:h-52 lg:h-44 xl:h-48"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-44 w-full items-center justify-center bg-white/[0.05] text-sm text-slate-400 sm:h-52 lg:h-44 xl:h-48">
                  Advertisement image unavailable
                </div>
              )}

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-emerald-200 backdrop-blur">
                <Megaphone className="h-3.5 w-3.5" />
                Featured Ad
              </div>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-200 transition hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06121C]"
                aria-label="Dismiss featured ad"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative space-y-4 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                    Community Spotlight
                  </p>
                  <h2 className="mt-2 break-words text-xl font-semibold text-white">
                    {activeAd.title}
                  </h2>
                </div>
                {featuredAds.length > 1 ? (
                  <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                    {activeIndex + 1}/{featuredAds.length}
                  </div>
                ) : null}
              </div>

              <p className="text-sm leading-6 text-slate-300">{shortDescription}</p>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href={`tel:${activeAd.contactNumber}`}
                  className="btn-primary min-h-[3rem] w-full px-4 py-3 sm:w-auto"
                >
                  <Phone className="h-4 w-4" />
                  Contact
                </a>
                <Link href="/ads" className="btn-secondary min-h-[3rem] w-full px-4 py-3 sm:w-auto">
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.2em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <span>Visible for 1 minute</span>
                <span>Returns automatically</span>
              </div>
            </div>
          </motion.aside>
        ) : (
          <motion.button
            key="featured-ad-minimized"
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setIsVisible(true)}
            className="pointer-events-auto inline-flex w-full items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[rgba(11,27,43,0.88)] px-4 py-3.5 text-left shadow-[0_20px_60px_rgba(2,6,23,0.28)] backdrop-blur-2xl sm:px-5"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-white">
              <Megaphone className="h-4 w-4 text-emerald-300" />
              Featured ads are paused
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Show now
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
