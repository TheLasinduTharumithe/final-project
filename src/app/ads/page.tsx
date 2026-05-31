"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Megaphone, PlusCircle } from "lucide-react";
import AdCard from "@/components/AdCard";
import { DashboardSkeleton, PageHeader, StatePanel } from "@/components/WorkspaceUI";
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
      <PageHeader
        eyebrow="Published ads"
        title="Restaurant promotions"
        description="EcoPlate only shows advertisements when payment is paid and the ad status is published."
        actions={
          profile?.role === "restaurant" ? (
            <>
              <Link href="/ads/new" className="btn-primary">
                <PlusCircle className="h-4 w-4" />
                Create Ad
              </Link>
              <Link href="/ads/my" className="btn-secondary">
                <Megaphone className="h-4 w-4" />
                My Ads
              </Link>
            </>
          ) : null
        }
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <StatePanel title="Could not load advertisements" message={error} tone="error" />
      ) : ads.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} showMeta={false} />
          ))}
        </div>
      ) : (
        <StatePanel title="No published ads" message="Published restaurant promotions will appear here." />
      )}
    </section>
  );
}
