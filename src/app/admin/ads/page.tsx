"use client";

import { useEffect, useState } from "react";
import AdCard from "@/components/AdCard";
import ProtectedRoute from "@/components/ProtectedRoute";
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

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <section className="page-shell">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Admin Ad Management</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Approve, reject, and publish ads</h1>
        </div>

        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading ads...</p>
          </div>
        ) : error ? (
          <div className="glass-card">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : ads.length ? (
          <div className="space-y-6">
            {ads.map((ad) => (
              <div key={ad.id} className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <AdCard ad={ad} />

                <div className="card h-fit w-full lg:w-[240px]">
                  <h2 className="text-lg font-semibold text-white">Admin Actions</h2>
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
          <div className="glass-card">
            <p className="text-slate-300">No ads have been submitted yet.</p>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
