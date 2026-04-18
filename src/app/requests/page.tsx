"use client";

import { useEffect, useState } from "react";
import RequestCard from "@/components/RequestCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { getDonationById } from "@/services/donations";
import {
  approveRequest,
  getRequestsByCharity,
  getRequestsForRestaurant,
  rejectRequest
} from "@/services/requests";
import { getUserProfile } from "@/services/users";
import type { AppUser, DonationRequest } from "@/types";

interface RequestViewItem {
  request: DonationRequest;
  donationName?: string;
  charityName?: string;
}

export default function RequestsPage() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [items, setItems] = useState<RequestViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  async function loadData(userProfile: AppUser) {
    setError("");

    try {
      const requests =
        userProfile.role === "restaurant"
          ? await getRequestsForRestaurant(userProfile.id)
          : await getRequestsByCharity(userProfile.id);

      const mappedItems = await Promise.all(
        requests.map(async (request) => {
          const donation = await getDonationById(request.donationId);

          return {
            request,
            donationName: donation?.foodName,
            charityName: request.charityName
          };
        })
      );

      setItems(mappedItems);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Could not load requests.";
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

      const userProfile = await getUserProfile(firebaseUser.uid);

      if (!userProfile || !isActive) {
        setLoading(false);
        return;
      }

      setProfile(userProfile);
      await loadData(userProfile);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  async function handleApprove(requestId: string) {
    try {
      setActionLoadingId(requestId);
      setError("");
      await approveRequest(requestId);

      if (profile) {
        await loadData(profile);
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Could not approve request.";
      setError(message);
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleReject(requestId: string) {
    try {
      setActionLoadingId(requestId);
      setError("");
      await rejectRequest(requestId);

      if (profile) {
        await loadData(profile);
      }
    } catch (actionError) {
      const message =
        actionError instanceof Error ? actionError.message : "Could not reject request.";
      setError(message);
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["restaurant", "charity"]}>
      <section className="page-shell">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            {profile?.role === "restaurant" ? "Incoming Requests" : "My Requests"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            {profile?.role === "restaurant"
              ? "Review charity requests"
              : "Track your donation requests"}
          </h1>
        </div>

        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="glass-card">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : items.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {items.map((item) => (
              <RequestCard
                key={item.request.id}
                request={item.request}
                donationName={item.donationName}
                charityName={profile?.role === "restaurant" ? item.charityName : undefined}
                showActions={profile?.role === "restaurant"}
                trackLink={
                  profile?.role === "charity" && item.request.status === "approved"
                    ? `/donations/${item.request.donationId}`
                    : undefined
                }
                onApprove={
                  actionLoadingId ? undefined : () => handleApprove(item.request.id)
                }
                onReject={
                  actionLoadingId ? undefined : () => handleReject(item.request.id)
                }
              />
            ))}
          </div>
        ) : (
          <div className="glass-card">
            <p className="text-slate-300">
              {profile?.role === "restaurant"
                ? "No requests have been received yet."
                : "You have not sent any donation requests yet."}
            </p>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
