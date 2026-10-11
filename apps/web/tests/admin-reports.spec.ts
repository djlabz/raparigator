import { expect, request, test, type Page } from "@playwright/test";
import { createApiClient, type ApiClient } from "@/lib/api/client";
import { apiUrl } from "./helpers/api";
import { clearAgeGate } from "./helpers/age-gate";
import { seedAdminSession } from "./helpers/auth";

const password = "Descartavel@123";
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWOokLOBIwbiOABZQw0hI3S61wAAAABJRU5ErkJggg==",
  "base64",
);

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function signUpProfessional(): Promise<ApiClient> {
  const suffix = uniqueSuffix();
  const context = await request.newContext();
  try {
    const response = await context.post(`${apiUrl}/api/auth/sign-up/email`, {
      data: {
        email: `denunciada-${suffix}@sigillus.dev`,
        password,
        name: "Anunciante Descartável",
        role: "profissional",
        alias: `Denunciada ${suffix}`,
      },
    });
    if (!response.ok()) {
      throw new Error(`Falha no cadastro via API (${response.status()}): ${await response.text()}`);
    }
    const cookie = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === "set-cookie")
      .map((header) => header.value.split(";")[0])
      .join("; ");
    return createApiClient({ baseUrl: apiUrl, headers: { cookie } });
  } finally {
    await context.dispose();
  }
}

async function uploadGalleryImage(api: ApiClient) {
  const created = await api.media.createUpload({
    kind: "image",
    purpose: "gallery",
    contentType: "image/png",
    sizeBytes: tinyPng.byteLength,
  });
  const context = await request.newContext();
  try {
    const put = await context.put(created.uploadUrl, { headers: created.headers, data: tinyPng });
    expect(put.ok()).toBe(true);
  } finally {
    await context.dispose();
  }
  await api.media.completeUpload({ assetId: created.asset.id });
  await expect
    .poll(async () => (await api.media.get({ assetId: created.asset.id })).status)
    .toBe("ready");
  return created.asset.id;
}

async function reportedAdWithMedia() {
  const professional = await signUpProfessional();
  const mine = await professional.announcements.getMine();
  const slug = mine.ad!.slug;
  const assetId = await uploadGalleryImage(professional);
  const anonymous = createApiClient({ baseUrl: apiUrl });
  const removal = await anonymous.reports.createPublic({
    profileSlug: slug,
    reason: "photo_without_consent",
    details: "Foto publicada sem o meu consentimento.",
  });
  const dismissal = await anonymous.reports.createPublic({
    profileSlug: slug,
    reason: "other",
    details: "Anúncio com informação que parece errada.",
  });
  return {
    professional,
    slug,
    assetId,
    removalId: removal.reportId,
    dismissalId: dismissal.reportId,
  };
}

async function openQueueFor(page: Page, slug: string) {
  await seedAdminSession(page);
  await page.goto("/admin/denuncias");
  await page.getByPlaceholder("Denunciante, acusado ou infração…").fill(slug);
}

test.describe("Denúncias no admin", () => {
  test("remover mídia por denúncia tira a foto do anúncio e encerra a denúncia", async ({
    page,
  }) => {
    const { professional, slug, assetId, removalId } = await reportedAdWithMedia();
    await openQueueFor(page, slug);

    const card = page.getByTestId(`report-card-${removalId}`);
    await expect(card.getByText("Canal público")).toBeVisible();
    await expect(card.getByText("Foto sem consentimento")).toBeVisible();
    await card.getByRole("button", { name: "Ver mídias do anúncio" }).click();
    await card.getByRole("button", { name: "Remover mídia" }).click();
    await page.getByLabel("Observação da moderação").fill("Foto sem consentimento confirmada");
    await page.getByRole("button", { name: "Confirmar", exact: true }).click();

    await expect(card.getByText("Mídia removida")).toBeVisible();
    await expect(card.getByText("Resolvida")).toBeVisible();
    await expect(card.getByRole("button", { name: "Remover mídia" })).toHaveCount(0);
    expect((await professional.media.get({ assetId })).status).toBe("rejected");
  });

  test("encerrar sem ação arquiva a denúncia e mantém a mídia", async ({ page }) => {
    const { professional, slug, assetId, dismissalId } = await reportedAdWithMedia();
    await openQueueFor(page, slug);

    const card = page.getByTestId(`report-card-${dismissalId}`);
    await card.getByRole("button", { name: "Encerrar sem ação" }).click();
    await page.getByRole("button", { name: "Confirmar", exact: true }).click();

    await expect(card.getByText("Encerrada sem ação")).toBeVisible();
    await expect(card.getByText("Arquivada")).toBeVisible();
    expect((await professional.media.get({ assetId })).status).toBe("ready");
  });
});

test.describe("Página pública de denúncia", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("abre sem a confirmação de idade, mostra o prazo e envia a denúncia", async ({ page }) => {
    const professional = await signUpProfessional();
    const { ad } = await professional.announcements.getMine();
    await clearAgeGate(page);
    await page.goto("/denuncia");

    await expect(page.getByRole("heading", { name: "Denunciar anúncio" })).toBeVisible();
    await expect(page.getByText("em até 48 horas")).toBeVisible();
    await page.getByLabel("Link do anúncio").fill(`http://localhost/anuncio/${ad!.slug}`);
    await page.getByLabel("Motivo").selectOption("coercion");
    await page.getByLabel("O que está errado").fill("Anunciante parece estar sob coação.");
    await page.getByRole("button", { name: "Enviar denúncia" }).click();

    await expect(page.getByRole("heading", { name: "Denúncia recebida" })).toBeVisible();
  });
});
