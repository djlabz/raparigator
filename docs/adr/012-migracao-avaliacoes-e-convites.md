# ADR-012 — Migração de Avaliações e Convites para API

- Status: aceito (2026-10-09)

## Contexto

Na plataforma Sigillus, avaliações são estritamente fechadas por convite emitido pela acompanhante a partir de uma conversa real de mão dupla com o cliente. Essa regra de produto protege o perfil contra assédio e avaliações falsas (astroturfing), impedindo qualquer avaliação pública anônima ou espontânea.

Antes desta task (T-15), o fluxo de convites e envio de avaliações no web em `apps/web` funcionava exclusivamente com persistência local em `localStorage` sob a chave `sigillus-review-invites` via `apps/web/lib/review-invites.ts`, com merge simples de dados mock em `apps/web/lib/ad-reviews.ts`.

Na API, o módulo `reviews` (`apps/api/src/modules/reviews/`) implementa o contrato completo:

- `reviews.listForAd`: rota pública que retorna o resumo de avaliações e rating recalculado do anúncio (`{ reviews, rating, reviewsCount }`).
- `reviews.getInvite`: obtém o status e detalhes do convite de avaliação para uma conversa específica do usuário.
- `reviews.listMyInvites`: lista os convites de avaliação do usuário autenticado (como cliente ou profissional).
- `reviews.invite`: endpoint restrito ao papel profissional que cria/renova convite de avaliação após validar no banco que houve conversa de mão dupla (`messages.senderRole` de ambos os lados).
- `reviews.withdrawInvite`: cancela convite ainda não utilizado e remove a notificação in-app enviada ao cliente.
- `reviews.submit`: endpoint restrito ao papel cliente que registra a avaliação de forma atômica no banco, marca o convite como usado (`usedAt`), recalcula a média ponderada e contagem no perfil da profissional via `mergeRating` e remove a notificação pendente.

## Decisão

**Conectar o módulo de avaliações e convites no web ao cliente oRPC em modo dual (`NEXT_PUBLIC_DATA_SOURCE=mock|api`), preservando suporte completo ao modo mock para testes E2E e execução offline.**

1. **Camada de Convites (`apps/web/lib/review-invites.ts`)**:
   - Manter compatibilidade com `useSyncExternalStore` e retrocompatibilidade com o armazenamento em `localStorage` sob o modo mock.
   - No modo API (`isApiDataSource()`):
     - Inicializar sincronização com `reviews.listMyInvites()`.
     - Implementar busca sob demanda por conversa via `reviews.getInvite({ conversationId })`.
     - Aplicar mutações otimistas locais imediatas para `inviteToReview` e `cancelInvite`, disparando em segundo plano `reviews.invite` e `reviews.withdrawInvite` com reversão automática em caso de erro.
     - Tornar `submitReview` assíncrono consumindo `reviews.submit({ conversationId, score, comment })`.

2. **Resumo e Média Ponderada (`apps/web/lib/ad-reviews.ts`)**:
   - No modo API, consultar `reviews.listForAd({ slug })` com cache em memória por slug de anúncio.
   - Mesclar reativamente com avaliações recém-submetidas pelo próprio cliente nesta sessão, recalculando média e contagem através de `mergeRating` de `@sigillus/domain`.
   - No modo mock, preservar o merge das avaliações semeadas (`seededReviews`) com as submetidas localmente.

3. **Interface e Componentes**:
   - `ad-details/review-cta.tsx`: adicionar controle de estado `isSubmitting` para evitar submissões duplicadas, desabilitar ações durante a requisição e aguardar a resolução de `submitReview`.
   - `professional-dashboard/reviews-tab.tsx`: substituir a busca estática em `mock-data` por `useProfessionalAd(adSlug)` de `@/lib/ad-data`, garantindo que anúncios criados e editados na API sejam resolvidos adequadamente.

## Consequências

- Avaliações e convites passam a ser persistidos de forma relacional no PostgreSQL com integridade transacional garantida pelo backend.
- A validação de conversa de mão dupla permanece centralizada no `@sigillus/domain` (`review-gate.ts`) e é validada em profundidade no banco de dados.
- O modo mock continua plenamente funcional, mantendo a suíte Playwright rápida e independente da API.
