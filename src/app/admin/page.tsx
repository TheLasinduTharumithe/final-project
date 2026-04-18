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
        <div className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
          <div className="glass-card">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Admin Dashboard
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Platform overview and management center
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              Review activity across EcoPlate, monitor donation and request flow, and keep ad
              publishing under control from one clean admin workspace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
          </div>

          <div className="card">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-300">
              Quick Snapshot
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-sm text-slate-400">Restaurants</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalRestaurants}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-sm text-slate-400">Charities</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalCharities}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-sm text-slate-400">Published Ads</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalPublishedAds}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading admin data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {error ? (
              <div className="glass-card">
                <p className="text-slate-300">{error}</p>
              </div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="stat-card">
                <p className="text-sm text-slate-300">Total Users</p>
                <p className="mt-3 text-4xl font-semibold">{users.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-slate-300">Total Donations</p>
                <p className="mt-3 text-4xl font-semibold">{donations.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-slate-300">Total Requests</p>
                <p className="mt-3 text-4xl font-semibold">{requests.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-slate-300">Total Ads</p>
                <p className="mt-3 text-4xl font-semibold">{ads.length}</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-white/10 bg-emerald-500/10 text-emerald-300">
                    <Users2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">User Mix</p>
                    <p className="text-lg font-semibold text-white">
                      {totalRestaurants} Restaurants / {totalCharities} Charities
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-white/10 bg-cyan-500/10 text-cyan-300">
                    <HandHeart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Donation Status</p>
                    <p className="text-lg font-semibold text-white">
                      {totalAvailableDonations} Available / {totalCompletedDonations} Completed
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-white/10 bg-amber-500/10 text-amber-300">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Request Flow</p>
                    <p className="text-lg font-semibold text-white">
                      {totalPendingRequests} Pending / {totalApprovedRequests} Approved
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="feature-icon-wrap border-white/10 bg-sky-500/10 text-sky-300">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Ad Readiness</p>
                    <p className="text-lg font-semibold text-white">
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
                    <h2 className="text-2xl font-semibold text-white">Latest Users</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Recently added accounts across the platform.
                    </p>
                  </div>
                  <span className="status-badge">{users.length} total</span>
                </div>

                <div className="mt-5 space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="truncate text-sm text-slate-400">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="status-badge">{user.role}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoadingKey === `user-${user.id}` || user.id === adminId}
                          className="inline-flex items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <h2 className="text-2xl font-semibold text-white">Latest Donations</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Most recent food donation activity in the system.
                    </p>
                  </div>
                  <span className="status-badge">{donations.length} total</span>
                </div>

                <div className="mt-5 space-y-4">
                  {donations.slice(0, 5).map((donation) => (
                    <div
                      key={donation.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white">{donation.foodName}</p>
                        <p className="truncate text-sm text-slate-400">
                          {donation.quantity} • {donation.pickupLocation}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="status-badge">{donation.status}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDonation(donation)}
                          disabled={actionLoadingKey === `donation-${donation.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <h2 className="text-2xl font-semibold text-white">Latest Requests</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Current request activity that may need attention.
                    </p>
                  </div>
                  <span className="status-badge">{requests.length} total</span>
                </div>

                <div className="mt-5 space-y-4">
                  {requests.slice(0, 5).map((request) => (
                    <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-white">Donation ID: {request.donationId}</p>
                        <span className="status-badge">{request.status}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{request.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Latest Ads</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Review ad publishing and payment progress.
                    </p>
                  </div>
                  <Link href="/admin/ads" className="btn-light">
                    Manage
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {ads.slice(0, 5).map((ad) => (
                    <div key={ad.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-white">{ad.title}</p>
                        <span className="status-badge">{ad.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Payment: {ad.paymentStatus}</p>
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
