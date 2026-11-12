import { eq, inArray } from "drizzle-orm";
import type { Database } from "../../client";
import {
  conversationParticipants,
  conversations,
  messages,
  reviewInvites,
  reviews,
} from "../../schema";
import { DEV_USERS } from "../users";

export async function seedConversations(db: Database, profileIdBySlug: Map<string, string>) {
  const lunaProfileId = profileIdBySlug.get("luna-velvet-sao-paulo");
  if (lunaProfileId) {
    const clientId = DEV_USERS[0]!.id;
    const proId = DEV_USERS[1]!.id;

    await db.delete(reviews).where(eq(reviews.isSeed, false));
    await db.delete(reviewInvites).where(inArray(reviewInvites.conversationId, ["c1", "c2"]));
    await db.delete(messages).where(inArray(messages.conversationId, ["c1", "c2"]));

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
}
