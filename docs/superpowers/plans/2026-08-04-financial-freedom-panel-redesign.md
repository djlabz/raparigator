# Painel de Liberdade Financeira — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the financial freedom calculator/panel for dense mobile, wide desktop FOMO impact, live preview, sticky/collapsing hero, and ⓘ info popovers — without changing calculation formulas.

**Architecture:** Keep calculation logic in `FinancialIndependenceScreen` `useMemo`. Add reusable `InfoHint` UI primitive. Compact calculator with live preview. Results panel uses sticky hero (`chromeBelowDesktopNavStickyTop` on desktop; scroll-collapse bar on mobile) + denser metrics grid. Validate with Playwright across 375 / 768 / 1280.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React, Playwright

## Global Constraints

- No external API / real backend fetches — mocks/services in `lib/` only
- No new shared types outside `lib/types.ts` unless truly shared
- No new icon or animation libraries — Lucide + Motion only
- UI copy in PT-BR
- No comments in code
- Do not change `TARGET`, `MIN_WAGE`, or revenue formulas
- Brand tokens: wine CTAs, emerald for “seu ritmo”, gray for CLT, gold only in existing Premium surfaces
- Run `npm run lint` before finishing the overall work; run targeted Playwright after UI tasks
- Commits: conventional (`feat:`, `fix:`, `test:`, `style:`)
- Work on branch `feature/financial-freedom-panel-redesign` (already created)

## File map

| File | Responsibility |
|---|---|
| `components/ui/info-hint.tsx` | Circular ⓘ button + animated popover (controlled open id) |
| `components/screens/financial-independence-screen.tsx` | Calculator + panel UI/UX redesign; wires InfoHint; hero sticky/collapse |
| `tests/financial-independence.spec.ts` | E2E: preview, panel, sticky/collapse, ⓘ, viewports, reset, premium toggle |
| `docs/superpowers/specs/2026-08-04-financial-freedom-panel-redesign.md` | Source of truth (read-only during impl) |

Optional local extractions inside the screen file only if it exceeds ~600 lines: `FreedomHero`, metrics blocks as inner functions/components in the same file.

---

### Task 1: Scaffold failing E2E coverage

**Files:**
- Create: `tests/financial-independence.spec.ts`
- Consumes: page at `/popular/independencia-financeira` (age gate already seeded via Playwright `storageState`)

**Interfaces:**
- Produces: Playwright specs that fail until UI ships (`data-testid`s expected below)

- [ ] **Step 1: Create the spec file**

```ts
import { test, expect, type Page } from "@playwright/test";

async function openCalculator(page: Page, width: number, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto("/popular/independencia-financeira");
  await expect(page.getByRole("heading", { name: "Calculadora de Liberdade" })).toBeVisible();
}

async function submitPanel(page: Page) {
  await page.getByRole("button", { name: /Ver meu Painel da Liberdade/i }).click();
  await expect(page.getByTestId("freedom-hero")).toBeVisible();
}

test.describe("Independência financeira", () => {
  test("preview vivo atualiza ao mudar steppers (375)", async ({ page }) => {
    await openCalculator(page, 375);
    const preview = page.getByTestId("freedom-live-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(/\/ mês/i);
    const before = await preview.innerText();
    await page.getByRole("button", { name: "adiciona 50" }).first().click();
    await expect(preview).not.toHaveText(before);
  });

  test("não expõe fórmula no rodapé da calculadora", async ({ page }) => {
    await openCalculator(page, 375);
    await expect(page.getByText(/Cálculo base:/i)).toHaveCount(0);
  });

  test("CTA abre painel com manchete e montante (1280)", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    await expect(page.getByTestId("freedom-hero")).toContainText(/anos/i);
    await expect(page.getByTestId("freedom-hero-amount")).toBeVisible();
  });

  test("hero sticky no desktop ao rolar", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    const hero = page.getByTestId("freedom-hero");
    const before = await hero.boundingBox();
    await page.getByTestId("freedom-metrics-grid").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect(hero).toBeVisible();
    const after = await hero.boundingBox();
    expect(before).toBeTruthy();
    expect(after).toBeTruthy();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(80);
  });

  test("hero colapsa no mobile após scroll", async ({ page }) => {
    await openCalculator(page, 375, 720);
    await submitPanel(page);
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "false");
    await page.evaluate(() => window.scrollBy(0, 220));
    await expect(page.getByTestId("freedom-hero")).toHaveAttribute("data-collapsed", "true");
    await expect(page.getByTestId("freedom-hero-compact")).toBeVisible();
  });

  test("InfoHint abre, fecha com Escape e troca ao abrir outro", async ({ page }) => {
    await openCalculator(page, 768);
    await page.getByTestId("info-hint-trigger-calc-base").click();
    await expect(page.getByTestId("info-hint-panel-calc-base")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("info-hint-panel-calc-base")).toHaveCount(0);
    await submitPanel(page);
    await page.getByTestId("info-hint-trigger-race").click();
    await expect(page.getByTestId("info-hint-panel-race")).toBeVisible();
    await page.getByTestId("info-hint-trigger-amount").click();
    await expect(page.getByTestId("info-hint-panel-amount")).toBeVisible();
    await expect(page.getByTestId("info-hint-panel-race")).toHaveCount(0);
  });

  test("Nova Simulação volta à calculadora", async ({ page }) => {
    await openCalculator(page, 375);
    await submitPanel(page);
    await page.getByRole("button", { name: /Nova Simulação/i }).first().click();
    await expect(page.getByRole("heading", { name: "Calculadora de Liberdade" })).toBeVisible();
  });

  test("toggle Premium continua atualizando números", async ({ page }) => {
    await openCalculator(page, 1280);
    await submitPanel(page);
    const amount = page.getByTestId("freedom-hero-amount");
    const before = await amount.innerText();
    await page.getByRole("switch", { name: /Topo das Pesquisas/i }).click();
    await expect(amount).not.toHaveText(before);
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx playwright test tests/financial-independence.spec.ts --project=chromium
```

