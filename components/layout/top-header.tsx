"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import type { AuthRole, MockUser } from "@/lib/types";
import {
  chromeControlsRow,
  chromeGlassFixed,
  chromePillActive,
  chromeSafeTop,
} from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { ChromeScrim } from "./chrome-scrim";
import { FeedHeaderDesktopTitle, FeedHeaderTitleSlot } from "./feed-header-title-slot";
import { useFeedHeaderTitleFlags } from "@/components/screens/feed-screen/feed-header-title-context";

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

  return (
    <header className={cn(chromeGlassFixed, "pointer-events-none")}>
      <ChromeScrim />

      <div
        className={cn(
          chromeControlsRow,
          chromeSafeTop,
          "relative mx-auto flex w-full max-w-7xl items-center gap-3 px-4 pb-3 sm:gap-4 sm:px-6 md:pb-4 lg:max-w-430 lg:px-8"
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
            <AccountMenu role={role} user={user} onLogout={onLogout} />
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/auth/login"
                className="font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500 focus-visible:ring-offset-2"
              >
                Entrar
              </Link>
              <Link
                href="/auth/cadastro"
                className={cn(chromePillActive, "px-3 font-medium")}
                style={{ color: "#fff" }}
              >
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
