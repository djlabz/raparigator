# Premium Early Access Benefit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar o benefício exclusivo “Acesso prioritário” em todo o catálogo Premium.

**Architecture:** Fonte de verdade em `lib/premium-catalog.ts` (lista exclusiva + `getImmediateGains`); card no passo 1 do `PremiumConversionModal` com ícone Lucide `Rocket` e highlight id `earlyAccess`.

**Tech Stack:** TypeScript, Next.js, Lucide React

## Global Constraints

- No new icon libraries — Lucide only
- No comments in code
- UI copy in PT-BR
- Spec: `docs/superpowers/specs/2026-08-04-premium-early-access-benefit-design.md`
- Run `npm run lint` / `npm run check` before finishing

## File map

| File | Change |
|---|---|
| `lib/premium-catalog.ts` | `PREMIUM_EXCLUSIVE_FEATURES` + `getImmediateGains` |
| `components/ui/premium-conversion-modal.tsx` | `PremiumHighlight` + `BENEFIT_CELLS` |

---

### Task 1: Catálogo + modal

**Files:**
- Modify: `lib/premium-catalog.ts`
- Modify: `components/ui/premium-conversion-modal.tsx`

- [ ] **Step 1: Atualizar `premium-catalog.ts`**

```ts
export const PREMIUM_EXCLUSIVE_FEATURES = [
  "Visualização única",
  "Apelido por cliente/conversa",
  "Acesso prioritário",
] as const;
```

Em `getImmediateGains()`, após o item `alias`:

```ts
    {
      id: "early-access",
      label: "Acesso prioritário",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
```

- [ ] **Step 2: Atualizar modal**

- Importar `Rocket`
- `PremiumHighlight` inclui `"earlyAccess"`
- Novo cell em `BENEFIT_CELLS`:

```ts
  {
    id: "earlyAccess",
    title: "Acesso prioritário",
    description: "Acesso prioritário a novos recursos e benefícios",
    icon: Rocket,
  },
```

- [ ] **Step 3: Verificar**

Run: `npm run check`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/premium-catalog.ts components/ui/premium-conversion-modal.tsx
git commit -m "$(cat <<'EOF'
feat: benefício Acesso prioritário no catálogo Premium

EOF
)"
```
