"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdForm, { type AdFormValues } from "@/components/AdForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PageHeader, StatePanel } from "@/components/WorkspaceUI";
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
        <PageHeader
          eyebrow="New advertisement"
          title="Submit a restaurant advertisement"
          description="Your ad stays pending until an admin reviews it and updates payment and publishing status."
        />

        {loadingProfile ? (
          <StatePanel title="Loading restaurant profile" message="Preparing the advertisement form." tone="loading" />
        ) : profileError ? (
          <StatePanel title="Advertisement unavailable" message={profileError} tone="error" />
        ) : (
          <AdForm onSubmit={handleSubmit} disabled={!profile} />
        )}
      </section>
    </ProtectedRoute>
  );
}
