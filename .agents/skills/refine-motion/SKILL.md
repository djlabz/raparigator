---
name: refine-motion
description: >
  Guarantees smooth, request-faithful UI motion. Use CSS/Tailwind only for very
  simple effects that CSS can fully solve; otherwise prefer motion/react as the
  primary library; allow another animation lib only when Motion cannot solve the
  effect. Scope-gate complex multi-step effects, define hard invariants before
  tuning feel, implement with driver/display separation and hold-then-commit
  handoffs, then verify with Playwright (mandatory): prefer a connected,
  functional Playwright MCP when available; otherwise use the internal
  webapp-testing fallback under references/webapp-testing-fallback — unless the
  user explicitly requires that fallback. Announce which Playwright product was
  selected before verification. Cover step-by-step + controlled-chaos +
  cross-navigation before delivery. Use whenever creating, refactoring, or
  adjusting animations, transitions, AnimatePresence, scroll-linked motion,
  gestures, tab/page motion, FABs, indicators, or microinteractions with
  movement; also for stutter, lag, jank, trembling, flicker, hitching, or
  "animação quebrada" reports — even if the user never says skill, QA, or
  Playwright. Prefer this over improvising motion. Skip only for pure
  layout/color/copy with no movement component. Invoke explicitly with
  /refine-motion when the user wants this workflow on demand.
---

# Refine Motion

Deliver motion that matches the request and feels continuous. Rough or almost-right animation is a failed delivery. Smoothness and fidelity beat lightness when those conflict. Softness that breaks a hard invariant is also a failed delivery.

## Workflow

1. Decide if the effect is complex enough to need a scope gate.
2. Write hard invariants (what must never happen) before choosing curves.
3. Choose technology: CSS only if very simple and fully solvable in CSS; else `motion/react` as primary; another lib only if Motion cannot deliver.
4. Implement with driver/display separation, safe-band softness, and hold-then-commit handoffs when layers swap.
5. Implement surgically; do not refactor unrelated motion.
6. Diff the result against the user's request before calling it done.
7. Select the Playwright verification product (see below), announce it to the user, then verify with chaos + step-by-step + cross-navigation routes (plus partial-state and settle checks when exclusivity matters).
8. Fix anomalies and retest the same routes before final delivery.

Read `references/implementation-principles.md` before implementing non-trivial motion from scratch or refining an existing effect. Read `references/verification-playbook.md` when running verification.

## Scope gate

Stop and ask before coding when the effect has multiple stages, a timeline, composed gestures, coordinated enter/exit, or otherwise non-trivial orchestration.

Ask only what closes scope:

- Trigger (mount, hover, scroll, navigation, gesture)
- What enters/exits and in what order
- Intended feel (fast, premium, subtle) and approximate duration
- Whether `prefers-reduced-motion` should reduce or disable the effect
- Desktop vs mobile differences
- Must-have vs nice-to-have

Only when the effect has a real dependency or swap between elements/states, also close:

- Exclusivity: under which condition may the next state become visible
- Completion: at the user’s “done” moment, must motion already be finished
- Feel vs sync: if soft follow would show the wrong state, which rule wins (default: exclusivity wins)

Skip those questions for independent one-element effects (single fade, hover, spin, simple enter). Do not invent A/B dependencies the request does not have.

Resume implementation only after the user closes scope or explicitly says to proceed with reasonable defaults.

Simple one-shot fades, hovers, short shakes, and single-property transitions do not need this gate.

## Technology choice

Default to `motion/react` whenever the effect is more than trivially simple. CSS is the exception, not the baseline.

Use **CSS / Tailwind / `@keyframes` only when all of these are true**:

- The effect is very simple (e.g. hover color/opacity, one-shot fade, short shimmer, short shake)
- A single transition or keyframe fully delivers the request — no orchestration, no shared layout, no enter/exit coordination, no scroll/gesture-driven motion
- The result stays smooth and faithful without fighting React mount/unmount

Otherwise use **`motion/react` as the primary library** (presence, layout, springs, scroll/gesture, sequenced stages, anything that would need hacks or incomplete CSS). Prefer a correct Motion implementation over a fragile CSS workaround.

If CSS is “almost enough” but not complete or not smooth, switch to `motion/react`. Smoothness and fidelity beat forcing CSS for lightness.

Only when `motion/react` clearly cannot deliver the requested effect smoothly and faithfully may another animation library be introduced. Treat that as exceptional: keep `motion/react` as the default stack for all other motion in the app, justify why Motion is insufficient, prefer the smallest dependency that solves the gap, and do not proliferate multiple competing animation libs for similar problems.

Project constraints:

- Prefer imports from `motion/react` for new and refactored motion work.
- Do not replace Motion project-wide with another lib; a secondary lib is a last resort for a specific effect Motion cannot solve.
- Prefer extending existing Motion usage over inventing a parallel pattern when Motion can do the job.

## Motion quality

Do not deliver stutter, hitching, perceptible lag, trembling, crackling, jumps, mount/unmount flicker, or obvious layout thrash.

Prefer:

- `transform` and `opacity` over animating layout-heavy properties
- Avoiding per-frame React re-renders; be careful with springs plus scroll handlers
- Coordinating tab/page transitions with the existing shell (`components/layout/tabs-keep-alive.tsx` and related keep-alive/nav motion)
- Honoring `prefers-reduced-motion` when the product context calls for it

### Implementation principles (any effect)

Apply what fits the request. Not every effect has layered swaps.

