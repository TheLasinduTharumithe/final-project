"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DonationCard from "@/components/DonationCard";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { getAvailableDonations, getDonationsByRestaurant } from "@/services/donations";
import { getUserProfile } from "@/services/users";
import type { AppUser, Donation } from "@/types";

export default function DonationsPage() {
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
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
        const donationList =
          userProfile.role === "restaurant"
            ? await getDonationsByRestaurant(userProfile.id)
            : await getAvailableDonations();

        if (!isActive) {
          return;
        }

        setDonations(donationList);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Could not load donations.";
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

  return (
    <ProtectedRoute allowedRoles={["restaurant", "charity"]}>
      <section className="page-shell">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              {profile?.role === "restaurant" ? "My Donations" : "Available Donations"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">
              {profile?.role === "restaurant"
                ? "Manage your posted donations"
                : "Browse food available for pickup"}
            </h1>
          </div>

          {profile?.role === "restaurant" ? (
            <Link href="/donations/new" className="btn-primary">
              Create Donation
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading donations...</p>
          </div>
        ) : error ? (
          <div className="glass-card">
            <p className="text-slate-300">{error}</p>
          </div>
        ) : donations.length ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                ctaLabel={profile?.role === "restaurant" ? "Manage Donation" : "View Donation"}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card">
            <p className="text-slate-300">
              {profile?.role === "restaurant"
                ? "You have not posted any donations yet."
                : "There are no available donations right now."}
            </p>
          </div>
        )}
      </section>
    </ProtectedRoute>
  );
}
