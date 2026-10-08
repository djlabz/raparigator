"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { AuthRole, User } from "@/lib/types";
import { getMockUserByRole } from "@/lib/mock-users";
import { USER_ROLE_COOKIE, writeSessionCookie } from "@/lib/session-cookies";
import { authClient } from "@/lib/api/auth-client";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";

const STORAGE_KEY = "sigillus-user-role";

const listeners = new Set<() => void>();

function isAuthRole(value: string | null): value is AuthRole {
  return value === "visitor" || value === "cliente" || value === "profissional";
}

function readStoredRole(): AuthRole {
  if (typeof window === "undefined") {
    return "visitor";
  }

  const storedRole = window.localStorage.getItem(STORAGE_KEY);
  return isAuthRole(storedRole) ? storedRole : "visitor";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setStoredRole(role: AuthRole) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, role);
  }
  writeSessionCookie(USER_ROLE_COOKIE, role === "visitor" ? null : role);
  emitChange();
}

export function pathRequiresAuth(pathname: string) {
  return (
    pathname.startsWith("/conta") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profissional") ||
    pathname.startsWith("/admin")
  );
}

function useMockAuthSession() {
  const role = useSyncExternalStore<AuthRole>(subscribe, readStoredRole, () => "visitor");

  const user = useMemo(() => {
    if (role === "visitor") {
      return null;
    }
    return getMockUserByRole(role);
  }, [role]);

  return {
    role,
    user,
    isLoggedIn: role !== "visitor",
    logout: () => {
      setStoredRole("visitor");
      if (typeof window === "undefined") {
        return;
      }
      if (pathRequiresAuth(window.location.pathname)) {
        window.location.href = "/feed";
      }
    },
    setRole: (nextRole: AuthRole) => setStoredRole(nextRole),
  };
}

function useApiAuthSession() {
  const session = authClient.useSession();
  const [apiUser, setApiUser] = useState<User | null>(null);
  const sessionUser = session.data?.user;

  useEffect(() => {
    if (!sessionUser) {
      setApiUser(null);
      return;
    }
    let cancelled = false;
    getApiClient()
      .auth.me()
      .then((res) => {
        if (!cancelled) {
          setApiUser(res.user);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  const user: User | null = useMemo(() => {
    if (!sessionUser) {
      return null;
    }
    if (apiUser) {
      return apiUser;
    }
    const raw = sessionUser as Record<string, unknown>;
    const role = (raw.role as User["role"] | undefined) ?? "cliente";
    return {
      id: sessionUser.id,
      role,
      fullName: sessionUser.name,
      email: sessionUser.email,
      phone: typeof raw.phone === "string" ? raw.phone : undefined,
      cpf: typeof raw.cpf === "string" ? raw.cpf : undefined,
      city: typeof raw.city === "string" ? raw.city : undefined,
      alias: typeof raw.alias === "string" ? raw.alias : undefined,
      plan: role === "profissional" ? "standard" : undefined,
    };
  }, [sessionUser, apiUser]);

  const role: AuthRole = user ? (user.role as AuthRole) : "visitor";

  return {
    role,
    user,
    isLoggedIn: Boolean(sessionUser),
    logout: async () => {
      await authClient.signOut();
      if (typeof window !== "undefined" && pathRequiresAuth(window.location.pathname)) {
        window.location.href = "/feed";
      }
    },
    setRole: undefined as ((nextRole: AuthRole) => void) | undefined,
  };
}

export const useAuthSession = isApiDataSource() ? useApiAuthSession : useMockAuthSession;
