# AGENTS.md

## Projeto

- Este repositório é o frontend Next.js do Raparigator.
- A interface é em português do Brasil (`pt-BR`).
- Preserve o tom do produto: segurança, discrição, custódia financeira e experiência premium.
- Não armazene segredos, tokens, URLs privadas, credenciais reais ou preferências pessoais em arquivos versionados.
- **Objetivo de evolução**: adicionar novas páginas e features sem quebrar rotas existentes, design system ou contratos de serviço.

## Stack

- **Framework**: Next.js (App Router) com React
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS v4 + `app/globals.css` (design system próprio — cores `wine-*`, `zinc-*`)
- **Ícones**: `lucide-react`
- **Animações**: `motion` (Framer Motion)
- **Lint**: ESLint + `eslint-config-next` (zero warnings)
- Use `npm` como package manager; `package-lock.json` é o lockfile canônico.
- Não troque para `pnpm`, `yarn` ou `bun` sem ADR aceito.
- Não instale dependências novas sem discussão.

## Comandos

- `npm run dev` — inicia `next dev --turbopack`
- `npm run dev:legacy` — inicia `next dev`
- `npm run build` — executa `next build`
- `npm run start` — executa `next start`
- `npm run lint` — executa `eslint`
- `npm run share` — expõe `http://localhost:3000` via Cloudflare Tunnel

Execute `npm run lint` antes de concluir mudanças de código quando Node/npm estiverem disponíveis.
Execute `npm run build` para mudanças em rotas, metadata, config, tipos globais ou comportamento compartilhado.

## Estrutura

- `app/**` — rotas do Next App Router
  - `app/(public)/` — rotas públicas (feed, anúncios, auth); não dependa de autenticação real
  - `app/(private)/` — rotas que exigem login (chat, conta, profissional); preserve separação visual, mas não assuma proteção real de backend
- `components/layout/**` — shell, navegação, header e bottom nav
- `components/screens/**` — telas de produto (interatividade client-side aqui quando a page for server component)
- `components/ui/**` — componentes reutilizáveis sem regra de negócio
- `lib/**` — tipos, mocks, navegação, sessão mockada e utilitários
- `public/**` — assets estáticos usados por rotas, componentes e PWA

## Regras Por Caminho

- `app/**`: mantenha pages pequenas; exporte `metadata` quando a rota precisar de título/descrição; delegue UI para `components/screens/**`.
- `components/ui/**`: não importe mocks, rotas de produto ou estado de sessão; exponha props reutilizáveis.
- `components/layout/**`: use `useAuthSession`, `getNavigationItems` e os papéis existentes antes de criar nova navegação.
- `components/screens/professional-dashboard/**`: leia `types.ts` e `use-profile-form.ts` antes de alterar o fluxo de anúncio; evite refatorações amplas em `announcement-tab.tsx` sem tarefa explícita.
- `lib/**`: preserve `@/*` como alias; não coloque código que dependa de DOM em módulos sem `"use client"`.
- `public/**`: não renomeie assets referenciados por rotas, manifest ou componentes sem atualizar todos os usos.

## Hard Constraints

1. Não refatorar `app/globals.css` nem o design system (cores `wine-*`, `zinc-*`).
2. Não tocar arquivos de autenticação (`lib/auth-session.ts`, rotas `/auth/*`) sem aprovação explícita.
3. Não criar novas convenções de componentes sem alinhar com o time antes.
4. Não alterar a assinatura pública das funções em `lib/chat-service.ts` — o backend vai integrar por esse contrato.
5. Não instalar dependências novas sem discussão.
6. Não reescrever componentes de UI existentes em `components/ui/` como parte de uma feature.
7. Manter mudanças mínimas, explícitas e revisáveis.

## UI E Estilo

- **Consulte `docs/design-guidelines.md`** para diretrizes estritas e completas sobre estilização, Tailwind, tipografia, UI Components, acessibilidade e temas premium.
- Use `components/ui/*` (Button, Card, Modal, etc.) antes de criar novos primitivos.
- Mantenha `pt-BR` e um tom seguro, discreto e premium.
- Sem cores fora do padrão `wine-*`/`zinc-*`.