Expected: FAIL (missing `data-testid`s / preview / hero behavior)

- [ ] **Step 3: Commit**

```bash
git add tests/financial-independence.spec.ts
git commit -m "$(cat <<'EOF'
test: scaffold e2e do painel de liberdade financeira

EOF
)"
```

---

### Task 2: InfoHint primitive

**Files:**
- Create: `components/ui/info-hint.tsx`
- Test: covered by Task 1 E2E once wired

**Interfaces:**
- Produces:

```ts
export type InfoHintProps = {
  id: string;
  label: string;
  children: React.ReactNode;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  className?: string;
  align?: "start" | "center" | "end";
};
export function InfoHint(props: InfoHintProps): JSX.Element;
```

- [ ] **Step 1: Implement `components/ui/info-hint.tsx`**

```tsx
"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoHintProps = {
  id: string;
  label: string;
  children: React.ReactNode;
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  className?: string;
  align?: "start" | "center" | "end";
};

export function InfoHint({
  id,
  label,
  children,
  openId,
  onOpenChange,
  className,
  align = "start",
}: InfoHintProps) {
  const open = openId === id;
  const panelDomId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(null);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) onOpenChange(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        data-testid={`info-hint-trigger-${id}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelDomId}
        onClick={() => onOpenChange(open ? null : id)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-500"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelDomId}
            role="dialog"
            data-testid={`info-hint-panel-${id}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 2 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
            className={cn(
              "absolute z-40 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs leading-relaxed text-zinc-600 shadow-lg",
              align === "end" && "right-0",
              align === "center" && "left-1/2 -translate-x-1/2",
              align === "start" && "left-0",
            )}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Lint the new file**

```bash
npx eslint components/ui/info-hint.tsx
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/ui/info-hint.tsx
git commit -m "$(cat <<'EOF'
feat: add InfoHint popover for calculation explanations

EOF
)"
```

---

### Task 3: Compact calculator + live preview + ⓘ

**Files:**
- Modify: `components/screens/financial-independence-screen.tsx`
- Test: `tests/financial-independence.spec.ts` (preview + no formula footer)

**Interfaces:**
- Consumes: `InfoHint`, existing `parsed` from `useMemo`, `currency`
- Produces DOM contracts:
  - `data-testid="freedom-live-preview"`
  - `data-testid="info-hint-trigger-calc-base"` (and panel)
  - Remove visible “Cálculo base: …” paragraph

- [ ] **Step 1: Add UI state and imports at top of screen**

Add imports:

```tsx
import { useEffect, useMemo, useState } from "react";
import { InfoHint } from "@/components/ui/info-hint";
import { cn } from "@/lib/utils";
```

(`currency` already imported from `@/lib/utils` — merge into one import.)

Inside `FinancialIndependenceScreen`, add:

```tsx
const [infoOpenId, setInfoOpenId] = useState<string | null>(null);
```

Reset `infoOpenId` when toggling `submitted`:

```tsx
const handleReset = () => {
  setSubmitted(false);
  setInfoOpenId(null);
};
```

When submitting:

```tsx
onClick={() => {
  setInfoOpenId(null);
  setSubmitted(true);
}}
```

- [ ] **Step 2: Densify `Counter`**

In `Counter` return, change:

- outer `space-y-1.5` → `space-y-1`
- label `text-sm` → `text-xs sm:text-sm`
- control height `h-11` → `h-10`
- keep +/- aria labels (`diminui ${step}` / `adiciona ${step}`)

- [ ] **Step 3: Replace calculator block**

Change wrapper `max-w-4xl space-y-6` → `max-w-5xl space-y-4 md:space-y-5`.

Replace the non-submitted section with denser card + preview (keep default state values and Counter wiring). Structure:

```tsx
{!submitted && (
  <>
    <header className="space-y-1">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 md:text-2xl">Calculadora de Liberdade</h1>
        <InfoHint
          id="calc-base"
          label="Como calculamos"
          openId={infoOpenId}
          onOpenChange={setInfoOpenId}
        >
          Multiplicamos valor × atendimentos × dias × 4,33 semanas do mês. Usamos o salário mínimo líquido (descontos de INSS e VT) como ritmo padrão de comparação.
        </InfoHint>
      </div>
      <p className="text-sm text-zinc-600">Descubra o quão rápido você pode atingir sua independência financeira.</p>
    </header>

    <Card className="space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {/* existing Counters + optional projection row — same state setters */}
      </div>

      {parsed ? (
        <div
          data-testid="freedom-live-preview"
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-center"
        >
          <p className="text-lg font-bold text-emerald-700 md:text-xl">
            ≈ {currency(parsed.monthlyRevenue)} / mês
          </p>
          <p className="mt-0.5 text-xs font-medium text-emerald-800/80 md:text-sm">
            {parsed.yearsSaved > 0
              ? `~${parsed.yearsSaved} anos a menos que o ritmo CLT`
              : "Você já está no ritmo — refine os números"}
          </p>
        </div>
      ) : null}

      <Button
        size="lg"
        className="w-full text-base font-semibold md:text-lg"
        onClick={() => {
          setInfoOpenId(null);
          setSubmitted(true);
        }}
      >
        Ver meu Painel da Liberdade 🚀
      </Button>
    </Card>
  </>
)}
```

Delete the footer paragraph:

```tsx
<p className="text-xs text-zinc-500 text-center mt-3">Cálculo base: ...</p>
```

- [ ] **Step 4: Run preview-related E2E**

```bash
npx playwright test tests/financial-independence.spec.ts -g "preview|fórmula" --project=chromium
```

Expected: those two tests PASS (others may still fail)

- [ ] **Step 5: Commit**

```bash
git add components/screens/financial-independence-screen.tsx
git commit -m "$(cat <<'EOF'
feat: compact freedom calculator with live preview

EOF
)"
```

---

### Task 4: Results hero — sticky desktop + collapsing mobile

**Files:**
- Modify: `components/screens/financial-independence-screen.tsx`
- Consumes: `chromeBelowDesktopNavStickyTop` from `@/lib/chrome-styles`

**Interfaces:**
- Produces:
  - `data-testid="freedom-hero"` with `data-collapsed="true|false"`
  - `data-testid="freedom-hero-amount"`
  - `data-testid="freedom-hero-compact"` when collapsed on mobile
  - Desktop sticky under desktop nav

- [ ] **Step 1: Add collapse state + scroll effect**

```tsx
import { chromeBelowDesktopNavStickyTop } from "@/lib/chrome-styles";

