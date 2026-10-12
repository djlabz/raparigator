import { test, expect } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

const flagOn = process.env.NEXT_PUBLIC_FINANCIAL_SIMULATOR_ENABLED !== "false";

test.describe("Simulador de projeção desligado", () => {
  test.skip(flagOn, "simulador ligado: este caso roda no passo com a flag false");

  test("rota responde 404 e o painel não mostra o link", async ({ page }) => {
    await seedUserRole(page, "profissional");
    const response = await page.goto("/profissional/simulador");
    expect(response?.status()).toBe(404);

    await page.goto("/profissional/dashboard?tab=Resumo");
    await expect(page.getByRole("heading", { name: "Tráfego e Descoberta" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Simulador de projeção/ })).toHaveCount(0);
  });
});
