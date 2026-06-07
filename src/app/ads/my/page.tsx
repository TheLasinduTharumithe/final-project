"use client";

// Purpose: Restaurant advertisement dashboard for managing submitted promotions.

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import AdCard from "@/components/AdCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, MetricCard, PageHeader, StatePanel } from "@/components/WorkspaceUI";
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

  const pendingAds = ads.filter((ad) => ad.status === "pending").length;
  const approvedAds = ads.filter((ad) => ad.status === "approved").length;
  const publishedAds = ads.filter((ad) => ad.status === "published").length;

  return (
    <ProtectedRoute allowedRoles={["restaurant"]}>
      <section className="page-shell">
        <PageHeader
          eyebrow="My advertisements"
          title="Track submitted ads"
          description="Follow approval, payment, and publishing progress for your restaurant promotions."
          actions={
            <Link href="/ads/new" className="btn-primary">
              <PlusCircle className="h-4 w-4" />
              Create Ad
            </Link>
          }
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <StatePanel title="Could not load your ads" message={error} tone="error" />
        ) : ads.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Pending" value={pendingAds} helper="Awaiting admin review" tone={pendingAds ? "attention" : "default"} />
              <MetricCard label="Approved" value={approvedAds} helper="Ready for payment review" tone="info" />
              <MetricCard label="Published" value={publishedAds} helper="Visible in public ads" tone="positive" />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {ads.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        ) : (
          <StatePanel
            title="No ads submitted"
            message="Create an ad when your restaurant has a promotion ready for review."
            action={<Link href="/ads/new" className="btn-primary">Create Ad</Link>}
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
