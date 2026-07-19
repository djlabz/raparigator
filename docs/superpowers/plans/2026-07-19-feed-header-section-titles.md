# Feed Header Section Titles Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax. **Não fazer commits** (pedido do usuário).

**Goal:** Títulos de seção do feed orquestrados por scroll no header (push desktop, logo↔título mobile) e contador no painel de filtros.

**Architecture:** Provider no feed + hook `useScroll` nas âncoras das seções; `TopHeader` renderiza o slot; divisores somem quando docked.

**Tech Stack:** Next.js App Router, React 19, `motion/react`, Tailwind v4

## Global Constraints

- Imports com `@/`
- Sem comentários no código
- UI em PT-BR
- Sem `framer-motion` direto — usar `motion/react`
- Sem commits

---

### Task 1: Contexto + hook + título compartilhado

- [ ] Criar `feed-section-title.tsx` (Star/Flame + label)
- [ ] Criar `feed-header-title-context.tsx`
- [ ] Criar `use-feed-section-title-scroll.ts`

### Task 2: TopHeader

- [ ] Consumir contexto; slot desktop push; mobile AnimatePresence

### Task 3: Feed screen + divider + filtros

- [ ] Âncoras, provider, remover “Acompanhantes”
- [ ] Divider com `docked`
- [ ] `resultCount` em `FeedFiltersContent`

### Task 4: Verificar

- [ ] `npm run lint`
