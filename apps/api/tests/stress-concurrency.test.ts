import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { ChatEvent } from "@sigillus/contracts";
import { createFeedFiltersCriteria } from "@sigillus/domain";
import { createMemoryChatEventBus } from "../src/lib/chat-events";
import { createTestHarness } from "./helpers/app";
import { createChatFixture } from "./helpers/conversations";
import { reviews, subscriptionEvents, subscriptions } from "../src/db/schema";
import { newId } from "../src/lib/ids";
import { signUp } from "./helpers/auth";
import { seedDevData } from "../src/db/seed/dev-data";
import { seedDevUsers } from "../src/db/seed/users";

const harness = createTestHarness();

describe("estresse e concorrência na API", () => {
  it("envio concorrente massivo de mensagens na mesma conversa mantém integridade", async () => {
    const fx = await createChatFixture(harness);
    const totalMessages = 20;

    const sendPromises = Array.from({ length: totalMessages }, (_, index) => {
      const isClient = index % 2 === 0;
      const actor = isClient ? fx.client : fx.professional;
      return fx.chat.sendText(actor, {
        conversationId: fx.conversationId,
        content: `Mensagem concorrente #${index}`,
        clientMessageId: `concurrent-${index}`,
      });
    });

    const results = await Promise.allSettled(sendPromises);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(totalMessages);

    const history = await fx.chat.listMessages(fx.client, {
      conversationId: fx.conversationId,
      limit: 50,
    });
    expect(history.items).toHaveLength(totalMessages);

    const contents = history.items.map((m) => m.content);
    for (let index = 0; index < totalMessages; index += 1) {
      expect(contents).toContain(`Mensagem concorrente #${index}`);
    }

    const clientInbox = await fx.chat.listConversations(fx.client);
    const proInbox = await fx.chat.listConversations(fx.professional);
    expect(clientInbox).toHaveLength(1);
    expect(proInbox).toHaveLength(1);
    expect(clientInbox[0]!.id).toBe(fx.conversationId);
    expect(proInbox[0]!.id).toBe(fx.conversationId);
  });

  it("múltiplos subscribers concorrentes de streaming (SSE) recebem rajadas de eventos", async () => {
    const chatEvents = createMemoryChatEventBus();
    const fx = await createChatFixture(harness, { chatEvents });
    const subscriberCount = 10;
    const eventsPerBurst = 5;

    const receivedBySubscriber: ChatEvent[][] = Array.from({ length: subscriberCount }, () => []);
    const abortControllers = Array.from({ length: subscriberCount }, () => new AbortController());

    const subscriberPromises = abortControllers.map(async (ac, subIndex) => {
      const stream = fx.chat.subscribe(fx.client, { conversationId: fx.conversationId }, ac.signal);
      for await (const event of stream) {
        receivedBySubscriber[subIndex]!.push(event);
        if (receivedBySubscriber[subIndex]!.length >= eventsPerBurst) {
          ac.abort();
          break;
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 30));

    for (let index = 0; index < eventsPerBurst; index += 1) {
      await chatEvents.publish([fx.client.id], {
        type: "message.created",
        conversationId: fx.conversationId,
        messageId: `burst-msg-${index}`,
      });
    }

    await Promise.all(subscriberPromises);

    for (let subIndex = 0; subIndex < subscriberCount; subIndex += 1) {
      expect(receivedBySubscriber[subIndex]!.length).toBeGreaterThanOrEqual(eventsPerBurst);
      const types = receivedBySubscriber[subIndex]!.map((e) => e.type);
      expect(types).toContain("message.created");
    }
  });

  it("corrida crítica: submissões concorrentes no mesmo convite de avaliação resultam em apenas 1 aprovada", async () => {
    const fx = await createChatFixture(harness);

    await fx.chat.sendText(fx.client, { conversationId: fx.conversationId, content: "Olá!" });
    await fx.chat.sendText(fx.professional, {
      conversationId: fx.conversationId,
      content: "Tudo bem?",
    });

    const { invite } = await fx.reviews.invite(fx.professional, fx.conversationId);
    expect(invite.conversationId).toBe(fx.conversationId);

    const concurrentAttempts = 5;
    const reviewPromises = Array.from({ length: concurrentAttempts }, (_, index) => {
      return fx.reviews.submit(fx.client, {
        conversationId: fx.conversationId,
        score: 5,
        comment: `Avaliação concorrente tentativa #${index}`,
      });
    });

    const settled = await Promise.allSettled(reviewPromises);
    const successful = settled.filter((r) => r.status === "fulfilled");
    const rejected = settled.filter((r) => r.status === "rejected");

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(concurrentAttempts - 1);

    for (const fail of rejected) {
      if (fail.status === "rejected") {
        expect(fail.reason).toMatchObject({
          code: expect.stringMatching(/CONFLICT|NOT_FOUND|BAD_REQUEST/),
        });
      }
    }

    const savedReviews = await harness.db
      .select()
      .from(reviews)
      .where(eq(reviews.conversationId, fx.conversationId));
    expect(savedReviews).toHaveLength(1);
    expect(savedReviews[0]!.score).toBe(5);
  });

  it("rajadas de inserção concorrente em subscriptionEvents respeitam idempotência", async () => {
    const pro = await signUp(harness, { email: "pro-stress@sigillus.dev", role: "profissional" });
    const subId = newId();

    await harness.db.insert(subscriptions).values({
      id: subId,
      userId: pro.userId,
      provider: "fake",
      providerRef: `fake-sub-${subId}`,
      cycle: "monthly",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });

    const idempotencyKey = `idem-${subId}`;
    const burstSize = 10;

    const eventInsertPromises = Array.from({ length: burstSize }, () => {
      return harness.db
        .insert(subscriptionEvents)
        .values({
          id: newId(),
          subscriptionId: subId,
          type: "renewed",
          idempotencyKey,
          payload: { cycle: "monthly", amount: 9900 },
          occurredAt: new Date(),
        })
        .onConflictDoNothing({ target: subscriptionEvents.idempotencyKey })
        .returning({ id: subscriptionEvents.id });
    });

    const results = await Promise.all(eventInsertPromises);
    const inserted = results.flat();
    expect(inserted).toHaveLength(1);
  });

  it("rajada de 50 requisições simultâneas ao feed e catálogos não esgota o pool nem falha", async () => {
    await seedDevUsers(harness.db);
    await seedDevData(harness.db);
    const burstCount = 50;

    const requests = Array.from({ length: burstCount }, (_, index) => {
      if (index % 2 === 0) {
        return harness.rpc("feed/list", { criteria: createFeedFiltersCriteria() });
      }
      return harness.rpc("catalogs/get");
    });

    const results = await Promise.all(requests);
    for (const res of results) {
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    }
  });
});
