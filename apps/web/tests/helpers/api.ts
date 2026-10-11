import { request, test, type APIResponse, type Page } from "@playwright/test";
import { createApiClient, type ApiClient } from "@/lib/api/client";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

const disposablePassword = "Descartavel@123";

type SessionCookie = { name: string; value: string };

export type ApiSession = {
  email: string;
  cookies: SessionCookie[];
  api: ApiClient;
};

function baseUrl() {
  return test.info().project.use.baseURL ?? "http://localhost:3100";
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cookiesFrom(response: APIResponse): SessionCookie[] {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => {
      const [pair] = header.value.split(";");
      const eqIdx = pair.indexOf("=");
      return { name: pair.slice(0, eqIdx).trim(), value: pair.slice(eqIdx + 1).trim() };
    });
}

async function authenticate(path: string, data: Record<string, string>): Promise<ApiSession> {
  const context = await request.newContext();
  try {
    const response = await context.post(`${apiUrl}${path}`, { data });
    if (!response.ok()) {
      throw new Error(`Falha em ${path} (${response.status()}): ${await response.text()}`);
    }
    const cookies = cookiesFrom(response);
    const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
    return {
      email: data.email,
      cookies,
      api: createApiClient({ baseUrl: apiUrl, headers: { cookie: cookieHeader } }),
    };
  } finally {
    await context.dispose();
  }
}

export function signUpDisposableClient(prefix = "cliente") {
  return authenticate("/api/auth/sign-up/email", {
    email: `${prefix}-${uniqueSuffix()}@sigillus.dev`,
    password: disposablePassword,
    name: "Cliente Descartável",
    role: "cliente",
  });
}

export function signInViaApi(user: { email: string; password: string }) {
  return authenticate("/api/auth/sign-in/email", { email: user.email, password: user.password });
}

export async function addSessionToPage(page: Page, session: ApiSession) {
  const url = baseUrl();
  await page.context().addCookies(session.cookies.map((cookie) => ({ ...cookie, url })));
}

export async function createEligibleConversation(
  adSlug: string,
  professional: { email: string; password: string },
) {
  const client = await signUpDisposableClient("avaliacao");
  const professionalSession = await signInViaApi(professional);
  const { conversationId } = await client.api.chat.ensureConversationForAd({ adSlug });
  await client.api.chat.sendText({ conversationId, content: "Oi, vi seu anúncio. Tudo bem?" });
  await professionalSession.api.chat.sendText({
    conversationId,
    content: "Tudo ótimo, obrigada pelo contato.",
  });
  return { client, professional: professionalSession, conversationId };
}

export function uniqueText(prefix: string) {
  return `${prefix} ${uniqueSuffix()}`;
}
