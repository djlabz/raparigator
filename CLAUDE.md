# Raparigator — Claude Code

Todas as instruções do projeto (stack, comandos, estrutura, convenções, critério de pronto, merge e revisão, proibições) estão em um único lugar. Leia e siga:

@AGENTS.md

Regras específicas para o Claude Code:

- Antes de encerrar qualquer tarefa, cumpra a seção "Critério de pronto" do `AGENTS.md`; durante a implementação, `npm run lint` sempre e `npm run test` quando mexer em `packages/*` ou `apps/api`
- Merge, CI verde e comentários do CodeRabbit seguem a seção "Merge e revisão" do `AGENTS.md`
- Nunca rode `npm run share` sem o usuário pedir (expõe o localhost publicamente)
- O checklist de `validacao-juridica` é a skill `validacao-juridica`
- Em caso de conflito entre este arquivo e o AGENTS.md, o AGENTS.md prevalece
