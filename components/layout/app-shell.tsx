"use client";

import { PropsWithChildren, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import { chromeHeaderOffset } from "@/lib/chrome-styles";
import {
  consumeTabDirection,
  getTabIndex,
  registerShell,
  restoreTabScroll,
  setMobileNavHidden,
  unregisterShell,
  type TabDirection,
} from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import { TopHeader } from "./top-header";
import { DesktopNav } from "./desktop-nav";

interface AppShellProps extends PropsWithChildren {
  location?: string;
  hideMobileBottomNav?: boolean;
  hideTopHeader?: boolean;
  hideDesktopNav?: boolean;
  onBack?: () => void;
  mainClassName?: string;
}

const tabEnterTransition = {
  duration: 0.2,
  ease: [0.22, 0.92, 0.3, 1] as const,
};

function getEnterOffset(direction: TabDirection) {
  if (direction === 0) {
    return 0;
  }

  return direction > 0 ? 12 : -12;
}

export function AppShell({
  children,
  hideMobileBottomNav = false,
  hideTopHeader = false,
  hideDesktopNav = false,
  onBack,
  mainClassName,
}: AppShellProps) {
  const pathname = usePathname();
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const navigationItems = getNavigationItems(role);
  const [enterDirection] = useState<TabDirection>(() => consumeTabDirection());
  const tabIndex = getTabIndex(pathname, navigationItems);
  const shouldAnimateTab = enterDirection !== 0 && tabIndex >= 0;

  useLayoutEffect(() => {
    registerShell();
    return () => {
      unregisterShell();
    };
  }, []);

  useLayoutEffect(() => {
    setMobileNavHidden(hideMobileBottomNav);
  }, [hideMobileBottomNav]);

  useLayoutEffect(() => {
    restoreTabScroll(pathname, navigationItems);
  }, [pathname, navigationItems]);

  return (
    <div className="min-h-dvh bg-zinc-50" data-app-shell>
      {hideTopHeader ? null : (
        <TopHeader
          role={role}
          user={user}
          isLoggedIn={isLoggedIn}
          onLogout={logout}
          onBack={onBack}
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
        {!hideDesktopNav && navigationItems.length > 0 ? (
          <DesktopNav items={navigationItems} className="mb-4 hidden md:grid" />
        ) : null}
        {shouldAnimateTab ? (
          <motion.div
            initial={{
              opacity: 1,
              x: getEnterOffset(enterDirection),
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={tabEnterTransition}
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
