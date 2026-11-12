import { isNotNull } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { isValidCpf } from "@sigillus/domain";
import { mediaAssets, users } from "../src/db/schema";
import { seedDevData } from "../src/db/seed/dev";
import { seedDevUsers } from "../src/db/seed/users";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness();
const STORAGE_URL = "http://storage.test/public/media/";

async function seed() {
  await seedDevUsers(harness.db);
  await seedDevData(harness.db, harness.storage);
}

describe("seed de desenvolvimento", () => {
  it("grava só CPFs válidos", async () => {
    await seed();
    const rows = await harness.db
      .select({ email: users.email, cpf: users.cpf })
      .from(users)
      .where(isNotNull(users.cpf));
    expect(rows.length).toBe(10);
    const invalid = rows.filter((row) => !isValidCpf(row.cpf!));
    expect(invalid).toEqual([]);
  });

  it("sobe as fotos dos anúncios no storage e cria os assets prontos", async () => {
    await seed();
    const assets = await harness.db.select().from(mediaAssets);
    expect(assets).toHaveLength(19);
    for (const asset of assets) {
      expect(asset.status).toBe("ready");
      expect(asset.kind).toBe("image");
      expect(asset.purpose).toBe("gallery");
      expect(asset.contentType).toBe("image/jpeg");
      expect(asset.storageKey.startsWith("public/media/")).toBe(true);
      expect(asset.width).toBe(900);
      expect(asset.height).toBe(1200);
      expect(asset.profileId).not.toBeNull();
      const stored = harness.storage.objects.get(asset.storageKey);
      expect(stored?.contentType).toBe("image/jpeg");
      expect(asset.sizeBytes).toBe(stored?.body.byteLength);
      expect(harness.storage.objects.get(asset.thumbnailKey!)?.contentType).toBe("image/webp");
    }
  });

  it("anúncio e feed devolvem as fotos pela URL pública do storage", async () => {
    await seed();
    const ad = await harness.rpc<{ images: string[] }>("ads/getBySlug", {
      slug: "luna-velvet-sao-paulo",
    });
    expect(ad.body.images).toHaveLength(3);
    expect(ad.body.images.every((url) => url.startsWith(STORAGE_URL))).toBe(true);

    const popular = await harness.rpc<Array<{ images: string[] }>>("ads/listPopular", {
      kind: "most_viewed",
      limit: 6,
    });
    expect(popular.body.length).toBeGreaterThan(0);
    for (const item of popular.body) {
      expect(item.images.length).toBeGreaterThan(0);
      expect(item.images.every((url) => url.startsWith(STORAGE_URL))).toBe(true);
    }
  });

  it("destaques da home usam fotos do storage", async () => {
    await seed();
    const highlights = await harness.rpc<Array<{ coverUrl: string }>>("ads/mediaHighlights");
    expect(highlights.body).toHaveLength(6);
    expect(highlights.body.every((item) => item.coverUrl.startsWith(STORAGE_URL))).toBe(true);
  });

  it("rodar de novo não reenvia objetos nem duplica assets", async () => {
    await seed();
    const keysBefore = [...harness.storage.objects.keys()].sort();
    const put = vi.spyOn(harness.storage, "putObject");
    try {
      await seed();
      expect(put).not.toHaveBeenCalled();
    } finally {
      put.mockRestore();
    }
    expect([...harness.storage.objects.keys()].sort()).toEqual(keysBefore);
    expect(await harness.db.select().from(mediaAssets)).toHaveLength(19);
  });
});
