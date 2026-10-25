import { test, expect, type Page } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";
import { ads } from "./helpers/credentials";

const AUTHENTICATED_RPC_PATTERNS = [
  "/rpc/chat/",
  "/rpc/reviews/listMyInvites",
  "/rpc/premium/getState",
];

function trackAuthenticatedCalls(page: Page) {
  const calls: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (AUTHENTICATED_RPC_PATTERNS.some((pattern) => url.includes(pattern))) {
      calls.push(url);
    }
  });
  return calls;
}

function trackDeniedResponses(page: Page) {
  const denied: string[] = [];
  page.on("response", (response) => {
    if (response.status() === 401 || response.status() === 403) {
      denied.push(`${response.status()} ${response.url()}`);
    }
  });
  return denied;
}

test.describe("sem sessão, nenhuma chamada autenticada", () => {
  test("visitante no anúncio não chama chat, convites nem premium", async ({ page }) => {
    const calls = trackAuthenticatedCalls(page);
    await page.goto(`/anuncio/${ads.premiumSlug}`);
    await expect(page.getByRole("heading", { name: ads.premiumName }).first()).toBeVisible();
    await page.waitForTimeout(2500);
    expect(calls).toEqual([]);
  });

  test("visitante no chat não chama chat, convites nem premium", async ({ page }) => {
    const calls = trackAuthenticatedCalls(page);
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Chat privado" })).toBeVisible();
    await page.waitForTimeout(2500);
    expect(calls).toEqual([]);
  });

  test("cliente no chat não recebe 401 nem 403", async ({ page }) => {
    const denied = trackDeniedResponses(page);
    await seedUserRole(page, "cliente");
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();
    await page.waitForTimeout(2500);
    expect(denied).toEqual([]);
  });

  test("conta com sessão lenta não mostra o convite para entrar", async ({ page }) => {
    await page.route("**/api/auth/get-session**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await seedUserRole(page, "cliente");
    await page.goto("/conta");
    await page.waitForTimeout(600);
    await expect(page.getByText("Ei, falta um convite")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /Minha conta|Conta/i }).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Ei, falta um convite")).toHaveCount(0);
  });
});
