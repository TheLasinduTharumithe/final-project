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
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
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
          <p className="text-sm text-slate-500">Checking your access...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return <>{children}</>;
}
