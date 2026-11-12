# ADR-018 — Lançamento gratuito e Premium concedido pelo admin

- Status: aceito (2026-11-12), registrando as decisões D-01 e D-02 (04/10/2026) e P-01 (10/10/2026)

## Contexto

O Premium da profissional (galeria maior, visualização única e apelido no chat, destaque no feed) já existia na API desde o início, com assinaturas por eventos e um `BillingProvider` com implementação fake. Ainda não há PSP que aceite o vertical com Pix e recorrência (ADR-006, item 4). As decisões estavam só no `docs/roteiro.md` (seção 2) e numa emenda do ADR-006.

## Opções consideradas

- **Esperar o PSP para lançar.** Atrasa o lançamento por um fator externo e deixa a plataforma sem anunciantes enquanto isso.
- **Lançar sem Premium.** Remove código pronto e testado e obriga a reintroduzir tudo depois.
- **Lançar gratuito, com o Premium concedido à mão pelo admin.** Mantém o módulo e a cobrança prontos para quando houver PSP, sem cobrar ninguém agora.

## Decisão

- **Lançamento gratuito (D-01).** Nenhuma cobrança e nenhum PSP antes do ar. Em produção a API só sobe com `BILLING_PROVIDER=fake` se `BILLING_FAKE_ACKNOWLEDGED=true`; com o fake em produção o billing fica desligado (`billingEnabled=false`).
- **Checkout escondido por flag.** `PREMIUM_CHECKOUT_ENABLED` (padrão `false`): `premium.startSubscription` responde `CONFLICT` e o web esconde as entradas de assinatura (banner, botão, modal de conversão, rota de checkout). `premium.getState` informa `checkoutEnabled` à UI.
- **Premium manual (P-01, opção b).** O admin concede Premium por `admin.grantPremium` (1 a 12 meses). A concessão é uma assinatura com `provider: "manual"` e passa pelos mesmos eventos (`payment_confirmed`, `renewed`) do fluxo pago; se já houver Premium ativo, o período é somado ao fim do atual. O job `premium.expire` (de hora em hora) encerra os períodos vencidos.
- **Conflito com assinatura do provedor (10/11/2026).** Se houver assinatura do provedor em `pending_payment`, `admin.grantPremium` recusa com `CONFLICT` ("Há uma assinatura aguardando pagamento; resolva antes de conceder o Premium manualmente.") e não cancela nada. Rever quando o PSP real existir (Fase 3 do roteiro).
- **Preços guardados (D-02).** R$ 10 mensal e R$ 30 semestral ficam em `PREMIUM_PLAN_OPTIONS` (`packages/domain/src/premium.ts`) e não mudam sem pedido do Daniel.
- **Assinatura por eventos.** O estado da assinatura vem da redução dos `subscription_events` por uma função pura do domain (`reduceSubscriptionEvents` em `packages/domain/src/subscription.ts`); o service só grava eventos e lê o resultado.

## Consequências

- Ligar a cobrança é implementar um `BillingProvider` real, configurar o PSP e virar `PREMIUM_CHECKOUT_ENABLED=true` (tasks T-30 a T-32 do roteiro); o resto do fluxo já existe.
- Enquanto for gratuito, o Premium depende de ação manual do admin, e a E2E cobre o checkout ligado num job próprio (`E2E (checkout-ligado)`).
- O único fluxo monetário previsto continua sendo profissional → plataforma (restrição de produto em `docs/adr/README.md`).
