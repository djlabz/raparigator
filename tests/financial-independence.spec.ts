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

  test("hero colapsa no mobile após scroll", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "false");
    await page.evaluate(() => window.scrollBy(0, 220));
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "true");
    await expect(page.getByTestId("freedom-hero-compact")).toBeVisible();
  });

  test("InfoHint abre, fecha com Escape e troca ao abrir outro", async ({ page }) => {
    await openCalculator(page, 768);
    await page.getByTestId("info-hint-trigger-calc-base").click();
    await expect(page.getByTestId("info-hint-panel-calc-base")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("info-hint-panel-calc-base")).toHaveCount(0);
    await submitPanel(page);
    await page.getByTestId("info-hint-trigger-race").click();
    await expect(page.getByTestId("info-hint-panel-race")).toBeVisible();
    await page.getByTestId("info-hint-trigger-amount").click();
    await expect(page.getByTestId("info-hint-panel-amount")).toBeVisible();
    await expect(page.getByTestId("info-hint-panel-race")).toHaveCount(0);
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
