"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AuthRole, MockUser } from "@/lib/types";
import { getProfileHref, getRoleLabel } from "@/lib/navigation";

interface AccountMenuProps {
  role: AuthRole;
  user: MockUser | null;
  onLogout: () => void;
}

export function AccountMenu({ role, user, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileHref = getProfileHref(role);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-50 sm:text-sm"
        aria-label={`Abrir opções da conta ${getRoleLabel(role)}`}
        aria-expanded={open}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span className="hidden sm:inline">Perfil: {getRoleLabel(role)}{user ? ` · ${user.fullName}` : ""}</span>
        <span className="sm:hidden">{getRoleLabel(role)}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/10">
          <Link
            href={profileHref}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-900 ring-1 ring-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span>Gerenciar sua conta</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-900 ring-1 ring-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
                <path d="M15 12H3" />
                <path d="m18 8 4 4-4 4" />
                <path d="M22 12H15" />
              </svg>
            </span>
            <span>Sair da conta</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
