# ADR-009 — Migração do Rascunho de Anúncio e Gestão do Perfil Profissional

- Status: aceito (2026-10-08)

## Contexto

O gerenciamento de anúncios da profissional no frontend (`apps/web`) engloba o preenchimento de seções (características, preços, serviços, localização, descrição, disponibilidade), validação prévia, persistência de rascunho, publicação para moderação e alternância rápida de status (Ativo/Pausado e disponibilidade imediata).

Antes desta task (T-12), toda essa persistência era baseada em `apps/web/lib/announcement-draft.ts` sincronizando diretamente em memória contra o mock `ads[0]`.
Na API, o módulo `announcements` (`apps/api/src/modules/announcements/`) já implementa o contrato completo com suporte a:

- `announcements.getMine`: busca ou provisiona o perfil próprio com slug único e carrega rascunho, status, score e dicas.
- `announcements.saveDraft`: grava o estado JSON do rascunho com timestamp.
- `announcements.saveSection`: valida regras de negócio e reflete os dados da seção nas colunas relacionais do perfil.
- `announcements.publish`: valida pendências obrigatórias, ativa o perfil, coloca em `pending_review` e cria registro no log de atividades dos admins.
- `announcements.setListingStatus`, `announcements.setAvailability` e `announcements.setContact`: mutações operacionais.

## Decisão

**Implementar um adaptador dual-mode em `apps/web/lib/announcement-draft.ts` e expor hooks e funções para o dashboard e telas de gestão profissional.**

1. **Consulta do Perfil Próprio (`useMyAnnouncement`)**:
   - No modo `api`, consulta `getApiClient().announcements.getMine()` e expõe `{ ad, draft, listingStatus, score, tips, isLoading, error, refetch }`.
   - No modo `mock`, retorna o primeiro anúncio mock (`ads[0]`) com status correspondente.

2. **Adaptação do Formulário de Rascunho (`useAnnouncementDraft`)**:
   - Aceita opcionalmente `initialDraft` vindo da API para carregar o rascunho pré-existente do banco de dados.
   - `persistDraft()`: em modo API, chama `announcements.saveDraft({ draft })`.
   - `saveSection(section)`: valida e envia `announcements.saveSection({ section, draft })`, atualizando snapshots e status de sincronização.
   - `publish({ status, onActivate })`: valida itens bloqueantes no cliente e chama `announcements.publish({ draft })`, tratando bloqueios do servidor se houver.
   - Preserva o recálculo reativo em tempo real de score e smart tips no cliente via `@sigillus/domain` (`calculateProfileScore`, `generateSmartTips`), idêntico à implementação da API.

3. **Mutações Operacionais Unificadas**:
   - `updateListingStatus(status)`: alterna entre "Ativo" e "Pausado" via `announcements.setListingStatus`.
   - `updateAvailability(status)`: atualiza o status de atendimento ("livre", "em_atendimento", "indisponivel") via `announcements.setAvailability` (integrado na tela de chat).
   - `updateContact(contact)`: atualiza número de WhatsApp e Telegram via `announcements.setContact` (integrado no salvamento de perfil da profissional na tela de conta).

4. **Telas Adaptadas**:
   - `professional-dashboard-screen.tsx`: consome `useMyAnnouncement`, sincroniza `adStatus` com a API e envia `handleToggleStatus`.
   - `announcement-tab.tsx`: recebe `initialDraft` e sincroniza `useAnnouncementDraft`.
   - `professional-ads-screen.tsx`: renderiza o anúncio próprio da profissional quando em modo API, com fallback gracioso para criação caso ainda não possua anúncio.

## Consequências

- O fluxo de rascunho, edição de seções, publicação e controle de status passa a operar conectado à API e ao banco Postgres quando `NEXT_PUBLIC_DATA_SOURCE=api`.
- A suíte E2E do Playwright continua 100% verde (71 testes) no modo `mock`.
- A próxima task (T-13 — Mídia) pode consumir diretamente o `profile.id` e `ad` autenticados para envio de mídias para URLs pré-assinadas e organização de galeria.
