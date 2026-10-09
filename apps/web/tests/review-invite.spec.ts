import { test, expect } from "@playwright/test";
import { seedUserRole } from "./helpers/auth";

const AD_SLUG = "luna-velvet-sao-paulo";
const AD_WITHOUT_INVITE_SLUG = "valentina-noir-campinas";

test.describe("Avaliação por convite", () => {
  test("cliente sem convite não consegue avaliar", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${AD_WITHOUT_INVITE_SLUG}`);

    await expect(page.getByText(/aguarde o convite da profissional/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
  });

  test("visitante não vê nada sobre avaliar", async ({ page }) => {
    await page.goto(`/anuncio/${AD_SLUG}`);

    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
    await expect(page.getByText(/aguarde o convite da profissional/i)).toHaveCount(0);
  });

  test("com convite aberto, cliente avalia uma única vez", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${AD_SLUG}`);

    await page.getByRole("button", { name: "Avaliar este perfil" }).click();

    await page.locator("label", { has: page.getByRole("radio", { name: "5 estrelas" }) }).click();
    await expect(page.getByRole("radio", { name: "5 estrelas" })).toBeChecked();

    await page.getByPlaceholder("Conte como foi o contato (opcional)").fill("Conversa ótima.");
    await page.getByRole("button", { name: "Enviar avaliação" }).click();

    await expect(page.getByText("Você já avaliou este perfil.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
    await expect(page.getByText("Conversa ótima.")).toBeVisible();
  });

  test("profissional convida um contato pela aba Contatos", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Contatos");

    await expect(page.getByText("Cliente reservado").first()).toBeVisible();

    await page.getByRole("button", { name: "Convidar para avaliar" }).first().click();
    await expect(page.getByText(/Convite enviado · expira em/)).toBeVisible();

    await page.getByRole("button", { name: "Retirar" }).first().click();
    await expect(page.getByRole("button", { name: "Convidar para avaliar" }).first()).toBeVisible();
  });
});
