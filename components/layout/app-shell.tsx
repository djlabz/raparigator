"use client";

import { PropsWithChildren, useLayoutEffect } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@/lib/navigation";
import {
  chromeDesktopNavSticky,
  chromeHeaderOffset,
  shellContainerClass,
} from "@/lib/chrome-styles";
import {
  registerShell,
  setMobileNavHidden,
  unregisterShell,
} from "@/lib/tab-navigation";
import { cn } from "@/lib/utils";
import { useShellChrome } from "./shell-chrome";
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

export function AppShell({
  children,
  hideMobileBottomNav: hideMobileBottomNavProp,
  hideTopHeader: hideTopHeaderProp,
  hideDesktopNav: hideDesktopNavProp,
  onBack: onBackProp,
  mainClassName: mainClassNameProp,
}: AppShellProps) {
  const { role, user, isLoggedIn, logout } = useAuthSession();
  const navigationItems = getNavigationItems(role);
  const chrome = useShellChrome();
  const hideMobileBottomNav = hideMobileBottomNavProp ?? chrome.hideMobileBottomNav;
  const hideTopHeader = hideTopHeaderProp ?? chrome.hideTopHeader;
  const hideDesktopNav = hideDesktopNavProp ?? chrome.hideDesktopNav;
  const onBack = onBackProp ?? chrome.onBack;
  const mainClassName = mainClassNameProp ?? chrome.mainClassName;

  useLayoutEffect(() => {
    registerShell();
    return () => {
      unregisterShell();
    };
  }, []);

  useLayoutEffect(() => {
    setMobileNavHidden(hideMobileBottomNav);
  }, [hideMobileBottomNav]);

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
          shellContainerClass,
          hideMobileBottomNav ? "pb-6 md:pb-10" : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10",
          !hideTopHeader && chromeHeaderOffset,
          mainClassName
        )}
      >
        {!hideDesktopNav && navigationItems.length > 0 ? (
          <DesktopNav items={navigationItems} className={cn(chromeDesktopNavSticky, "mb-4 hidden md:block")} />
        ) : null}
        {children}
      </main>
    </div>
  );
}
