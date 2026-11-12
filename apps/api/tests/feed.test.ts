import { describe, expect, it } from "vitest";
import {
  createFeedFiltersCriteria,
  filterAds,
  feedRelevanceScore,
  PREMIUM_VISIBILITY_MULTIPLIER,
} from "@sigillus/domain";
import { seedDevData } from "../src/db/seed/dev";
import { seedDevUsers } from "../src/db/seed/users";
import { createTestHarness } from "./helpers/app";
import { and, eq } from "drizzle-orm";
import { professionalProfiles } from "../src/db/schema";
import { toProfessionalAd } from "../src/modules/profiles/mapper";

const harness = createTestHarness();

type FeedResult = {
  items: Array<{ slug: string; adTier: string; city: string; startingPrice: number }>;
  total: number;
  page: number;
  pageSize: number;
};

async function feed(criteria = createFeedFiltersCriteria(), extra: Record<string, unknown> = {}) {
  const result = await harness.rpc<FeedResult>("feed/list", { criteria, ...extra });
  expect(result.status).toBe(200);
  return result.body;
}

describe("feed, catálogos e anúncio público", () => {
  it("catálogos vêm do banco semeado", async () => {
    const result = await harness.rpc<{ services: string[]; locations: unknown[] }>("catalogs/get");
    expect(result.status).toBe(200);
    expect(result.body.services).toContain("Jantar");
    expect(result.body.locations.length).toBeGreaterThan(5);
  });

  it("lista só perfis publicados, ativos e não suspensos, premium primeiro", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db, harness.storage);
    const all = await feed();
    expect(all.total).toBeGreaterThan(5);
    const tiers = all.items.map((item) => item.adTier);
    const firstStandard = tiers.indexOf("normal");
    const lastPremium = tiers.lastIndexOf("premium");
    expect(lastPremium).toBeLessThan(firstStandard === -1 ? Infinity : firstStandard);
  });

  it("aplica filtros no servidor: cidade, preço, tier, cabelo e serviço", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db, harness.storage);
    const all = await feed();
    const bySp = await feed(createFeedFiltersCriteria({ selectedCity: "Sao Paulo" }));
    expect(bySp.total).toBeLessThan(all.total);
    expect(bySp.items.every((item) => item.city === "Sao Paulo")).toBe(true);

    const cheap = await feed(createFeedFiltersCriteria({ maxPrice: 300 }));
    expect(cheap.items.every((item) => item.startingPrice <= 300)).toBe(true);

    const premium = await feed(createFeedFiltersCriteria({ adTiers: ["premium"] }));
    expect(premium.items.every((item) => item.adTier === "premium")).toBe(true);

    const morenas = await feed(createFeedFiltersCriteria({ hairs: ["Morena"] }));
    expect(morenas.total).toBeGreaterThan(0);
    expect(morenas.total).toBeLessThan(all.total);

    const jantares = await feed(createFeedFiltersCriteria({ services: ["Jantares e eventos"] }));
    expect(jantares.total).toBeGreaterThan(0);

    const none = await feed(createFeedFiltersCriteria({ selectedCity: "Lua" }));
    expect(none.total).toBe(0);
  });

  it("pagina com teto de 100 e rejeita acima", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db, harness.storage);
    const page = await feed(createFeedFiltersCriteria(), { pagination: { page: 1, pageSize: 3 } });
    expect(page.items).toHaveLength(3);
    expect(page.pageSize).toBe(3);
    const tooBig = await harness.rpc("feed/list", {
      criteria: createFeedFiltersCriteria(),
      pagination: { page: 1, pageSize: 101 },
    });
    expect(tooBig.status).toBe(400);
  });

  it("anúncio público por slug e contagem de views", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db, harness.storage);
    const before = await harness.rpc<{ profileViews: number; slug: string }>("ads/getBySlug", {
      slug: "luna-velvet-sao-paulo",
    });
    expect(before.body.slug).toBe("luna-velvet-sao-paulo");
    await harness.rpc("ads/registerView", { slug: "luna-velvet-sao-paulo" });
    const after = await harness.rpc<{ profileViews: number }>("ads/getBySlug", {
      slug: "luna-velvet-sao-paulo",
    });
    expect(after.body.profileViews).toBe(before.body.profileViews + 1);
    const missing = await harness.rpc<null>("ads/getBySlug", { slug: "nao-existe" });
    expect(missing.body).toBeNull();
  });

  it("views repetidas do mesmo IP no mesmo anúncio contam uma vez", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db, harness.storage);
    const slug = "luna-velvet-sao-paulo";
    const read = async () =>
      (await harness.rpc<{ profileViews: number }>("ads/getBySlug", { slug })).body.profileViews;
    const before = await read();
    for (let index = 0; index < 20; index += 1) {
      const response = await harness.rpc("ads/registerView", { slug }, { "x-real-ip": "10.0.0.7" });
      expect(response.status).toBe(200);
    }
    expect(await read()).toBe(before + 1);
    await harness.rpc("ads/registerView", { slug }, { "x-real-ip": "10.0.0.8" });
    expect(await read()).toBe(before + 2);
  });

  it("feed.list equivale a filterAds + feedRelevanceScore do domain sobre as seeds", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db, harness.storage);
    const rows = await harness.db
      .select()
      .from(professionalProfiles)
      .where(
        and(
          eq(professionalProfiles.moderationStatus, "published"),
          eq(professionalProfiles.listingStatus, "Ativo"),
          eq(professionalProfiles.isSuspended, false),
        ),
      );
    const universe = rows.map((row) => ({
      ad: toProfessionalAd(row, { images: [] }),
      updatedAt: row.updatedAt.getTime(),
    }));
    const criteriaList = [
      createFeedFiltersCriteria({ maxPrice: 100_000 }),
      createFeedFiltersCriteria(),
      createFeedFiltersCriteria({ maxPrice: 600 }),
      createFeedFiltersCriteria({ maxPrice: 100_000, adTiers: ["premium"] }),
      createFeedFiltersCriteria({ maxPrice: 100_000, quickFilters: ["Livre Agora"] }),
      createFeedFiltersCriteria({ maxPrice: 100_000, selectedGender: "Mulher" }),
    ];
    for (const criteria of criteriaList) {
      const matched = new Set(
        filterAds(
          universe.map((entry) => entry.ad),
          criteria,
        ),
      );
      const expected = universe
        .filter((entry) => matched.has(entry.ad))
        .sort(
          (a, b) =>
            feedRelevanceScore(b.ad, PREMIUM_VISIBILITY_MULTIPLIER) -
              feedRelevanceScore(a.ad, PREMIUM_VISIBILITY_MULTIPLIER) || b.updatedAt - a.updatedAt,
        )
        .map((entry) => entry.ad.slug);
      const result = await feed(criteria, { pagination: { page: 1, pageSize: 100 } });
      expect(result.items.map((item) => item.slug)).toEqual(expected);
    }
  });
});
