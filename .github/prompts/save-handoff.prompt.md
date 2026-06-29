---
name: save-handoff
description: Salvar ou anexar o último handoff do agente em docs/handoffs.md.
agent: orchestrator
argument-hint: feature=<nome_da_feature>
---

Objetivo: preservar o último handoff significativo como checkpoint em `docs/handoffs.md`.

Leia:
- `AGENTS.md`
- `docs/handoffs.md` se existir
- O último handoff no chat atual
- `docs/features/<feature>.md` se existir

Instruções:
1. Identifique o último bloco `## Handoff` completo da conversa atual.
2. Se não houver handoff completo, pergunte ao usuário sobre os campos faltantes antes de editar.
3. Anexe o handoff a `docs/handoffs.md`.
4. Não reescreva handoffs antigos a menos que o usuário peça explicitamente.
5. Não invente arquivos alterados, decisões ou riscos.
6. Se um campo for desconhecido, escreva `Desconhecido` ou `Não fornecido`.
7. Mantenha a entrada concisa e útil como checkpoint.

Formato de append:

```markdown
## <AAAA-MM-DD> — <feature> — <fase>

- Agente:
- Fase:
- Feature:
- Arquivos lidos:
- Arquivos alterados:
- Decisões tomadas:
- Perguntas em aberto:
- Riscos:
- Verificações manuais necessárias:
- Próximo agente recomendado:
```
