import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { getApiUrl } from "@/lib/data-source";

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  basePath: "/api/auth",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
        },
        cpf: {
          type: "string",
          required: false,
        },
        phone: {
          type: "string",
          required: false,
        },
        city: {
          type: "string",
          required: false,
        },
        alias: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});
