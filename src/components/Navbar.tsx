"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CircleUserRound,
  HandHeart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Megaphone,
  Menu,
  PlusCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser, subscribeToAuthState } from "@/lib/auth";
import { getInitials, safePreviewSrc } from "@/lib/image";
import { getUserProfile } from "@/services/users";
import type { AppUser } from "@/types";

interface NavLinkItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export default function Navbar({ workspaceMode = false }: { workspaceMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!isActive) {
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
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  const publicLinks: NavLinkItem[] = [{ href: "/ads", label: "Public Ads", icon: Megaphone }];

  const userLinks: NavLinkItem[] =
    user?.role === "admin"
      ? [
          { href: "/admin", label: "Admin", icon: ShieldCheck },
          { href: "/admin/ads", label: "Ads", icon: Megaphone },
          { href: "/chat", label: "AI", icon: MessageSquareText }
        ]
      : user?.role === "restaurant"
        ? [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/donations", label: "Donations", icon: HandHeart },
            { href: "/requests", label: "Requests", icon: Sparkles },
            { href: "/ads/my", label: "My Ads", icon: Megaphone },
            { href: "/profile", label: "Profile", icon: CircleUserRound },
            { href: "/chat", label: "AI Help", icon: MessageSquareText }
          ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/donations", label: "Donations", icon: HandHeart },
          { href: "/requests", label: "Requests", icon: Sparkles },
          { href: "/ads", label: "Public Ads", icon: Megaphone },
          { href: "/profile", label: "Profile", icon: CircleUserRound },
          { href: "/chat", label: "AI Help", icon: MessageSquareText }
        ];

  const navLinks = [...publicLinks, ...(user ? userLinks : [])].filter(
    (link, index, items) => items.findIndex((item) => item.href === link.href) === index
  );
  const sidebarCompanionLinks = publicLinks;
  const desktopLinks = navLinks;

  function linkClass(href: string) {
    const normalizedHref = href.split("#")[0];
    const isActive =
      pathname === normalizedHref ||
      (normalizedHref !== "/" && pathname.startsWith(`${normalizedHref}/`));

    return `nav-link ${isActive ? "nav-link-active" : ""}`;
  }

  const avatarSrc = safePreviewSrc(user?.avatar64);
  const initials = getInitials(user?.name);

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4 lg:px-6">
      <div className="mx-auto max-w-[96rem]">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.03, rotate: -3 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative h-10 w-10 overflow-hidden rounded-md border border-[#E5E7EB] bg-white sm:h-11 sm:w-11"
            >
              <Image
                src="/og-image.jpg"
                alt="EcoPlate logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </motion.div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold tracking-tight text-[#1F2937] sm:text-[1.38rem]">
                EcoPlate
              </p>
              <p className="hidden truncate text-xs text-[#6B7280] sm:block sm:text-sm">
                Reduce waste. Feed communities.
              </p>
            </div>
          </Link>

          {workspaceMode && user ? (
            <>
              <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:hidden">
                {desktopLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className={linkClass(link.href)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
                <div className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-[#FAFAF8] px-2 py-1.5">
                  <span className="rounded-md border border-[#A5D6A7] bg-[#E8F5E9] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#1F5A24]">
                    {user.role === "admin" ? "Admin Workspace" : "Workspace"}
                  </span>
                  {sidebarCompanionLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        className={linkClass(link.href)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
              {desktopLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className={linkClass(link.href)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
            {loading ? (
              <div className="rounded-full border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#6B7280]">
                Loading...
              </div>
            ) : user ? (
              <>
                <div className="inline-flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`${user.name} avatar`}
                      className="h-9 w-9 rounded-md border border-[#E5E7EB] object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#A5D6A7] text-sm font-semibold text-[#1F5A24]">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 max-w-[140px] xl:max-w-[180px]">
                    <p className="truncate text-sm font-medium text-[#1F2937]">{user.name}</p>
                    <p className="truncate text-xs capitalize text-[#6B7280]">{user.role}</p>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="btn-secondary">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  <Sparkles className="h-4 w-4" />
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#D1D5DB] bg-white text-[#374151] transition hover:bg-[#F3F4F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/30 lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="surface-panel mt-3 max-h-[calc(100vh-6.5rem)] overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:hidden"
            >
              {user?.role === "restaurant" ? (
                <Link href="/donations/new" className="btn-primary mb-3 w-full">
                  <PlusCircle className="h-4 w-4" />
                  New Donation
                </Link>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className={linkClass(link.href)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-[#E5E7EB] pt-4">
                {loading ? (
                  <p className="text-sm text-[#6B7280]">Loading account...</p>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3">
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
                        <p className="truncate text-sm font-medium text-[#1F2937]">{user.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#2E7D32]">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="btn-secondary w-full">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link href="/login" className="btn-secondary w-full">
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                    <Link href="/register" className="btn-primary w-full">
                      <Sparkles className="h-4 w-4" />
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
