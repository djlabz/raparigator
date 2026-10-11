import { test, expect } from "@playwright/test";
import { addSessionToPage, createEligibleConversation, uniqueText } from "./helpers/api";
import { seedUserRole } from "./helpers/auth";
import { credentials } from "./helpers/credentials";

const AD_SLUG = "luna-velvet-sao-paulo";
const AD_WITH_INVITE_SLUG = "valentina-noir-campinas";

test.describe("Avaliação por convite", () => {
  test("cliente sem convite não consegue avaliar", async ({ page }) => {
    await seedUserRole(page, "cliente");
    await page.goto(`/anuncio/${AD_SLUG}`);

    await expect(page.getByText(/aguarde o convite da profissional/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
  });

  test("visitante não vê nada sobre avaliar", async ({ page }) => {
    await page.goto(`/anuncio/${AD_SLUG}`);

    await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
    await expect(page.getByText(/aguarde o convite da profissional/i)).toHaveCount(0);
  });

  test("com convite aberto, cliente avalia uma única vez", async ({ page }) => {
    const { client, professional, conversationId } = await createEligibleConversation(
      AD_WITH_INVITE_SLUG,
      credentials.profissionalValentina,
    );
    await professional.api.reviews.invite({ conversationId });
    const comment = uniqueText("Conversa ótima.");

    try {
      await addSessionToPage(page, client);
      await page.goto(`/anuncio/${AD_WITH_INVITE_SLUG}`);

      await page.getByRole("button", { name: "Avaliar este perfil" }).click();

      await page.locator("label", { has: page.getByRole("radio", { name: "5 estrelas" }) }).click();
      await expect(page.getByRole("radio", { name: "5 estrelas" })).toBeChecked();

      await page.getByPlaceholder("Conte como foi o contato (opcional)").fill(comment);
      await page.getByRole("button", { name: "Enviar avaliação" }).click();

      await expect(page.getByText("Você já avaliou este perfil.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Avaliar este perfil" })).toHaveCount(0);
      await expect(page.getByText(comment)).toBeVisible();

      const { status } = await client.api.reviews.getInvite({ conversationId });
      expect(status).toBe("used");
    } finally {
      await professional.api.chat.deleteFromInbox({ conversationId });
    }
  });

  test("profissional convida um contato pela aba Contatos", async ({ page }) => {
    const { client, professional, conversationId } = await createEligibleConversation(
      AD_SLUG,
      credentials.profissional,
    );
    try {
      await seedUserRole(page, "profissional");
      await page.goto("/profissional/dashboard?tab=Contatos");

      const row = page.getByText(client.alias, { exact: true }).locator("xpath=../..");
      await expect(row).toBeVisible();

      await row.getByRole("button", { name: "Convidar para avaliar" }).click();
      await expect(row.getByText(/Convite enviado · expira em/)).toBeVisible();
      await expect
        .poll(async () => (await client.api.reviews.getInvite({ conversationId })).status)
        .toBe("open");

      await row.getByRole("button", { name: "Retirar" }).click();
      await expect(row.getByRole("button", { name: "Convidar para avaliar" })).toBeEnabled();
      await expect
        .poll(async () => (await client.api.reviews.getInvite({ conversationId })).status)
        .toBe("none");
    } finally {
      await professional.api.chat.deleteFromInbox({ conversationId });
    }
  });
});
