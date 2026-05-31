"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
  HandHeart,
  Megaphone,
  PackageCheck,
  PlusCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, MetricCard, PageHeader, StatePanel } from "@/components/WorkspaceUI";
import { subscribeToAuthState } from "@/lib/auth";
import { getAdsByRestaurant } from "@/services/ads";
import { getDonationsByRestaurant, subscribeToAvailableDonations } from "@/services/donations";
import { getRequestsForRestaurant, subscribeToRequestsByCharity } from "@/services/requests";
import { getUserProfile } from "@/services/users";
import type { AppUser, Donation, DonationRequest } from "@/types";

interface RestaurantDashboardData {
  donations: Donation[];
  requests: DonationRequest[];
  adsCount: number;
}

interface CharityDashboardData {
  availableDonations: Donation[];
  requests: DonationRequest[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [restaurantData, setRestaurantData] = useState<RestaurantDashboardData | null>(null);
  const [charityData, setCharityData] = useState<CharityDashboardData | null>(null);
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

        if (!userProfile) {
          setLoading(false);
          return;
        }

        setProfile(userProfile);

        if (userProfile.role === "admin") {
          router.replace("/admin");
          return;
        }

        if (userProfile.approvalStatus !== "approved") {
          setLoading(false);
          return;
        }

        if (userProfile.role === "restaurant") {
          const [donations, requests, ads] = await Promise.all([
            getDonationsByRestaurant(userProfile.id),
            getRequestsForRestaurant(userProfile.id),
            getAdsByRestaurant(userProfile.id)
          ]);

          if (!isActive) return;

          setRestaurantData({
            donations,
            requests,
            adsCount: ads.length
          });
          setLoading(false);
        } else {
          // Real-time for Charity
          const unsubDonations = subscribeToAvailableDonations((availableDonations) => {
            if (isActive) {
              setCharityData((prev) => ({
                availableDonations,
                requests: prev?.requests || []
              }));
              setLoading(false);
            }
          });
          
          const unsubRequests = subscribeToRequestsByCharity(userProfile.id, (requests) => {
            if (isActive) {
              setCharityData((prev) => ({
                availableDonations: prev?.availableDonations || [],
                requests
              }));
              setLoading(false);
            }
          });

          // Cleanup listeners if the auth changes
          return () => {
            unsubDonations();
            unsubRequests();
          };
        }
      } catch (loadError) {
        if (!isActive) return;
        const message = loadError instanceof Error ? loadError.message : "Could not load the dashboard.";
        setError(message);
        setLoading(false);
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [router]);

  const activeDonations =
    restaurantData?.donations.filter((donation) => donation.status === "available").length || 0;
  const pendingRequests =
    restaurantData?.requests.filter((request) => request.status === "pending").length || 0;
  const approvedPickups =
    restaurantData?.requests.filter((request) => request.status === "approved").length || 0;
  const recentRestaurantDonations = restaurantData?.donations.slice(0, 4) || [];
  const recentRestaurantRequests = restaurantData?.requests.slice(0, 4) || [];

  const availableDonations = charityData?.availableDonations.length || 0;
  const approvedRequests =
    charityData?.requests.filter((request) => request.status === "approved").length || 0;
  const pendingCharityRequests =
    charityData?.requests.filter((request) => request.status === "pending").length || 0;
  const nearbyOpportunities = charityData?.availableDonations.slice(0, 4) || [];
  const collectionSchedule =
    charityData?.requests
      .filter((request) => request.status === "approved")
      .slice(0, 4) || [];

