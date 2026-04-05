"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getMockUserByRole } from "@/lib/mock-users";
import type { AuthRole } from "@/lib/types";

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

  emitChange();
}

export function useAuthSession() {
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
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    },
    setRole: (nextRole: AuthRole) => setStoredRole(nextRole),
  };
}
