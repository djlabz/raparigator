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
  navbarAckedUnreadIds: string[];
  swingPaused: boolean;
}

const listeners = new Set<() => void>();
const roleStateCache = new Map<Exclude<AuthRole, "visitor">, AccountNotificationState>();
const roleServerSnapshotCache = new Map<Exclude<AuthRole, "visitor">, AccountNotificationState>();

const notificationsKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-notifications-${role}`;
const bannerKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-banner-dismissed-${role}`;
const navbarAckKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-navbar-ack-${role}`;
const swingPausedKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-swing-paused-${role}`;

export function getDashboardHref(role: AuthRole) {
  if (role === "profissional") {
    return "/profissional/dashboard";
  }
  if (role === "cliente") {
    return "/conta";
  }
  return "/auth/login";
}

export function isDashboardPath(pathname: string, role: AuthRole) {
  const href = getDashboardHref(role);
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

function readAckedIds(role: Exclude<AuthRole, "visitor">): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(navbarAckKey(role));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function readState(role: Exclude<AuthRole, "visitor">): AccountNotificationState {
  if (typeof window === "undefined") {
    return getServerSnapshot(role);
  }

  const rawItems = window.localStorage.getItem(notificationsKey(role));
  const rawBanner = window.localStorage.getItem(bannerKey(role));
  const rawSwing = window.localStorage.getItem(swingPausedKey(role));

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
    navbarAckedUnreadIds: readAckedIds(role),
    swingPaused: rawSwing === "true",
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
  const cachedServerState = roleServerSnapshotCache.get(role);
  if (cachedServerState) {
    return cachedServerState;
  }

  const serverState: AccountNotificationState = {
    items: defaultNotifications(role),
    bannerClosed: false,
    navbarAckedUnreadIds: [],
    swingPaused: false,
  };
  roleServerSnapshotCache.set(role, serverState);
  return serverState;
}

function writeState(role: Exclude<AuthRole, "visitor">, state: AccountNotificationState) {
  if (typeof window === "undefined") {
    return;
  }

  const nextState: AccountNotificationState = {
    items: state.items,
    bannerClosed: state.bannerClosed,
    navbarAckedUnreadIds: state.navbarAckedUnreadIds,
    swingPaused: state.swingPaused,
  };

  roleStateCache.set(role, nextState);
  window.localStorage.setItem(notificationsKey(role), JSON.stringify(nextState.items));
  window.localStorage.setItem(bannerKey(role), String(nextState.bannerClosed));
  window.localStorage.setItem(navbarAckKey(role), JSON.stringify(nextState.navbarAckedUnreadIds));
  window.localStorage.setItem(swingPausedKey(role), String(nextState.swingPaused));
  emitChange();
}

function unreadIds(items: AccountNotificationItem[]) {
  return items.filter((item) => !item.read).map((item) => item.id);
}

export function useAccountNotifications(role: Exclude<AuthRole, "visitor">) {
  const state = useSyncExternalStore(subscribe, () => getSnapshot(role), () => getServerSnapshot(role));

  const unreadCount = useMemo(() => state.items.filter((item) => !item.read).length, [state.items]);

  const navbarBadgeCount = useMemo(() => {
    const acked = new Set(state.navbarAckedUnreadIds);
    return state.items.filter((item) => !item.read && !acked.has(item.id)).length;
  }, [state.items, state.navbarAckedUnreadIds]);

  const unreadItems = useMemo(() => state.items.filter((item) => !item.read), [state.items]);
  const readItems = useMemo(() => state.items.filter((item) => item.read), [state.items]);

  return {
    notifications: state.items,
    unreadItems,
    readItems,
    unreadCount,
    navbarBadgeCount,
    swingPaused: state.swingPaused,
    bannerClosed: state.bannerClosed,
    setBannerClosed: (nextValue: boolean) => writeState(role, { ...getSnapshot(role), bannerClosed: nextValue }),
    markAllAsRead: () => {
      const current = getSnapshot(role);
      writeState(role, {
        ...current,
        items: current.items.map((item) => ({ ...item, read: true })),
        navbarAckedUnreadIds: [],
        swingPaused: false,
      });
    },
    markAsRead: (id: string) => {
      const current = getSnapshot(role);
      const nextItems = current.items.map((item) => (item.id === id ? { ...item, read: true } : item));
      writeState(role, {
        ...current,
        items: nextItems,
        navbarAckedUnreadIds: current.navbarAckedUnreadIds.filter((ackedId) => ackedId !== id),
        swingPaused: unreadIds(nextItems).length === 0 ? false : current.swingPaused,
      });
    },
    clearNavbarBadge: () => {
      const current = getSnapshot(role);
      writeState(role, {
        ...current,
        navbarAckedUnreadIds: unreadIds(current.items),
      });
    },
    pauseNotificationSwing: () => {
      const current = getSnapshot(role);
      writeState(role, { ...current, swingPaused: true });
    },
    resumeNotificationSwing: () => {
      const current = getSnapshot(role);
      writeState(role, { ...current, swingPaused: false });
    },
  };
}
