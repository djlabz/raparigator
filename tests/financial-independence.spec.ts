import { test, expect, type Page } from "@playwright/test";

async function openCalculator(page: Page, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto("/popular/independencia-financeira");
  await expect(page.getByRole("heading", { name: "Calculadora de Liberdade" })).toBeVisible();
}

async function submitPanel(page: Page) {
  await page.getByRole("button", { name: /Ver meu Painel da Liberdade/i }).click();
  await expect(page.getByTestId("freedom-hero")).toBeVisible();
}

test.describe("Independência financeira", () => {
  test("preview vivo atualiza ao mudar steppers (375)", async ({ page }) => {
    await openCalculator(page, 375);
    const preview = page.getByTestId("freedom-live-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(/\/ mês/i);
    const before = await preview.innerText();
    await page.getByRole("button", { name: "adiciona 50" }).first().click();
    await expect(preview).not.toHaveText(before);
  });

  test("não expõe fórmula no rodapé da calculadora", async ({ page }) => {
    await openCalculator(page, 375);
    await expect(page.getByText(/Cálculo base:/i)).toHaveCount(0);
  });

  test("CTA abre painel com manchete e montante (1280)", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    await expect(page.getByTestId("freedom-hero")).toContainText(/anos/i);
    await expect(page.getByTestId("freedom-hero-amount")).toBeVisible();
  });

  test("hero sticky no desktop ao rolar", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    const before = await hero.boundingBox();
    await page.getByTestId("freedom-metrics-grid").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect(hero).toBeVisible();
    const after = await hero.boundingBox();
    expect(before).toBeTruthy();
    expect(after).toBeTruthy();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(80);
  });

  test("hero colapsa e reexpande suavemente no mobile", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "false");
    await page.evaluate(() => window.scrollBy(0, 220));
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "true");
    const compact = page.getByTestId("freedom-hero-compact");
    await expect(compact).toBeVisible();
    await expect(compact).toContainText(/anos|ritmo/i);
    const box = await compact.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThan(24);
    expect(box!.height).toBeLessThan(96);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "false");
    await expect(page.getByRole("heading", { name: /ganhando .* anos de tempo até a meta/i })).toBeVisible();
  });

  test("explica o significado dos anos ganhos", async ({ page }) => {
    await openCalculator(page, 375);
    await submitPanel(page);
    await expect(page.getByRole("heading", { name: /ganhando .* anos de tempo até a meta/i })).toBeVisible();
    await page.getByTestId("info-hint-trigger-years-back").click();
    const panel = page.getByTestId("info-hint-panel-years-back");
    await expect(panel).toBeVisible();
    await expect(panel.getByTestId("years-back-explanation")).toContainText(/diferença de tempo/i);
    await expect(panel).toContainText(/100%/i);
  });

  test("InfoHints têm explicação própria por módulo", async ({ page }) => {
    await openCalculator(page, 768);
    await page.getByTestId("info-hint-trigger-calc-base").click();
    const calcPanel = page.getByTestId("info-hint-panel-calc-base");
    await expect(calcPanel.getByTestId("hint-calc-base")).toBeVisible();
    await expect(calcPanel).toContainText(/4,33 semanas/i);
    await expect(calcPanel.getByTestId("clt-payroll-breakdown")).toHaveCount(0);
    await expect(calcPanel).toContainText(/1\.621,00|R\$\s*1\.621/);
    await page.keyboard.press("Escape");

    await submitPanel(page);

    await page.getByTestId("info-hint-trigger-amount").click();
    const amountPanel = page.getByTestId("info-hint-panel-amount");
    await expect(amountPanel.getByTestId("hint-amount")).toBeVisible();
    await expect(amountPanel).toContainText(/Montante do seu cenário/i);
    await expect(amountPanel.getByTestId("clt-payroll-breakdown")).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.getByTestId("info-hint-trigger-race").click();
    const racePanel = page.getByTestId("info-hint-panel-race");
    await expect(racePanel.getByTestId("hint-race")).toBeVisible();
    await expect(racePanel.getByTestId("clt-payroll-breakdown")).toBeVisible();
    await expect(racePanel).toContainText("− INSS");
    await expect(racePanel).toContainText(/Decreto/i);
    await page.keyboard.press("Escape");

    await page.getByTestId("info-hint-trigger-equivalence").click();
    const eqPanel = page.getByTestId("info-hint-panel-equivalence");
    await expect(eqPanel.getByTestId("hint-equivalence")).toBeVisible();
    await expect(eqPanel).toContainText(/÷/);
    await expect(eqPanel.getByTestId("clt-payroll-breakdown")).toHaveCount(0);
  });

  test("InfoHint no mobile não gera scroll horizontal", async ({ page }) => {
    await openCalculator(page, 375);
    const before = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(before.scrollWidth).toBeLessThanOrEqual(before.clientWidth + 1);
    await page.getByTestId("info-hint-trigger-calc-base").click();
    const panel = page.getByTestId("info-hint-panel-calc-base");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375 + 1);
    const after = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(after.scrollWidth).toBeLessThanOrEqual(after.clientWidth + 1);
  });

  test("Nova Simulação volta à calculadora", async ({ page }) => {
    await openCalculator(page, 375);
    await submitPanel(page);
    await page.getByRole("button", { name: /Nova Simulação/i }).first().click();
    await expect(page.getByRole("heading", { name: "Calculadora de Liberdade" })).toBeVisible();
  });

  test("toggle Premium continua atualizando números", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    const amount = page.getByTestId("freedom-hero-amount");
    const before = await amount.innerText();
    await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
    await expect(amount).not.toHaveText(before);
  });

  for (const width of [375, 768, 1280] as const) {
    test(`fluxo completo em ${width}px`, async ({ page }) => {
      await openCalculator(page, width);
      await expect(page.getByTestId("freedom-live-preview")).toBeVisible();
      await submitPanel(page);
      await expect(page.getByTestId("freedom-metrics-grid")).toBeVisible();
    });
  }
});