1. **Invariants before feel** — list only the hard rules this effect actually needs (may be just “no jank / no settle jump”; exclusivity only if elements depend on each other)
2. **Driver vs display** — when progress is driven by scroll/gesture/time, smooth the shown value; do not combine live moving geometry with lagged progress without clamps
3. **Safe-band softness** — damp/ease without breaking those rules
4. **Hold-then-commit handoffs** — only when one layer yields to another; skip for single-element motion
5. **Stable measurement** — if size/fit depends on space, measure settled targets, not mid-flight size
6. **One job per channel** — transforms, opacity, and document-flow collapse must not yank each other
7. **Regression after feel tweaks** — re-check the rules that apply to this effect

Details and build sequence: `references/implementation-principles.md`.

Before final delivery, re-read the user request and the changed files side by side. If the code solves a different effect than requested, fix that first.

## Verification before delivery

Verification is part of the work, not optional polish. **Playwright is mandatory** on every refine-motion run: use it to inspect, validate, and mitigate motion issues for the effect being created or adjusted. Skipping Playwright verification is a failed delivery.

`refine-motion` is the only public entry point for this verification. There is no standalone `webapp-testing` skill in the catalog. The Python helpers live only at `references/webapp-testing-fallback/` and must be loaded exclusively through the selection rules below.

### Playwright product selection

Resolve the verification product autonomously at the start of verification (or earlier if the task will clearly need browser interaction). Do not ask the user which product to use unless both paths are blocked.

Selection rules, in order:

1. **User override** — if the user prompt/command explicitly requires the Python fallback (e.g. “use webapp-testing”, “via fallback Python”, “não use o MCP”), use `references/webapp-testing-fallback` even when a Playwright MCP is available.
2. **Playwright MCP preferred** — otherwise, inspect whether a Playwright MCP server is connected and functional in the current session (server present, status usable — not `needsAuth` / `error` / `loading` — and its tools discoverable/callable for navigation, interaction, and inspection). When that check passes, use the Playwright MCP tools and do **not** open `references/webapp-testing-fallback` for this run.
3. **Fallback** — if no Playwright MCP is connected and functional, read `references/webapp-testing-fallback/FALLBACK.md` and use its Python Playwright helpers only.

### Session exclusivity (mandatory)

After the product is chosen, treat the other path as **forbidden for this run**:

- If MCP is selected: do not read `references/webapp-testing-fallback/`, do not write Python Playwright scripts, do not invoke those helpers.
- If fallback is selected: do not call Playwright MCP `browser_*` tools, even if they still appear in the tool list.
- Only switch products if the chosen path becomes unusable mid-run — announce the switch first, then continue remaining routes on the new product only.

Do not add npm Playwright or `@playwright/test` just to satisfy this skill. Do not use Cursor browser MCP / non-Playwright browser tooling as a substitute for the mandatory Playwright path above.

### Announce the chosen product

Before the first verification action, tell the user which product will be used, in a short formal line. Examples:

- `Verificação Playwright: utilizando o MCP do Playwright.`
- `Verificação Playwright: utilizando o fallback Python (MCP do Playwright indisponível).`
- `Verificação Playwright: utilizando o fallback Python (override solicitado no prompt).`

### Minimum routes

1. **Faithful path** — execute the exact flow the user described.
2. **Controlled chaos** — scrolls and clicks with slightly irregular timing and positions to surface jank that linear happy paths hide.
3. **Cross-navigation** — leave to another page/tab, interact (scroll/click), return, repeat motion, and check that state and animation still behave (no stuck UI, no broken double-mount, no dead transitions).

When exclusivity or layered handoffs matter, also:

4. **Partial-state probe** — pause mid-effect; assert the invariant for that slice.
5. **Settle probe** — stop abruptly; wait briefly; nothing should refit or jump.

On failure: fix → rerun the same routes with the same Playwright product → only then deliver.

Details: `references/verification-playbook.md`.

## Relation to other skills

- `frontend-design` / `brand-guidelines` own visual identity; this skill owns movement behavior and motion QA.
- Playwright MCP (when available) or `references/webapp-testing-fallback` (fallback / user override) is the mandatory verification substrate; neither replaces smoothness criteria.
- `karpathy-guidelines` still applies: touch only what the motion task requires.

## Examples

**Example 1 — simple**

Input: Add a subtle fade when the premium badge appears on the ad card.

Approach: CSS only if a simple opacity transition fully covers appear/disappear; if mount timing or presence matters, use `motion/react`. Select Playwright product, announce it, then verify appear/disappear and a quick scroll past the card. No scope interview.

**Example 2 — complex**

Input: When switching tabs, the title should fly into the header while the feed content crossfades, then the bottom nav indicator catches up.

Approach: Scope gate first (order, timing, mobile vs desktop, exclusivity/completion). Likely `motion/react` coordinated with keep-alive shell. Implement driver/display separation and hold-then-commit handoffs. Announce Playwright product, then verify tab A→B→A with chaos scrolls between switches.

**Example 3 — bug**

Input: The contact FAB stutters when I scroll down and open chat then come back.

Approach: Announce Playwright product. Reproduce with cross-navigation + irregular scroll. Prefer fixing render/subscription thrash or conflicting animations over adding heavier motion. Retest the same path after the fix.

**Example 4 — product selection**

Input: Refine the tab indicator spring. (Playwright MCP connected and healthy.)

Approach: Announce `Verificação Playwright: utilizando o MCP do Playwright.` Run routes via MCP tools. Do not open `references/webapp-testing-fallback`.

Input: Refine the tab indicator spring. Use webapp-testing for QA.

Approach: Honor override. Announce `Verificação Playwright: utilizando o fallback Python (override solicitado no prompt).` Read `references/webapp-testing-fallback/FALLBACK.md` and ignore MCP even if available.
