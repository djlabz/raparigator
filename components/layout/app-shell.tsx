"use client";

import { PropsWithChildren } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { DesktopNav } from "./desktop-nav";
import { TopHeader } from "./top-header";
import { BottomNav } from "./bottom-nav";
import { Button } from "@/components/ui/button";

interface AppShellProps extends PropsWithChildren {
  location?: string;
  hideMobileBottomNav?: boolean;
  onBack?: () => void;
}

export function AppShell({ children, location = "Sao Paulo, SP", hideMobileBottomNav = false, onBack }: AppShellProps) {
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const navigationItems = getNavigationItems(role);

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopHeader location={location} role={role} user={user} isLoggedIn={isLoggedIn} onLogout={logout} />
      {onBack && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1 px-2 text-zinc-500 hover:text-wine-700 hover:bg-wine-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m15 18-6-6 6-6" /></svg>
            Voltar
          </Button>
        </div>
      )}
      <DesktopNav items={navigationItems} />
      <main className={cn("mx-auto w-full max-w-7xl px-4 pt-6 pb-20 sm:px-6 lg:px-8 md:pb-10")}>{children}</main>
      {hideMobileBottomNav ? null : <BottomNav items={navigationItems} />}
    </div>
  );
}
