"use client";

// Purpose: Request management page for tracking pickup requests by role.

import { useEffect, useState } from "react";
import RequestCard from "@/components/RequestCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, MetricCard, PageHeader, StatePanel } from "@/components/WorkspaceUI";
import { subscribeToAuthState } from "@/lib/auth";
import { getDonationById } from "@/services/donations";
import {
  approveRequest,
  getRequestsForRestaurant,
  rejectRequest,
  subscribeToRequestsByCharity
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
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadData(userProfile: AppUser) {
    setError("");

    try {
      // Restaurant only uses loadData now
      const requests = await getRequestsForRestaurant(userProfile.id);

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

    let unsubRequests: (() => void) | null = null;

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
      
      if (userProfile.approvalStatus !== "approved") {
        setLoading(false);
        return;
      }

      if (userProfile.role === "restaurant") {
        await loadData(userProfile);
      } else {
        unsubRequests = subscribeToRequestsByCharity(userProfile.id, async (requests: DonationRequest[]) => {
          if (!isActive) return;
          try {
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
            if (isActive) {
              setItems(mappedItems);
              setLoading(false);
            }
          } catch (err) {
            if (isActive) {
              setError("Failed to load request details.");
              setLoading(false);
            }
          }
        });
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
      if (unsubRequests) unsubRequests();
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

  const pendingCount = items.filter((item) => item.request.status === "pending").length;
  const approvedCount = items.filter((item) => item.request.status === "approved").length;
  const rejectedCount = items.filter((item) => item.request.status === "rejected").length;
  const visibleItems =
    statusFilter === "all"
      ? items
      : items.filter((item) => item.request.status === statusFilter);
  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" }
  ];

  return (
    <ProtectedRoute allowedRoles={["restaurant", "charity"]} requireApproval={true}>
      <section className="page-shell">
        <PageHeader
          eyebrow={profile?.role === "restaurant" ? "Incoming requests" : "My requests"}
          title={profile?.role === "restaurant" ? "Review charity requests" : "Track donation requests"}
          description={
            profile?.role === "restaurant"
              ? "Approve or reject requests with enough context to avoid pickup confusion."
              : "Monitor every request and open approved pickups when logistics are ready."
          }
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <StatePanel title="Could not load requests" message={error} tone="error" />
        ) : items.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Pending" value={pendingCount} helper="Needs a decision" tone={pendingCount ? "attention" : "default"} />
              <MetricCard label="Approved" value={approvedCount} helper="Ready for pickup" tone="info" />
              <MetricCard label="Rejected" value={rejectedCount} helper="Closed without pickup" />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#6B7280]">
                Showing {visibleItems.length} of {items.length} requests
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0" aria-label="Request status filters">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`min-h-10 rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/30 ${
                      statusFilter === option.value
                        ? "bg-[#2E7D32] text-white"
                        : "bg-[#F3F4F1] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#1F2937]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {visibleItems.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {visibleItems.map((item) => (
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
              <StatePanel title="No requests match this filter" message="Change the status filter to see more request activity." />
            )}
          </div>
        ) : (
          <StatePanel
            title={profile?.role === "restaurant" ? "No incoming requests" : "No requests sent"}
            message={
              profile?.role === "restaurant"
                ? "Charity requests will appear here when they request your donations."
                : "Browse available donations and send a request when one matches your needs."
            }
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
