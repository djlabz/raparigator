"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { AuthRole, MockUser } from "@/lib/types";
import { getProfileHref, getRoleLabel } from "@/lib/navigation";
import { useAccountNotifications } from "@/lib/account-notifications";
import { chromeCircle } from "@/lib/chrome-styles";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  role: AuthRole;
  user: MockUser | null;
  onLogout: () => void;
}

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

export function AccountMenu({ role, user, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);
  const profileHref = getProfileHref(role);
  const roleLabel = getRoleLabel(role);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAccountNotifications(
    role as Exclude<AuthRole, "visitor">
  );

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setMenuPos({
        top: rect.bottom + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!openNotifications) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openNotifications]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(chromeCircle, "text-zinc-900")}
          aria-label={`Abrir opções da conta ${roleLabel}${user ? ` · ${user.fullName}` : ""}`}
          aria-expanded={open}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setOpenNotifications(true)}
          className={cn(chromeCircle, "relative")}
          aria-label="Abrir central de notificações"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.17V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v3.17a2 2 0 0 1-.6 1.43L4 17h5" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </div>

      {mounted && open
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-60 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/20"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <div className="border-b border-zinc-100 px-3 py-2.5">
                <p className="text-sm font-semibold text-zinc-900">{user?.fullName ?? roleLabel}</p>
                <p className="text-xs text-zinc-500">{roleLabel}</p>
              </div>
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />
                    <path d="M15 12H3" />
                    <path d="m18 8 4 4-4 4" />
                    <path d="M22 12H15" />
                  </svg>
                </span>
                <span>Sair da conta</span>
              </button>
            </div>,
            document.body
          )
        : null}

      {openNotifications ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-60 bg-black/30"
            onClick={() => setOpenNotifications(false)}
            aria-label="Fechar painel de notificações"
          />
          <aside className="fixed right-0 top-0 z-[70] flex h-screen w-full max-w-sm flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl shadow-zinc-900/20 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Central de notificações</p>
                <p className="mt-1 text-sm text-zinc-700">Avisos recentes da sua conta</p>
              </div>
              <button type="button" onClick={() => setOpenNotifications(false)} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
                Fechar
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    markAsRead(notification.id);
                    setOpenNotifications(false);
                    window.location.href = "/conta#profile-workflow";
                  }}
                  className="flex w-full items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:bg-zinc-100"
                >
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.read ? "bg-zinc-300" : "bg-black"}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-zinc-900">{notification.title}</p>
                      <span className="text-xs text-zinc-500">{notification.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{notification.message}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-100 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  markAllAsRead();
                }}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Marcar tudo como lido
              </button>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
