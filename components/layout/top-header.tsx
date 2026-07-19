"use client";

import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import type { AuthRole, MockUser } from "@/lib/types";
import type { NavigationItem } from "@/lib/navigation";
import {
  chromeControlsRow,
  chromeGlassFixed,
  chromePill,
  chromePillActive,
  chromeSafeTop,
} from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { ChromeScrim } from "./chrome-scrim";
import { DesktopNav } from "./desktop-nav";

interface TopHeaderProps {
  role: AuthRole;
  user: MockUser | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  onBack?: () => void;
  navigationItems?: NavigationItem[];
}

export function TopHeader({ role, user, isLoggedIn, onLogout, onBack, navigationItems = [] }: TopHeaderProps) {
  return (
    <header className={cn(chromeGlassFixed, "pointer-events-none")}>
      <ChromeScrim />

      <div
        className={cn(
          chromeControlsRow,
          chromeSafeTop,
          "mx-auto flex w-full max-w-7xl items-center gap-2 px-4 pb-3 sm:gap-3 sm:px-6 md:pb-4 lg:max-w-430 lg:px-8"
        )}
      >
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <BackButton onBack={onBack} />
          <Link href="/" className="font-display text-xl tracking-wide text-wine-800">
            Sigillus
          </Link>
        </div>

        <DesktopNav items={navigationItems} className="min-w-0 flex-1 justify-center" />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {isLoggedIn ? (
            <AccountMenu role={role} user={user} onLogout={onLogout} />
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link href="/auth/login" className={cn(chromePill, "px-3 font-medium text-zinc-700")}>
                Entrar
              </Link>
              <Link href="/auth/cadastro" className={cn(chromePillActive, "px-3 font-medium")} style={{ color: "#fff" }}>
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
