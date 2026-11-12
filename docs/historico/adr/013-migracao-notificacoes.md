# ADR-013 — Migração de Notificações para API

- Status: aceito (2026-10-09)

## Contexto

A plataforma Sigillus conta com uma central de notificações no cabeçalho e navegação mobile para alertar clientes e profissionais sobre eventos relevantes de suas contas (convites para avaliação de perfil emitidos pela profissional, aprovação ou reprovação de anúncios pelo admin no backoffice, avisos de perfil e segurança).

Antes desta task (T-16), as notificações eram geradas e mantidas estritamente em `localStorage` por perfil (`sigillus-account-notifications-${role}`) através de `apps/web/lib/account-notifications.ts`, sem persistência de eventos reais originados no backend.

Na API, o módulo `notifications` (`apps/api/src/modules/notifications/`) implementa o contrato completo:

- `notifications.list`: lista as notificações persistidas do usuário autenticado ordenadas por data decrescente.
- `notifications.markRead`: marca uma notificação específica como lida no banco.
- `notifications.markAllRead`: marca todas as notificações não lidas do usuário como lidas.
- `notifications.remove`: exclui a notificação especificada para o usuário.
- O serviço de notificações é consumido internamente no backend por outros módulos:
  - `reviews.invite`: emite notificação para o cliente quando a profissional abre um convite de avaliação.
  - `reviews.withdrawInvite` e `reviews.submit`: removem a notificação quando o convite é cancelado ou concluído.
  - `admin.approveProfile` / `admin.rejectProfile`: emitem notificações para a profissional avisando da aprovação ou rejeição do perfil.

## Decisão

**Conectar a central de notificações do web ao cliente oRPC em modo dual (`NEXT_PUBLIC_DATA_SOURCE=mock|api`), com atualizações otimistas imediatas e suporte completo a formatação amigável de datas relativas.**

1. **Camada de Notificações (`apps/web/lib/account-notifications.ts`)**:
   - Manter compatibilidade com `useSyncExternalStore` e retrocompatibilidade com o armazenamento em `localStorage` no modo mock.
   - No modo API (`isApiDataSource()`):
     - Buscar notificações persistidas do usuário via `getApiClient().notifications.list()`.
     - Disponibilizar método `refresh` para revalidação sob demanda ao abrir a central de notificações.
     - Aplicar mutações otimistas imediatas para `markAsRead`, `markAllAsRead` e `removeNotification`, sincronizando em segundo plano com `notifications.markRead`, `notifications.markAllRead` e `notifications.remove`.
     - Preservar preferências visuais de interface do cliente (`bannerClosed`, `navbarAckedUnreadIds`, `swingPaused`) no storage local.

2. **Formatação de Tempo Relativo (`@sigillus/domain`)**:
   - Implementar `formatRelativeTime(time, now)` em `packages/domain/src/format.ts` com cobertura de testes unitários.
   - Suportar tanto timestamps ISO gerados pelo PostgreSQL quanto descrições relativas do modo mock ("Agora", "Há 15 min", "Hoje, HH:mm", "Ontem, HH:mm", "DD/MM, HH:mm").
   - Utilizar a função em `notifications-center.tsx` para exibição humanizada.

3. **Integração na Interface (`apps/web/components/layout/notification-bell-button.tsx`)**:
   - Acionar `refresh()` ao abrir a central de notificações (`handleOpen`), garantindo que notificações recém-geradas pelo backend apareçam imediatamente.

## Consequências

- Aprovações/rejeições do admin e convites de avaliação tornam-se imediatamente visíveis para os usuários autenticados no modo API.
- A experiência de leitura e limpeza de notificações é instantânea graças às atualizações otimistas.
- A suíte de testes E2E Playwright continua verde e isolada com o modo mock preservado.
