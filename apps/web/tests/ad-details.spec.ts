import { test, expect } from "@playwright/test";
import { adTiers, ads, credentials } from "./helpers/credentials";
import { seedUserRole } from "./helpers/auth";

test.describe("Detalhe do anúncio", () => {
  test("visitante vê perfil premium e CTA de login", async ({ page }) => {
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await expect(page.getByRole("heading", { name: ads.premiumName })).toBeVisible();
    await expect(page.getByText("Entrar para Interagir").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "WhatsApp" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Telegram" }).first()).toBeVisible();
  });

  test("alias /p aponta para o mesmo anúncio", async ({ page }) => {
    await page.goto(`/p/${ads.premiumSlug}`);

    await expect(page.getByRole("heading", { name: ads.premiumName })).toBeVisible();
  });

  test("cliente logado vê CTA para iniciar chat", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await expect(page.getByText("Iniciar Chat").first()).toBeVisible();
    await page.getByText("Iniciar Chat").first().click();
    await page.waitForURL("**/chat**");
    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();
  });

  for (const { tier, slug, name } of adTiers) {
    test(`visitante no FAB do anúncio ${tier} vai ao login e volta ao anúncio`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/anuncio/${slug}`);
      await expect(page.getByRole("heading", { name })).toBeVisible();

      await page.evaluate(() => window.scrollTo(0, 700));
      const fabToggle = page.getByRole("button", { name, exact: true });
      await expect(fabToggle).toBeVisible();
      await fabToggle.click();

      await page.getByRole("link", { name: "Entrar para interagir", exact: true }).click();
      await page.waitForURL("**/auth/login**");

      await page.getByLabel("E-mail").fill(credentials.cliente.email);
      await page.getByLabel("Senha").fill(credentials.cliente.password);
      await page.getByRole("button", { name: "Entrar na plataforma" }).click();
      await page.waitForURL(`**/anuncio/${slug}`);
    });
  }

  test("slug inexistente mostra estado vazio", async ({ page }) => {
    await page.goto("/anuncio/nao-existe-este-perfil");

    await expect(page.getByText("Esse encanto não está mais aqui")).toBeVisible();
  });
});
