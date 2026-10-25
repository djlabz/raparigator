import { test, expect, request } from "@playwright/test";
import type { ApiClient } from "@/lib/api/client";
import { addSessionToPage, signUpDisposableProfessional } from "./helpers/api";
import { seedUserRole } from "./helpers/auth";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEElEQVQImWOokLOBIwbiOABZQw0hI3S61wAAAABJRU5ErkJggg==",
  "base64",
);

async function uploadGalleryImage(api: ApiClient) {
  const created = await api.media.createUpload({
    kind: "image",
    purpose: "gallery",
    contentType: "image/png",
    sizeBytes: tinyPng.length,
    fileName: "foto.png",
  });
  const context = await request.newContext();
  try {
    const put = await context.put(created.uploadUrl, { headers: created.headers, data: tinyPng });
    expect(put.ok()).toBe(true);
  } finally {
    await context.dispose();
  }
  await api.media.completeUpload({ assetId: created.asset.id });
  for (let attempt = 0; attempt < 40; attempt++) {
    const asset = await api.media.get({ assetId: created.asset.id });
    if (asset.status === "ready") {
      return asset;
    }
    if (asset.status === "failed" || asset.status === "rejected" || asset.status === "blocked") {
      throw new Error(`mídia ${asset.id} terminou em ${asset.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("mídia não ficou pronta a tempo");
}

async function openGalleryPhoto(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: /Galeria/i })).toBeVisible();
  const cover = page.locator(".cursor-pointer").filter({ hasText: "Capa do Perfil" }).first();
  await expect(cover).toBeVisible();
  await cover.click({ force: true });
  await expect(page.getByTestId("define-as-role-trigger")).toBeVisible();
}

test.describe("Galeria — foto de perfil", () => {
  test("profissional define foto de perfil pelo Definir como…", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Anúncio");

    await openGalleryPhoto(page);

    await page.getByTestId("define-as-role-trigger").click();
    await page.getByTestId("set-role-profile").click();

    const saveCrop = page.getByRole("button", { name: "Salvar" });
    const cropOpenedForNon34Image = await saveCrop
      .waitFor({ state: "visible", timeout: 3000 })
      .then(
        () => true,
        () => false,
      );
    if (cropOpenedForNon34Image) {
      await saveCrop.click();
    }

    await expect(page.getByText("Foto de Perfil").first()).toBeVisible({ timeout: 10000 });
  });

  test("quando a API recusa a nova ordem, a galeria avisa", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const professional = await signUpDisposableProfessional("galeria");
    await professional.api.announcements.getMine();
    await uploadGalleryImage(professional.api);
    await uploadGalleryImage(professional.api);
    await page.route("**/rpc/media/reorder", (route) => route.abort());
    await addSessionToPage(page, professional);
    await page.goto("/profissional/dashboard?tab=Anúncio");

    await expect(page.getByRole("heading", { name: /Galeria/i })).toBeVisible();
    await page.getByRole("button", { name: "Abrir foto" }).first().click();
    await expect(page.getByTestId("define-as-role-trigger")).toBeVisible();
    await page.getByTestId("define-as-role-trigger").click();
    await page.getByTestId("set-role-cover").click();

    const saveCrop = page.getByRole("button", { name: "Salvar" });
    const cropOpened = await saveCrop.waitFor({ state: "visible", timeout: 3000 }).then(
      () => true,
      () => false,
    );
    if (cropOpened) {
      await saveCrop.click();
    }

    await expect(page.getByText("Não foi possível salvar a ordem das fotos.")).toBeVisible({
      timeout: 10000,
    });
  });

  test("mobile: Definir como… abre bottom sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedUserRole(page, "profissional");
    await page.goto("/profissional/dashboard?tab=Anúncio");

    await openGalleryPhoto(page);

    await page.getByTestId("define-as-role-trigger").click();
    await expect(page.getByTestId("define-as-role-sheet")).toBeVisible();
    await expect(page.getByTestId("set-role-profile")).toBeVisible();
    await expect(page.getByTestId("set-role-cover")).toBeVisible();
    await page.getByTestId("define-as-role-close").click();
    await expect(page.getByTestId("define-as-role-sheet")).toHaveCount(0);
  });
});
