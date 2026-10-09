"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import type { AccountNotificationItem, AuthRole } from "@sigillus/contracts";
import { formatRelativeTime } from "@sigillus/domain";
import { getRoleLabel } from "./navigation";

export type { AccountNotificationItem };
export { formatRelativeTime };

const DEFAULT_NOTIFICATION_HREF = "/conta#profile-workflow";

export function getNotificationHref(notification: AccountNotificationItem) {
  return notification.href ?? DEFAULT_NOTIFICATION_HREF;
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

let apiItems: AccountNotificationItem[] = [];
let apiInFlight = false;

const notificationsKey = (role: Exclude<AuthRole, "visitor">) =>
  `sigillus-account-notifications-${role}`;
const bannerKey = (role: Exclude<AuthRole, "visitor">) =>
  `sigillus-account-banner-dismissed-${role}`;
const navbarAckKey = (role: Exclude<AuthRole, "visitor">) => `sigillus-account-navbar-ack-${role}`;
const swingPausedKey = (role: Exclude<AuthRole, "visitor">) =>
  `sigillus-account-swing-paused-${role}`;

export function getDashboardHref(role: AuthRole) {
  if (role === "profissional") {
    return "/profissional/dashboard";
  }
  if (role === "cliente") {
    return "/conta";
  }
  return "/auth/login";
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
  if (isApiDataSource()) {
    return {
      items: apiItems,
      bannerClosed:
        typeof window !== "undefined" && window.localStorage.getItem(bannerKey(role)) === "true",
      navbarAckedUnreadIds: readAckedIds(role),
      swingPaused:
        typeof window !== "undefined" &&
        window.localStorage.getItem(swingPausedKey(role)) === "true",
    };
  }

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

  if (isApiDataSource()) {
    apiItems = state.items;
    window.localStorage.setItem(bannerKey(role), String(state.bannerClosed));
    window.localStorage.setItem(navbarAckKey(role), JSON.stringify(state.navbarAckedUnreadIds));
    window.localStorage.setItem(swingPausedKey(role), String(state.swingPaused));
    emitChange();
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

export function pushNotification(
  role: Exclude<AuthRole, "visitor">,
  item: Omit<AccountNotificationItem, "read">,
) {
  const current = getSnapshot(role);
  const others = current.items.filter((existing) => existing.id !== item.id);

  writeState(role, {
    ...current,
    items: [{ ...item, read: false }, ...others],
    navbarAckedUnreadIds: current.navbarAckedUnreadIds.filter((ackedId) => ackedId !== item.id),
  });
}

export function removeNotification(role: Exclude<AuthRole, "visitor">, id: string) {
  const current = getSnapshot(role);

  if (!current.items.some((item) => item.id === id)) {
    return;
  }

  writeState(role, {
    ...current,
    items: current.items.filter((item) => item.id !== id),
    navbarAckedUnreadIds: current.navbarAckedUnreadIds.filter((ackedId) => ackedId !== id),
  });

  if (isApiDataSource()) {
    getApiClient()
      .notifications.remove({ id })
      .catch(() => {});
  }
}

export function useAccountNotifications(role: Exclude<AuthRole, "visitor">) {
  const useApi = isApiDataSource();
  const state = useSyncExternalStore(
    subscribe,
    () => getSnapshot(role),
    () => getServerSnapshot(role),
  );

  useEffect(() => {
    if (!useApi || apiInFlight) {
      return;
    }
    apiInFlight = true;
    getApiClient()
      .notifications.list()
      .then((items) => {
        apiItems = items;
        emitChange();
      })
      .catch(() => {})
      .finally(() => {
        apiInFlight = false;
      });
  }, [useApi, role]);

  const unreadCount = useMemo(() => state.items.filter((item) => !item.read).length, [state.items]);

  const navbarBadgeCount = useMemo(() => {
    const acked = new Set(state.navbarAckedUnreadIds);
    return state.items.filter((item) => !item.read && !acked.has(item.id)).length;
  }, [state.items, state.navbarAckedUnreadIds]);

  const unreadItems = useMemo(() => state.items.filter((item) => !item.read), [state.items]);
  const readItems = useMemo(() => state.items.filter((item) => item.read), [state.items]);

  const refresh = useMemo(() => {
    return async () => {
      if (!useApi) {
        return;
      }
      try {
        const items = await getApiClient().notifications.list();
        apiItems = items;
        emitChange();
      } catch {}
    };
  }, [useApi]);

  const markAllAsRead = useMemo(() => {
    return () => {
      const current = getSnapshot(role);
      writeState(role, {
        ...current,
        items: current.items.map((item) => ({ ...item, read: true })),
        navbarAckedUnreadIds: [],
        swingPaused: false,
      });
      if (useApi) {
        getApiClient()
          .notifications.markAllRead()
          .catch(() => {});
      }
    };
  }, [role, useApi]);

  const markAsRead = useMemo(() => {
    return (id: string) => {
      const current = getSnapshot(role);
      const nextItems = current.items.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      );
      writeState(role, {
        ...current,
        items: nextItems,
        navbarAckedUnreadIds: current.navbarAckedUnreadIds.filter((ackedId) => ackedId !== id),
        swingPaused: unreadIds(nextItems).length === 0 ? false : current.swingPaused,
      });
      if (useApi) {
        getApiClient()
          .notifications.markRead({ id })
          .catch(() => {});
      }
    };
  }, [role, useApi]);

  return {
    notifications: state.items,
    unreadItems,
    readItems,
    unreadCount,
    navbarBadgeCount,
    swingPaused: state.swingPaused,
    bannerClosed: state.bannerClosed,
    setBannerClosed: (nextValue: boolean) =>
      writeState(role, { ...getSnapshot(role), bannerClosed: nextValue }),
    markAllAsRead,
    markAsRead,
    refresh,
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
      if (!current.swingPaused) {
        return;
      }
      writeState(role, { ...current, swingPaused: false });
    },
  };
}
