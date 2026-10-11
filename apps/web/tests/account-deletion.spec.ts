import { test, expect, type Page } from "@playwright/test";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
const password = "Descartavel@123";

function baseUrl() {
  return test.info().project.use.baseURL ?? "http://localhost:3100";
}

async function signUpDisposableClient(page: Page) {
  const email = `exclusao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@sigillus.dev`;
  const response = await page.request.post(`${apiUrl}/api/auth/sign-up/email`, {
    data: { email, password, name: "Cliente Descartável", role: "cliente" },
  });
  if (!response.ok()) {
    throw new Error(`Falha no cadastro via API (${response.status()}): ${await response.text()}`);
  }

  const base = baseUrl();
  const cookies = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => {
      const [pair] = header.value.split(";");
      const eqIdx = pair.indexOf("=");
      return {
        name: pair.slice(0, eqIdx).trim(),
        value: pair.slice(eqIdx + 1).trim(),
        url: base,
      };
    });
  await page.context().addCookies(cookies);
  return email;
}

async function openDeleteModal(page: Page) {
  await page.getByTestId("delete-account-button").click();
  await expect(page.getByText("Confirmar exclusão de conta")).toBeVisible();
}

test.describe("Exclusão de conta", () => {
  test("exige a senha correta e encerra a conta", async ({ page }) => {
    const email = await signUpDisposableClient(page);

    await page.goto("/conta");
    await openDeleteModal(page);

    const passwordInput = page.getByLabel("Digite sua senha para confirmar");
    const confirmButton = page.getByTestId("confirm-delete-account-button");
    await expect(confirmButton).toBeDisabled();

    await passwordInput.fill("SenhaErrada@123");
    await confirmButton.click();
    await expect(page.getByText("Senha incorreta.")).toBeVisible();
    await expect(page).toHaveURL(/\/conta/);

    await page.reload();
    await expect(page.getByTestId("delete-account-button")).toBeVisible();

    await openDeleteModal(page);
    await page.getByLabel("Digite sua senha para confirmar").fill(password);
    await page.getByTestId("confirm-delete-account-button").click();
    await page.waitForURL((url) => url.pathname === "/");

    await page.goto("/conta");
    await expect(page).toHaveURL(/\/auth\/login/);

    const loginResponse = await page.request.post(`${apiUrl}/api/auth/sign-in/email`, {
      data: { email, password },
    });
    expect(loginResponse.ok()).toBe(false);
  });
});