## Dados, Auth E Segurança

- `lib/mock-data.ts` e `lib/mock-users.ts` são dados mockados de frontend.
- `useAuthSession` usa `localStorage` e não representa autenticação real.
- Não promova senhas mockadas, conteúdo de `credenciais_mock.txt` ou `.env*` para documentação, memória ou prompts.
- Se uma tarefa exigir auth real, backend, pagamentos reais ou proteção de rota, registre a decisão antes de implementar.

## Configuração Sensível

- Preserve o bloco de `next.config.ts` que usa `DISABLE_HMR === "true"` para desabilitar file watching em ambiente de agente.
- `next.config.ts` ignora ESLint durante build; por isso `npm run lint` é verificação separada.
- Domínios remotos de imagem permitidos ficam em `next.config.ts`.

## Contrato De Nova Feature

Toda nova feature deve seguir esta estrutura padrão:

1. Criar contrato em `docs/features/<feature>.md` antes de qualquer implementação.
2. Estrutura de arquivos preferida:
   - `app/(public|private)/<rota>/page.tsx` — Server Component (metadata + render)
   - `components/screens/<feature>-screen.tsx` — Client Component principal
   - `lib/<feature>-service.ts` — camada de serviço (mock agora, API real depois)
   - `lib/types.ts` — adicionar tipos (não reescrever o arquivo)
   - `components/ui/<componente>.tsx` — apenas se for reutilizável em outras features

## Fontes De Verdade (Docs)

| Arquivo | Conteúdo |
|---|---|
| `docs/architecture.md` | Arquitetura atual |
| `docs/design-guidelines.md` | Design system completo |
| `docs/decisions/` | Decisões arquiteturais aprovadas |
| `docs/features/<feature>.md` | Contrato de cada feature |
| `docs/tasks.md` | Fila de trabalho |
| `docs/open-questions.md` | Perguntas em aberto |
| `docs/handoffs.md` | Histórico de handoffs |
| `memory-bank/project-brief.md` | Contexto estável de produto/arquitetura |
| `memory-bank/active-context.md` | Snapshot pequeno e regravável do estado atual |

Registre decisões duráveis em `docs/decisions/`. Não crie persona, skills, rules locais ou docs longos sem justificar o custo em ADR.

## Time De Agentes

### `orchestrator`

**Responsável por:**
- Sequenciamento de tasks
- Manutenção de `docs/tasks.md`, `docs/decisions/`, `docs/open-questions.md`, `docs/handoffs.md`
- Gates de aceitação
- Identificar próximo passo e próximo agente

**Não é responsável por:**
- Implementação de código
- Decisões arquiteturais sem review de contrato

### `feature-builder`

**Responsável por:**
- Implementar a feature aprovada pelo orchestrator
- Criar/atualizar screen, service e types
- Registrar rota se necessário
- Garantir zero erros e warnings no ESLint dos arquivos alterados
- Validação manual documentada

## Gates De Workflow

1. Nenhuma implementação antes de um contrato de feature existir em `docs/features/<feature>.md`.
2. Nenhuma task está completa até:
   - ESLint dos arquivos alterados passar com `--max-warnings=0`
   - Decisões arquiteturais registradas em `docs/decisions/`
   - `docs/tasks.md` atualizado

## Definition Of Done

Uma feature está pronta somente se:

- [ ] Rota carrega no browser sem erro de console
- [ ] ESLint nos arquivos da feature: 0 erros, 0 warnings
- [ ] Design system respeitado (sem cores fora do padrão `wine-*`/`zinc-*`)
- [ ] Contrato de auth respeitado (visitante bloqueado onde necessário)
- [ ] `docs/tasks.md` e `docs/decisions/` atualizados
- [ ] Validação manual documentada no handoff

## Formato De Handoff Obrigatório

Todo agente deve terminar com:

```
## Handoff
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
