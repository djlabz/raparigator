# ADR-014 — Migração de Gestão de Plano Premium para API

- Status: aceito (2026-10-09)

## Contexto

A plataforma Sigillus oferece assinatura Premium exclusiva para profissionais anunciantes, concedendo destaque visual nas buscas, selo VIP, aumento substancial nos limites de fotos (100) e vídeos (50) do portfólio, e recursos exclusivos no chat como envio de mídias de visualização única (`canSendViewOnce`) e definição de apelido por cliente/conversa (`canUseAlias`).

Antes desta task (T-17), o estado do plano no web era lido e gravado puramente em `localStorage` sob a chave `sigillus-premium-plan` através de `apps/web/lib/premium-plan.ts`.

Na API, o módulo `premium` (`apps/api/src/modules/premium/`) implementa o contrato completo:

- `premium.getState`: recupera o plano ativo da profissional (`standard` ou `premium`), os limites derivados (`limits: PlanLimits`) e os detalhes da assinatura (`subscription: Subscription | null`).
- `premium.plans`: retorna os planos de assinatura disponíveis (`PREMIUM_PLAN_OPTIONS`) e seus ciclos.
- `premium.startSubscription` e `premium.cancelSubscription`: manipulação do ciclo de vida da assinatura no provedor de faturamento (`BillingProvider`).

## Decisão

**Adotar o servidor (`premium.getState` e `premium.plans`) como a fonte da verdade para o plano da profissional e seus limites no modo API (`NEXT_PUBLIC_DATA_SOURCE=api`), eliminando a dependência de `localStorage` para autorização de recursos e limites, mantendo suporte dual retrocompatível para testes E2E.**

1. **Servidor como Fonte da Verdade (`apps/web/lib/premium-plan.ts`)**:
   - Sob `isApiDataSource()`, `getCachedPlanTier()` e `getCachedPremiumLimits()` derivam seus valores exclusivamente do estado retornado por `getApiClient().premium.getState()`, sem consultar `localStorage`.
   - Caso não haja sessão de profissional ativa ou ocorra falha na requisição, o fallback é o estado padrão seguro (`standard` e `STANDARD_LIMITS`).
   - Mutações otimistas via `activatePremium()` e `deactivatePremium()` atualizam o cache em memória no modo API e continuam persistindo em `localStorage` no modo mock para não quebrar a suíte de testes Playwright.
   - Fornecer revalidação sob demanda com `refetch()`.

2. **Catálogo e Planos (`apps/web/lib/premium-catalog.ts`)**:
   - Re-exportar `PREMIUM_PLAN_OPTIONS` e utilitários de `@sigillus/domain` sem violar a regra D-02 (não alterar o domínio).
   - Disponibilizar `fetchPremiumPlans()` e o hook `usePremiumPlans()` que consomem `premium.plans` no modo API com fallback síncrono.

3. **Gating de Recursos no Frontend**:
   - `chat-screen.tsx`: checa `canUseAlias` e `canSendViewOnce` de `usePremiumPlan()`, direcionando para o modal de conversão Premium quando não autorizado.
   - `announcement-tab.tsx`: respeita `photoLimit` e `videoLimit` diretamente de `usePremiumPlan()`.
   - Telas de conversão e checkout (`premium-subscription-checkout-screen.tsx`, `premium-conversion-modal.tsx`): utilizam `usePremiumPlans()` e `usePremiumPlan()`.

## Consequências

- Limites de mídia, visualização única e apelidos passam a ser governados pelo servidor no modo API.
- Mantido estrito isolamento: a plataforma segue sendo vitrine pura de anúncios sem intermediação de valores de clientes.
- A suíte completa de testes E2E continua 100% verde.
