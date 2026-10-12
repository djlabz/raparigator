import { test, expect, type Page } from "@playwright/test";
import { PREMIUM_PLAN_OPTIONS, formatCurrencyBRL } from "@sigillus/domain";
import { seedUserRole } from "./helpers/auth";
import { signInViaApi } from "./helpers/api";
import { ads, credentials } from "./helpers/credentials";

const FORBIDDEN_TERMS = /mensal|semestral|\bassine\b|ganhe mais|aumente seus ganhos/i;
const FICTITIOUS_SUMMARY = /R\$ 3\.200|Receita do mês|acima da meta/i;

function normalize(text: string) {
  return text.replace(/ /g, " ");
}

const FORBIDDEN_PRICES = [
  ...new Set(
    PREMIUM_PLAN_OPTIONS.flatMap((option) => [option.price, option.monthlyEquivalent]).map(
      (value) => normalize(formatCurrencyBRL(value)),
    ),
  ),
];

async function expectNoPricing(page: Page) {
  const text = normalize(await page.locator("body").innerText());
  expect(text).not.toMatch(FORBIDDEN_TERMS);
  for (const price of FORBIDDEN_PRICES) {
    expect(text).not.toContain(price);
  }
  return text;
}

let flagOn = false;

test.beforeAll(async () => {
  const session = await signInViaApi(credentials.profissional);
  const state = await session.api.premium.getState();
  flagOn = state.checkoutEnabled;
});

test.describe("Sem preço nem apelo de ganho com o checkout desligado", () => {
  test.beforeEach(() => {
    test.skip(flagOn, "preços liberados pela flag");
  });

  test("feed e anúncio para visitante", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.locator("[data-feed-premium-section]")).toBeVisible();
    await expectNoPricing(page);

    await page.goto(`/anuncio/${ads.premiumSlug}`);
    await expect(page.getByRole("heading", { name: ads.premiumName })).toBeVisible();
    await expectNoPricing(page);
  });

  test("feed e anúncio para anunciante", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/feed");
    await expect(page.locator("[data-feed-premium-section]")).toBeVisible();
    await expectNoPricing(page);

    await page.goto(`/anuncio/${ads.premiumSlug}`);
    await expect(page.getByRole("heading", { name: ads.premiumName })).toBeVisible();
    await expectNoPricing(page);
  });

  test("painel da anunciante: Resumo sem receita nem meta fictícias", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Resumo");
    await expect(page.getByText("Comparativo - Mês Anterior")).toBeVisible();
    const text = await expectNoPricing(page);
    expect(text).not.toMatch(FICTITIOUS_SUMMARY);
  });

  test("painel da anunciante: aba Anúncio", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Anúncio");
    await expect(page.getByRole("heading", { name: /Galeria/i })).toBeVisible();
    await expectNoPricing(page);
  });

  test("tela de assinatura redireciona para o painel", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/assinatura-premium");
    await expect(page).toHaveURL(/\/profissional\/dashboard/);
    await expectNoPricing(page);
  });

  test("conta e chat", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/conta");
    await expect(page.getByRole("heading", { name: "Dados da sua conta" })).toBeVisible();
    await expectNoPricing(page);

    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: "Conversas" })).toBeVisible();
    await expectNoPricing(page);
  });

  test("simulador: CTA de Premium não leva a preço", async ({ page }) => {
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/simulador");
    await expect(page.getByRole("heading", { name: "Simulador de projeção" })).toBeVisible();
    await expectNoPricing(page);

    const cta = page.getByRole("button", { name: /Experimentar o Premium/i });
    if (await cta.isVisible()) {
      await cta.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: /^Continuar$/i }).click();
      await expect(page.getByText("Plano atual")).toBeVisible();
    }
    await expectNoPricing(page);
  });
});
