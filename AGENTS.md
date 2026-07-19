# Raparigator (Frontend)

Frontend de uma plataforma de anúncios de acompanhantes com feed, chat, checkout e backoffice admin. Ainda não há backend: todos os dados são mockados em `lib/`.

## Stack

- TypeScript (strict) · Next.js 16 (App Router + Turbopack) · React 19
- Tailwind CSS v4 · Motion (animações) · Lucide React (ícones)
- Sem banco e sem API real — dados vêm de `lib/mock-data.ts` e `lib/mock-users.ts`

## Como rodar

- Instalar: `npm install`
- Dev: `npm run dev` (porta 3000; `npm run dev:legacy` roda sem Turbopack)
- Lint: `npm run lint` — SEMPRE rode antes de finalizar tarefa
- Build de produção: `npm run build` · servir build: `npm run start`
- Não existe suite de testes; a verificação é lint + build + checagem visual
- Logins de teste estão em `credenciais_mock.txt`
- PWA / tela cheia: em aba normal do navegador a barra de endereço não pode ser escondida de forma permanente. Para experiência tipo app nativo, instale via “Adicionar à Tela de Início” / “Instalar app” (`display: standalone` em `app/manifest.ts`). Valide nesse modo, não só no tunnel Cloudflare.

## Estrutura

- `app/(tabs)` → abas principais com shell persistente (feed, chat, acompanhamento, painel)
- `app/(public)` → rotas abertas (auth, anúncio, checkout, popular)
- `app/(private)` → rotas logadas fora das abas (conta, financeiro, anúncios)
- `app/(admin)` → backoffice de administradores
- `components/ui` → primitivos genéricos · `components/layout` → navbar/footer/sidebar · `components/screens` → blocos grandes de página
- `lib/` → tipos (`types.ts` é a fonte de verdade), mocks e serviços (auth-session, chat-service, admin-service etc.)

## Convenções

- Importe sempre com o alias `@/` (aponta para a raiz do repo)
- Componentes React em PascalCase; hooks começam com `use`
- Commits: conventional (`feat:`, `fix:`, `chore:`, `style:`)
- Branches descritivas (`feature/...`, `fix/...`); nunca commite direto na `main`
- Textos de UI em português (PT-BR)
- Não escreva comentários no código

## Nunca faça

- Nunca chame API externa nem crie fetch para backend real — consuma os serviços/mocks de `lib/`
- Nunca adicione novos tipos fora de `lib/types.ts` quando forem compartilhados
- Nunca edite `.next/`, `node_modules/` ou `tsconfig.tsbuildinfo`
- Nunca commite `.env*` (segredos ficam em `.env.local`)
- Nunca instale outra lib de ícones ou animação — já usamos Lucide e Motion
