"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminUser } from "@/lib/types";
import { adminAuthClient } from "@/lib/api/admin-auth-client";
import { getApiClient } from "@/lib/api/client";

export function useAdminSession() {
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
    logout: async () => {
      await adminAuthClient.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    },
  };
}
