"use client";

import { PropsWithChildren } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import { chromeHeaderOffset } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { TopHeader } from "./top-header";
import { BottomNav } from "./bottom-nav";

interface AppShellProps extends PropsWithChildren {
  location?: string;
  hideMobileBottomNav?: boolean;
  hideTopHeader?: boolean;
  onBack?: () => void;
  mainClassName?: string;
}

export function AppShell({ children, hideMobileBottomNav = false, hideTopHeader = false, onBack, mainClassName }: AppShellProps) {
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const navigationItems = getNavigationItems(role);

  return (
    <div className="min-h-dvh bg-zinc-50" data-app-shell>
      {hideTopHeader ? null : (
        <TopHeader
          role={role}
          user={user}
          isLoggedIn={isLoggedIn}
          onLogout={logout}
          onBack={onBack}
          navigationItems={navigationItems}
        />
      )}
      <main
        className={cn(
          "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:max-w-430 lg:px-8",
          hideMobileBottomNav ? "pb-6 md:pb-10" : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10",
          !hideTopHeader && chromeHeaderOffset,
          mainClassName
        )}
      >
        {children}
      </main>
      {hideMobileBottomNav ? null : <BottomNav items={navigationItems} />}
    </div>
  );
}
