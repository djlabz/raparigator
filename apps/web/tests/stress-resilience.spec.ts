import { test, expect } from "@playwright/test";
import { ads } from "./helpers/credentials";
import { seedUserRole } from "./helpers/auth";

test.describe("Estresse e resiliência na UI", () => {
  test("rajadas rápidas de alternância de filtros no feed não quebram a interface", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/feed");

    const filterPanel = page.locator("[data-feed-filters-panel]");
    const premiumBtn = filterPanel.getByRole("button", { name: "Premium" });
    await expect(premiumBtn).toBeVisible();

    for (let index = 0; index < 6; index += 1) {
      await premiumBtn.click();
    }

    await expect(page.getByText("Luna Velvet").first()).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("cliques rápidos repetidos no envio de briefing não geram cards duplicados", async ({
    page,
  }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${ads.premiumSlug}`);

    await page
      .getByRole("button")
      .filter({ hasText: /^Duração2 horas/ })
      .first()
      .click();

    await page.getByRole("button", { name: "Chat Direto", exact: true }).click();
    await page.waitForURL("**/chat**");

    const preview = page.getByText("Seu interesse, pronto para enviar").first();
    await expect(preview).toBeVisible();

    const countBefore = await page.getByText("Simulação de encontro").count();
    const sendBtn = page.getByRole("button", { name: "Enviar interesse" }).first();
    await Promise.allSettled([sendBtn.click(), sendBtn.click()]);

    await expect(preview).toBeHidden();
    const countAfter = await page.getByText("Simulação de encontro").count();
    expect(countAfter).toBe(countBefore + 1);
  });

  test("navegação rápida sequencial entre rotas públicas e anúncio preserva integridade", async ({
    page,
  }) => {
    await page.goto("/feed");
    await expect(page.getByText("Modelos Premium").first()).toBeVisible();

    await page.goto("/termos");
    await expect(page.getByRole("heading", { name: /Termos de Uso/i })).toBeVisible();

    await page.goto("/privacidade");
    await expect(page.getByRole("heading", { name: /Política de Privacidade/i })).toBeVisible();

    await page.goto(`/anuncio/${ads.premiumSlug}`);
    await expect(page.getByRole("heading", { name: ads.premiumName })).toBeVisible();
    await expect(page.getByText("Simulador de Encontro").first()).toBeVisible();
  });
});
