"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AuthRole } from "./types";
import { getRoleLabel } from "./navigation";

export interface AccountNotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface AccountNotificationState {
  items: AccountNotificationItem[];
  bannerClosed: boolean;
}

const listeners = new Set<() => void>();
const roleStateCache = new Map<Exclude<AuthRole, "visitor">, AccountNotificationState>();
const roleServerSnapshotCache = new Map<Exclude<AuthRole, "visitor">, AccountNotificationState>();

const notificationsKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-notifications-${role}`;
const bannerKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-banner-dismissed-${role}`;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function defaultNotifications(role: Exclude<AuthRole, "visitor">): AccountNotificationItem[] {
  const roleLabel = getRoleLabel(role).toLowerCase();

  return [
    {
      id: "complete-profile",
      title: "Complete seu cadastro",
      message: `Finalize o perfil ${roleLabel} para liberar as funcionalidades da plataforma.`,
      time: "Agora",
      read: false,
    },
    {
      id: "security-check",
      title: "Validação de segurança",
      message: "Revise seus dados para manter sua conta pronta para uso seguro e rastreável.",
      time: "Hoje, 09:40",
      read: true,
    },
  ];
}

function readState(role: Exclude<AuthRole, "visitor">): AccountNotificationState {
  if (typeof window === "undefined") {
    const cachedServerState = roleServerSnapshotCache.get(role);
    if (cachedServerState) {
      return cachedServerState;
    }

    const serverState = { items: defaultNotifications(role), bannerClosed: false };
    roleServerSnapshotCache.set(role, serverState);
    return serverState;
  }

  const rawItems = window.localStorage.getItem(notificationsKey(role));
  const rawBanner = window.localStorage.getItem(bannerKey(role));

  let items = defaultNotifications(role);

  if (rawItems) {
    try {
      const parsed = JSON.parse(rawItems) as AccountNotificationItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        items = parsed;
      }
    } catch {
      items = defaultNotifications(role);
    }
  }

  return {
    items,
    bannerClosed: rawBanner === "true",
  };
}

function getSnapshot(role: Exclude<AuthRole, "visitor">): AccountNotificationState {
  const cachedState = roleStateCache.get(role);
  if (cachedState) {
    return cachedState;
  }

  const initialState = readState(role);
  roleStateCache.set(role, initialState);
  return initialState;
}

function getServerSnapshot(role: Exclude<AuthRole, "visitor">): AccountNotificationState {
  return readState(role);
}

function writeState(role: Exclude<AuthRole, "visitor">, state: AccountNotificationState) {
  if (typeof window === "undefined") {
    return;
  }

  const nextState: AccountNotificationState = {
    items: state.items,
    bannerClosed: state.bannerClosed,
  };

  roleStateCache.set(role, nextState);
  window.localStorage.setItem(notificationsKey(role), JSON.stringify(nextState.items));
  window.localStorage.setItem(bannerKey(role), String(nextState.bannerClosed));
  emitChange();
}

export function useAccountNotifications(role: Exclude<AuthRole, "visitor">) {
  const state = useSyncExternalStore(subscribe, () => getSnapshot(role), () => getServerSnapshot(role));

  const unreadCount = useMemo(() => state.items.filter((item) => !item.read).length, [state.items]);

  return {
    notifications: state.items,
    unreadCount,
    bannerClosed: state.bannerClosed,
    setBannerClosed: (nextValue: boolean) => writeState(role, { ...state, bannerClosed: nextValue }),
    markAllAsRead: () => writeState(role, { ...state, items: state.items.map((item) => ({ ...item, read: true })) }),
    markAsRead: (id: string) =>
      writeState(role, {
        ...state,
        items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
      }),
  };
}
