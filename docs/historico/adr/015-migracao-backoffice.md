# ADR-015 — Migração do Backoffice Administrativo para API

- Status: aceito (2026-10-09)

## Contexto

A plataforma Sigillus conta com um backoffice administrativo restrito (`/admin`) para gestão da plataforma, aprovação e revisão cadastral de perfis de anunciantes, moderação de denúncias de usuários e controle de suspensão preventiva de contas de clientes e profissionais (decisão D-04).

Antes desta task (T-18), todas as 7 telas administrativas do frontend (`admin-dashboard-screen.tsx`, `admin-profiles-screen.tsx`, `admin-profile-detail-screen.tsx`, `admin-active-professionals-screen.tsx`, `admin-clients-screen.tsx`, `admin-reports-screen.tsx` e `admin-search.tsx`) consumiam dados em memória locais gerados por `apps/web/lib/admin-service.ts` a partir de `mock-data.ts`.

Na API, o módulo `admin` (`apps/api/src/modules/admin/`) implementa o contrato `admin.*` completo com autenticação dedicada de admin via better-auth (`sigillus-admin` session cookie):

- `admin.me`: recupera a sessão do administrador atual.
- `admin.dashboard`: métricas consolidadas (perfis pendentes, ativos, denúncias abertas, usuários ativos).
- `admin.activity`: trilha recente de auditoria de ações administrativas.
- `admin.clients`, `admin.suspendClient`, `admin.reinstateClient`: listagem e moderação disciplinar de clientes.
- `admin.professionals`, `admin.profile`, `admin.approveProfile`, `admin.rejectProfile`, `admin.suspendProfessional`, `admin.reinstateProfessional`: esteira de triagem, detalhe de perfil (documentos, mídias, bio), aprovação, rejeição com motivo e suspensão de profissionais.
- `admin.reports`, `admin.startReportReview`, `admin.resolveReport`: triagem e encerramento de denúncias de conduta.
- `admin.search`: busca unificada de perfis e contas por termo.

## Decisão

**Migrar `apps/web/lib/admin-service.ts` para modo dual (`isApiDataSource()`), consumindo todos os procedimentos de `getApiClient().admin.*` no modo API, mantendo compatibilidade integral com o estado em memória no modo mock para os testes E2E.**

1. **Camada de Serviço Centralizada (`apps/web/lib/admin-service.ts`)**:
   - Quando `isApiDataSource()` é verdadeiro, todas as operações administrativas direcionam requisições para os endpoints correspondentes do contrato oRPC `admin.*`.
   - O client oRPC (`apps/web/lib/api/client.ts`) já envia automaticamente as credenciais e cookies (`credentials: "include"`), garantindo o envio do cookie de sessão `sigillus-admin` autenticado.
   - Os tipos de retorno do contrato (`ClientAccount`, `AdminProfileSummary`, `AdminProfileDetail`, `AdminReportSummary`, `AdminAuditEntry`, `AdminDashboardMetrics`, `AdminSearchResult`) encaixam diretamente nos tipos esperados pela UI.
   - Mantida retrocompatibilidade completa com os stores e geradores em memória quando em modo `mock`.

2. **Telas Administrativas Preservadas**:
   - Todas as 7 telas de backoffice já operavam de forma assíncrona com `load()` e estados de loading/erro. Nenhuma quebra visual ou alteração de contrato foi necessária, cumprindo todos os requisitos da decisão D-04 (aprovação de perfil, rejeição com motivo, suspensão e tratamento de denúncias).

## Consequências

- O backoffice administrativo passa a interagir 100% com o banco Postgres e a API quando rodando em modo API.
- A suíte completa de testes E2E Playwright (`tests/admin.spec.ts` e suíte geral de 71 cenários) permanece verde.
- Conclui o passo 10 de 10 da Fase 1 da migração de dados Mock → API, liberando a realização da Task T-19.