  return (
    <ProtectedRoute requireApproval={true}>
      <section className="page-shell">
        {loading || !profile ? (
          <DashboardSkeleton />
        ) : error ? (
          <StatePanel title="Dashboard unavailable" message={error} tone="error" />
        ) : profile.role === "restaurant" && restaurantData ? (
          <div className="space-y-6">
            <PageHeader
              eyebrow="Restaurant workspace"
              title={`Welcome back, ${profile.name}`}
              description="Manage live donations, review charity requests, and keep advertisement submissions moving."
              actions={
                <>
                  <Link href="/donations/new" className="btn-primary">
                    <PlusCircle className="h-4 w-4" />
                    New Donation
                  </Link>
                  <Link href="/requests" className="btn-secondary">
                    <ClipboardList className="h-4 w-4" />
                    Review Requests
                  </Link>
                </>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Active donations" value={activeDonations} helper={`${restaurantData.donations.length} total posted`} tone="positive" />
              <MetricCard label="Pending requests" value={pendingRequests} helper="Needs review from your team" tone={pendingRequests ? "attention" : "default"} />
              <MetricCard label="Approved pickups" value={approvedPickups} helper="Ready for charity collection" tone="info" />
              <MetricCard label="Advertisement status" value={restaurantData.adsCount} helper="Submitted restaurant ads" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
              <div className="table-card">
                <div className="border-b border-[#E5E7EB] px-4 py-3">
                  <h2 className="font-semibold text-[#1F2937]">Recent donation activity</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Newest posts and current availability.</p>
                </div>
                {recentRestaurantDonations.length ? (
                  recentRestaurantDonations.map((donation) => (
                    <div key={donation.id} className="list-row">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#1F2937]">{donation.foodName}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {donation.remainingQuantity}/{donation.totalQuantity} remaining - {donation.pickupLocation}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="status-badge border-[#E5E7EB] bg-[#F3F4F1] text-[#374151]">{donation.status}</span>
                        <Link href={`/donations/${donation.id}`} className="btn-ghost">
                          Open
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    title="No donations yet"
                    message="Create your first donation with a clear pickup time and location."
                    action={<Link href="/donations/new" className="btn-primary">Create Donation</Link>}
                  />
                )}
              </div>

              <div className="table-card">
                <div className="border-b border-[#E5E7EB] px-4 py-3">
                  <h2 className="font-semibold text-[#1F2937]">Requests requiring attention</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Pending requests appear first in your workflow.</p>
                </div>
                {recentRestaurantRequests.length ? (
                  recentRestaurantRequests.map((request) => (
                    <div key={request.id} className="list-row">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#1F2937]">{request.charityName || "Charity request"}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="status-badge border-[#F59E0B]/35 bg-[#FEF3C7] text-[#92400E]">
                        {request.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <StatePanel title="No incoming requests" message="New charity requests will appear here as soon as they arrive." />
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/donations" className="card transition hover:border-[#A5D6A7]">
                <HandHeart className="h-5 w-5 text-[#2E7D32]" />
                <h2 className="mt-3 font-semibold text-[#1F2937]">Manage Donations</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">Review live posts, update status, and keep availability accurate.</p>
              </Link>
              <Link href="/requests" className="card transition hover:border-[#2563EB]/40">
                <PackageCheck className="h-5 w-5 text-[#1E40AF]" />
                <h2 className="mt-3 font-semibold text-[#1F2937]">Approve Pickups</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">Confirm requests before food is collected.</p>
              </Link>
              <Link href="/ads/my" className="card transition hover:border-[#A5D6A7]">
                <Megaphone className="h-5 w-5 text-[#2E7D32]" />
                <h2 className="mt-3 font-semibold text-[#1F2937]">Track Ads</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">Monitor payment, approval, and publishing status.</p>
              </Link>
            </div>
          </div>
        ) : charityData ? (
          <div className="space-y-6">
            <PageHeader
              eyebrow="Charity workspace"
              title={`Welcome back, ${profile.name}`}
              description="Find available donations, track approved requests, and prepare collection schedules."
              actions={
                <>
                  <Link href="/donations" className="btn-primary">
                    <HandHeart className="h-4 w-4" />
                    Browse Donations
                  </Link>
                  <Link href="/requests" className="btn-secondary">
                    <CalendarCheck2 className="h-4 w-4" />
                    My Requests
                  </Link>
                </>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Available donations" value={availableDonations} helper="Open for requests now" tone="positive" />
              <MetricCard label="Approved requests" value={approvedRequests} helper="Ready to coordinate pickup" tone="info" />
              <MetricCard label="Pending requests" value={pendingCharityRequests} helper="Awaiting restaurant review" tone={pendingCharityRequests ? "attention" : "default"} />
              <MetricCard label="Collection schedule" value={collectionSchedule.length} helper="Approved pickups to plan" />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="table-card">
                <div className="border-b border-[#E5E7EB] px-4 py-3">
                  <h2 className="font-semibold text-[#1F2937]">Nearby opportunities</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Available donations you can request now.</p>
                </div>
                {nearbyOpportunities.length ? (
                  nearbyOpportunities.map((donation) => (
                    <div key={donation.id} className="list-row">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#1F2937]">{donation.foodName}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {donation.remainingQuantity}/{donation.totalQuantity} remaining - {donation.pickupLocation}
                        </p>
                      </div>
                      <Link href={`/donations/${donation.id}`} className="btn-ghost">
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))
                ) : (
                  <StatePanel title="No donations available" message="New available donations will appear here automatically." />
                )}
              </div>

              <div className="table-card">
                <div className="border-b border-[#E5E7EB] px-4 py-3">
                  <h2 className="font-semibold text-[#1F2937]">Collection schedule</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">Approved requests ready for pickup planning.</p>
                </div>
                {collectionSchedule.length ? (
                  collectionSchedule.map((request) => (
                    <div key={request.id} className="list-row">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#1F2937]">Donation #{request.donationId.slice(0, 6)}</p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          Approved - {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Link href={`/donations/${request.donationId}`} className="btn-ghost">
                        Route
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))
                ) : (
                  <StatePanel title="No approved pickups" message="Approved donation requests will become your pickup schedule." />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </ProtectedRoute>
  );
}
