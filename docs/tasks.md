# Tasks — raparigator-front-nextjs

Fila de trabalho atual. Atualizar sempre que uma task for iniciada, concluída ou bloqueada.

---

## Legenda
- `[ ]` — pendente
- `[/]` — em progresso
- `[x]` — concluído
- `[!]` — bloqueado (ver Open Questions)

---

## Feature: chat-screen (concluída)

- [x] Criar tipos completos em `lib/types.ts` (`Message`, `Conversation`, `MessageStatus`, etc.)
- [x] Criar `lib/chat-service.ts` com flag `USE_MOCK` e contratos REST documentados
- [x] Atualizar `lib/mock-data.ts` com campos novos dos tipos
- [x] Reescrever `components/screens/chat-screen.tsx` com todos os estados
- [x] Mover rota para `app/(private)/chat/page.tsx`
- [x] Bloquear/desbloquear usuário (com toggle correto no modal)
- [x] Denunciar conversa
- [x] Excluir da minha caixa (soft delete)
- [x] Apelido por conversa e apelido geral
- [x] Presença online/offline controlada pelo usuário
- [x] Envio otimista com estado sending/sent/delivered/failed
- [x] Mídia temporária (view-once) — UX simulada
- [x] Corrigir acentuação e capitalização (WhatsApp, opções, etc.)
- [x] ESLint: 0 erros, 0 warnings nos arquivos do chat

---

## Próximas features

> Adicionar tasks aqui quando novas features forem planejadas.

<!-- Exemplo:
## Feature: <nome>

- [ ] Criar contrato em docs/features/<nome>.md
- [ ] Criar tipos em lib/types.ts
- [ ] Criar lib/<nome>-service.ts
- [ ] Criar components/screens/<nome>-screen.tsx
- [ ] Registrar rota em app/(private|public)/<rota>/page.tsx
- [ ] ESLint clean
- [ ] Validação manual documentada no handoff
-->
