import { test, expect, type Page } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

const SIMULATOR_PATH = "/profissional/simulador";
const NO_PAYMENT_TEXT =
  "100% do valor do seu atendimento é seu. A plataforma não participa de nenhum pagamento.";
const DISCLAIMER_TEXT = "Simulação. Não representa garantia de renda.";

async function openSimulator(page: Page, width = 375, height = 667) {
  await page.setViewportSize({ width, height });
  await seedUserRole(page, "profissional");
  await page.goto(SIMULATOR_PATH);
  await expect(page.getByRole("heading", { name: "Simulador de projeção" })).toBeVisible();
}

test.describe("Simulador de projeção", () => {
  test("visitante é levado para o login", async ({ page }) => {
    await page.goto(SIMULATOR_PATH);
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fprofissional%2Fsimulador$/);
  });

  test("cliente logado é redirecionado", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(SIMULATOR_PATH);
    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByRole("heading", { name: "Simulador de projeção" })).toHaveCount(0);
  });

  test("rota tem noindex", async ({ page }) => {
    await openSimulator(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("frases obrigatórias aparecem sem rolar em 375×667", async ({ page }) => {
    await openSimulator(page);
    await expect(page.getByText(NO_PAYMENT_TEXT)).toBeInViewport();
    await expect(page.getByText(DISCLAIMER_TEXT)).toBeInViewport();
  });

  test("não fala em CLT, milhão, liberdade nem conquistas", async ({ page }) => {
    await openSimulator(page);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/CLT|milh[aã]o|Liberdade|conquista|Topo das Pesquisas|mensal/i);
  });

  test("steppers atualizam a projeção ao vivo", async ({ page }) => {
    await openSimulator(page);
    const monthly = page.getByTestId("earnings-projection-month");
    const yearly = page.getByTestId("earnings-projection-year");
    await expect(monthly).toHaveText("R$ 25.980,00");
    await expect(yearly).toHaveText("R$ 311.760,00");

    await page.getByRole("button", { name: "Aumentar valor por hora" }).click();
    await expect(page.getByLabel("Valor por hora", { exact: true })).toHaveValue("350");
    await expect(monthly).toHaveText("R$ 30.310,00");

    await page.getByRole("button", { name: "Diminuir dias por semana" }).click();
    await expect(page.getByLabel("Dias por semana", { exact: true })).toHaveValue("4");
    await expect(monthly).toHaveText("R$ 24.248,00");

    await page.getByRole("button", { name: "Aumentar contatos por dia" }).click();
    await expect(page.getByLabel("Contatos por dia", { exact: true })).toHaveValue("5");
    await expect(monthly).toHaveText("R$ 30.310,00");
  });

  test("troca de meta recalcula o prazo e o montante", async ({ page }) => {
    await openSimulator(page);
    const result = page.getByTestId("earnings-goal-result");

    await expect(page.getByRole("radio", { name: "Reserva de 3 meses" })).toBeChecked();
    await expect(result).toContainText("R$ 77.940,00");
    await expect(result).toContainText("com a projeção atual, 3 meses");

    await page.getByRole("radio", { name: "Reserva de 6 meses" }).click();
    await expect(result).toContainText("R$ 155.880,00");
    await expect(result).toContainText("com a projeção atual, 6 meses");

    await page.getByRole("radio", { name: "Valor que eu definir" }).click();
    const custom = page.getByTestId("earnings-goal-custom");
    await expect(custom).toHaveValue("");
    await expect(result).toHaveCount(0);
    await custom.fill("100000");
    await expect(result).toContainText("com a projeção atual, 4 meses");

    await page.getByRole("radio", { name: "Prazo que eu definir" }).click();
    await expect(custom).toHaveValue("");
    await custom.fill("12");
    await expect(result).toContainText("R$ 311.760,00");
  });

  test("troca de cenário compara com a projeção atual", async ({ page }) => {
    await openSimulator(page);
    const comparison = page.getByTestId("earnings-scenario-result");

    await page.getByRole("radio", { name: "Um dia a mais" }).click();
    await expect(comparison).toContainText("R$ 31.176,00");
    await expect(comparison).toContainText("R$ 25.980,00");

    await page.getByRole("radio", { name: "Valor por hora menor" }).click();
    await expect(comparison).toContainText("R$ 21.650,00");
  });

  test("Como calculamos explica a fórmula", async ({ page }) => {
    await openSimulator(page);
    const formula = page.getByText(/× 4,33 semanas/);
    await expect(formula).toBeHidden();
    await page.getByText("Como calculamos").click();
    await expect(formula).toBeVisible();
  });

  test("painel da anunciante leva ao simulador", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Resumo");
    await page.getByRole("link", { name: /Simulador de projeção/ }).click();
    await expect(page).toHaveURL(new RegExp(`${SIMULATOR_PATH}$`));
    await expect(page.getByRole("heading", { name: "Simulador de projeção" })).toBeVisible();
  });
});
