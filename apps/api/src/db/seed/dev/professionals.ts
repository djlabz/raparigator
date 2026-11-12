import { eq } from "drizzle-orm";
import type { Database } from "../../client";
import type { ObjectStorage } from "../../../lib/storage";
import { identityVerifications, professionalProfiles } from "../../schema";
import { DEV_USERS, upsertUserWithPassword } from "../users";
import { fixtures, type SeedAd } from "./fixtures";
import { seedGallery } from "./media";

const DEV_PROFESSIONAL_PASSWORD = "Profissional@123";
const SEED_IDENTITY_REVIEWER = "seed";

function professionalEmailFor(ad: SeedAd, index: number) {
  return index === 0 ? DEV_USERS[1]!.email : `${ad.slug}@sigillus.dev`;
}

export type SeededProfessionals = {
  profileIdBySlug: Map<string, string>;
  galleryKeysBySlug: Map<string, string[]>;
};

export async function seedProfessionals(
  db: Database,
  storage: ObjectStorage,
): Promise<SeededProfessionals> {
  const profileIdBySlug = new Map<string, string>();
  const galleryKeysBySlug = new Map<string, string[]>();

  for (const [index, ad] of fixtures.ads.entries()) {
    const email = professionalEmailFor(ad, index);
    const userId = await upsertUserWithPassword(db, {
      id: index === 0 ? DEV_USERS[1]!.id : `pro-${ad.slug}`,
      role: "profissional",
      fullName: ad.displayName,
      alias: ad.artisticName,
      email,
      password: DEV_PROFESSIONAL_PASSWORD,
      city: `${ad.city}, ${ad.state}`,
    });

    const seededAt = new Date();
    await db
      .insert(identityVerifications)
      .values({
        id: `identity-${userId}`,
        userId,
        status: "approved",
        reviewedBy: SEED_IDENTITY_REVIEWER,
        reviewedAt: seededAt,
        adminNotifiedAt: seededAt,
      })
      .onConflictDoNothing();

    const [existing] = await db
      .select({ id: professionalProfiles.id })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId));
    const profileId = existing?.id ?? `profile-${ad.id}`;
    profileIdBySlug.set(ad.slug, profileId);

    const values = {
      id: profileId,
      userId,
      slug: ad.slug,
      displayName: ad.artisticName,
      artisticName: ad.artisticName,
      city: ad.city,
      state: ad.state,
      neighborhood: ad.neighborhood,
      category: ad.category,
      shortDescription: ad.shortDescription,
      description: ad.description,
      serviceDescription: ad.serviceDescription,
      startingPrice: ad.startingPrice,
      age: ad.age,
      heightCm: ad.heightCm,
      weightKg: ad.weightKg,
      ethnicity: ad.ethnicity,
      eyeColor: ad.eyeColor,
      hairType: ad.hairType,
      hairColor: ad.hairColor,
      services: ad.services,
      serviceOptions: ad.serviceOptions,
      fetishOptions: ad.fetishOptions,
      fetishCustom: ad.fetishCustom,
      pricingTable: ad.pricingTable,
      paymentMethods: ad.paymentMethods ?? [],
      availabilityStatus: ad.status,
      adTier: ad.adTier,
      listingStatus: "Ativo" as const,
      moderationStatus: ad.moderationStatus ?? ("published" as const),
      submittedAt: ad.submittedAt ? new Date(ad.submittedAt) : new Date(),
      rejectionReason: ad.rejectionReason ?? null,
      isSuspended: ad.isSuspended ?? false,
      rating: ad.rating,
      reviewsCount: ad.reviewsCount,
      profileViews: ad.profileViews,
      whatsappNumber: ad.whatsappNumber ?? null,
      telegramUsername: ad.telegramUsername ?? null,
    };
    await db
      .insert(professionalProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: professionalProfiles.id,
        set: { ...values, updatedAt: new Date() },
      });

    galleryKeysBySlug.set(
      ad.slug,
      await seedGallery(db, storage, {
        userId,
        profileId,
        slug: ad.slug,
        artisticName: ad.artisticName,
        imageCount: ad.imageCount,
      }),
    );
  }

  return { profileIdBySlug, galleryKeysBySlug };
}