const [heroCollapsed, setHeroCollapsed] = useState(false);

useEffect(() => {
  if (!submitted) {
    setHeroCollapsed(false);
    return;
  }
  const onScroll = () => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) {
      setHeroCollapsed(false);
      return;
    }
    setHeroCollapsed(window.scrollY > 80);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}, [submitted]);
```

- [ ] **Step 2: Replace top-of-panel reset + headline + montante card with unified hero**

Remove the standalone “Nova Simulação” row that only adds top whitespace, the separate centered headline block, and the standalone montante `Card`. Put toggle Premium first (keep existing premium card), then:

```tsx
<div
  data-testid="freedom-hero"
  data-collapsed={heroCollapsed ? "true" : "false"}
  className={cn(
    "z-10 border border-emerald-200 bg-emerald-50/95 shadow-sm backdrop-blur-md",
    "sticky rounded-2xl",
    chromeBelowDesktopNavStickyTop,
    heroCollapsed ? "px-3 py-2" : "p-4 md:p-5",
  )}
>
  {heroCollapsed ? (
    <div data-testid="freedom-hero-compact" className="flex items-center justify-between gap-3 md:hidden">
      <p className="truncate text-sm font-bold text-emerald-700">
        {parsed.yearsSaved > 0 ? `${parsed.yearsSaved} anos` : "No ritmo"} · {currency(parsed.projectedAmount)}
      </p>
      <Button
        type="button"
        onClick={handleReset}
        className="h-8 shrink-0 bg-zinc-100 px-2 text-xs text-zinc-700 hover:bg-zinc-200"
        aria-label="Nova Simulação"
      >
        <IconRefresh className="h-3.5 w-3.5" />
      </Button>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold text-zinc-900 md:text-3xl">
          {parsed.yearsSaved > 0 ? (
            <>
              Você está comprando{" "}
              <span className="text-emerald-600">{parsed.yearsSaved} anos</span> da sua vida de volta.
            </>
          ) : (
            <>Você já está no ritmo — refine os números.</>
          )}
        </h2>
        <Button
          onClick={handleReset}
          className="hidden h-9 shrink-0 items-center gap-2 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200 md:inline-flex"
        >
          <IconRefresh className="h-4 w-4" />
          Nova Simulação
        </Button>
      </div>
      <p className="text-sm text-zinc-600 md:hidden">
        Esse é o poder de valorizar a sua hora de trabalho.
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-emerald-200/80 pt-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Montante em {parsed.effectiveTimeNum}{" "}
              {parsed.effectiveUnit === "years"
                ? parsed.effectiveTimeNum === 1
                  ? "ano"
                  : "anos"
                : parsed.effectiveTimeNum === 1
                  ? "mês"
                  : "meses"}
            </p>
            <InfoHint
              id="amount"
              label="Sobre o montante"
              openId={infoOpenId}
              onOpenChange={setInfoOpenId}
            >
              Projeção do seu ritmo atual nesse período.
            </InfoHint>
          </div>
          <p data-testid="freedom-hero-amount" className="text-3xl font-bold text-emerald-600 md:text-4xl">
            {currency(parsed.projectedAmount)}
          </p>
        </div>
        <Button
          onClick={handleReset}
          className="inline-flex h-9 items-center gap-2 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200 md:hidden"
        >
          <IconRefresh className="h-4 w-4" />
          Nova Simulação
        </Button>
      </div>
    </div>
  )}
