"use client";

import { PropsWithChildren } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { DesktopNav } from "./desktop-nav";
import { TopHeader } from "./top-header";
import { BottomNav } from "./bottom-nav";

interface AppShellProps extends PropsWithChildren {
  location?: string;
  hideMobileBottomNav?: boolean;
  onBack?: () => void;
  mainClassName?: string;
}

export function AppShell({ children, hideMobileBottomNav = false, onBack, mainClassName }: AppShellProps) {
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const navigationItems = getNavigationItems(role);

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopHeader role={role} user={user} isLoggedIn={isLoggedIn} onLogout={logout} onBack={onBack} />
      <DesktopNav items={navigationItems} />
      <main className={cn("mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:max-w-430 lg:px-8 md:pb-10", mainClassName ?? "pt-6")}>{children}</main>
      {hideMobileBottomNav ? null : <BottomNav items={navigationItems} />}
    </div>
  );
}
