# Premium Modal Scroll Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No passo 2 do `PremiumConversionModal`, impedir Continuar até o usuário rolar até o fim e indicar conteúdo abaixo com fade + seta.

**Architecture:** `Modal` mede overflow/posição do scroll e opcionalmente mostra hint; `ShinyButton` ganha `disabled`; `PremiumConversionModal` liga o gate só no passo Comparar.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React, Playwright

## Global Constraints

- No external API / real backend fetches — mocks/services in `lib/` only
- No new shared types outside `lib/types.ts` unless truly shared (tipo de scroll fica local em `modal.tsx` e exportado se necessário)
- No new icon or animation libraries — Lucide + Motion only
- UI copy in PT-BR
- No comments in code
- Hint visual: fade suave + ChevronDown (variante A da spec)
- Gate só no passo 2; texto do CTA permanece “Continuar para assinatura”
- Run `npm run lint` before finishing; `npm run check` after wiring
- Commits: conventional (`feat:`, `fix:`, `test:`, `style:`)
- Spec: `docs/superpowers/specs/2026-08-04-premium-modal-scroll-gate-design.md`

## File map

| File | Responsibility |
|---|---|
| `components/ui/shiny-button.tsx` | Suporte a `disabled` (opacidade, sem motion de hover/tap, sem click) |
| `components/ui/modal.tsx` | Medição de scroll + callback + overlay de hint opcional |
| `components/ui/premium-conversion-modal.tsx` | Liga gate/hint só no passo 2 |
| `tests/premium-conversion-modal-scroll-gate.spec.ts` | E2E do gate no passo Comparar |
| `docs/superpowers/specs/2026-08-04-premium-modal-scroll-gate-design.md` | Fonte da verdade (somente leitura na impl) |

---

### Task 1: Scaffold E2E que falha

**Files:**
- Create: `tests/premium-conversion-modal-scroll-gate.spec.ts`
- Consumes: fluxo já existente em `/popular/independencia-financeira` que abre o modal Premium (mesmo padrão de `tests/financial-independence.spec.ts`)

**Interfaces:**
- Produces: specs Playwright que esperam `data-testid="modal-scroll"`, `data-testid="modal-scroll-hint"`, e CTA desabilitado/habilitado
- Consumes (após Tasks 2–4): props/comportamento do Modal e PremiumConversionModal

- [ ] **Step 1: Criar o arquivo de teste**

```ts
import { test, expect, type Page } from "@playwright/test";

async function openPremiumCompareStep(page: Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.goto("/popular/independencia-financeira");
  await page.getByRole("button", { name: /Ver meu Painel da Liberdade/i }).click();
  await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
  await page
    .getByTestId("freedom-premium-cta")
    .getByRole("button", { name: /Experimentar o Premium/i })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: /^Continuar$/i }).click();
  await expect(page.getByText(/2 · Comparar/i)).toBeVisible();
}

test.describe("Premium conversion modal scroll gate", () => {
  test("no mobile trava Continuar até rolar o passo Comparar", async ({ page }) => {
    await openPremiumCompareStep(page, 375, 700);

    const continueBtn = page.getByRole("button", { name: /Continuar para assinatura/i });
    await expect(continueBtn).toBeDisabled();
    await expect(page.getByTestId("modal-scroll-hint")).toBeVisible();

    await page.getByTestId("modal-scroll").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await expect(page.getByTestId("modal-scroll-hint")).toHaveCount(0);
    await expect(continueBtn).toBeEnabled();
  });

  test("sem overflow o Continuar já nasce liberado", async ({ page }) => {
    await openPremiumCompareStep(page, 1280, 1200);

    const continueBtn = page.getByRole("button", { name: /Continuar para assinatura/i });
    await expect(continueBtn).toBeEnabled();
    await expect(page.getByTestId("modal-scroll-hint")).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar falha**

Run: `npm run test:e2e:chromium -- tests/premium-conversion-modal-scroll-gate.spec.ts`

Expected: FAIL (testid ausente e/ou botão sem `disabled`)

- [ ] **Step 3: Commit**

```bash
git add tests/premium-conversion-modal-scroll-gate.spec.ts
git commit -m "$(cat <<'EOF'
test: e2e scroll gate do modal Premium (passo Comparar)

EOF
)"
```

---

### Task 2: `ShinyButton` com `disabled`

**Files:**
- Modify: `components/ui/shiny-button.tsx`

**Interfaces:**
- Produces: `ShinyButtonProps.disabled?: boolean` — quando true, `disabled` nativo, sem hover/tap scale, `opacity-40`, `onClick` não dispara
- Consumes: nada das tasks seguintes

- [ ] **Step 1: Atualizar o componente**

Substituir o conteúdo de `components/ui/shiny-button.tsx` por:

```tsx
"use client";

