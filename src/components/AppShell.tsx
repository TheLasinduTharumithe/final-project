"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

function isWorkspaceRoute(pathname: string) {
  const prefixes = ["/dashboard", "/donations", "/requests", "/profile", "/chat", "/admin"];
  const exactMatches = ["/ads/my", "/ads/new"];

  return (
    prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    exactMatches.includes(pathname)
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const workspaceMode = isWorkspaceRoute(pathname);

  return (
    <>
      <Navbar workspaceMode={workspaceMode} />
      <div className="relative z-10">
        {workspaceMode ? <Sidebar /> : null}
        <main className={`app-shell-main ${workspaceMode ? "app-shell-main-with-sidebar" : ""}`}>
          {children}
        </main>
      </div>
    </>
  );
}
