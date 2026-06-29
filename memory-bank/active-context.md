# Active Context

## Estado Atual

- Arquitetura de contexto auditada em 2026-06-07.
- Arquitetura minima implementada com `AGENTS.md`, adapter Claude, ADRs e memory bank minimo.
- Nao havia arquivos canonicos de contexto no repositorio antes desta implementacao.

## Foco Atual

- Usar `AGENTS.md` como contrato canonico always-on.
- Evitar criar persona, skills ou documentacao longa sem nova justificativa em ADR.

## Ambiente Observado

- O workspace esta em WSL/Windows.
- Nesta sessao, `npm run lint` nao pode ser executado porque `npm` nao estava disponivel no shell usado.
- ESLint foi executado via Node bundled e `node_modules/eslint/bin/eslint.js`; falhou por erros preexistentes no codigo da aplicacao.

## Proximos Passos

- Revisar e versionar os novos arquivos de contexto.
- Corrigir os erros preexistentes de ESLint em uma tarefa separada.
