import { expect, test } from "@playwright/test";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
const password = "Descartavel@123";

test("anunciante sem anúncio não recebe nenhum número pré-preenchido no formulário", async ({
  page,
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `sem-anuncio-${suffix}@sigillus.dev`;
  const response = await page.request.post(`${apiUrl}/api/auth/sign-up/email`, {
    data: {
      email,
      password,
      name: "Anunciante Nova",
      role: "profissional",
      alias: `Nova ${suffix}`,
    },
  });
  expect(response.ok()).toBe(true);
  const base = test.info().project.use.baseURL ?? "http://localhost:3100";
  const cookies = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => {
      const [pair] = header.value.split(";");
      const separator = pair.indexOf("=");
      return {
        name: pair.slice(0, separator).trim(),
        value: pair.slice(separator + 1).trim(),
        url: base,
      };
    });
  await page.context().addCookies(cookies);

  await page.goto("/profissional/dashboard?tab=Anúncio");
  await expect(page.getByRole("heading", { name: /Galeria/i })).toBeVisible();
  for (const section of ["Características físicas", "Tabela de preços", "Localização"]) {
    await page
      .getByRole("button", { name: new RegExp(`^${section}`) })
      .first()
      .click();
  }
  await expect(page.locator("input:visible").first()).toBeVisible();

  const prefilled = await page.evaluate(() =>
    Array.from(document.querySelectorAll("input, textarea, select"))
      .filter((element) => {
        const field = element as HTMLInputElement;
        return !["hidden", "file", "checkbox", "radio"].includes(field.type);
      })
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => {
        const field = element as HTMLInputElement;
        return {
          name: field.name || field.id || field.getAttribute("aria-label"),
          value: field.value,
        };
      })
      .filter((field) => /\d/.test(field.value)),
  );
  expect(prefilled).toEqual([]);
});
