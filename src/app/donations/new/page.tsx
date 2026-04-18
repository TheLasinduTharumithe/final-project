"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DonationForm, { type DonationFormValues } from "@/components/DonationForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { createDonation } from "@/services/donations";
import { getUserProfile } from "@/services/users";
import type { AppUser } from "@/types";

export default function NewDonationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AppUser | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        return;
      }

      const userProfile = await getUserProfile(firebaseUser.uid);
      setProfile(userProfile);
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit(values: DonationFormValues) {
    if (!profile) {
      throw new Error("User profile not found.");
    }

    if (profile.role !== "restaurant") {
      throw new Error("Only restaurant accounts can create donation posts.");
    }

    await createDonation({
      restaurantId: profile.id,
      foodName: values.foodName,
      quantity: values.quantity,
      description: values.description,
      pickupLocation: values.pickupLocation,
      pickupTime: values.pickupTime,
      expiryDate: values.expiryDate,
      status: values.status,
      image64: values.image64 || "",
      latitude: values.latitude,
      longitude: values.longitude,
      locationText: values.locationText || ""
    });

    router.push("/donations");
  }

  return (
    <ProtectedRoute allowedRoles={["restaurant"]}>
      <section className="page-shell">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">New Donation</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Create a donation post</h1>
          <p className="mt-4 text-slate-300">
            Add clear pickup details and pin the exact map location so charities can request it safely.
          </p>
        </div>

        <DonationForm onSubmit={handleSubmit} submitLabel="Create Donation" />
      </section>
    </ProtectedRoute>
  );
}
