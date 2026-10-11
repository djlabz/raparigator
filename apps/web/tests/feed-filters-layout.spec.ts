import { test, expect, type Page } from "@playwright/test";

async function openDesktopFeed(page: Page) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/feed");
  await expect(page.locator("[data-feed-filters-panel]")).toBeVisible();
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(
    page.locator("[data-feed-content-column] a[href^='/anuncio/']").first(),
  ).toBeVisible();
}

test.describe("Feed: barra de filtros no desktop", () => {
  test("no fim da página a barra não sobrepõe o rodapé", async ({ page }) => {
    await openDesktopFeed(page);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(
      () =>
        Math.abs(window.scrollY + window.innerHeight - document.documentElement.scrollHeight) <= 1,
    );

    const footer = await page.locator("footer").boundingBox();
    const panel = await page.locator("[data-feed-filters-panel]").boundingBox();
    expect(footer).not.toBeNull();
    expect(panel).not.toBeNull();

    const intersects =
      panel!.x < footer!.x + footer!.width &&
      footer!.x < panel!.x + panel!.width &&
      panel!.y < footer!.y + footer!.height &&
      footer!.y < panel!.y + panel!.height;
    expect(intersects, `painel ${JSON.stringify(panel)} x rodapé ${JSON.stringify(footer)}`).toBe(
      false,
    );
  });

  test("com a página rolada a barra fica grudada abaixo do header", async ({ page }) => {
    await openDesktopFeed(page);

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForFunction(() => window.scrollY === 500);

    const panel = page.locator("[data-feed-filters-panel]");
    await expect(panel).toBeInViewport();

    const { top, stickyTop, headerBottom } = await panel.evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      stickyTop: Number.parseFloat(getComputedStyle(el).top),
      headerBottom: document.querySelector("header")!.getBoundingClientRect().bottom,
    }));

    expect(Number.isFinite(stickyTop)).toBe(true);
    expect(Math.abs(top - stickyTop)).toBeLessThanOrEqual(2);
    expect(top).toBeGreaterThanOrEqual(headerBottom - 2);
  });
});

test.describe("Feed: filtros no mobile", () => {
  test("sem barra lateral; o botão Filtros abre o modal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/feed");

    const openButton = page.getByRole("button", { name: "Filtros", exact: true });
    await expect(openButton).toBeVisible();
    await expect(page.locator("[data-feed-filters-panel]")).toBeHidden();

    await openButton.click();
    await expect(page.getByText("Filtros avançados")).toBeVisible();
  });
});
