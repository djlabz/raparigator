# Project Brief

## Produto

Sigillus e uma plataforma frontend em portugues do Brasil para conectar clientes e profissionais com foco em seguranca, discricao, custodia financeira e experiencia premium.

## Stack

- Next.js App Router.
- React 19.
- TypeScript strict.
- Tailwind CSS v4.
- `npm` com `package-lock.json`.
- Icones via `lucide-react`.
- Animacoes pontuais via `motion`.
- Imagens com `next/image` quando aplicavel.

## Arquitetura Atual

- `app/**` define rotas e metadata.
- `components/screens/**` implementa telas de produto.
- `components/layout/**` implementa shell e navegacao.
- `components/ui/**` implementa primitives reutilizaveis.
- `lib/types.ts` concentra tipos de dominio mockado.
- `lib/mock-data.ts` contem anuncios, reviews, conversas e midia mockados.
- `lib/auth-session.ts` implementa sessao mockada em `localStorage`.

## Papeis

- `visitor`
- `cliente`
- `profissional`

## Rotas Principais

- Publicas: `/`, `/feed`, `/anuncio/[slug]`, `/chat`, `/checkout`, `/acompanhamento`, `/popular/*`, `/auth/*`.
- Privadas: `/conta`, `/profissional/dashboard`, `/profissional/anuncios`, `/profissional/financeiro`.

## Limites Importantes

- A autenticacao atual e mockada e client-side.
- Dados de `lib/mock-users.ts` e `credenciais_mock.txt` nao sao credenciais reais de producao.
- Nao assumir backend, banco, pagamento real ou protecao real de rota sem decisao explicita.

## Pontos De Atencao

- `components/screens/professional-dashboard/announcement-tab.tsx` e grande e deve ser inspecionado sob demanda.
- `next.config.ts` contem regra de ambiente para `DISABLE_HMR`.
- O build ignora ESLint; lint deve ser rodado separadamente.
