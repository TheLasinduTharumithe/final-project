"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdCard from "@/components/AdCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { getAdsByRestaurant } from "@/services/ads";
import { getUserProfile } from "@/services/users";
import type { Ad } from "@/types";

export default function MyAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser || !isActive) {
        return;
      }

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);

        if (!userProfile || !isActive) {
          setLoading(false);
          return;
        }

        const adList = await getAdsByRestaurant(userProfile.id);

        if (!isActive) {
          return;
        }

        setAds(adList);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : "Could not load your ads.";
        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return (
    <ProtectedRoute allowedRoles={["restaurant"]}>
      <section className="page-shell">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">My Advertisements</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Track your submitted ads</h1>
          </div>
          <Link href="/ads/new" className="btn-primary">
            Create Ad
          </Link>
        </div>

        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading your ads...</p>
          </div>
        ) : error ? (
          <div className="glass-card">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : ads.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="glass-card">
            <p className="text-slate-300">You have not submitted any ads yet.</p>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
