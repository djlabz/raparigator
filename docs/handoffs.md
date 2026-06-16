# Handoffs — raparigator-front-nextjs

Histórico de handoffs entre sessões de desenvolvimento. Append-only — não reescrever entradas antigas.

---

## 2026-06-09 — chat-screen — completo

- **Agente**: feature-builder (sessão Antigravity)
- **Fase**: implementação completa
- **Feature**: chat-screen

- **Arquivos lidos**:
  - `lib/types.ts`
  - `lib/mock-data.ts`
  - `components/ui/button.tsx`
  - `components/ui/modal.tsx`
  - `components/ui/toast.tsx`
  - `lib/auth-session.ts`

- **Arquivos alterados**:
  - `lib/types.ts` — tipos `Conversation`, `Message`, `MessageStatus`, `MessageType` ampliados
  - `lib/mock-data.ts` — mocks atualizados com campos novos
  - `lib/chat-service.ts` — criado do zero (camada de serviço com mock + contratos REST)
  - `components/screens/chat-screen.tsx` — reescrito completamente
  - `app/(private)/chat/page.tsx` — rota movida de (public) para (private)
  - `components/ui/button.tsx` — variant `danger` padronizado para `wine-700/800`

- **Decisões tomadas**:
  - Status "lida" removido do chat (privacidade do usuário)
  - "Digitando..." e "visto por último" removidos (simplicidade)
  - Presença: apenas online/offline, controlado pelo próprio usuário
  - "Excluir da minha caixa" = soft delete com `deletedFromInboxAt`
  - WhatsApp mantido no menu mas sem alteração (decisão de produto)

- **Perguntas em aberto**:
  - Autenticação real (JWT? Cookie?)
  - WebSocket vs SSE vs polling para mensagens em tempo real
  - Storage de mídia para view-once (S3, R2, etc.)

- **Riscos**:
  - `lib/auth-session.ts` é mock — rotas privadas dependem disso
  - Chat exibe `USE_MOCK = true` — quando o backend chegar, testar integração real

- **Verificações manuais necessárias**:
  - Navegar para `/chat` logado e deslogado
  - Enviar mensagem, verificar status sending → sent
  - Bloquear e desbloquear usuário na mesma sessão
  - Denunciar conversa (toast aparece)
  - Excluir da minha caixa (conversa some da lista)
  - Alterar apelido global e por conversa
  - Toggle online/offline
  - ESLint nos arquivos do chat: `npx eslint components/screens/chat-screen.tsx lib/chat-service.ts lib/mock-data.ts lib/types.ts --max-warnings=0` → 0 erros, 0 warnings ✅

- **Próximo agente recomendado**: orchestrator (planejar próxima feature)

---

## 2026-06-09 — pós-cadastro e onboarding — completo

- **Agente**: feature-builder (sessão Antigravity)
- **Fase**: implementação
- **Feature**: pós-cadastro e fluxo de autenticação (cliente e profissional)

- **Arquivos lidos**:
  - `components/screens/login-screen.tsx`
  - `lib/account-notifications.ts`
  - `components/screens/client-signup-screen.tsx`
  - `components/screens/professional-signup-screen/professional-signup-screen.tsx`
  - `components/screens/professional-dashboard/professional-dashboard-screen.tsx`

- **Arquivos alterados**:
  - `components/screens/login-screen.tsx` — Login redireciona direto pro feed. Aviso de eslint corrigido.
  - `components/screens/client-signup-screen.tsx` — Botão de concluir agora faz login com role 'cliente' e redireciona pro `/feed`.
  - `components/screens/professional-signup-screen/professional-signup-screen.tsx` — Botão concluir faz login com role 'profissional' e vai pro `/profissional/dashboard`.
  - `components/screens/professional-dashboard/professional-dashboard-screen.tsx` — Inserido um `InfoBanner` solicitando que ele configure seu anúncio. Avisos de eslint corrigidos.
  - `docs/features/post-cadastro.md` — Contrato da feature gerado e atualizado.

- **Decisões tomadas**:
  - Removido o direcionamento condicional baseado na "completude do perfil". Todos os clientes agora vão para o `/feed` no login/cadastro. 
  - A interface será responsável por exibir as notificações para ele preencher o perfil através da Central de Notificações.
  - Profissionais não terão uma tela separada obrigatória de onboarding impeditiva, mas sim irão para o dashboard que os alertará e direcionará ao preenchimento.

- **Perguntas em aberto**:
  - As notificações hoje são estáticas em `lib/account-notifications.ts`. No futuro, devemos ter uma store real puxando status de completude da API.

- **Riscos**:
  - Nenhum. Todas as rotas funcionam com dados do localStorage que mockam o `useAuthSession`.

- **Verificações manuais necessárias**:
  - Fazer cadastro do cliente, ver toast e feed.
  - Fazer cadastro de profissional, ver redirecionamento pro painel profissional com o banner "Configure seu anúncio".
  - Fazer login e ver redirecionamento sempre indo pro feed/dashboard.
  - ESLint: zero erros, zero warnings ✅

- **Próximo agente recomendado**: orchestrator (definir próximas features e bugs no todo)
