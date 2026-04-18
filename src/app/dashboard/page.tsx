"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { getAdsByRestaurant } from "@/services/ads";
import { getAvailableDonations, getDonationsByRestaurant } from "@/services/donations";
import { getRequestsByCharity, getRequestsForRestaurant } from "@/services/requests";
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

        if (userProfile.role === "restaurant") {
          const [donations, requests, ads] = await Promise.all([
            getDonationsByRestaurant(userProfile.id),
            getRequestsForRestaurant(userProfile.id),
            getAdsByRestaurant(userProfile.id)
          ]);

          if (!isActive) {
            return;
          }

          setRestaurantData({
            donations,
            requests,
            adsCount: ads.length
          });
        } else {
          const [availableDonations, requests] = await Promise.all([
            getAvailableDonations(),
            getRequestsByCharity(userProfile.id)
          ]);

          if (!isActive) {
            return;
          }

          setCharityData({
            availableDonations,
            requests
          });
        }
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Could not load the dashboard.";
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
  }, [router]);

  return (
    <ProtectedRoute>
      <section className="page-shell">
        {loading || !profile ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="glass-card">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : profile.role === "restaurant" && restaurantData ? (
          <div className="space-y-8">
            <div className="glass-card">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Restaurant Dashboard</p>
              <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back, {profile.name}</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Manage your live donations, review charity requests, and monitor your advertisement submissions from one place.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="stat-card">
                <p className="text-sm text-slate-300">My Donations</p>
                <p className="mt-3 text-4xl font-semibold">{restaurantData.donations.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-slate-300">Incoming Requests</p>
                <p className="mt-3 text-4xl font-semibold">{restaurantData.requests.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-slate-300">My Ads</p>
                <p className="mt-3 text-4xl font-semibold">{restaurantData.adsCount}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Link href="/donations/new" className="card transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20">
                <h2 className="text-xl font-semibold text-white">Create Donation</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Post a new food donation with pickup details and expiry time.
                </p>
              </Link>
              <Link href="/requests" className="card transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20">
                <h2 className="text-xl font-semibold text-white">Review Requests</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Approve or reject charity requests for your donations.
                </p>
              </Link>
              <Link href="/ads/my" className="card transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20">
                <h2 className="text-xl font-semibold text-white">Manage Ads</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Track payment, approval, and publication of your ads.
                </p>
              </Link>
            </div>
          </div>
        ) : charityData ? (
          <div className="space-y-8">
            <div className="glass-card">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Charity Dashboard</p>
              <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back, {profile.name}</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Browse available meals, send donation requests, and keep track of collection activity.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="stat-card">
                <p className="text-sm text-slate-300">Available Donations</p>
                <p className="mt-3 text-4xl font-semibold">{charityData.availableDonations.length}</p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-slate-300">My Requests</p>
                <p className="mt-3 text-4xl font-semibold">{charityData.requests.length}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Link href="/donations" className="card transition duration-300 hover:-translate-y-1 hover:border-emerald-400/20">
                <h2 className="text-xl font-semibold text-white">Browse Donations</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Explore available food donations and send requests.
                </p>
              </Link>
              <Link href="/requests" className="card transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20">
                <h2 className="text-xl font-semibold text-white">Track Requests</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  View the current status of all requests made by your organization.
                </p>
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </ProtectedRoute>
  );
}
