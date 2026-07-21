---
name: refine-motion
description: >
  Guarantees smooth, request-faithful UI motion for Raparigator: choose CSS vs
  motion/react (lightness first, smoothness wins), scope-gate complex multi-step
  effects, then verify with step-by-step + controlled-chaos + cross-navigation
  (webapp-testing Playwright or browser MCP — whichever finds jank faster) before
  delivery. Use whenever creating, refactoring, or adjusting animations,
  transitions, AnimatePresence, scroll-linked motion, gestures, tab/page motion,
  FABs, indicators, or microinteractions with movement; also for stutter, lag,
  jank, trembling, flicker, hitching, or "animação quebrada" reports — even if
  the user never says skill, QA, or Playwright. Prefer this over improvising
  motion. Skip only for pure layout/color/copy with no movement component.
  Invoke explicitly with /refine-motion when the user wants this workflow on demand.
---

# Refine Motion

Deliver motion that matches the request and feels continuous. Rough or almost-right animation is a failed delivery. Smoothness and fidelity beat lightness when those conflict.

## Workflow

1. Decide if the effect is complex enough to need a scope gate.
2. Choose CSS vs `motion/react` (lightness first, smoothness wins ties).
3. Implement surgically; do not refactor unrelated motion.
4. Diff the result against the user's request before calling it done.
5. Verify with chaos + step-by-step + cross-navigation routes.
6. Fix anomalies and retest the same routes before final delivery.

Read `references/verification-playbook.md` when running verification.

## Scope gate

Stop and ask before coding when the effect has multiple stages, a timeline, composed gestures, coordinated enter/exit, or otherwise non-trivial orchestration.

Ask only what closes scope:

- Trigger (mount, hover, scroll, navigation, gesture)
- What enters/exits and in what order
- Intended feel (fast, premium, subtle) and approximate duration
- Whether `prefers-reduced-motion` should reduce or disable the effect
- Desktop vs mobile differences
- Must-have vs nice-to-have

Resume implementation only after the user closes scope or explicitly says to proceed with reasonable defaults.

Simple one-shot fades, hovers, short shakes, and single-property transitions do not need this gate.

## Technology choice

Order of preference:

1. **CSS / Tailwind / `@keyframes`** for hover, simple fade, shimmer, short shake, and non-orchestrated state changes.
2. **`motion/react`** for `AnimatePresence`, layout animation, springs, scroll/gesture, and multi-step orchestration.
3. Accept more complexity only when CSS cannot deliver the requested feel smoothly.

Project constraints:

- Import from `motion/react`, not `framer-motion`.
- Never install another animation library.
- Prefer transforming existing Motion usage over introducing parallel patterns.

Tie-breaker: if a lighter approach is almost right but stutters or fails fidelity, choose the approach that stays continuous and matches the request.

## Motion quality

Do not deliver stutter, hitching, perceptible lag, trembling, crackling, jumps, mount/unmount flicker, or obvious layout thrash.

Prefer:

- `transform` and `opacity` over animating layout-heavy properties
- Avoiding per-frame React re-renders; be careful with springs plus scroll handlers
- Coordinating tab/page transitions with the existing shell (`components/layout/tabs-keep-alive.tsx` and related keep-alive/nav motion)
- Honoring `prefers-reduced-motion` when the product context calls for it

Before final delivery, re-read the user request and the changed files side by side. If the code solves a different effect than requested, fix that first.

## Verification before delivery

Verification is part of the work, not optional polish.

Tool preference (pick the one that finds anomalies fastest for the current case):

1. Skill `webapp-testing` (Python Playwright helpers) when scripted interaction is the clearest path.
2. Cursor browser MCP when interactive visual inspection is faster.
3. Do not add npm Playwright or `@playwright/test` just to satisfy this skill.

Minimum routes:

1. **Faithful path** — execute the exact flow the user described.
2. **Controlled chaos** — scrolls and clicks with slightly irregular timing and positions to surface jank that linear happy paths hide.
3. **Cross-navigation** — leave to another page/tab, interact (scroll/click), return, repeat motion, and check that state and animation still behave (no stuck UI, no broken double-mount, no dead transitions).

On failure: fix → rerun the same routes → only then deliver.

## Relation to other skills

- `frontend-design` / `brand-guidelines` own visual identity; this skill owns movement behavior and motion QA.
- `webapp-testing` is a verification tool, not a substitute for smoothness criteria.
- `karpathy-guidelines` still applies: touch only what the motion task requires.

## Examples

**Example 1 — simple**

Input: Add a subtle fade when the premium badge appears on the ad card.

Approach: CSS/Tailwind opacity transition unless presence orchestration is required. Verify appear/disappear and a quick scroll past the card. No scope interview.

**Example 2 — complex**

Input: When switching tabs, the title should fly into the header while the feed content crossfades, then the bottom nav indicator catches up.

Approach: Scope gate first (order, timing, mobile vs desktop). Likely `motion/react` coordinated with keep-alive shell. Verify tab A→B→A with chaos scrolls between switches.

**Example 3 — bug**

Input: The contact FAB stutters when I scroll down and open chat then come back.

Approach: Reproduce with cross-navigation + irregular scroll. Prefer fixing render/subscription thrash or conflicting animations over adding heavier motion. Retest the same path after the fix.
