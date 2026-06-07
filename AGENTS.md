# AGENTS.md

## Projeto

- Este repositorio e o frontend Next.js da Sigillus.
- A interface e em portugues do Brasil (`pt-BR`).
- Preserve o tom do produto: seguranca, discricao, custodia financeira e experiencia premium.
- Nao armazene segredos, tokens, URLs privadas, credenciais reais ou preferencias pessoais em arquivos versionados.

## Stack E Comandos

- Use `npm` como package manager; `package-lock.json` e o lockfile canonico.
- Scripts reais:
  - `npm run dev` inicia `next dev --turbopack`.
  - `npm run dev:legacy` inicia `next dev`.
  - `npm run build` executa `next build`.
  - `npm run start` executa `next start`.
  - `npm run lint` executa `eslint`.
  - `npm run share` expoe `http://localhost:3000` via Cloudflare Tunnel.
- Execute `npm run lint` antes de concluir mudancas de codigo quando Node/npm estiverem disponiveis.
- Execute `npm run build` para mudancas em rotas, metadata, config, tipos globais ou comportamento compartilhado.
- Nao troque para `pnpm`, `yarn` ou `bun` sem ADR aceito.

## Estrutura

- `app/**` contem rotas do Next App Router.
- `components/layout/**` contem shell, navegacao, header e bottom nav.
- `components/screens/**` contem telas de produto.
- `components/ui/**` contem componentes reutilizaveis sem regra de negocio.
- `lib/**` contem tipos, mocks, navegacao, sessao mockada e utilitarios.
- `public/**` contem assets estaticos usados por rotas, componentes e PWA.

## Regras Por Caminho

- `app/**`: mantenha pages pequenas; exporte `metadata` quando a rota precisar de titulo/descricao; delegue UI para `components/screens/**`.
- `app/(public)/**`: trate como rotas publicas; nao dependa de autenticacao real.
- `app/(private)/**`: preserve a separacao visual de area privada, mas nao assuma protecao real de backend.
- `components/ui/**`: nao importe mocks, rotas de produto ou estado de sessao; exponha props reutilizaveis.
- `components/layout/**`: use `useAuthSession`, `getNavigationItems` e os papeis existentes antes de criar nova navegacao.
- `components/screens/**`: coloque interatividade client-side aqui quando a page puder continuar server component.
- `components/screens/professional-dashboard/**`: leia `types.ts` e `use-profile-form.ts` antes de alterar o fluxo de anuncio; evite refatoracoes amplas em `announcement-tab.tsx` sem tarefa explicita.
- `lib/**`: preserve `@/*` como alias; nao coloque codigo que dependa de DOM em modulos sem `"use client"`.
- `public/**`: nao renomeie assets referenciados por rotas, manifest ou componentes sem atualizar todos os usos.

## UI E Estilo

- Use Tailwind CSS v4 e os tokens definidos em `app/globals.css`.
- Use `components/ui/button.tsx`, `card.tsx`, `modal.tsx`, `select.tsx`, `switch.tsx` e componentes existentes antes de criar novos primitives.
- Use `lucide-react` para icones quando houver icone equivalente.
- Use `next/image` para imagens de produto/remotas quando aplicavel.
- Preserve fontes globais configuradas em `app/layout.tsx`: Manrope e Cormorant Garamond.
- Nao faca redesign global ou troca de paleta sem tarefa explicita.

## Dados, Auth E Seguranca

- `lib/mock-data.ts` e `lib/mock-users.ts` sao dados mockados de frontend.
- `useAuthSession` usa `localStorage` e nao representa autenticacao real.
- Nao promova senhas mockadas, conteudo de `credenciais_mock.txt` ou `.env*` para documentacao, memoria ou prompts.
- Se uma tarefa exigir auth real, backend, pagamentos reais ou protecao de rota, registre a decisao antes de implementar.

## Configuracao Sensivel

- Preserve o bloco de `next.config.ts` que usa `DISABLE_HMR === "true"` para desabilitar file watching em ambiente de agente.
- `next.config.ts` ignora ESLint durante build; por isso `npm run lint` e verificacao separada.
- Dominios remotos de imagem permitidos ficam em `next.config.ts`.

## Decisoes E Memoria

- Registre decisoes duraveis em `docs/decisions/`.
- Use `memory-bank/project-brief.md` para contexto estavel de produto/arquitetura.
- Use `memory-bank/active-context.md` como snapshot pequeno, regravavel e sem historico infinito.
- Nao crie persona, skills, rules locais ou docs longos sem justificar o custo em ADR.
