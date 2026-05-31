"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DonationForm, { type DonationFormValues } from "@/components/DonationForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/WorkspaceUI";
import { subscribeToAuthState } from "@/lib/auth";
import { createDonation } from "@/services/donations";
import { getUserProfile, getApprovedCharities } from "@/services/users";
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

    // 1. Save the donation to Firestore (client SDK, auth context present).
    const donationId = await createDonation({
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

    // 2. Fetch approved charities client-side while the user is still authenticated.
    //    The API route will also attempt this via the Admin SDK, but we pass the
    //    result here as a reliable fallback for environments where the Admin SDK
    //    service account is not configured (e.g. local development).
    let approvedCharities: AppUser[] = [];
    try {
      approvedCharities = await getApprovedCharities();
      console.log(`[donation-new] Fetched ${approvedCharities.length} approved charities for email notification.`);
    } catch (err) {
      console.warn("[donation-new] Could not fetch charities client-side:", err);
    }

    // 3. Build a clean donation payload for the email template.
    const newDonation = {
      id: donationId,
      restaurantId: profile.id,
      foodName: values.foodName,
      quantity: values.quantity,
      description: values.description,
      pickupLocation: values.pickupLocation,
      pickupTime: values.pickupTime,
      expiresAt: values.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // 4. Trigger email notifications via the server-side API route.
    //    Errors here never block navigation — the donation was already saved.
    try {
      const res = await fetch("/api/send-donation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donation: newDonation,
          restaurant: profile,
          // Passed as a fallback: the API will prefer its own Admin SDK query
          // but uses this list when Admin SDK credentials are unavailable.
          charities: approvedCharities,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[donation-new] Email API success. Notified: ${data.notifiedCount ?? 0} recipient(s).`);
      } else {
        const text = await res.text();
        console.error(`[donation-new] Email API returned ${res.status}:`, text);
      }
    } catch (error) {
      console.error("[donation-new] Failed to reach email notification API:", error);
    }

    router.push("/donations");
  }

  return (
    <ProtectedRoute allowedRoles={["restaurant"]} requireApproval={true}>
      <section className="page-shell">
        <PageHeader
          eyebrow="New donation"
          title="Create a donation post"
          description="Add clear pickup details and pin the exact map location so charities can request it safely."
        />

        <DonationForm onSubmit={handleSubmit} submitLabel="Create Donation" />
      </section>
    </ProtectedRoute>
  );
}
