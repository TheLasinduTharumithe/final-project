"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CircleUserRound,
  ExternalLink,
  HandHeart,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  PlusCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { subscribeToAuthState } from "@/lib/auth";
import { getInitials, safePreviewSrc } from "@/lib/image";
import { getUserProfile } from "@/services/users";
import type { AppUser } from "@/types";

interface SidebarLinkItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

function isWorkspaceRoute(pathname: string) {
  const prefixes = ["/dashboard", "/donations", "/requests", "/profile", "/chat", "/admin"];
  const exactMatches = ["/ads/my", "/ads/new"];

  return (
    prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    exactMatches.includes(pathname)
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!isMounted) {
        return;
      }

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);
      } catch {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const links = useMemo<SidebarLinkItem[]>(() => {
    if (!user) {
      return [];
    }

    if (user.role === "admin") {
      return [
        { href: "/admin", label: "Overview", icon: ShieldCheck },
        { href: "/admin/ads", label: "Manage Ads", icon: Megaphone },
        { href: "/chat", label: "AI Assistant", icon: MessageSquareText }
      ];
    }

    return [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/donations", label: "Donations", icon: HandHeart },
      { href: "/requests", label: "Requests", icon: Sparkles },
      {
        href: user.role === "restaurant" ? "/ads/my" : "/ads",
        label: user.role === "restaurant" ? "My Ads" : "Public Ads",
        icon: Megaphone
      },
      { href: "/profile", label: "Profile", icon: CircleUserRound },
      { href: "/chat", label: "AI Assistant", icon: MessageSquareText }
    ];
  }, [user]);

  if (!isWorkspaceRoute(pathname)) {
    return null;
  }

  const avatarSrc = safePreviewSrc(user?.avatar64);
  const initials = getInitials(user?.name);

  return (
    <aside className="sidebar-shell">
      <div className="flex h-full flex-col p-4">
        <div className="surface-panel-soft px-3 py-3">
          {loading ? (
            <div className="space-y-3">
              <div className="h-11 w-11 animate-pulse rounded-md bg-[#E5E7EB]" />
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded-md bg-[#E5E7EB]" />
                <div className="h-3 w-20 animate-pulse rounded-md bg-[#F3F4F1]" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${user.name} avatar`}
                  className="h-11 w-11 rounded-md border border-[#E5E7EB] object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#A5D6A7] text-sm font-semibold text-[#1F5A24]">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1F2937]">{user.name}</p>
                <p className="mt-1 truncate text-xs uppercase tracking-[0.14em] text-[#2E7D32]">
                  {user.role}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-[#1F2937]">EcoPlate Workspace</p>
              <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                Sign in to access the app workspace.
              </p>
            </div>
          )}
        </div>

        {user?.role === "restaurant" ? (
          <Link href="/donations/new" className="btn-primary mt-4 w-full">
            <PlusCircle className="h-4 w-4" />
            New Donation
          </Link>
        ) : user?.role === "admin" ? (
          <Link href="/admin/pending-approvals" className="btn-secondary mt-4 w-full">
            <ShieldCheck className="h-4 w-4" />
            Pending Approvals
          </Link>
        ) : null}

        <div className="mt-5">
          <p className="sidebar-section-title">Workspace</p>
          <div className="mt-3 space-y-1.5">
            {links.map((link, index) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || (link.href !== "/admin" && pathname.startsWith(`${link.href}/`));

              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24, delay: index * 0.04 }}
                >
                  <Link
                    href={link.href}
                    className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-5">
          <p className="sidebar-section-title">Explore</p>
          <div className="mt-3 space-y-2">
            <Link href="/ads" className="sidebar-link">
              <Megaphone className="h-4 w-4" />
              <span>Public Ads</span>
            </Link>
            <a
              href="#top"
              className="sidebar-link"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Back To Top</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
