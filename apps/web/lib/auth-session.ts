"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthRole, User } from "@/lib/types";
import { authClient } from "@/lib/api/auth-client";
import { getApiClient } from "@/lib/api/client";
import { resetAccountNotifications } from "@/lib/account-notifications";
import { resetChatStore } from "@/lib/chat-store";
import { resetPremiumPlan } from "@/lib/premium-plan";
import { reportStoreError } from "@/lib/report-store-error";
import { resetReviewInvites } from "@/lib/review-invites";
import { resetVerification } from "@/lib/verification";

function pathRequiresAuth(pathname: string) {
  return (
    pathname.startsWith("/conta") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profissional") ||
    pathname.startsWith("/admin")
  );
}

export function useAuthSession() {
  const session = authClient.useSession();
  const [apiUser, setApiUser] = useState<User | null>(null);
  const sessionUser = session.data?.user;
  const sessionUserId = sessionUser?.id;

  useEffect(() => {
    if (!sessionUserId) {
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
      .catch((error: unknown) => {
        reportStoreError("auth.me", error);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

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
    isPending: session.isPending,
    logout: async () => {
      resetChatStore();
      resetReviewInvites();
      resetPremiumPlan();
      resetVerification();
      resetAccountNotifications();
      await authClient.signOut();
      if (typeof window !== "undefined" && pathRequiresAuth(window.location.pathname)) {
        window.location.href = "/feed";
      }
    },
  };
}
