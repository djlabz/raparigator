import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "@/lib/api/client";

export const adminAuthClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/api/admin-auth",
  fetchOptions: {
    credentials: "include",
  },
});
