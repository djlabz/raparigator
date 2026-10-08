import { test, type Page } from "@playwright/test";
import { credentials } from "./credentials";

type UserRole = "cliente" | "profissional";

function baseUrl() {
  return test.info().project.use.baseURL ?? "http://localhost:3000";
}

export async function seedUserRole(page: Page, role: UserRole) {
  await page.context().addCookies([{ name: "sigillus-user-role", value: role, url: baseUrl() }]);
  await page.addInitScript((nextRole) => {
    window.localStorage.setItem("sigillus-user-role", nextRole);
  }, role);
}

export async function seedAdminSession(page: Page, email = credentials.admin.email) {
  await page
    .context()
    .addCookies([
      { name: "sigillus-admin-session", value: encodeURIComponent(email), url: baseUrl() },
    ]);
  await page.addInitScript((adminEmail) => {
    window.localStorage.setItem("sigillus-admin-session", adminEmail);
  }, email);
}

export async function loginViaUi(page: Page, user: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar na plataforma" }).click();
  await page.waitForURL("**/feed**");
}

export async function loginViaApi(
  page: Page,
  user: { email: string; password: string },
  apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
) {
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

  const base = baseUrl();
  for (const cookieStr of setCookies) {
    const [pair] = cookieStr.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      await page.context().addCookies([
        {
          name,
          value,
          url: base,
        },
      ]);
    }
  }
}

export async function loginAdminViaApi(
  page: Page,
  admin = credentials.admin,
  apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
) {
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

  const base = baseUrl();
  for (const cookieStr of setCookies) {
    const [pair] = cookieStr.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const name = pair.slice(0, eqIdx).trim();
      const value = pair.slice(eqIdx + 1).trim();
      await page.context().addCookies([
        {
          name,
          value,
          url: base,
        },
      ]);
    }
  }
}
