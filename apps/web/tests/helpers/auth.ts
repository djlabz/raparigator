import { test, type Page } from "@playwright/test";
import { credentials } from "./credentials";

type UserRole = "cliente" | "profissional";

function baseUrl() {
  return test.info().project.use.baseURL ?? "http://localhost:3100";
}

const cookieCache = new Map<string, Array<{ name: string; value: string; url: string }>>();

export async function loginViaApi(
  page: Page,
  user: { email: string; password: string },
  apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001",
) {
  const base = baseUrl();
  const cached = cookieCache.get(user.email);
  if (cached) {
    await page.context().addCookies(cached.map((c) => ({ ...c, url: base })));
    return;
  }

  const response = await page.request.post(`${apiUrl}/api/auth/sign-in/email`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Falha no login via API (${response.status()}): ${await response.text()}`);
  }

  const setCookies = response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);

  const cookiesToStore: Array<{ name: string; value: string; url: string }> = [];
  for (const cookieStr of setCookies) {
    const [pair] = cookieStr.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      cookiesToStore.push({ name, value, url: base });
    }
  }

  cookieCache.set(user.email, cookiesToStore);
  await page.context().addCookies(cookiesToStore);
}

export async function loginAdminViaApi(
  page: Page,
  admin = credentials.admin,
  apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001",
) {
  const base = baseUrl();
  const cached = cookieCache.get(admin.email);
  if (cached) {
    await page.context().addCookies(cached.map((c) => ({ ...c, url: base })));
    return;
  }

  const response = await page.request.post(`${apiUrl}/api/admin-auth/sign-in/email`, {
    data: {
      email: admin.email,
      password: admin.password,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Falha no login de admin via API (${response.status()}): ${await response.text()}`,
    );
  }

  const setCookies = response
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value);

  const cookiesToStore: Array<{ name: string; value: string; url: string }> = [];
  for (const cookieStr of setCookies) {
    const [pair] = cookieStr.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      cookiesToStore.push({ name, value, url: base });
    }
  }

  cookieCache.set(admin.email, cookiesToStore);
  await page.context().addCookies(cookiesToStore);
}

export async function seedUserRole(page: Page, role: UserRole) {
  await loginViaApi(page, credentials[role]);
}

export async function seedAdminSession(page: Page, email = credentials.admin.email) {
  await loginAdminViaApi(page, {
    email,
    password: credentials.admin.password,
  });
}

export async function loginViaUi(page: Page, user: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await page.waitForURL("**/feed**");
}
