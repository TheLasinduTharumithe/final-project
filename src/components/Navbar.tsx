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
    return `nav-link ${pathname === normalizedHref ? "nav-link-active" : ""}`;
  }

  const avatarSrc = safePreviewSrc(user?.avatar64);
  const initials = getInitials(user?.name);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
      <div className="mx-auto max-w-[96rem]">
        <div className="surface-panel flex items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5 lg:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.03, rotate: -3 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="relative h-11 w-11 overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.06] shadow-[0_18px_34px_rgba(16,185,129,0.18)] sm:h-12 sm:w-12 sm:rounded-[1.35rem]"
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
              <p className="truncate text-xl font-semibold tracking-tight text-white sm:text-[1.38rem]">
                EcoPlate
              </p>
              <p className="truncate text-xs text-slate-400 sm:text-sm">
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
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-emerald-300">
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
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-400">
                Loading...
              </div>
            ) : user ? (
              <>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`${user.name} avatar`}
                      className="h-9 w-9 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-semibold text-slate-950">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 max-w-[140px] xl:max-w-[180px]">
                    <p className="truncate text-sm font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs capitalize text-slate-400">{user.role}</p>
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
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white transition duration-300 hover:bg-white/[0.12] lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label="Toggle navigation"
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

              <div className="mt-4 border-t border-white/10 pt-4">
                {loading ? (
                  <p className="text-sm text-slate-400">Loading account...</p>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={`${user.name} avatar`}
                          className="h-11 w-11 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-sm font-semibold text-slate-950">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{user.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-300">
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