import { ReactNode } from "react";
import { motion } from "motion/react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export function ShinyButton({
  children,
  onClick,
  fullWidth = false,
  size = "md",
  className,
  disabled = false,
}: ShinyButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={cn(
        "shiny-button-border relative inline-flex shrink-0 items-center justify-center rounded-full p-[1.5px]",
        fullWidth && "flex w-full",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#121212] font-semibold text-[#FFDF00]",
          size === "sm" ? "px-4 py-2 text-xs" : "px-6 py-3 text-sm",
        )}
      >
        <Crown className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
        {children}
      </span>
    </motion.button>
  );
}
```

- [ ] **Step 2: Typecheck rápido**

Run: `npx tsc --noEmit`

Expected: PASS (sem erros novos em shiny-button)

- [ ] **Step 3: Commit**

```bash
git add components/ui/shiny-button.tsx
git commit -m "$(cat <<'EOF'
feat: suporte disabled no ShinyButton

EOF
)"
```

---

### Task 3: Medição de scroll + hint no `Modal`

**Files:**
- Modify: `components/ui/modal.tsx`

**Interfaces:**
- Produces:
  - `export type ModalScrollAvailability = { canScrollDown: boolean; reachedEnd: boolean }`
  - `onScrollAvailabilityChange?: (state: ModalScrollAvailability) => void`
  - `showScrollHint?: boolean`
  - `data-testid="modal-scroll"` no container rolável
  - `data-testid="modal-scroll-hint"` no overlay quando visível
- Consumes: `ChevronDown` de `lucide-react`, `motion` para bounce leve do chevron

- [ ] **Step 1: Estender props e medição**

No topo do arquivo, ajustar imports e props:

```tsx
"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useModalLock } from "@/lib/modal-lock";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type ModalScrollAvailability = {
  canScrollDown: boolean;
  reachedEnd: boolean;
};

const SCROLL_END_THRESHOLD_PX = 20;

interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  actions?: ReactNode | null;
  headerActions?: ReactNode;
  size?: "sm" | "md";
  mobileCentered?: boolean;
  titleClassName?: string;
  scrollResetKey?: string | number;
  onScrollAvailabilityChange?: (state: ModalScrollAvailability) => void;
  showScrollHint?: boolean;
}
```

Dentro de `Modal`, após `scrollRef`, adicionar (antes do `if (!open) return null`):

```tsx
  const onScrollAvailabilityChangeRef = useRef(onScrollAvailabilityChange);
  onScrollAvailabilityChangeRef.current = onScrollAvailabilityChange;

  const measureScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const canScrollDown = maxScroll > 1;
    const reachedEnd = !canScrollDown || el.scrollTop >= maxScroll - SCROLL_END_THRESHOLD_PX;
    onScrollAvailabilityChangeRef.current?.({ canScrollDown, reachedEnd });
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;

    measureScroll();
    el.addEventListener("scroll", measureScroll, { passive: true });
    const ro = new ResizeObserver(() => measureScroll());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", measureScroll);
      ro.disconnect();
    };
  }, [open, scrollResetKey, children, measureScroll]);
```

Manter o `useEffect` existente de `scrollTo` com `scrollResetKey`. Depois do reset suave, a medição roda de novo via `scroll`/ResizeObserver; se precisar, chamar `measureScroll()` no fim desse effect também:

```tsx
  useEffect(() => {
    if (!open || scrollResetKey === undefined) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    const id = window.setTimeout(() => measureScroll(), 50);
    return () => window.clearTimeout(id);
  }, [open, scrollResetKey, measureScroll]);
```

- [ ] **Step 2: Envolver a área de scroll com hint**

Trocar o bloco do scroll body por:

```tsx
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            data-testid="modal-scroll"
            className="modal-scroll h-full min-h-0 overflow-y-auto px-0.5 pr-1 overscroll-contain touch-pan-y pb-4 sm:px-1"
          >
            {children}
          </div>
          {showScrollHint ? (
            <div
              data-testid="modal-scroll-hint"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-white via-white/80 to-transparent pb-1"
              aria-hidden="true"
            >
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-zinc-400"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.span>
            </div>
          ) : null}
        </div>
```

Incluir `showScrollHint = false` e `onScrollAvailabilityChange` na desestruturação dos props.

- [ ] **Step 3: Lint/typecheck do Modal**

Run: `npx tsc --noEmit && npx eslint components/ui/modal.tsx`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/ui/modal.tsx
git commit -m "$(cat <<'EOF'
feat: medição de scroll e hint opcional no Modal

EOF
)"
```

---

