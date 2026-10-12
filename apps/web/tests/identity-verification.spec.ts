import { expect, request, test, type Page } from "@playwright/test";
import type { AnnouncementDraftState } from "@sigillus/contracts";
import { buildInitialState } from "@sigillus/domain";
import { createApiClient, type ApiClient } from "@/lib/api/client";
import { addSessionToPage, apiUrl, type ApiSession } from "./helpers/api";
import { seedAdminSession } from "./helpers/auth";

const password = "Descartavel@123";
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWOokLOBIwbiOABZQw0hI3S61wAAAABJRU5ErkJggg==",
  "base64",
);
const MISSING_FLAG_MESSAGE =
  "A API em uso está sem IDENTITY_REQUIRED=true. Encerre a API reaproveitada na porta 4001 e rode a E2E de novo para o webServer do playwright.config subir a API com a flag.";

type Professional = ApiSession & { alias: string };

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function signUpProfessional(): Promise<Professional> {
  const suffix = uniqueSuffix();
  const alias = `Verificada ${suffix}`;
  const email = `verificada-${suffix}@sigillus.dev`;
  const context = await request.newContext();
  try {
    const response = await context.post(`${apiUrl}/api/auth/sign-up/email`, {
      data: { email, password, name: "Anunciante Descartável", role: "profissional", alias },
    });
    if (!response.ok()) {
      throw new Error(`Falha no cadastro via API (${response.status()}): ${await response.text()}`);
    }
    const cookies = response
      .headersArray()
      .filter((header) => header.name.toLowerCase() === "set-cookie")
      .map((header) => {
        const [pair] = header.value.split(";");
        const eqIdx = pair.indexOf("=");
        return { name: pair.slice(0, eqIdx).trim(), value: pair.slice(eqIdx + 1).trim() };
      });
    const cookie = cookies.map((item) => `${item.name}=${item.value}`).join("; ");
    return {
      email,
      alias,
      cookies,
      api: createApiClient({ baseUrl: apiUrl, headers: { cookie } }),
    };
  } finally {
    await context.dispose();
  }
}

async function requireIdentityFlag(api: ApiClient) {
  const mine = await api.identity.getMine();
  if (!mine.required) {
    throw new Error(MISSING_FLAG_MESSAGE);
  }
  return mine;
}

function completeDraft(): AnnouncementDraftState {
  const draft = buildInitialState({
    slug: "x",
    artisticName: "X",
    city: "",
    state: "",
    startingPrice: 0,
    images: [],
    rating: 0,
    reviewsCount: 0,
    profileViews: 0,
    status: "livre",
  });
  return {
    ...draft,
    shortDescription: "Curta e direta",
    description: "Descrição longa o bastante para o anúncio.",
    characteristics: {
      ...draft.characteristics,
      gender: "Mulher",
      ethnicity: "Morena",
      height: "170",
      weight: "60",
      hairColor: "Liso::Castanho",
      smoker: "Não",
    },
    services: draft.services.map((item, index) => ({ ...item, selected: index < 2 })),
    pricing: [
      { label: "1 hora", price: "35000", disabled: false, billingType: "hourly" },
      { label: "30 min", price: "20000", disabled: false, billingType: "hourly" },
    ],
    paymentMethods: ["pix"],
    locationState: "SP",
    locationCity: "Sao Paulo",
    locationAddresses: [
      {
        id: "addr-1",
        label: "Jardins",
        addressLine: "Jardins",
        city: "Sao Paulo",
        state: "SP",
        country: "Brasil",
        notes: "",
        active: true,
      },
    ],
  };
}

async function submitViaApi(api: ApiClient) {
  const keys: string[] = [];
  for (const kind of ["document", "selfie"] as const) {
    const created = await api.identity.createUpload({
      kind,
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
    keys.push(created.key);
  }
  await api.identity.submit({ documentKey: keys[0]!, selfieKey: keys[1]! });
}

function verificationCard(page: Page, alias: string) {
  return page.getByTestId("identity-verification-card").filter({ hasText: alias });
}

async function expectImageLoaded(page: Page, alt: string) {
  const image = page.getByRole("img", { name: alt });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  return (await image.getAttribute("src"))!;
}

test.describe("verificação de identidade da anunciante", () => {
  test("anunciante envia documento e selfie, admin aprova e o anúncio é publicado", async ({
    page,
  }) => {
    const professional = await signUpProfessional();
    await requireIdentityFlag(professional.api);
    await seedAdminSession(page);
    await professional.api.announcements.getMine();
    const blocked = await professional.api.announcements.publish({ draft: completeDraft() });
    expect(blocked).toMatchObject({ ok: false, reason: "identity_required" });

    await addSessionToPage(page, professional);
    await page.goto("/profissional/anuncios/verificacao");
    await expect(page.getByText("Verificação pendente de envio")).toBeVisible();
    await page.getByLabel("Documento com foto").setInputFiles({
      name: "documento.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.getByLabel("Selfie").setInputFiles({
      name: "selfie.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.getByRole("button", { name: "Enviar para verificação" }).click();
    await expect(page.getByText("Em análise")).toBeVisible();

    const pending = await professional.api.announcements.publish({ draft: completeDraft() });
    expect(pending).toMatchObject({ ok: false, reason: "identity_required" });

    await page.goto("/admin/verificacoes");
    const card = verificationCard(page, professional.alias);
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Ver documento e selfie" }).click();
    const documentUrl = await expectImageLoaded(page, "Documento");
    await expectImageLoaded(page, "Selfie");

    const anonymous = await request.newContext();
    try {
      const unsigned = new URL(documentUrl);
      expect(unsigned.pathname).toContain("/private/identity/");
      unsigned.search = "";
      expect((await anonymous.get(unsigned.toString())).status()).toBe(403);
      expect((await anonymous.get(documentUrl)).status()).toBe(200);
    } finally {
      await anonymous.dispose();
    }

    await card.getByRole("button", { name: "Aprovar" }).click();
    await expect(card).toHaveCount(0);

    const published = await professional.api.announcements.publish({ draft: completeDraft() });
    expect(published).toEqual({ ok: true });
    const mine = await professional.api.announcements.getMine();
    expect(mine.ad?.verificationStatus).toBe("pending_review");

    await page.goto("/profissional/anuncios/verificacao");
    await expect(page.getByText("Identidade verificada")).toBeVisible();
  });

  test("admin reprova com motivo e a anunciante lê o motivo e pode reenviar", async ({ page }) => {
    const professional = await signUpProfessional();
    await requireIdentityFlag(professional.api);
    await submitViaApi(professional.api);

    await seedAdminSession(page);
    await page.goto("/admin/verificacoes");
    const card = verificationCard(page, professional.alias);
    await card.getByRole("button", { name: "Reprovar" }).click();
    const confirm = card.getByRole("button", { name: "Confirmar reprovação" });
    await expect(confirm).toBeDisabled();
    await card.getByLabel("Motivo da reprovação").fill("Documento ilegível");
    await confirm.click();
    await expect(card).toHaveCount(0);

    await addSessionToPage(page, professional);
    await page.goto("/profissional/anuncios/verificacao");
    await expect(page.getByText("Verificação reprovada")).toBeVisible();
    await expect(page.getByTestId("identity-reject-reason")).toHaveText("Documento ilegível");
    await expect(page.getByRole("button", { name: "Enviar para verificação" })).toBeVisible();
  });
});
