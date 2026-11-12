import type {
  AnnouncementDraftState,
  AnnouncementListingStatus,
  AnnouncementPublishResult,
  AnnouncementSaveSectionResult,
  AnnouncementSectionKey,
  AvailabilityStatus,
} from "@sigillus/contracts";
import {
  ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
  FEED_CATEGORY_BY_GENDER,
  calculateProfileScore,
  draftSelectedServices,
  draftStartingPrice,
  draftToPricingTable,
  generateSmartTips,
  getPublishBlockingItems,
  isSelectUnselected,
  PROFILE_INITIAL_STATUS,
  sanitizeNumericInput,
  transitionOnPublish,
  validateSectionForSave,
  splitHairSelection,
  slugify,
} from "@sigillus/domain";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { adminActivityLogs, professionalProfiles } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import { toProfessionalAd } from "../profiles/mapper";
import type { ProfileRepository } from "../profiles/repository";
import { enqueueAdminReviewDigest } from "./review-digest";

type AnnouncementIdentityGate = (
  userId: string,
) => Promise<{ ok: true } | { ok: false; message: string }>;

export type AnnouncementsServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  jobs: JobQueue;
  logger: Logger;
  identityGate: AnnouncementIdentityGate;
};

export type AnnouncementOwner = { id: string; name: string; alias?: string | null };

type ProfileValues = Partial<typeof professionalProfiles.$inferInsert>;

const ALL_SECTIONS: AnnouncementSectionKey[] = [
  "characteristics",
  "pricing",
  "location",
  "description",
  "services",
  "availability",
];

function optionalSelect(value: string): string | null {
  return isSelectUnselected(value) ? null : value.trim();
}

function splitHair(value: string): { hairType: string | null; hairColor: string | null } {
  const { type, color } = splitHairSelection(value);
  return { hairType: optionalSelect(type), hairColor: optionalSelect(color) };
}

function draftSectionToProfileValues(
  section: AnnouncementSectionKey,
  draft: AnnouncementDraftState,
): ProfileValues {
  switch (section) {
    case "description":
      return { shortDescription: draft.shortDescription, description: draft.description };
    case "location": {
      const values: ProfileValues = {};
      const city = draft.locationCity.trim();
      const state = draft.locationState.trim();
      if (city) {
        values.city = city;
      }
      if (state) {
        values.state = state;
      }
      const activeAddress = draft.locationAddresses.find((address) => address.active);
      const neighborhood = activeAddress?.addressLine.trim();
      if (neighborhood) {
        values.neighborhood = neighborhood;
      }
      return values;
    }
    case "services": {
      const services = draftSelectedServices(draft);
      return services.length > 0 ? { services } : {};
    }
    case "pricing":
      return {
        pricingTable: draftToPricingTable(draft),
        startingPrice: draftStartingPrice(draft),
        paymentMethods: draft.paymentMethods,
      };
    case "characteristics": {
      const values: ProfileValues = {};
      const { characteristics } = draft;
      const ethnicity = optionalSelect(characteristics.ethnicity);
      if (ethnicity) {
        values.ethnicity = ethnicity;
      }
      const eyeColor = optionalSelect(characteristics.eyeColor);
      if (eyeColor) {
        values.eyeColor = eyeColor;
      }
      const hair = splitHair(characteristics.hairColor);
      if (hair.hairType) {
        values.hairType = hair.hairType;
      }
      if (hair.hairColor) {
        values.hairColor = hair.hairColor;
      }
      const height = Number(sanitizeNumericInput(characteristics.height));
      if (height > 0) {
        values.heightCm = height;
      }
      const weight = Number(sanitizeNumericInput(characteristics.weight));
      if (weight > 0) {
        values.weightKg = weight;
      }
      const gender = optionalSelect(characteristics.gender);
      const category = gender ? FEED_CATEGORY_BY_GENDER[gender] : undefined;
      if (category) {
        values.category = category;
      }
      return values;
    }
    case "availability":
      return {};
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}

function isSlugConflict(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  } | null;
  const detail = candidate?.cause ?? candidate;
  return detail?.code === "23505" && detail.constraint === "professional_profile_slug_key";
}

function draftToProfileValues(draft: AnnouncementDraftState): ProfileValues {
  return ALL_SECTIONS.reduce<ProfileValues>(
    (values, section) => ({ ...values, ...draftSectionToProfileValues(section, draft) }),
    {},
  );
}

