import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { ChatEvent } from "@sigillus/contracts";
import { CLIENT_ALIAS_PATTERN } from "@sigillus/domain";
import { users } from "../src/db/schema";
import { createMemoryChatEventBus } from "../src/lib/chat-events";
import type { ChatActor } from "../src/modules/chat";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";
import { createChatAsset, createChatFixture, nextChatEvent } from "./helpers/conversations";

const harness = createTestHarness();

async function aliasOf(userId: string) {
  const [row] = await harness.db
    .select({ alias: users.alias })
    .from(users)
    .where(eq(users.id, userId));
  return row?.alias ?? null;
}

describe("chat", () => {
  it("ensureConversationForAd é idempotente e restaura conversa removida da caixa", async () => {
    const fx = await createChatFixture(harness);
    const again = await fx.chat.ensureConversationForAd(fx.client, fx.slug);
    expect(again.conversationId).toBe(fx.conversationId);

    await fx.chat.deleteFromInbox(fx.client, fx.conversationId);
    expect(await fx.chat.listConversations(fx.client)).toHaveLength(0);

    const restored = await fx.chat.ensureConversationForAd(fx.client, fx.slug);
    expect(restored.conversationId).toBe(fx.conversationId);
    expect(await fx.chat.listConversations(fx.client)).toHaveLength(1);

    await expect(fx.chat.ensureConversationForAd(fx.client, "nao-existe")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("não-participante não lê nem envia", async () => {
    const fx = await createChatFixture(harness);
    const stranger = await signUp(harness, { email: "stranger@sigillus.dev" });
    const actor: ChatActor = { id: stranger.userId, role: "cliente", name: "Estranho" };

    await expect(
      fx.chat.listMessages(actor, { conversationId: fx.conversationId, limit: 20 }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      fx.chat.sendText(actor, { conversationId: fx.conversationId, content: "oi" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(
      await fx.chat.setBlocked(actor, { conversationId: fx.conversationId, isBlocked: true }),
    ).toEqual({ ok: false, reason: "not_found" });
    expect(await fx.chat.listConversations(actor)).toHaveLength(0);
  });

  it("envio de texto atualiza prévia, não lidas e entrega ao listar", async () => {
    const fx = await createChatFixture(harness);
    const sent = await fx.chat.sendText(fx.client, {
      conversationId: fx.conversationId,
      content: "Olá!",
    });
    expect(sent.message.from).toBe("me");
    expect(sent.message.status).toBe("sent");
    const generatedAlias = await aliasOf(fx.client.id);
    expect(generatedAlias).toMatch(CLIENT_ALIAS_PATTERN);
    expect(sent.message.senderDisplayName).toBe(generatedAlias);

    const proInbox = await fx.chat.listConversations(fx.professional);
    expect(proInbox).toHaveLength(1);
    expect(proInbox[0]!.lastMessage).toBe("Olá!");
    expect(proInbox[0]!.unread).toBe(1);
    expect(proInbox[0]!.contactName).toBe(generatedAlias);
    expect(proInbox[0]!.adSlug).toBe(fx.slug);

    const clientInbox = await fx.chat.listConversations(fx.client);
    expect(clientInbox[0]!.contactName).toBe("Luna Teste");
    expect(clientInbox[0]!.unread).toBe(0);

    const delivered: ChatEvent[] = [];
    const unsubscribe = fx.chatEvents.subscribe(fx.client.id, (event) => delivered.push(event));
    const proView = await fx.chat.listMessages(fx.professional, {
      conversationId: fx.conversationId,
      limit: 20,
    });
    unsubscribe();
    expect(proView.items).toHaveLength(1);
    expect(proView.items[0]!.from).toBe("other");
    expect(proView.items[0]!.status).toBe("delivered");
    expect(delivered.some((event) => event.type === "message.delivered")).toBe(true);

    await fx.chat.markRead(fx.professional, fx.conversationId);
    const afterRead = await fx.chat.listConversations(fx.professional);
    expect(afterRead[0]!.unread).toBe(0);
    const clientSees = await fx.chat.listConversations(fx.client);
    expect(clientSees[0]!.contactStatus).toBe("online");
  });

  it("pagina mensagens por cursor", async () => {
    const fx = await createChatFixture(harness);
    for (let index = 0; index < 5; index += 1) {
      await fx.chat.sendText(fx.client, {
        conversationId: fx.conversationId,
        content: `m${index}`,
      });
    }
    const last = await fx.chat.listMessages(fx.client, {
      conversationId: fx.conversationId,
      limit: 2,
    });
    expect(last.items.map((item) => item.content)).toEqual(["m3", "m4"]);
    expect(last.hasMore).toBe(true);
    const previous = await fx.chat.listMessages(fx.client, {
      conversationId: fx.conversationId,
      before: last.items[0]!.sentAt,
      limit: 2,
    });
    expect(previous.items.map((item) => item.content)).toEqual(["m1", "m2"]);
    const first = await fx.chat.listMessages(fx.client, {
      conversationId: fx.conversationId,
      before: previous.items[0]!.sentAt,
      limit: 2,
    });
    expect(first.items.map((item) => item.content)).toEqual(["m0"]);
    expect(first.hasMore).toBe(false);
  });

  it("bloqueio impede envio nos dois sentidos", async () => {
    const fx = await createChatFixture(harness);
    expect(
      await fx.chat.setBlocked(fx.professional, {
        conversationId: fx.conversationId,
        isBlocked: true,
      }),
    ).toEqual({ ok: true });
    await expect(
      fx.chat.sendText(fx.client, { conversationId: fx.conversationId, content: "oi" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      fx.chat.sendText(fx.professional, { conversationId: fx.conversationId, content: "oi" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await fx.chat.setBlocked(fx.professional, {
      conversationId: fx.conversationId,
      isBlocked: false,
    });
    const sent = await fx.chat.sendText(fx.client, {
      conversationId: fx.conversationId,
      content: "agora vai",
    });
    expect(sent.message.content).toBe("agora vai");
  });

  it("idempotência por clientMessageId", async () => {
    const fx = await createChatFixture(harness);
    const first = await fx.chat.sendText(fx.client, {
      conversationId: fx.conversationId,
      content: "uma vez",
      clientMessageId: "cid-1",
    });
    const second = await fx.chat.sendText(fx.client, {
      conversationId: fx.conversationId,
      content: "uma vez",
      clientMessageId: "cid-1",
    });
    expect(second.message.id).toBe(first.message.id);
    const list = await fx.chat.listMessages(fx.client, {
      conversationId: fx.conversationId,
      limit: 10,
    });
    expect(list.items).toHaveLength(1);
    const inbox = await fx.chat.listConversations(fx.professional);
    expect(inbox[0]!.unread).toBe(1);
  });

  it("brief é recalculado pelo servidor e só cliente envia", async () => {
    const fx = await createChatFixture(harness);
    const forged = {
      adSlug: "outro",
      artisticName: "Outra",
      duration: "2 horas",
      basePrice: 1,
      extras: ["Jantar", "Serviço inexistente"],
      extrasCost: 0,
      total: 1,
    };
    const sent = await fx.chat.sendBrief(fx.client, {
      conversationId: fx.conversationId,
      brief: forged,
      greeting: "Olá, montei uma simulação.",
    });
    expect(sent.message.messageType).toBe("brief");
    expect(sent.message.brief).toEqual({
      adSlug: fx.slug,
      artisticName: "Luna Teste",
      duration: "2 horas",
      basePrice: 550,
      extras: ["Jantar"],
      extrasCost: 150,
      total: 700,
    });
    const inbox = await fx.chat.listConversations(fx.professional);
    expect(inbox[0]!.lastMessage).toBe("Interesse enviado · 2 horas");

    await expect(
      fx.chat.sendBrief(fx.professional, {
        conversationId: fx.conversationId,
        brief: forged,
        greeting: "eu também",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("view-once só para profissional premium e abre uma vez pelo destinatário", async () => {
    const standard = await createChatFixture(harness, { adTier: "normal" });
    const standardAsset = await createChatAsset(harness, standard.professional.id);
    await expect(
      standard.chat.sendMedia(standard.professional, {
        conversationId: standard.conversationId,
        assetId: standardAsset,
        isViewOnce: true,
      }),
    ).rejects.toMatchObject({ code: "PLAN_LIMIT" });
    const plain = await standard.chat.sendMedia(standard.professional, {
      conversationId: standard.conversationId,
      assetId: standardAsset,
      isViewOnce: false,
    });
    expect(plain.message.media).toMatchObject({
      id: standardAsset,
      isViewOnce: false,
      kind: "image",
    });
    const openPlain = await standard.chat.openViewOnce(standard.client, plain.message.id);
    expect(openPlain.url).toContain("signed=1");
    const openPlainAgain = await standard.chat.openViewOnce(standard.client, plain.message.id);
    expect(openPlainAgain.url).toContain("signed=1");

    const clientAsset = await createChatAsset(harness, standard.client.id);
    await expect(
      standard.chat.sendMedia(standard.client, {
        conversationId: standard.conversationId,
        assetId: clientAsset,
        isViewOnce: true,
      }),
    ).rejects.toMatchObject({ code: "PLAN_LIMIT" });
    const foreignAsset = await createChatAsset(harness, standard.professional.id);
    await expect(
      standard.chat.sendMedia(standard.client, {
        conversationId: standard.conversationId,
        assetId: foreignAsset,
        isViewOnce: false,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const premium = await createChatFixture(harness, { adTier: "premium" });
    const premiumAsset = await createChatAsset(harness, premium.professional.id);
    const viewOnce = await premium.chat.sendMedia(premium.professional, {
      conversationId: premium.conversationId,
      assetId: premiumAsset,
      isViewOnce: true,
    });
    expect(viewOnce.message.media?.isViewOnce).toBe(true);
    const inbox = await premium.chat.listConversations(premium.client);
    expect(inbox[0]!.lastMessage).toBe("Mídia temporária");

    await expect(
      premium.chat.openViewOnce(premium.professional, viewOnce.message.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const opened: ChatEvent[] = [];
    const unsubscribe = premium.chatEvents.subscribe(premium.professional.id, (event) =>
      opened.push(event),
    );
    const first = await premium.chat.openViewOnce(premium.client, viewOnce.message.id);
    unsubscribe();
    expect(first.url).toContain("signed=1");
    expect(opened.some((event) => event.type === "message.opened")).toBe(true);
    await expect(
      premium.chat.openViewOnce(premium.client, viewOnce.message.id),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const listed = await premium.chat.listMessages(premium.client, {
      conversationId: premium.conversationId,
      limit: 10,
    });
    expect(listed.items[0]!.media?.openedAt).toBe(first.openedAt);
  });

  it("apelido: cliente livre, profissional só premium; denúncia registra report", async () => {
    const fx = await createChatFixture(harness, { adTier: "normal" });
    expect(
      await fx.chat.updateAlias(fx.client, { conversationId: fx.conversationId, alias: "Anônimo" }),
    ).toEqual({ ok: true });
    await expect(
      fx.chat.updateAlias(fx.professional, { conversationId: fx.conversationId, alias: "X" }),
    ).rejects.toMatchObject({ code: "PLAN_LIMIT" });
    const proInbox = await fx.chat.listConversations(fx.professional);
    expect(proInbox[0]!.contactName).toBe("Anônimo");
    const clientInbox = await fx.chat.listConversations(fx.client);
    expect(clientInbox[0]!.currentUserAlias).toBe("Anônimo");

    expect(
      await fx.chat.report(fx.professional, {
        conversationId: fx.conversationId,
        type: "harassment",
        reason: "Mensagens ofensivas",
      }),
    ).toEqual({ ok: true });
    const reportRows = await harness.db.query.reports.findMany();
    expect(reportRows).toHaveLength(1);
    expect(reportRows[0]).toMatchObject({
      reporterUserId: fx.professional.id,
      reportedUserId: fx.client.id,
      reportedName: "Anônimo",
      reportedRole: "cliente",
      status: "pending",
    });
  });

  it("profissional vê o apelido de cadastro do cliente, nunca o nome real", async () => {
    const fx = await createChatFixture(harness, { clientAlias: "Lobo Discreto" });

    const [proView] = await fx.chat.listConversations(fx.professional);
    expect(proView!.clientAlias).toBe("Lobo Discreto");
    expect(proView!.clientAlias).not.toBe("Carlos Cliente");
    expect(proView!.currentUserAlias).toBeUndefined();

    const [clientView] = await fx.chat.listConversations(fx.client);
    expect(clientView!.clientAlias).toBeUndefined();
    expect(clientView!.currentUserAlias).toBeUndefined();
    expect(clientView!.contactName).toBe("Luna Teste");
  });

  it("apelido que o cliente define na conversa prevalece sobre o do cadastro", async () => {
    const fx = await createChatFixture(harness, {
      adTier: "premium",
      clientAlias: "Lobo Discreto",
    });
    await fx.chat.updateAlias(fx.client, { conversationId: fx.conversationId, alias: "Anônimo" });
    await fx.chat.updateAlias(fx.professional, {
      conversationId: fx.conversationId,
      alias: "Apelido da Pro",
    });

    const [proView] = await fx.chat.listConversations(fx.professional);
    expect(proView!.clientAlias).toBe("Anônimo");
    expect(proView!.currentUserAlias).toBe("Apelido da Pro");

    const [clientView] = await fx.chat.listConversations(fx.client);
    expect(clientView!.clientAlias).toBeUndefined();
    expect(clientView!.currentUserAlias).toBe("Anônimo");
  });

  it("anunciante nunca vê o name do cliente sem apelido", async () => {
    const fx = await createChatFixture(harness);
    const sent = await fx.chat.sendText(fx.client, {
      conversationId: fx.conversationId,
      content: "Olá, vi seu anúncio.",
    });
    expect(sent.message.senderDisplayName).not.toContain("Carlos Cliente");

    expect(
      await fx.chat.report(fx.professional, {
        conversationId: fx.conversationId,
        type: "harassment",
        reason: "Mensagens ofensivas",
      }),
    ).toEqual({ ok: true });

    const proInbox = await fx.chat.listConversations(fx.professional);
    expect(proInbox).toHaveLength(1);
    expect(JSON.stringify(proInbox)).not.toContain("Carlos Cliente");

    const proMessages = await fx.chat.listMessages(fx.professional, {
      conversationId: fx.conversationId,
      limit: 20,
    });
    expect(proMessages.items.length).toBeGreaterThan(0);
    for (const message of proMessages.items) {
      expect(message.senderDisplayName).not.toContain("Carlos Cliente");
    }

    const reportRows = await harness.db.query.reports.findMany();
    expect(reportRows).toHaveLength(1);
    expect(reportRows[0]!.reportedName).not.toContain("Carlos Cliente");
    expect(reportRows[0]!.reporterName).not.toContain("Paula Pro");

    await harness.db.delete(users).where(eq(users.id, fx.client.id));
    const afterDeletion = await fx.chat.listConversations(fx.professional);
    expect(afterDeletion[0]!.contactName).toBe("Conta encerrada");
    expect(JSON.stringify(afterDeletion)).not.toContain("Carlos Cliente");
  });

  it("cliente sem apelido aparece com o apelido gerado, nunca com o nome real", async () => {
    const fx = await createChatFixture(harness);
    const [proView] = await fx.chat.listConversations(fx.professional);
    const generatedAlias = await aliasOf(fx.client.id);
    expect(generatedAlias).toMatch(CLIENT_ALIAS_PATTERN);
    expect(proView!.clientAlias).toBe(generatedAlias);
    expect(proView!.contactName).toBe(generatedAlias);
  });

  it("evento message.created chega ao outro participante e ao subscribe", async () => {
    const bus = createMemoryChatEventBus();
    const fx = await createChatFixture(harness, { chatEvents: bus });
    const received: ChatEvent[] = [];
    const unsubscribe = bus.subscribe(fx.professional.id, (event) => received.push(event));

    const controller = new AbortController();
    const stream = fx.chat.subscribe(
      fx.professional,
      { conversationId: fx.conversationId },
      controller.signal,
    );
    const firstEvent = nextChatEvent(stream);
    const sent = await fx.chat.sendText(fx.client, {
      conversationId: fx.conversationId,
      content: "ping",
    });
    const event = await firstEvent;
    expect(event.done).toBe(false);
    expect(event.value).toEqual({
      type: "message.created",
      conversationId: fx.conversationId,
      messageId: sent.message.id,
    });
    const heartbeat = await stream.next();
    expect(heartbeat.value).toMatchObject({ type: "heartbeat" });
    controller.abort();
    const closed = await stream.next();
    expect(closed.done).toBe(true);
    unsubscribe();
    expect(received).toContainEqual({
      type: "message.created",
      conversationId: fx.conversationId,
      messageId: sent.message.id,
    });
  });
});
