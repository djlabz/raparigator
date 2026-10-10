import { test, expect } from "@playwright/test";

test.describe("Home / onboarding", () => {
  test("exibe marca, hero e CTA para o feed", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Sigillus/i);
    await expect(page.getByRole("link", { name: "Sigillus" }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Nem todo luxo se anuncia/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Comece sua experiência:" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar no feed" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Cadastrar" }).first()).toBeVisible();
  });

  test("navega para o feed com location na query", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Localização").fill("SP, Sao Paulo");
    await page.getByRole("button", { name: "Entrar no feed" }).click();

    await page.waitForURL(/\/feed\?location=/);
    await expect(page).toHaveURL(/location=SP/);
    await expect(page.getByText("Modelos Premium").first()).toBeVisible();
  });

  test("rodapé exibe links institucionais e navega para termos e privacidade", async ({ page }) => {
    await page.goto("/");

    const termosLink = page.getByRole("link", { name: "Termos de Uso" }).first();
    await expect(termosLink).toBeVisible();
    await termosLink.click();
    await expect(page).toHaveURL(/\/termos/);
    await expect(page.getByRole("heading", { name: /Termos de Uso/i })).toBeVisible();

    await page.goto("/privacidade");
    await expect(page.getByRole("heading", { name: /Política de Privacidade/i })).toBeVisible();
    await expect(page.getByText(/Lei Geral de Proteção de Dados/i).first()).toBeVisible();
  });
});