</div>
```

Keep Premium toggle **above** the hero (not sticky). Reduce panel wrapper from `space-y-6` + `pt-2` to `space-y-3 md:space-y-4` and remove extra top padding.

- [ ] **Step 3: Run hero E2E**

```bash
npx playwright test tests/financial-independence.spec.ts -g "hero|Nova Simulação|Premium" --project=chromium
```

Expected: PASS for sticky, collapse, reset, premium (InfoHint race/amount may still fail until Task 5)

- [ ] **Step 4: Commit**

```bash
git add components/screens/financial-independence-screen.tsx
git commit -m "$(cat <<'EOF'
feat: sticky collapsing freedom hero for FOMO impact

EOF
)"
```

---

### Task 5: Dense metrics grid + remaining ⓘ hints

**Files:**
- Modify: `components/screens/financial-independence-screen.tsx`

**Interfaces:**
- Produces: `data-testid="freedom-metrics-grid"`
- InfoHint ids: `race`, `equivalence`, `dreams`, `premium` (plus `amount` / `calc-base` from earlier)

- [ ] **Step 1: Wrap metrics and densify**

Wrap Corrida + Equivalência + Conquistas:

```tsx
<div data-testid="freedom-metrics-grid" className="grid gap-3 md:grid-cols-2 md:gap-4">
  <Card className="border-zinc-200 p-4 shadow-sm md:col-span-1 md:p-5">
    <div className="mb-4 flex items-center gap-2">
      <h3 className="text-base font-semibold text-zinc-900">🏁 A Corrida do Milhão</h3>
      <InfoHint id="race" label="Sobre a corrida do milhão" openId={infoOpenId} onOpenChange={setInfoOpenId}>
        Tempo estimado para juntar R$ 1 milhão no seu ritmo vs no ritmo CLT.
      </InfoHint>
    </div>
    {/* existing race bars — reduce space-y-8 → space-y-5; remove long captions if redundant */}
  </Card>

  <div className="grid gap-3 sm:grid-cols-2 md:col-span-1">
    {/* potência + equivalência cards with p-4; add InfoHint id="equivalence" on section label */}
  </div>

  <div className="md:col-span-2">
    <div className="mb-2 ml-1 flex items-center gap-2">
      <h3 className="text-base font-semibold text-zinc-900">🏆 Linha do Tempo das Conquistas</h3>
      <InfoHint id="dreams" label="Sobre as conquistas" openId={infoOpenId} onOpenChange={setInfoOpenId}>
        Tempo estimado para cada meta mantendo o ritmo simulado.
      </InfoHint>
    </div>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
      {/* dream cards: p-3 md:p-4, keep highlight styles */}
    </div>
  </div>
