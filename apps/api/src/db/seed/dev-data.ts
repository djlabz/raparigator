import { eq, inArray, sql } from "drizzle-orm";
import type {
  AdminActivityLog,
  ClientAccount,
  MediaHighlight,
  ProfessionalAd,
  Report,
  Review,
} from "@sigillus/contracts";
import type { Database } from "../client";
import {
  adminActivityLogs,
  conversationParticipants,
  conversations,
  mediaHighlights,
  messages,
  professionalProfiles,
  reports,
  reviewInvites,
  reviews,
  users,
} from "../schema";
import devData from "./fixtures/dev-data.json" with { type: "json" };
import { DEV_USERS, upsertUserWithPassword } from "./users";

type DevData = {
  ads: ProfessionalAd[];
  reviews: Review[];
  mediaHighlights: MediaHighlight[];
  mockClients: ClientAccount[];
  mockReports: Report[];
  adminActivityLog: AdminActivityLog[];
};

const fixtures = devData as unknown as DevData;

export const DEV_PROFESSIONAL_PASSWORD = "Profissional@123";

function professionalEmailFor(ad: ProfessionalAd, index: number) {
  return index === 0 ? DEV_USERS[1]!.email : `${ad.slug}@sigillus.dev`;
}

export async function seedDevData(db: Database) {
  const profileIdBySlug = new Map<string, string>();

  for (const [index, ad] of fixtures.ads.entries()) {
    const email = professionalEmailFor(ad, index);
    const userId = await upsertUserWithPassword(db, {
      id: index === 0 ? DEV_USERS[1]!.id : `pro-${ad.slug}`,
      role: "profissional",
      fullName: ad.displayName,
      email,
      password: DEV_PROFESSIONAL_PASSWORD,
      city: `${ad.city}, ${ad.state}`,
    });

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
      displayName: ad.displayName,
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
      verificationStatus: ad.verificationStatus ?? ("published" as const),
      submittedAt: ad.submittedAt ? new Date(ad.submittedAt) : new Date(),
      rejectionReason: ad.rejectionReason ?? null,
      isSuspended: ad.isSuspended ?? false,
      externalImages: ad.images,
      externalProfileImage: ad.profileImage ?? null,
      externalProfileImageIndex: ad.profileImageIndex ?? null,
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
  }

  for (const review of fixtures.reviews) {
    const ad = fixtures.ads.find((item) => item.id === review.adId);
    const profileId = ad ? profileIdBySlug.get(ad.slug) : undefined;
    if (!profileId) {
      continue;
    }
    await db
      .insert(reviews)
      .values({
        id: `seed-review-${review.id}`,
        profileId,
        authorName: review.author,
        score: review.score,
        comment: review.comment,
        isSeed: true,
        createdAt: new Date(review.createdAt),
      })
      .onConflictDoNothing();
  }

  for (const [position, highlight] of fixtures.mediaHighlights.entries()) {
    await db
      .insert(mediaHighlights)
      .values({ ...highlight, position })
      .onConflictDoUpdate({ target: mediaHighlights.id, set: { ...highlight, position } });
  }

  for (const client of fixtures.mockClients) {
    await db
      .insert(users)
      .values({
        id: `client-${client.id}`,
        name: client.fullName,
        email: client.email,
        emailVerified: true,
        role: "cliente",
        cpf: client.cpf,
        city: `${client.city}, ${client.state}`,
        status: client.status,
        suspensionReason: client.suspensionReason ?? null,
        createdAt: new Date(client.registeredAt),
      })
      .onConflictDoNothing();
  }

  for (const report of fixtures.mockReports) {
    await db
      .insert(reports)
      .values({
        id: `seed-report-${report.id}`,
        type: report.type,
        reporterName: report.reporterName,
        reporterRole: report.reporterRole,
        reportedName: report.reportedName,
        reportedRole: report.reportedRole,
        description: report.description,
        status: report.status,
        resolution: report.resolution ?? null,
        createdAt: new Date(report.createdAt),
        updatedAt: report.updatedAt ? new Date(report.updatedAt) : null,
      })
      .onConflictDoNothing();
  }

  for (const entry of fixtures.adminActivityLog) {
    await db
      .insert(adminActivityLogs)
      .values({
        id: `seed-activity-${entry.id}`,
        action: entry.action,
        targetName: entry.targetName,
        targetId: entry.targetId ?? null,
        adminEmail: entry.adminEmail ?? null,
        reason: entry.reason ?? null,
        createdAt: new Date(entry.timestamp),
      })
      .onConflictDoNothing();
  }

  const lunaProfileId = profileIdBySlug.get("luna-velvet-sao-paulo");
  if (lunaProfileId) {
    const clientId = DEV_USERS[0]!.id;
    const proId = DEV_USERS[1]!.id;

    await db.delete(reviews).where(eq(reviews.isSeed, false));
    await db.delete(reviewInvites).where(inArray(reviewInvites.conversationId, ["c1", "c2"]));

    await db
      .insert(conversations)
      .values({
        id: "c1",
        profileId: lunaProfileId,
        clientUserId: clientId,
        professionalUserId: proId,
        lastMessagePreview: "Fico no aguardo. Boa noite!",
        lastMessageAt: new Date(),
      })
      .onConflictDoUpdate({
        target: conversations.id,
        set: { lastMessagePreview: "Fico no aguardo. Boa noite!", lastMessageAt: new Date() },
      });

    await db
      .insert(conversationParticipants)
      .values([
        {
          id: "cp-client-c1",
          conversationId: "c1",
          userId: clientId,
          role: "cliente",
          alias: "Cliente reservado",
          unreadCount: 1,
        },
        {
          id: "cp-pro-c1",
          conversationId: "c1",
          userId: proId,
          role: "profissional",
          unreadCount: 0,
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(messages)
      .values([
        {
          id: "m1",
          conversationId: "c1",
          senderUserId: proId,
          senderRole: "profissional",
          messageType: "text",
          content: "Oi! Obrigada por passar no meu perfil.",
          sentAt: new Date(Date.now() - 3600_000),
          deliveredAt: new Date(Date.now() - 3600_000),
        },
        {
          id: "m2",
          conversationId: "c1",
          senderUserId: clientId,
          senderRole: "cliente",
          messageType: "text",
          content: "Oi, Luna. Gostei muito das fotos novas.",
          sentAt: new Date(Date.now() - 3000_000),
          deliveredAt: new Date(Date.now() - 3000_000),
        },
        {
          id: "m3",
          conversationId: "c1",
          senderUserId: proId,
          senderRole: "profissional",
          messageType: "text",
          content: "Que bom! Fico a disposicao para conversar por aqui.",
          sentAt: new Date(Date.now() - 2400_000),
          deliveredAt: new Date(Date.now() - 2400_000),
        },
        {
          id: "m4",
          conversationId: "c1",
          senderUserId: clientId,
          senderRole: "cliente",
          messageType: "text",
          content: "Combinado. Te chamo mais tarde.",
          sentAt: new Date(Date.now() - 1800_000),
          deliveredAt: new Date(Date.now() - 1800_000),
        },
        {
          id: "m5",
          conversationId: "c1",
          senderUserId: proId,
          senderRole: "profissional",
          messageType: "text",
          content: "Fico no aguardo. Boa noite!",
          sentAt: new Date(Date.now() - 1200_000),
          deliveredAt: new Date(Date.now() - 1200_000),
        },
      ])
      .onConflictDoNothing();

    const valentinaProfileId = profileIdBySlug.get("valentina-noir-campinas");
    const valentinaUserId = "pro-valentina-noir-campinas";
    if (valentinaProfileId) {
      await db
        .insert(conversations)
        .values({
          id: "c2",
          profileId: valentinaProfileId,
          clientUserId: clientId,
          professionalUserId: valentinaUserId,
          lastMessagePreview: "Perfeito, combinamos assim.",
          lastMessageAt: new Date(),
        })
        .onConflictDoUpdate({
          target: conversations.id,
          set: {
            profileId: valentinaProfileId,
            clientUserId: clientId,
            professionalUserId: valentinaUserId,
            lastMessagePreview: "Perfeito, combinamos assim.",
            lastMessageAt: new Date(),
          },
        });

      await db
        .insert(conversationParticipants)
        .values([
          {
            id: "cp-client-c2",
            conversationId: "c2",
            userId: clientId,
            role: "cliente",
            alias: "Cliente reservado",
            unreadCount: 0,
          },
          {
            id: "cp-pro-c2",
            conversationId: "c2",
            userId: valentinaUserId,
            role: "profissional",
            unreadCount: 0,
          },
        ])
        .onConflictDoNothing();

      await db
        .insert(messages)
        .values([
          {
            id: "m6",
            conversationId: "c2",
            senderUserId: clientId,
            senderRole: "cliente",
            messageType: "text",
            content: "Ola Valentina, tudo bem?",
            sentAt: new Date(Date.now() - 3600_000),
            deliveredAt: new Date(Date.now() - 3600_000),
          },
          {
            id: "m7",
            conversationId: "c2",
            senderUserId: valentinaUserId,
            senderRole: "profissional",
            messageType: "text",
            content: "Perfeito, combinamos assim.",
            sentAt: new Date(Date.now() - 1800_000),
            deliveredAt: new Date(Date.now() - 1800_000),
          },
        ])
        .onConflictDoNothing();

      await db
        .insert(reviewInvites)
        .values({
          id: "invite-seed-c2",
          conversationId: "c2",
          profileId: valentinaProfileId,
          clientUserId: clientId,
          invitedAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing();
    }
  }

  await db.execute(sql`select 1`);
  return { profiles: profileIdBySlug };
}
