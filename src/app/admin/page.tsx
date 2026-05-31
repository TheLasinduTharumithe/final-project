"use client";

import Link from "next/link";
import {
  BarChart3,
  HandHeart,
  Loader2,
  Megaphone,
  ShieldCheck,
  Trash2,
  Users2
} from "lucide-react";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardSkeleton, MetricCard, PageHeader, StatePanel } from "@/components/WorkspaceUI";
import { subscribeToAuthState } from "@/lib/auth";
import { getAllAds } from "@/services/ads";
import { deleteDonation, getAllDonations } from "@/services/donations";
import { getAllRequests } from "@/services/requests";
import { deleteUserProfile, getAllUsers, getUserProfile } from "@/services/users";
import type { Ad, AppUser, Donation, DonationRequest } from "@/types";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingKey, setActionLoadingKey] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const [userList, donationList, requestList, adList] = await Promise.all([
          getAllUsers(),
          getAllDonations(),
          getAllRequests(),
          getAllAds()
        ]);

        if (!isActive) {
          return;
        }

        setUsers(userList);
        setDonations(donationList);
        setRequests(requestList);
        setAds(adList);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Could not load admin data.";
        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

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

      setAdminId(profile.id);
      await loadData();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const totalRestaurants = users.filter((user) => user.role === "restaurant").length;
  const totalCharities = users.filter((user) => user.role === "charity").length;
  const totalAvailableDonations = donations.filter(
    (donation) => donation.status === "available"
  ).length;
  const totalCompletedDonations = donations.filter(
    (donation) => donation.status === "completed"
  ).length;
  const totalPendingRequests = requests.filter((request) => request.status === "pending").length;
  const totalApprovedRequests = requests.filter((request) => request.status === "approved").length;
  const totalPublishedAds = ads.filter((ad) => ad.status === "published").length;
  const totalPaidAds = ads.filter((ad) => ad.paymentStatus === "paid").length;
  const totalPendingApprovals = users.filter((user) => user.approvalStatus === "pending").length;
  const totalPendingAds = ads.filter((ad) => ad.status === "pending").length;

  async function handleDeleteUser(user: AppUser) {
    if (user.id === adminId) {
      setError("You cannot delete the admin account currently in use.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the user profile for ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingKey(`user-${user.id}`);
      setError("");
      await deleteUserProfile(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Could not delete this user.";
      setError(message);
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleDeleteDonation(donation: Donation) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the donation "${donation.foodName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingKey(`donation-${donation.id}`);
      setError("");
      await deleteDonation(donation.id);
      setDonations((current) => current.filter((item) => item.id !== donation.id));
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Could not delete this donation.";
      setError(message);
    } finally {
      setActionLoadingKey("");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <section className="page-shell">
        <PageHeader
          eyebrow="Admin dashboard"
          title="Platform overview and management"
          description="Review approvals, monitor donation and request flow, and keep advertisement publishing controlled."
          actions={
            <>
              <Link href="/admin/pending-approvals" className="btn-primary">
                <ShieldCheck className="h-4 w-4" />
                Pending Approvals
              </Link>
              <Link href="/admin/ads" className="btn-secondary">
                <Megaphone className="h-4 w-4" />
                Manage Ads
              </Link>
            </>
          }
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Pending approvals"
            value={totalPendingApprovals}
            helper="New registrations needing review"
            tone={totalPendingApprovals ? "attention" : "default"}
          />
          <MetricCard
            label="Pending ads"
            value={totalPendingAds}
            helper="Awaiting ad review"
            tone={totalPendingAds ? "attention" : "default"}
          />
          <MetricCard
            label="Total users"
            value={users.length}
            helper={`${totalRestaurants} restaurants / ${totalCharities} charities`}
            tone="info"
          />
          <MetricCard
            label="Active donations"
            value={totalAvailableDonations}
            helper={`${totalCompletedDonations} completed donations`}
            tone="positive"
          />
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 sm:flex-row sm:flex-wrap">
              <Link href="/admin#users" className="btn-secondary">
                <Users2 className="h-4 w-4" />
                Manage Users
              </Link>
              <Link href="/admin#donations" className="btn-secondary">
                <HandHeart className="h-4 w-4" />
                Manage Donations
              </Link>
              <Link href="/admin/ads" className="btn-primary">
                <Megaphone className="h-4 w-4" />
                Manage Ads
              </Link>
              <Link href="/chat" className="btn-secondary">
                <BarChart3 className="h-4 w-4" />
                Ask AI Assistant
              </Link>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8">
            {error ? (
              <StatePanel title="Admin data unavailable" message={error} tone="error" />
            ) : null}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="stat-card">
                <p className="text-sm text-[#6B7280]">Total Users</p>
                <p className="mt-3 text-4xl font-semibold">{users.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-[#6B7280]">Total Donations</p>
                <p className="mt-3 text-4xl font-semibold">{donations.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-[#6B7280]">Total Requests</p>
                <p className="mt-3 text-4xl font-semibold">{requests.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-[#6B7280]">Total Ads</p>
                <p className="mt-3 text-4xl font-semibold">{ads.length}</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-[#E5E7EB] bg-[#E8F5E9] text-[#2E7D32]">
                    <Users2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">User Mix</p>
                    <p className="text-lg font-semibold text-[#1F2937]">
                      {totalRestaurants} Restaurants / {totalCharities} Charities
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-[#E5E7EB] bg-[#DBEAFE] text-[#2563EB]">
                    <HandHeart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Donation Status</p>
                    <p className="text-lg font-semibold text-[#1F2937]">
                      {totalAvailableDonations} Available / {totalCompletedDonations} Completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-[#E5E7EB] bg-[#FEF3C7] text-[#92400E]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Request Flow</p>
                    <p className="text-lg font-semibold text-[#1F2937]">
                      {totalPendingRequests} Pending / {totalApprovedRequests} Approved
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-[#E5E7EB] bg-[#DBEAFE] text-[#1E40AF]">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#6B7280]">Ad Readiness</p>
                    <p className="text-lg font-semibold text-[#1F2937]">
                      {totalPaidAds} Paid / {totalPublishedAds} Published
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div id="users" className="card scroll-mt-28">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1F2937]">Latest Users</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Recently added accounts across the platform.
                    </p>
                  </div>
                  <span className="status-badge">{users.length} total</span>
                </div>

                <div className="mt-5 space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#1F2937]">{user.name}</p>
                        <p className="truncate text-sm text-[#6B7280]">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="status-badge">{user.role}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoadingKey === `user-${user.id}` || user.id === adminId}
                          className="danger-button"
                          aria-label={`Delete ${user.name}`}
                        >
                          {actionLoadingKey === `user-${user.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="donations" className="card scroll-mt-28">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1F2937]">Latest Donations</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Most recent food donation activity in the system.
                    </p>
                  </div>
                  <span className="status-badge">{donations.length} total</span>
                </div>

                <div className="mt-5 space-y-4">
                  {donations.slice(0, 5).map((donation) => (
                    <div
                      key={donation.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#1F2937]">{donation.foodName}</p>
                        <p className="truncate text-sm text-[#6B7280]">
                          {donation.quantity} - {donation.pickupLocation}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="status-badge">{donation.status}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDonation(donation)}
                          disabled={actionLoadingKey === `donation-${donation.id}`}
                          className="danger-button"
                          aria-label={`Delete ${donation.foodName}`}
                        >
                          {actionLoadingKey === `donation-${donation.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div id="requests" className="card scroll-mt-28">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1F2937]">Latest Requests</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Current request activity that may need attention.
                    </p>
                  </div>
                  <span className="status-badge">{requests.length} total</span>
                </div>

                <div className="mt-5 space-y-4">
                  {requests.slice(0, 5).map((request) => (
                    <div key={request.id} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-[#1F2937]">Donation ID: {request.donationId}</p>
                        <span className="status-badge">{request.status}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#6B7280]">{request.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1F2937]">Latest Ads</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      Review ad publishing and payment progress.
                    </p>
                  </div>
                  <Link href="/admin/ads" className="btn-light">
                    Manage
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {ads.slice(0, 5).map((ad) => (
                    <div key={ad.id} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-[#1F2937]">{ad.title}</p>
                        <span className="status-badge">{ad.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#6B7280]">Payment: {ad.paymentStatus}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
