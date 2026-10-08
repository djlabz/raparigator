"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AdminUser } from "@/lib/types";
import { adminUsers } from "@/lib/mock-users";
import { ADMIN_SESSION_COOKIE, writeSessionCookie } from "@/lib/session-cookies";
import { adminAuthClient } from "@/lib/api/admin-auth-client";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";

const STORAGE_KEY = "sigillus-admin-session";

const listeners = new Set<() => void>();

function readStoredEmail(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((l) => l());
}

function setStoredEmail(email: string | null) {
  if (typeof window !== "undefined") {
    if (email) {
      window.localStorage.setItem(STORAGE_KEY, email);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  writeSessionCookie(ADMIN_SESSION_COOKIE, email);
  emitChange();
}

function useMockAdminSession() {
  const email = useSyncExternalStore<string | null>(subscribe, readStoredEmail, () => null);

  const admin = useMemo<AdminUser | null>(() => {
    if (!email) {
      return null;
    }
    return adminUsers.find((u) => u.email === email) ?? null;
  }, [email]);

  return {
    isAdmin: admin !== null,
    admin,
    login: (adminUser: AdminUser) => setStoredEmail(adminUser.email),
    logout: () => {
      setStoredEmail(null);
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    },
  };
}

function useApiAdminSession() {
  const session = adminAuthClient.useSession();
  const [apiAdmin, setApiAdmin] = useState<AdminUser | null>(null);
  const sessionAdmin = session.data?.user;

  useEffect(() => {
    if (!sessionAdmin) {
      setApiAdmin(null);
      return;
    }
    let cancelled = false;
    getApiClient()
      .admin.me()
      .then((res) => {
        if (!cancelled && res.admin) {
          setApiAdmin(res.admin);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionAdmin]);

  const admin: AdminUser | null = useMemo(() => {
    if (!sessionAdmin) {
      return null;
    }
    if (apiAdmin) {
      return apiAdmin;
    }
    return {
      id: sessionAdmin.id,
      fullName: sessionAdmin.name,
      email: sessionAdmin.email,
      role: "admin",
    };
  }, [sessionAdmin, apiAdmin]);

  return {
    isAdmin: Boolean(sessionAdmin),
    admin,
    login: undefined as ((adminUser: AdminUser) => void) | undefined,
    logout: async () => {
      await adminAuthClient.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    },
  };
}

export const useAdminSession = isApiDataSource() ? useApiAdminSession : useMockAdminSession;
