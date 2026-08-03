# Títulos dinâmicos do header do feed

## Problema

O feed exibe “Acompanhantes” e o contador de perfis de forma estática no topo do conteúdo. As seções “Modelos Premium” e “Descubra outras Modelos” usam divisores com título + linha `flex-1` que, se sticky sem ajuste, virariam uma barra fixa no header.

## Decisões

- Desktop (`lg+`): Sigillus permanece; título da seção no slot central do `TopHeader`; animação push entre títulos.
- Mobile (`< lg`): `AnimatePresence mode="wait"` troca Sigillus ↔ título da seção (sem push).
- Estado inicial: primeira seção existente já docked no header.
- Divisor in-flow some por completo ao encaixar; âncora `h-px` permanece para o scroll tracking.
- Contador só no painel de filtros (sidebar + modal), acima de “Filtros rápidos”.
- Títulos no header com opacidade 100%, acima do scrim.
- Pacote: `motion/react`.

## Arquitetura

- `FeedHeaderTitleProvider` envolve o `AppShell` no feed.
- Hook `useFeedSectionTitleScroll` liga refs âncora + `useScroll`/`useTransform`.
- `TopHeader` consome o contexto (fallback = só Sigillus fora do feed).
- `FeedSectionDivider` não renderiza quando `docked`.

## Escopo

- `top-header.tsx`, `feed-screen.tsx`, `feed-section-divider.tsx`, `feed-filters-content.tsx`
- Novos: contexto, hook e título compartilhado sob `components/screens/feed-screen/`

## Fora do escopo

- Backend / API
- Alterar copy dos títulos
- Sticky na sidebar de filtros

## Verificação

- `npm run lint`
- Visual: push ida/volta; mobile logo↔título; contador; divisor some ao dockar; título legível
