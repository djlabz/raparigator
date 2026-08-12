import { test, expect } from "@playwright/test";

test.describe("Checkout", () => {
  test("confirma pagamento mock e exibe toast de sucesso", async ({ page }) => {
    await page.goto("/checkout");

    await expect(page.getByRole("heading", { name: "Fluxo de contratacao" })).toBeVisible();
    await expect(page.getByText(/custodia/i).first()).toBeVisible();

    await page.getByRole("button", { name: "Confirmar e pagar" }).click();
    await expect(page.getByText("Pagamento reservado")).toBeVisible();
  });
});