</div>
```

On Premium toggle title row, add:

```tsx
<InfoHint id="premium" label="Sobre o Topo das Pesquisas" openId={infoOpenId} onOpenChange={setInfoOpenId}>
  Simula o efeito da visibilidade Premium nos seus números.
</InfoHint>
```

Remove redundant helper captions that duplicate ⓘ content (e.g. long “Mantendo o seu ritmo…” under montante if already covered — keep at most one short line in expanded hero if needed for FOMO).

- [ ] **Step 2: Run InfoHint E2E**

```bash
npx playwright test tests/financial-independence.spec.ts -g "InfoHint" --project=chromium
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/screens/financial-independence-screen.tsx
git commit -m "$(cat <<'EOF'
feat: densify freedom metrics grid with info hints

EOF
)"
```

---

### Task 6: Full Playwright matrix + lint polish

**Files:**
- Modify if needed: `components/screens/financial-independence-screen.tsx`, `components/ui/info-hint.tsx`, `tests/financial-independence.spec.ts`

- [ ] **Step 1: Run full financial-independence suite**

```bash
npx playwright test tests/financial-independence.spec.ts --project=chromium
```

Expected: all PASS

- [ ] **Step 2: Add viewport smoke loop if any gap remains**

If Task 1 didn’t already cover 768 for open+submit, append:

```ts
for (const width of [375, 768, 1280] as const) {
  test(`fluxo completo em ${width}px`, async ({ page }) => {
    await openCalculator(page, width);
    await expect(page.getByTestId("freedom-live-preview")).toBeVisible();
    await submitPanel(page);
    await expect(page.getByTestId("freedom-metrics-grid")).toBeVisible();
  });
}
```

Re-run suite until green.

- [ ] **Step 3: Lint + typecheck**

```bash
npm run check
```

Expected: exit 0

- [ ] **Step 4: Manual ad hoc motion check (optional but recommended)**

Use skill `refine-motion` with **user Playwright MCP only** (do not mix fallback): verify preview spring, hero collapse, InfoHint open/close on 375 and 1280.

- [ ] **Step 5: Final commit if polish landed**

```bash
git add components/screens/financial-independence-screen.tsx components/ui/info-hint.tsx tests/financial-independence.spec.ts
git commit -m "$(cat <<'EOF'
test: harden freedom panel responsiveness coverage

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Compact calculator / less clutter | 3 |
| Live preview ≈ R$/mês + anos vs CLT | 3 |
| Hide formula behind ⓘ | 2, 3, 5 |
| FOMO hero (anos + montante) | 4 |
| Desktop sticky hero, less top whitespace | 4 |
| Mobile collapse to compact bar | 4 |
| Dense metrics grid / wider `max-w-5xl` | 3, 5 |
| Premium toggle + upsell preserved | 4, 6 |
| yearsSaved === 0 copy | 3, 4 |
| Formulas unchanged | all (no calc edits) |
| Playwright 375/768/1280 | 1, 6 |
| lint before finish | 6 |

## Placeholder / consistency notes

- InfoHint ids used in tests and UI must match exactly: `calc-base`, `amount`, `race`, `equivalence`, `dreams`, `premium`
- Sticky top token: `chromeBelowDesktopNavStickyTop` (desktop nav present on this shell)
- Do not reintroduce footer “Cálculo base:” text