export function createAnnouncementsService(deps: AnnouncementsServiceDeps) {
  const { db, profiles, jobs, logger, identityGate } = deps;

  async function uniqueSlug(artisticName: string): Promise<string> {
    const base = slugify(artisticName) || "perfil";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${base}-${newId().slice(0, 6)}`;
      if (!(await profiles.findBySlug(candidate))) {
        return candidate;
      }
    }
    return `${base}-${newId()}`;
  }

  async function ensureProfile(owner: AnnouncementOwner) {
    const existing = await profiles.findByUserId(owner.id);
    if (existing) {
      return existing;
    }
    const artisticName = owner.alias?.trim() ?? "";
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const created = await profiles.insertForNewOwner({
          id: newId(),
          userId: owner.id,
          slug: await uniqueSlug(artisticName),
          displayName: artisticName,
          moderationStatus: PROFILE_INITIAL_STATUS,
          listingStatus: "Pausado",
        });
        if (created) {
          logger.info({ profileId: created.id }, "perfil profissional criado");
          return created;
        }
        break;
      } catch (err) {
        if (!isSlugConflict(err)) {
          throw err;
        }
      }
    }
    const concurrent = await profiles.findByUserId(owner.id);
    if (!concurrent) {
      throw new ORPCError("CONFLICT", {
        message: "Não foi possível criar o perfil. Tente de novo.",
      });
    }
    return concurrent;
  }

  return {
    async getMine(owner: AnnouncementOwner) {
      const profile = await ensureProfile(owner);
      const images = await profiles.imagesFor([profile]);
      const ad = toProfessionalAd(
        profile,
        images.get(profile.id) ?? { images: profile.externalImages },
      );
      const draft = profile.draft ?? null;
      return {
        ad,
        draft,
        listingStatus: profile.listingStatus,
        score: draft ? calculateProfileScore(draft) : null,
        tips: draft ? generateSmartTips(draft) : [],
      };
    },

    async saveDraft(owner: AnnouncementOwner, draft: AnnouncementDraftState) {
      const profile = await ensureProfile(owner);
      const savedAt = new Date();
      await profiles.update(profile.id, { draft, draftSavedAt: savedAt });
      return { savedAt: savedAt.toISOString() };
    },

    async saveSection(
      owner: AnnouncementOwner,
      section: AnnouncementSectionKey,
      draft: AnnouncementDraftState,
    ): Promise<AnnouncementSaveSectionResult> {
      const profile = await ensureProfile(owner);
      const failure = validateSectionForSave(section, draft);
      if (failure) {
        return failure;
      }
      await profiles.update(profile.id, {
        draft,
        draftSavedAt: new Date(),
        ...draftSectionToProfileValues(section, draft),
      });
      return { ok: true, saveResult: "saved" };
    },

    async publish(
      owner: AnnouncementOwner,
      draft: AnnouncementDraftState,
    ): Promise<AnnouncementPublishResult> {
      const profile = await ensureProfile(owner);
      const items = getPublishBlockingItems(draft, []);
      if (items.length > 0) {
        return {
          ok: false,
          reason: "blocked",
          message: ANNOUNCEMENT_PUBLISH_BLOCKED_MESSAGE,
          items,
        };
      }
      const transition = transitionOnPublish(profile.moderationStatus);
      const needsReview = transition.needsReview;
      if (needsReview) {
        const gate = await identityGate(owner.id);
        if (!gate.ok) {
          return { ok: false, reason: "identity_required", message: gate.message };
        }
      }
      const now = new Date();
      const values: ProfileValues = {
        draft,
        draftSavedAt: now,
        ...draftToProfileValues(draft),
        listingStatus: "Ativo",
      };
      if (needsReview) {
        values.moderationStatus = transition.status;
        values.submittedAt = now;
        values.rejectionReason = null;
      }
      const updated = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(professionalProfiles)
          .set({ ...values, updatedAt: now })
          .where(eq(professionalProfiles.id, profile.id))
          .returning();
        if (needsReview && row) {
          await tx.insert(adminActivityLogs).values({
            id: newId(),
            action: "profile_submitted",
            targetName: row.artisticName || owner.name,
            targetId: row.id,
          });
        }
        return row ?? null;
      });
      if (needsReview && updated) {
        await enqueueAdminReviewDigest(jobs, now);
      }
      return { ok: true };
    },

    async setListingStatus(owner: AnnouncementOwner, status: AnnouncementListingStatus) {
      const profile = await ensureProfile(owner);
      await profiles.update(profile.id, { listingStatus: status });
      return { ok: true as const };
    },

    async setAvailability(owner: AnnouncementOwner, status: AvailabilityStatus) {
      const profile = await ensureProfile(owner);
      await profiles.update(profile.id, { availabilityStatus: status });
      return { ok: true as const };
    },

    async updateContact(
      owner: AnnouncementOwner,
      contact: { whatsappNumber: string | null; telegramUsername: string | null },
    ) {
      const profile = await ensureProfile(owner);
      await profiles.update(profile.id, contact);
      return { ok: true as const };
    },
  };
}
