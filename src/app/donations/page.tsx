"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusCircle } from "lucide-react";
import DonationCard from "@/components/DonationCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, MetricCard, PageHeader, StatePanel } from "@/components/WorkspaceUI";
import { subscribeToAuthState } from "@/lib/auth";
import { subscribeToAvailableDonations, subscribeToDonationsByRestaurant } from "@/services/donations";
import { getUserProfile } from "@/services/users";
import type { AppUser, Donation } from "@/types";

export default function DonationsPage() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isActive = true;
    let unsubscribeDonations: () => void;

    const unsubscribeAuth = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser || !isActive) return;

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (!userProfile) {
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        if (userProfile.approvalStatus !== "approved") {
          setLoading(false);
          return;
        }

        if (userProfile.role === "restaurant") {
          unsubscribeDonations = subscribeToDonationsByRestaurant(userProfile.id, (donationList) => {
            if (isActive) setDonations(donationList);
          });
        } else {
          unsubscribeDonations = subscribeToAvailableDonations((donationList) => {
            if (isActive) setDonations(donationList);
          });
        }
      } catch (loadError) {
        if (!isActive) return;
        const message = loadError instanceof Error ? loadError.message : "Could not load donations.";
        setError(message);
      } finally {
        if (isActive) setLoading(false);
      }
    });

    return () => {
      isActive = false;
      unsubscribeAuth();
      if (unsubscribeDonations) unsubscribeDonations();
    };
  }, []);

  const visibleDonations =
    statusFilter === "all"
      ? donations
      : donations.filter((donation) => donation.status === statusFilter);
  const availableCount = donations.filter((donation) => donation.status === "available").length;
  const requestedCount = donations.filter((donation) => donation.status === "requested").length;
  const completedCount = donations.filter((donation) => donation.status === "completed").length;
  const filterOptions = [
    { value: "all", label: "All" },
    { value: "available", label: "Available" },
    { value: "requested", label: "Requested" },
    { value: "completed", label: "Completed" }
  ];

  return (
    <ProtectedRoute allowedRoles={["restaurant", "charity"]} requireApproval={true}>
      <section className="page-shell">
        <PageHeader
          eyebrow={profile?.role === "restaurant" ? "My donations" : "Available donations"}
          title={profile?.role === "restaurant" ? "Manage posted donations" : "Browse food available for pickup"}
          description={
            profile?.role === "restaurant"
              ? "Keep availability, pickup details, and donation status accurate for charities."
              : "Find donations that match your pickup capacity and request them before they expire."
          }
          actions={
            profile?.role === "restaurant" ? (
              <Link href="/donations/new" className="btn-primary">
                <PlusCircle className="h-4 w-4" />
                Create Donation
              </Link>
            ) : null
          }
        />

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <StatePanel title="Could not load donations" message={error} tone="error" />
        ) : donations.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Available" value={availableCount} helper="Open for requests" tone="positive" />
              <MetricCard label="Requested" value={requestedCount} helper="Awaiting pickup decision" tone={requestedCount ? "attention" : "default"} />
              <MetricCard label="Completed" value={completedCount} helper="Closed donations" />
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#6B7280]">
                Showing {visibleDonations.length} of {donations.length} donations
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0" aria-label="Donation status filters">
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

            {visibleDonations.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleDonations.map((donation) => (
                  <DonationCard
                    key={donation.id}
                    donation={donation}
                    ctaLabel={profile?.role === "restaurant" ? "Manage Donation" : "View Donation"}
                  />
                ))}
              </div>
            ) : (
              <StatePanel
                title="No donations match this filter"
                message="Change the status filter to see more donation activity."
              />
            )}
          </div>
        ) : (
          <StatePanel
            title={profile?.role === "restaurant" ? "No donations posted" : "No donations available"}
            message={
              profile?.role === "restaurant"
                ? "Create a donation when surplus food is ready for pickup."
                : "New available donations will appear here automatically."
            }
            action={
              profile?.role === "restaurant" ? (
                <Link href="/donations/new" className="btn-primary">Create Donation</Link>
              ) : null
            }
          />
        )}
      </section>
    </ProtectedRoute>
  );
}
