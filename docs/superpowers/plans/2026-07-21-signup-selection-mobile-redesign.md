# Signup Selection Mobile Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the mobile signup selection screen in two independent branches — `feature/signup-selection-mobile-A` (cards lado a lado + background image) and `feature/signup-selection-mobile-C` (full-screen snap scroll com imagem de fundo).

**Architecture:** Single component `SignupSelectionScreen` (`components/screens/signup-selection-screen.tsx`) with responsive Tailwind classes. Desktop (`md:`) unchanged. Mobile (`< md:`) gets new layout via conditional classes. Each branch modifies only this file.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, next/image, Lucide React

**Global Constraints:**
- No external API calls — use mocks only
- No new types outside `lib/types.ts`
- No new icon or animation libraries (Lucide + Motion only)
- UI text in PT-BR
- No code comments
- Desktop (≥768px) must remain pixel-identical to current
- Run `npm run lint` and `npm run build` before every commit
- All commits: conventional format (`feat:`, `style:`, etc.)

---

## Phase 1: Branch A — Cards lado a lado + background image

### Task A1: Create feature branch

- [ ] **Step 1: Create branch from main**

```bash
git checkout main
git pull origin main
git checkout -b feature/signup-selection-mobile-A
```

### Task A2: Modify mobile layout — background image + horizontal cards

**File:** `components/screens/signup-selection-screen.tsx`

- [ ] **Step 1: Show the image on mobile as background**

Move the image section out of `hidden md:block` — make it visible on mobile but as a background overlay of the form section instead of a standalone column.

Change the wrapper structure: remove the two-column grid on mobile, keep it only on desktop. The image becomes a decorative background inside the form section.

Replace the outer structure:

**Before:**
```tsx
<div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
  <section className="hidden h-screen bg-black md:sticky md:top-0 md:block">
    ...image section...
  </section>
  <section className="px-4 py-10 sm:px-6 md:flex md:min-h-screen md:items-center md:justify-center md:px-10">
    ...form section...
  </section>
</div>
```

**After:**
```tsx
<div className="min-h-screen bg-zinc-50 md:grid md:grid-cols-2 md:items-start">
  <section className="hidden h-screen bg-black md:sticky md:top-0 md:block">
    ...image section (unchanged)...
  </section>
  <section className="relative px-4 py-10 sm:px-6 md:flex md:min-h-screen md:items-center md:justify-center md:px-10">
    {/* Mobile background image */}
    <div className="absolute inset-0 overflow-hidden md:hidden">
      <Image
        src="/images/personas/persona3/persona3-selection-hero.png"
        alt=""
        fill
        className="object-cover opacity-15"
        sizes="100vw"
        aria-hidden
      />
      <div className="absolute inset-0 bg-linear-to-b from-white/90 via-white/70 to-white/90" />
    </div>
    ...form section content (with relative z-10 on the inner wrapper)...
  </section>
</div>
```

- [ ] **Step 2: Wrap form content in a relative container**

Wrap everything inside the right section (BackButton, header, cards, footer) in:
```tsx
<div className="relative z-10">
  ...existing content...
</div>
```

- [ ] **Step 3: Restructure cards grid for mobile**

Change the card grid from `grid gap-6 md:grid-cols-2` to use `grid-cols-2` by default with a `max-w-xs` constraint and reduced gap:

```tsx
<div className="mx-auto w-full max-w-xs space-y-6">
  {/* header remains the same */}

  {/* Cards - lado a lado no mobile, ainda lado a lado no desktop */}
  <div className="grid grid-cols-2 gap-3 md:gap-6">
    {/* Card Cliente */}
    <Link
      href="/auth/cadastro/cliente"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-wine-300 hover:shadow-xl hover:shadow-wine-900/10 md:p-8"
    >
      <div className="mb-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 transition-colors duration-500 group-hover:bg-wine-50 group-hover:text-wine-700 md:mb-8 md:h-14 md:w-14">
        <User size={20} strokeWidth={1.5} className="md:size-7" />
      </div>
      <h3 className="mb-1 text-sm font-bold text-zinc-900 transition-colors group-hover:text-wine-800 md:mb-4 md:text-xl">Acessar a Plataforma</h3>
      {/* Description hidden on mobile */}
      <p className="mb-10 hidden flex-grow text-sm leading-relaxed text-zinc-600 md:block">
        Tenha acesso a perfis verificados e uma curadoria de elite com total discrição e segurança. Explore um universo de possibilidades.
      </p>
      <div className="mt-auto flex items-center text-[9px] font-black uppercase tracking-widest text-wine-700 md:text-[10px]">
        <span>Iniciar</span>
        <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1 md:ml-2 md:h-4 md:w-4" />
      </div>
    </Link>

    {/* Card Profissional — same pattern */}
    ...
  </div>

  {/* footer remains the same */}
</div>
```

