import { test, expect, type Page } from "@playwright/test";
import { createApiClient } from "@/lib/api/client";
import { apiUrl } from "./helpers/api";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sigillus.dev`;
}

async function sessionApi(page: Page) {
  const cookies = await page.context().cookies(apiUrl);
  const cookie = cookies.map((item) => `${item.name}=${item.value}`).join("; ");
  return createApiClient({ baseUrl: apiUrl, headers: { cookie } });
}

test.describe("Identity signup", () => {
  test("cliente não avança no passo 2 com senha curta", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/cadastro/cliente");

    await page.getByLabel("Seu CPF").fill("529.982.247-25");
    await page.getByLabel("Nome completo civil").fill("Cliente Teste");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("E-mail principal").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Confirmar e-mail").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Crie sua senha").fill("curta");
    await page.getByLabel("Confirmar senha").fill("curta");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("A senha deve ter ao menos 8 caracteres.")).toBeVisible();
  });

  test("cliente no passo 3 exige aceite dos termos para criar conta", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/cadastro/cliente");

    await page.getByLabel("Seu CPF").fill("529.982.247-25");
    await page.getByLabel("Nome completo civil").fill("Cliente Teste");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("E-mail principal").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Confirmar e-mail").fill("cliente.teste@sigillus.dev");
    await page.getByLabel("Crie sua senha").fill("SenhaForte@123");
    await page.getByLabel("Confirmar senha").fill("SenhaForte@123");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByRole("heading", { name: "Revisão Final" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Termos de Uso" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Política de Privacidade" })).toBeVisible();

    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(
      page.getByText(
        "Você precisa concordar com os Termos de Uso e a Política de Privacidade para continuar.",
      ),
    ).toBeVisible();
  });

  test("cliente conclui o cadastro e a conta guarda papel e CPF", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/cadastro/cliente");
    const email = uniqueEmail("cadastro-cliente");

    await page.getByLabel("Seu CPF").fill("529.982.247-25");
    await page.getByLabel("Nome completo civil").fill("Cliente Cadastro");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("E-mail principal").fill(email);
    await page.getByLabel("Confirmar e-mail").fill(email);
    await page.getByLabel("Crie sua senha").fill("SenhaForte@123");
    await page.getByLabel("Confirmar senha").fill("SenhaForte@123");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByTestId("client-terms-checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Conta criada com sucesso!")).toBeVisible();

    const me = await (await sessionApi(page)).auth.me();
    expect(me.user?.email).toBe(email);
    expect(me.user?.role).toBe("cliente");
    expect(me.user?.cpf).toBe("529.982.247-25");
  });

  test("anunciante conclui o cadastro e a conta guarda papel, CPF e telefone", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/auth/cadastro/profissional");
    const email = uniqueEmail("cadastro-anunciante");

    await page.getByLabel("CPF", { exact: true }).fill("111.444.777-35");
    await page.getByLabel("Nome Civil").fill("Nome Civil Teste");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("Telefone").fill("11988887777");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Confirmação de email").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("SenhaForte@123");
    await page.getByLabel("Confirmação de senha").fill("SenhaForte@123");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByTestId("professional-terms-checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL("**/profissional/dashboard");

    const me = await (await sessionApi(page)).auth.me();
    expect(me.user?.email).toBe(email);
    expect(me.user?.role).toBe("profissional");
    expect(me.user?.cpf).toBe("111.444.777-35");
    expect(me.user?.phone?.replace(/\D/g, "")).toMatch(/11988887777$/);
  });
});
