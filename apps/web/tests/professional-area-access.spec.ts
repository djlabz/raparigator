import { test, expect } from "@playwright/test";
import {
  addSessionToPage,
  disposablePassword,
  signInAdminViaApi,
  signInViaApi,
  signUpDisposableProfessional,
} from "./helpers/api";
import { seedUserRole } from "./helpers/auth";
import { credentials } from "./helpers/credentials";

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

  test("profissional suspensa não entra no painel mesmo após novo login", async ({ page }) => {
    const professional = await signUpDisposableProfessional();
    const mine = await professional.api.announcements.getMine();
    const profileId = mine.ad!.id;
    const admin = await signInAdminViaApi(credentials.admin);
    await admin.api.admin.suspendProfessional({ id: profileId, reason: "Teste E2E" });
    try {
      const again = await signInViaApi({ email: professional.email, password: disposablePassword });
      await addSessionToPage(page, again);
      await page.goto("/profissional/dashboard");
      await page.waitForURL(/\/feed/);
      await expect(page).not.toHaveURL(/\/profissional/);
    } finally {
      await admin.api.admin.reinstateProfessional({ id: profileId });
    }
  });

  test("profissional abre o painel normalmente", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard");
    await expect(page).toHaveURL(/\/profissional\/dashboard/);
    await expect(page.getByRole("link", { name: "Painel" })).toBeVisible();
  });
});