### Task 4: Ligar o gate no `PremiumConversionModal`

**Files:**
- Modify: `components/ui/premium-conversion-modal.tsx`

**Interfaces:**
- Consumes: `ModalScrollAvailability`, `onScrollAvailabilityChange`, `showScrollHint` do Modal; `disabled` do ShinyButton
- Produces: gate só no passo 2; antes da 1ª medição no passo 2, CTA desabilitado

- [ ] **Step 1: Estado e wiring**

Adicionar imports/estado:

```tsx
import { useState } from "react";
import { Modal, type ModalScrollAvailability } from "@/components/ui/modal";
```

Dentro do componente, após os estados existentes:

```tsx
  const [scrollGateMeasured, setScrollGateMeasured] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);
  const [reachedEnd, setReachedEnd] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(1);
      setBillingCycle("semiannual");
      setScrollGateMeasured(false);
      setCanScrollDown(true);
      setReachedEnd(false);
    }
  }

  const handleScrollAvailabilityChange = (state: ModalScrollAvailability) => {
    setScrollGateMeasured(true);
    setCanScrollDown(state.canScrollDown);
    setReachedEnd(state.reachedEnd);
  };

  const step2CtaDisabled =
    step === 2 && (!scrollGateMeasured || (canScrollDown && !reachedEnd));
```

Ao mudar para o passo 2, resetar a medição antes do conteúdo novo:

No botão Continuar do passo 1:

```tsx
onClick={() => {
  setScrollGateMeasured(false);
  setCanScrollDown(true);
  setReachedEnd(false);
  setStep(2);
}}
```

No `Modal`:

```tsx
    <Modal
      open={open}
      onClose={handleClose}
      title="Sigillus Premium"
      titleClassName="premium-modal-title"
      size="md"
      mobileCentered
      scrollResetKey={step}
      onScrollAvailabilityChange={step === 2 ? handleScrollAvailabilityChange : undefined}
      showScrollHint={step === 2 && canScrollDown}
      actions={
        step === 1 ? (
          <ShinyButton
            fullWidth
            onClick={() => {
              setScrollGateMeasured(false);
              setCanScrollDown(true);
              setReachedEnd(false);
              setStep(2);
            }}
          >
            Continuar
          </ShinyButton>
        ) : (
          <div className="flex w-full flex-col gap-2">
            <ShinyButton fullWidth disabled={step2CtaDisabled} onClick={handleGoCheckout}>
              Continuar para assinatura
            </ShinyButton>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              ← Ver benefícios
            </button>
          </div>
        )
      }
    >
```

Em `handleClose`, também resetar o gate:

```tsx
  const handleClose = () => {
    setStep(1);
    setScrollGateMeasured(false);
    setCanScrollDown(true);
    setReachedEnd(false);
    onClose();
  };
```

- [ ] **Step 2: Rodar E2E**

Run: `npm run test:e2e:chromium -- tests/premium-conversion-modal-scroll-gate.spec.ts`

Expected: PASS nos dois testes

Se o teste “sem overflow” falhar em CI porque ainda há scroll em 1280×1200, aumentar altura para `1400` ou reduzir conteúdo só no assert — preferir viewport maior antes de mudar produto.

- [ ] **Step 3: Commit**

```bash
git add components/ui/premium-conversion-modal.tsx
git commit -m "$(cat <<'EOF'
feat: gate de scroll no passo Comparar do modal Premium

EOF
)"
```

---

### Task 5: Verificação final

**Files:**
- Nenhuma mudança de produto esperada; só validação

- [ ] **Step 1: Lint + typecheck**

Run: `npm run check`

Expected: PASS

- [ ] **Step 2: Smoke manual rápido (opcional se E2E passou)**

- Abrir modal Premium em viewport ~375×700
- Passo 1: Continuar normal
- Passo 2: ver fade + seta, CTA desabilitado
- Rolar até planos: hint some, CTA libera
- “← Ver benefícios” funciona com CTA ainda travado

- [ ] **Step 3: Commit de ajustes só se houver fix**

Se algum fix residual for necessário:

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: ajustes finais do scroll gate do modal Premium

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Hint fade + ChevronDown no passo 2 | Task 3 + 4 |
| CTA disabled até scroll end | Task 2 + 4 |
| Texto CTA inalterado | Task 4 |
| Sem overflow → CTA liberado | Task 3 + 4 + E2E Task 1 |
| Ver benefícios sempre ativo | Task 4 |
| Reset ao reabrir / voltar ao passo 2 | Task 4 |
| Passo 1 sem gate | Task 4 |
| Modal props opcionais (outros modais ok) | Task 3 |
| Antes da 1ª medição, CTA travado | Task 4 |
| Lint/check | Task 5 |
