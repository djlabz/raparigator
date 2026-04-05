"use client";

import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import type { AuthRole, MockUser } from "@/lib/types";
import { AccountMenu } from "./account-menu";

interface TopHeaderProps {
  location: string;
  role: AuthRole;
  user: MockUser | null;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export function TopHeader({ location, role, user, isLoggedIn, onLogout }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

        <div className="flex items-center gap-2 md:gap-4">
          <BackButton />
          <Link href="/" className="font-display text-xl tracking-wide text-wine-800">
            Sigillus
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 md:flex">
            <span>Local:</span>
            <strong>{location}</strong>
          </div>

          {isLoggedIn ? (
            <AccountMenu role={role} user={user} onLogout={onLogout} />
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link href="/auth/login" className="rounded-lg px-3 py-2 text-zinc-700 transition hover:bg-zinc-100">
                Entrar
              </Link>
              <Link href="/auth/cadastro/cliente" className="rounded-lg bg-wine-700 px-3 py-2 font-medium text-white transition hover:bg-wine-800" style={{ color: "#fff" }}>
                Criar conta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
