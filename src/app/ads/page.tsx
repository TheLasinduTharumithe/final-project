"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdCard from "@/components/AdCard";
import { subscribeToAuthState } from "@/lib/auth";
import { getPublishedPaidAds } from "@/services/ads";
import { getUserProfile } from "@/services/users";
import type { Ad, AppUser } from "@/types";

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAds() {
      try {
        const publishedAds = await getPublishedPaidAds();
        setAds(publishedAds);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Could not load advertisements.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        setProfile(null);
        return;
      }

      const userProfile = await getUserProfile(firebaseUser.uid);
      setProfile(userProfile);
    });

    loadAds();

    return () => unsubscribe();
  }, []);

  return (
    <section className="page-shell">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Published Ads</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            Restaurant promotions visible to all users
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            EcoPlate only shows advertisements when payment is marked as paid and the ad status is published.
          </p>
        </div>

        {profile?.role === "restaurant" ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/ads/new" className="btn-primary">
              Create Ad
            </Link>
            <Link href="/ads/my" className="btn-secondary">
              My Ads
            </Link>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="glass-card">
          <p className="text-slate-300">Loading advertisements...</p>
        </div>
      ) : error ? (
        <div className="glass-card">
          <p className="text-slate-300">{error}</p>
        </div>
      ) : ads.length ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} showMeta={false} />
          ))}
        </div>
      ) : (
        <div className="glass-card">
          <p className="text-slate-300">No published ads are available right now.</p>
        </div>
      )}
    </section>
  );
}
