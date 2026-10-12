# Raparigator — Claude Code

Todas as instruções do projeto (stack, comandos, estrutura, convenções e proibições) estão em um único lugar. Leia e siga:

@AGENTS.md

Regras específicas para o Claude Code:

- Rode `npm run lint` antes de encerrar qualquer tarefa; se mexeu em `packages/*` ou `apps/api`, rode também `npm run test`
- Nunca rode `npm run share` sem o usuário pedir (expõe o localhost publicamente)
- Toda feature nova que toque anúncio, contato, mídia, pagamento ou dados pessoais passa pelo checklist de `validacao-juridica` antes da implementação; o resultado vai na descrição do PR (skill `validacao-juridica`)
- Em caso de conflito entre este arquivo e o AGENTS.md, o AGENTS.md prevalece
