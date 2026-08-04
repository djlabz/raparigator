# Benefício Premium — Acesso prioritário

## Problema

O catálogo Premium (modal de conversão e checkout) não comunica acesso antecipado a novidades da plataforma.

## Decisão

Adicionar o benefício exclusivo **Acesso prioritário** em todos os pontos do catálogo Premium (abordagem C + opção 1).

## Copy e identidade

| Campo | Valor |
|---|---|
| id | `earlyAccess` |
| Título (card passo 1) | Acesso prioritário |
| Descrição | Acesso prioritário a novos recursos e benefícios |
| Ícone | `Rocket` (Lucide) |
| Tipo | Exclusivo Premium (sem linha Comum × Premium) |

## Escopo

- [`lib/premium-catalog.ts`](../../../lib/premium-catalog.ts): incluir string em `PREMIUM_EXCLUSIVE_FEATURES`; entrada em `getImmediateGains()` com `exclusive: true` (`from: "Não incluso"`, `to: "Exclusivo Premium"`, `label: "Acesso prioritário"`)
- [`components/ui/premium-conversion-modal.tsx`](../../../components/ui/premium-conversion-modal.tsx): estender `PremiumHighlight` com `"earlyAccess"`; novo item em `BENEFIT_CELLS` (6 cards → grade 2 colunas sem `sm:col-span-2` no último)

## Fora do escopo

- Linha nos cards Comum × Premium do passo Comparar
- Novos CTAs / upsells apontando `highlight="earlyAccess"`
- Mudança de preços ou planos

## Verificação

- `npm run lint` e `npm run check`
- Passo 1: 6 cards, título e descrição corretos, ícone Rocket
- Passo 2: item em “Exclusivo Premium”
- Checkout Premium: ganho listado via `getImmediateGains()`
