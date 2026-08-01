"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { isDashboardPath } from "@/lib/account-notifications";
import type { AuthRole, MockUser } from "@/lib/types";
import {
  chromeControlsRow,
  chromeGlassFixed,
  chromeSafeTop,
  shellContainerClass,
} from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { ChromeScrim } from "./chrome-scrim";
import { FeedHeaderDesktopTitle, FeedHeaderTitleSlot } from "./feed-header-title-slot";
import { useFeedHeaderTitleFlags } from "@/components/screens/feed-screen/feed-header-title-context";
import { GuestAuthControls } from "./guest-auth-controls";
import { NotificationBellButton } from "./notification-bell-button";

interface TopHeaderProps {
  role: AuthRole;
  user: MockUser | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  onBack?: () => void;
}

function isFeedPath(pathname: string) {
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

export function TopHeader({ role, user, isLoggedIn, onLogout, onBack }: TopHeaderProps) {
  const pathname = usePathname();
  const { enabled, mode } = useFeedHeaderTitleFlags();
  const onFeed = isFeedPath(pathname);
  const feedDesktop = onFeed && enabled && mode === "desktop";
  const showDashboardBell =
    isLoggedIn && role !== "visitor" && isDashboardPath(pathname, role);

  return (
    <header className={cn(chromeGlassFixed, "pointer-events-none")}>
      <ChromeScrim />

      <div
        className={cn(
          chromeControlsRow,
          chromeSafeTop,
          "relative flex items-center gap-3 pb-3 sm:gap-4 md:pb-4",
          shellContainerClass
        )}
      >
        {feedDesktop ? <FeedHeaderDesktopTitle /> : null}

        <div className="relative z-20 flex min-w-0 flex-1 items-center gap-3 md:gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <BackButton onBack={onBack} />
            <FeedHeaderTitleSlot />
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <>
              {showDashboardBell ? <NotificationBellButton role={role} /> : null}
              <AccountMenu role={role} user={user} onLogout={onLogout} />
            </>
          ) : (
            <GuestAuthControls />
          )}
        </div>
      </div>
    </header>
  );
}
