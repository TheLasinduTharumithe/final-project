"use client";

import { useEffect, useState } from "react";
import AdCard from "@/components/AdCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, MetricCard, PageHeader, StatePanel } from "@/components/WorkspaceUI";
import { subscribeToAuthState } from "@/lib/auth";
import { getAllAds, updateAd } from "@/services/ads";
import { getUserProfile } from "@/services/users";
import type { Ad } from "@/types";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  async function loadAds() {
    try {
      const adList = await getAllAds();
      setAds(adList);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Could not load ads.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser || !isActive) {
        return;
      }

      const profile = await getUserProfile(firebaseUser.uid);

      if (!profile || profile.role !== "admin") {
        if (isActive) {
          setLoading(false);
        }
        return;
      }

      await loadAds();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  async function handleUpdate(ad: Ad, data: Partial<Ad>) {
    if (data.status === "published" && (ad.status !== "approved" || ad.paymentStatus !== "paid")) {
      setError("An ad can only be published after it is approved and marked as paid.");
      return;
    }

    try {
      setActionLoadingId(ad.id);
      setError("");
      await updateAd(ad.id, data);
      await loadAds();
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Could not update this ad.";
      setError(message);
    } finally {
      setActionLoadingId("");
    }
  }

  const pendingAds = ads.filter((ad) => ad.status === "pending").length;
  const approvedAds = ads.filter((ad) => ad.status === "approved").length;
  const paidAds = ads.filter((ad) => ad.paymentStatus === "paid").length;
  const publishedAds = ads.filter((ad) => ad.status === "published").length;

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <section className="page-shell">
        <PageHeader
          eyebrow="Admin ad management"
          title="Approve, reject, and publish ads"
          description="Ads can only be published after approval and paid payment status."
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <StatePanel title="Could not load ads" message={error} tone="error" />
        ) : ads.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Pending" value={pendingAds} helper="Needs admin review" tone={pendingAds ? "attention" : "default"} />
              <MetricCard label="Approved" value={approvedAds} helper="Can be paid next" tone="info" />
              <MetricCard label="Paid" value={paidAds} helper="Ready for publishing rules" tone="positive" />
              <MetricCard label="Published" value={publishedAds} helper="Visible to users" />
            </div>
            {ads.map((ad) => (
              <div key={ad.id} className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <AdCard ad={ad} />

                <div className="card h-fit w-full lg:w-[248px]">
                  <h2 className="text-lg font-semibold text-[#1F2937]">Admin actions</h2>
                  <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                    Current: {ad.status} / {ad.paymentStatus}
                  </p>
                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={() => handleUpdate(ad, { status: "approved" })}
                      disabled={
                        actionLoadingId === ad.id ||
                        ad.status === "approved" ||
                        ad.status === "published"
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn-light w-full"
                      onClick={() => handleUpdate(ad, { status: "rejected" })}
                      disabled={
                        actionLoadingId === ad.id ||
                        ad.status === "rejected" ||
                        ad.status === "published"
                      }
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="btn-light w-full"
                      onClick={() => handleUpdate(ad, { paymentStatus: "paid" })}
                      disabled={actionLoadingId === ad.id || ad.paymentStatus === "paid"}
                    >
                      Mark Paid
                    </button>
                    <button
                      type="button"
                      className="btn-light w-full"
                      onClick={() => handleUpdate(ad, { status: "published" })}
                      disabled={
                        actionLoadingId === ad.id ||
                        ad.paymentStatus !== "paid" ||
                        ad.status !== "approved"
                      }
                    >
                      Publish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <StatePanel title="No submitted ads" message="Restaurant ad submissions will appear here for review." />
        )}
      </section>
    </ProtectedRoute>
  );
}
