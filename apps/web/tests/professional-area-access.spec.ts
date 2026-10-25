import { test, expect } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

test.describe("acesso à área profissional", () => {
  test("visitante em /profissional/dashboard vai para o login com retorno", async ({ page }) => {
    await page.goto("/profissional/dashboard");
    await page.waitForURL(/\/auth\/login\?next=%2Fprofissional%2Fdashboard/);
    await expect(page.getByRole("button", { name: "Entrar na plataforma" })).toBeVisible();
  });

  test("cliente em /profissional/dashboard é levado ao feed", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto("/profissional/dashboard");
    await page.waitForURL(/\/feed/);
    await expect(page).not.toHaveURL(/\/profissional/);
  });

  test("cliente em /profissional/anuncios também é levado ao feed", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto("/profissional/anuncios");
    await page.waitForURL(/\/feed/);
  });

  test("profissional abre o painel normalmente", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard");
    await expect(page).toHaveURL(/\/profissional\/dashboard/);
    await expect(page.getByRole("link", { name: "Painel" })).toBeVisible();
  });
});
