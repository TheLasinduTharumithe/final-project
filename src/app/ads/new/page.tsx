"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdForm, { type AdFormValues } from "@/components/AdForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { subscribeToAuthState } from "@/lib/auth";
import { createAd } from "@/services/ads";
import { getUserProfile } from "@/services/users";
import type { AppUser } from "@/types";

export default function NewAdPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        if (isActive) {
          setProfile(null);
          setLoadingProfile(false);
        }
        return;
      }

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);

        if (!isActive) {
          return;
        }

        if (!userProfile || userProfile.role !== "restaurant") {
          setProfile(null);
          setProfileError("Only restaurant accounts can create advertisements.");
          return;
        }

        setProfile(userProfile);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        const message =
          loadError instanceof Error ? loadError.message : "Could not load your restaurant profile.";
        setProfileError(message);
      } finally {
        if (isActive) {
          setLoadingProfile(false);
        }
      }
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  async function handleSubmit(values: AdFormValues) {
    if (!profile) {
      throw new Error("Restaurant profile is not ready yet. Please wait a moment and try again.");
    }

    await createAd(
      {
        title: values.title,
        description: values.description,
        contactNumber: values.contactNumber,
        restaurantId: profile.id,
        imageUrl: values.imageUrl
      }
    );

    router.push("/ads/my");
  }

  return (
    <ProtectedRoute allowedRoles={["restaurant"]}>
      <section className="page-shell">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">New Advertisement</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Submit a restaurant advertisement</h1>
          <p className="mt-4 text-slate-300">
            Your ad will stay pending until an admin reviews it and updates the payment and publishing status.
          </p>
        </div>

        {loadingProfile ? (
          <div className="glass-card">
            <p className="text-slate-300">Loading your restaurant profile...</p>
          </div>
        ) : profileError ? (
          <div className="glass-card">
            <p className="text-slate-300">{profileError}</p>
          </div>
        ) : (
          <AdForm onSubmit={handleSubmit} disabled={!profile} />
        )}
      </section>
    </ProtectedRoute>
  );
}
