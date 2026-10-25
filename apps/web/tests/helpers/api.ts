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

export async function signUpDisposableClient(prefix = "cliente") {
  const suffix = uniqueSuffix();
  const alias = `Apelido ${suffix}`;
  const session = await authenticate("/api/auth/sign-up/email", {
    email: `${prefix}-${suffix}@sigillus.dev`,
    password: disposablePassword,
    name: "Cliente Descartável",
    role: "cliente",
    alias,
  });
  return { ...session, alias };
}

export async function signUpDisposableProfessional(prefix = "anunciante") {
  const suffix = uniqueSuffix();
  const alias = `Anunciante ${suffix}`;
  const session = await authenticate("/api/auth/sign-up/email", {
    email: `${prefix}-${suffix}@sigillus.dev`,
    password: disposablePassword,
    name: "Anunciante Descartável",
    role: "profissional",
    alias,
  });
  return { ...session, alias };
}

export function signInAdminViaApi(admin: { email: string; password: string }) {
  return authenticate("/api/admin-auth/sign-in/email", {
    email: admin.email,
    password: admin.password,
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
