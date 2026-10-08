import { createAuthClient } from "better-auth/react";
import { getApiUrl } from "@/lib/data-source";

export const adminAuthClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/api/admin-auth",
  fetchOptions: {
    credentials: "include",
  },
});
