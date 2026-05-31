"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { subscribeToAuthState } from "@/lib/auth";
import { getUserProfile } from "@/services/users";
import type { AppUser, UserRole } from "@/types";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireApproval?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, requireApproval = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const allowedRolesKey = allowedRoles?.join(",") ?? "";

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!isActive) {
        return;
      }

      if (!firebaseUser) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        setIsChecking(false);
        return;
      }

      let userProfile: AppUser | null = null;

      try {
        userProfile = await getUserProfile(firebaseUser.uid);
      } catch {
        router.replace("/login");
        setIsChecking(false);
        return;
      }

      if (!userProfile) {
        router.replace("/login");
        setIsChecking(false);
        return;
      }

      if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
        router.replace(userProfile.role === "admin" ? "/admin" : "/dashboard");
        setIsChecking(false);
        return;
      }

      setProfile(userProfile);
      setIsChecking(false);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [allowedRolesKey, pathname, router]);

  if (isChecking) {
    return (
      <div className="page-shell">
        <div className="card max-w-xl text-center">
          <p className="text-sm text-[#9CA3AF]">Checking your access...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  if (requireApproval && profile.role !== "admin" && profile.approvalStatus !== "approved") {
    return (
      <div className="page-shell">
        <div className="card max-w-xl text-center">
          <h2 className="text-xl font-semibold text-[#1F2937]">Account Pending Approval</h2>
          <p className="mt-3 text-sm text-[#6B7280]">
            Your account is currently under review by our team. You will have full access to the platform once approved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
