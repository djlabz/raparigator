# Decisions — raparigator-front-nextjs

Registro de decisões arquiteturais e de produto aprovadas. Cada entrada deve ser adicionada quando uma decisão significativa for tomada.

---

## Template de entrada

```
## AAAA-MM-DD — <título da decisão>

**Decisão**: <o que foi decidido>
**Motivo**: <por que foi decidido assim>
**Consequências**: <o que isso implica para o projeto>
**Alternativas rejeitadas**: <o que foi considerado e descartado>
```

---

## 2026-06-09 — Design system protegido como hard constraint

**Decisão**: Os tokens de cor `wine-*` e `zinc-*` em `globals.css` não podem ser alterados por nenhuma feature.
**Motivo**: Consistência visual da marca em toda a plataforma.
**Consequências**: Features devem usar apenas os tokens existentes; novos tokens exigem alinhamento explícito.
**Alternativas rejeitadas**: Permitir variações por feature (rejeitado por inconsistência visual).

---

## 2026-06-09 — Camada de serviço mock com contratos REST

**Decisão**: Cada feature tem seu próprio `lib/<feature>-service.ts` com flag `USE_MOCK` e contratos REST documentados em comentários.
**Motivo**: Permite o frontend evoluir independente do backend, sem acoplamento. O backend conecta depois sem reescrever a tela.
**Consequências**: Assinatura das funções de serviço é contrato público — não pode ser alterada sem alinhar com o dev de backend.
**Alternativas rejeitadas**: Importar mocks diretamente nos componentes (rejeitado por dificultar integração futura).

---

## 2026-06-09 — Rota /chat movida para (private)

**Decisão**: A rota de chat vive em `app/(private)/chat/`, não em `(public)/`.
**Motivo**: Chat é área restrita; expor como rota pública contradiz a proposta de produto.
**Consequências**: A URL `/chat` continua a mesma, mas o grupo de rota é privado.
**Alternativas rejeitadas**: Manter em `(public)` com guard apenas no componente (rejeitado por semântica confusa).

---

## 2026-06-09 — Status "lida" removido do chat

**Decisão**: O chat não exibe confirmação de leitura para o remetente.
**Motivo**: Decisão de produto — privacidade do usuário.
**Consequências**: O tipo `MessageStatus` não inclui `"read"`. Não implementar no frontend.
**Alternativas rejeitadas**: Mostrar "lida" mas deixar o usuário desativar (rejeitado por complexidade desnecessária).

---

## 2026-06-09 — Presença: apenas online/offline

**Decisão**: O indicador de presença exibe apenas online ou offline. "Digitando..." e "visto por último" foram removidos.
**Motivo**: Decisão de produto — simplicidade e privacidade.
**Consequências**: O contato de backend não precisa suportar tipagem em tempo real por enquanto.
**Alternativas rejeitadas**: Adicionar "digitando..." (rejeitado por complexidade de WebSocket desnecessária neste momento).

---

## 2026-06-09 — "Excluir da minha caixa" = soft delete

**Decisão**: A ação de remover conversa é "Excluir da minha caixa", não exclusão definitiva.
**Motivo**: Retenção de dados para auditoria do backend; transparência com o usuário sobre o que acontece.
**Consequências**: O campo `deletedFromInboxAt` no tipo `Conversation` e o endpoint `DELETE /api/chat/conversations/:id/inbox` são soft deletes.
**Alternativas rejeitadas**: Exclusão definitiva imediata (rejeitado por problemas de auditoria e rastreabilidade).
