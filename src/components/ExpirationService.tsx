"use client";

// Purpose: Client-side service component that marks expired donations after login.

import { useEffect } from "react";
import { cleanupExpiredDonations } from "@/services/donations";
import { subscribeToAuthState } from "@/lib/auth";
import { getUserProfile } from "@/services/users";

export default function ExpirationService() {
  useEffect(() => {
    let isActive = true;
    let intervalId: NodeJS.Timeout;

    const runCleanup = async (uid: string) => {
      try {
        if (!isActive) return;
        const profile = await getUserProfile(uid);
        if (profile && (profile.role === "admin" || profile.approvalStatus === "approved")) {
          await cleanupExpiredDonations(uid, profile.role);
        }
      } catch (err) {
        console.error("Failed to cleanup expired donations:", err);
      }
    };

    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        // Run once on login/mount
        runCleanup(user.uid);
        
        // Then run every minute
        intervalId = setInterval(() => {
          if (isActive) runCleanup(user.uid);
        }, 60000);
      } else {
        clearInterval(intervalId);
      }
    });

    return () => {
      isActive = false;
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  return null; // Silent background service
}
