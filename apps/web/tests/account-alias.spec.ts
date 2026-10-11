import { test, expect, type Page } from "@playwright/test";
import { createApiClient } from "@/lib/api/client";
import { apiUrl, signUpDisposableClient } from "./helpers/api";

const password = "Descartavel@123";
const aliasPattern = /^[A-Z][a-z]+-[A-Z][a-z]+-\d{3}$/;

function baseUrl() {
  return test.info().project.use.baseURL ?? "http://localhost:3100";
}

async function signUpWithoutAlias(page: Page) {
  const email = `apelido-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sigillus.dev`;
  const response = await page.request.post(`${apiUrl}/api/auth/sign-up/email`, {
    data: { email, password, name: "Cliente Sem Apelido", role: "cliente" },
  });
  if (!response.ok()) {
    throw new Error(`Falha no cadastro via API (${response.status()}): ${await response.text()}`);
  }
  const pairs = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => {
      const [pair] = header.value.split(";");
      const eqIdx = pair.indexOf("=");
      return { name: pair.slice(0, eqIdx).trim(), value: pair.slice(eqIdx + 1).trim() };
    });
  await page.context().addCookies(pairs.map((cookie) => ({ ...cookie, url: baseUrl() })));
  const cookie = pairs.map((item) => `${item.name}=${item.value}`).join("; ");
  return createApiClient({ baseUrl: apiUrl, headers: { cookie } });
}

async function fillRequiredAccountFields(page: Page) {
  await page.getByLabel("CPF", { exact: true }).fill("529.982.247-25");
  await page.getByLabel("Telefone", { exact: true }).fill("11987654321");
  await page.getByLabel("Cidade", { exact: true }).fill("São Paulo");
  await page.getByRole("combobox", { name: "Preferência principal" }).click();
  await page.getByRole("option", { name: "Explorar o feed" }).click();
}

test.describe("Apelido na conta", () => {
  test("cliente sem apelido recebe um gerado, edita e não pode repetir o de outra pessoa", async ({
    page,
  }) => {
    const other = await signUpDisposableClient("apelido-dono");
    const api = await signUpWithoutAlias(page);

    const before = await api.auth.me();
    const generated = before.user?.alias ?? "";
    expect(generated).toMatch(aliasPattern);

    await page.goto("/conta");
    const aliasInput = page.getByLabel("Apelido (opcional)");
    await expect(aliasInput).toHaveValue(generated);
    await fillRequiredAccountFields(page);

    await aliasInput.fill(other.alias.toUpperCase());
    await page.getByRole("button", { name: "Salvar dados da conta" }).click();
    await expect(page.getByText("Apelido já em uso.").first()).toBeVisible();
    expect((await api.auth.me()).user?.alias).toBe(generated);

    const chosen = `Coruja ${Date.now()}`;
    await aliasInput.fill(chosen);
    await page.getByRole("button", { name: "Salvar dados da conta" }).click();
    await expect(page.getByText("Dados da conta salvos com sucesso.")).toBeVisible();
    await expect.poll(async () => (await api.auth.me()).user?.alias).toBe(chosen);
  });
});
