# Raparigator — Gemini

Leia, nesta ordem, antes de qualquer coisa:

1. `AGENTS.md` — stack, comandos, estrutura, convenções, critério de pronto, merge e revisão, e a lista "Nunca faça". É a regra do repo e prevalece sobre este arquivo.
2. `docs/roteiro.md` — estado atual, fase em andamento, decisões tomadas e pendentes.
3. `docs/adr/README.md` — a restrição de produto (vitrine, sem intermediação) e os ADRs vigentes.

## Qual task pegar

- A que o `docs/roteiro.md` aponta como fase atual, na ordem do arquivo daquela fase. Se o Daniel apontar outra, vale a dele.
- Não pegue nada da Fase 3 do roteiro (monetização) nem a T-69 (aguarda lista do operador).

## Regras que você precisa seguir à risca

- Uma task por vez, um PR por task. Faça só o que a task pede. Achou outro problema: registre onde o arquivo da fase manda e siga; não corrija.
- Se a task depender de uma decisão que não está escrita no roteiro, no inventário da fase ou nos ADRs, **pare e pergunte**. Não invente regra de produto, preço, texto legal ou fluxo.
- Nunca mexa em `packages/domain/src/premium.ts` (`PREMIUM_PLAN_OPTIONS`) sem pedido explícito.
- Antes de dizer que terminou, cumpra a seção "Critério de pronto" do `AGENTS.md`. Merge e CodeRabbit seguem a seção "Merge e revisão".
- Ao concluir, marque `[x]` com `(PR #nn, dd/mm)` no arquivo onde a task está, no mesmo PR.

**Quando terminar uma task, responda em 5 linhas no máximo**: o que mudou, como verificou, o que ficou pendente, qual é a próxima task.
