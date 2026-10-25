import { test, expect } from "@playwright/test";
import { credentials } from "./helpers/credentials";
import { signInAdminViaApi, signUpDisposableProfessional } from "./helpers/api";
import { seedAdminSession } from "./helpers/auth";

test.describe("Admin", () => {
  test.describe.configure({ mode: "serial" });

  test("login válido abre o dashboard", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel("E-mail administrativo").fill(credentials.admin.email);
    await page.getByLabel("Senha").fill(credentials.admin.password);
    await page.getByRole("button", { name: "Acessar painel" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByText("Dashboard").first()).toBeVisible();
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Clientes", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Validação de Perfis" }),
    ).toBeVisible();
  });

  test("sessão seed acessa o painel sem formulário", async ({ page }) => {
    await seedAdminSession(page);
    await page.goto("/admin");

    await expect(page.getByText("Total de Clientes").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Denúncias" })).toBeVisible();
  });

  test("sessão que demora a carregar no navegador não manda para o login", async ({ page }) => {
    await page.route("**/api/admin-auth/get-session**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await seedAdminSession(page);
    await page.goto("/admin");

    await expect(page.getByText("Total de Clientes").first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("sem sessão redireciona para login admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL(/\/admin\/login/);
    await expect(page.getByRole("button", { name: "Acessar painel" })).toBeVisible();
  });

  test("perfil só criado pelo painel não aparece em Pendentes nem conta no dashboard", async ({
    page,
  }) => {
    const professional = await signUpDisposableProfessional();
    const mine = await professional.api.announcements.getMine();
    const profileId = mine.ad!.id;
    expect(mine.ad?.verificationStatus).toBe("draft");

    const admin = await signInAdminViaApi(credentials.admin);
    const queue = await admin.api.admin.professionals({ status: "pending_review" });
    expect(queue.map((item) => item.id)).not.toContain(profileId);
    const dashboard = await admin.api.admin.dashboard();
    expect(dashboard.pendingReview).toBe(queue.length);

    await seedAdminSession(page);
    await page.goto("/admin/perfis");
    const loadedList = page.getByRole("link", { name: "Analisar" }).first();
    const emptyState = page.getByText("Nenhum perfil encontrado");
    await expect(loadedList.or(emptyState)).toBeVisible();
    await expect(page.locator(`a[href="/admin/perfis/${profileId}"]`)).toHaveCount(0);
  });
});