Update the header title for mobile to be more compact (optional — maybe keep as is):

Keep header as-is since it collapses fine.

- [ ] **Step 4: Add cardmin-height for visual balance**

On each card link, add `min-h-[180px] md:min-h-0` so mobile cards don't collapse too much.

- [ ] **Step 5: Verify build**

```bash
npm run lint
if ($?) { npm run build }
```

- [ ] **Step 6: Commit**

```bash
git add components/screens/signup-selection-screen.tsx
git commit -m "feat: mobile signup selection with side-by-side cards and background image"
```

---

## Phase 2: Branch C — Full-screen snap scroll

### Task C1: Create feature branch

- [ ] **Step 1: Return to main and branch**

```bash
git checkout main
git checkout -b feature/signup-selection-mobile-C
```

### Task C2: Modify mobile layout — snap scroll slides

**File:** `components/screens/signup-selection-screen.tsx`

- [ ] **Step 1: Replace mobile form section with snap container**

On mobile (`< md:`), replace the form section's content with a scroll-snap container. Desktop stays identical.

**Approach:** Use a conditional wrapper. The outer structure stays the same (`md:grid`), but inside the right section we branch on mobile vs desktop.

Wrap the whole right section content in a conditional:

```tsx
<section className="relative px-4 py-10 sm:px-6 md:flex md:min-h-screen md:items-center md:justify-center md:px-10">
  {/* Mobile: snap scroll */}
  <div className="flex min-h-[calc(100vh-5rem)] flex-col overflow-y-auto snap-y snap-mandatory md:hidden">
    {/* Slide 1 — Cliente */}
    <section className="relative flex min-h-[calc(100vh-5rem)] snap-start flex-col items-center justify-center px-6 py-16">
      <Image
        src="/images/personas/persona3/persona3-selection-hero.png"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/80" />
      <div className="relative z-10 flex flex-col items-center text-center text-white">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
          <User size={32} strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight">Quero acessar<br />a plataforma</h2>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
          Perfis verificados e curadoria de elite com discrição e segurança.
        </p>
        <Link
          href="/auth/cadastro/cliente"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-zinc-900 shadow-lg transition-transform active:scale-95"
        >
          Iniciar Experiência
          <ArrowRight size={16} />
        </Link>
      </div>
      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest">
          <span>Deslize</span>
          <ChevronDown size={16} />
        </div>
      </div>
    </section>

    {/* Slide 2 — Profissional */}
    <section className="relative flex min-h-[calc(100vh-5rem)] snap-start flex-col items-center justify-center px-6 py-16">
      <Image
        src="/images/personas/persona3/persona3-selection-hero.png"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
        aria-hidden
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/80" />
      <div className="relative z-10 flex flex-col items-center text-center text-white">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
          <Sparkles size={32} strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight">Quero anunciar<br />meu perfil</h2>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
          Apresente seu perfil na plataforma mais exclusiva do mercado.
        </p>
        <Link
          href="/auth/cadastro/profissional"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-zinc-900 shadow-lg transition-transform active:scale-95"
        >
          Candidatar-se
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  </div>

  {/* Desktop: unchanged */}
  <div className="mx-auto hidden w-full max-w-xl space-y-6 md:block">
    ...existing desktop content exactly as current code...
  </div>
</section>
```

- [ ] **Step 2: Import ChevronDown**

Add `ChevronDown` to the Lucide import:
```tsx
import { User, Sparkles, ArrowRight, ChevronDown } from "lucide-react";
```

- [ ] **Step 3: Add scroll-snap styles to globals.css if not already available**

Check if Tailwind v4 has scroll-snap utilities. If not, add a custom CSS:

Add to `app/globals.css`:
```css
.snap-y {
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}
.snap-start {
  scroll-snap-align: start;
}
```

But Tailwind v4 should support `snap-y`, `snap-mandatory`, `snap-start`, `scroll-snap-align`, `scroll-snap-type` out of the box in v4. Let me check — Tailwind v3.3+ has these. Tailwind v4 definitely has them. So no globals.css change needed.

If any of these classes don't produce the desired behavior (e.g., `scroll-snap-type: y mandatory` conflicts with touch scroll), fall back to:
```css
scroll-snap-stop: always;
```

- [ ] **Step 4: Verify build**

```bash
npm run lint
if ($?) { npm run build }
```

- [ ] **Step 5: Commit**

```bash
git add components/screens/signup-selection-screen.tsx
git commit -m "feat: mobile signup selection with full-screen snap scroll"
```

---

## Verification (both branches)

After each branch is committed, verify visually on:
- 375×667 (iPhone SE) — no cutoff, no overflow
- 390×844 (iPhone 14) — looks balanced
- Desktop ≥768px — pixel-identical to current main

If on desktop the mobile styles leak, double-check that all mobile wrappers use `md:hidden` / `hidden md:block` correctly to separate the two layouts.
