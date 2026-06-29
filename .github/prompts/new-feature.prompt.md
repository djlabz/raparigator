---
name: new-feature
description: Criar o contrato de uma nova feature e implementá-la no frontend Next.js.
agent: orchestrator
argument-hint: feature=<nome_da_feature>
---

Leia primeiro:
- [Regras do time](../../AGENTS.md)
- [Arquitetura atual](../../docs/architecture.md)
- [Decisões aprovadas](../../docs/decisions.md)
- [Tasks](../../docs/tasks.md)
- Arquivos relevantes em `app/`, `components/screens/`, `lib/`

## Fase 1 — Contrato
Crie ou atualize `docs/features/<feature>.md` com:
1. Resumo da feature
2. Rota (public ou private)
3. Arquivos a criar/alterar
4. Contrato de serviço (endpoints que o backend deverá implementar)
5. Tipos novos necessários em `lib/types.ts`
6. Estados de UI obrigatórios (loading, erro, vazio)
7. Regras de autenticação (visível para visitante ou não)
8. Riscos e incertezas

## Fase 2 — Implementação
Implemente a feature conforme o contrato.

Requisitos:
- Design system respeitado (cores `wine-*`, `zinc-*`)
- ESLint: 0 erros, 0 warnings nos arquivos alterados
- Visitante bloqueado se rota é privada
- Estados loading/erro/vazio na screen
- Service com mock funcional e contrato REST comentado

Ao final, documente:
- Arquivos alterados
- Decisões tomadas
- Riscos
- Verificações manuais necessárias
