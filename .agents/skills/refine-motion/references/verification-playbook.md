# Verification playbook

Use this after implementing or fixing motion. Goal: force anomalies to appear before the user finds them.

Playwright verification is mandatory on every refine-motion run. Choose the product first, announce it, then execute the routes with that product only.

There is no standalone `webapp-testing` skill. Python helpers live only under `references/webapp-testing-fallback/` and are loaded only when selected below.

## Playwright product selection

Resolve autonomously before the first browser action:

1. **User override** — if the prompt/command explicitly requires the Python fallback (e.g. “use webapp-testing”, “via fallback Python”, “não use o MCP”), use `references/webapp-testing-fallback` even when a Playwright MCP is available.
2. **Playwright MCP preferred** — otherwise probe the current session for a Playwright MCP that is connected and functional:
   - Server is present and status is usable (not `needsAuth`, `error`, or `loading`)
   - Tools are discoverable and cover navigation, interaction, and inspection needed for the routes below
   - When this check passes, use the MCP tools for the entire verification pass; do not open the fallback mid-run unless the MCP becomes unusable
3. **Fallback** — if no Playwright MCP is connected and functional, read `references/webapp-testing-fallback/FALLBACK.md` and use its Python Playwright helpers only

### Session exclusivity (mandatory)

After the product is chosen, treat the other path as forbidden for this run:

- MCP selected → do not read `references/webapp-testing-fallback/`, do not write Python Playwright scripts
- Fallback selected → do not call Playwright MCP `browser_*` tools, even if listed
- Switch products only if the chosen path breaks mid-run; announce first, then finish remaining routes on the new product only

Do not install npm Playwright / `@playwright/test` to satisfy this skill. Do not substitute non-Playwright browser MCP tooling for the paths above.

### Announcement (required)

Before the first verification action, send the user one short formal line naming the product, for example:

- `Verificação Playwright: utilizando o MCP do Playwright.`
- `Verificação Playwright: utilizando o fallback Python (MCP do Playwright indisponível).`
- `Verificação Playwright: utilizando o fallback Python (override solicitado no prompt).`

## Setup

- Prefer an already-running `npm run dev` on port 3000.
- If using Playwright MCP: discover tool schemas first, then navigate → interact → screenshot/snapshot as the MCP exposes; keep the session consistent across routes A–D.
- If using the Python fallback: read `references/webapp-testing-fallback/FALLBACK.md`, run script `--help` first, and treat bundled helpers as black boxes. Invoke helpers via `.agents/skills/refine-motion/references/webapp-testing-fallback/scripts/…`.
- Wait for the UI to be interactive (`networkidle` or equivalent) before judging motion.

## Route A — Faithful path

1. Restate the user's success criteria in one sentence.
2. Perform only the steps they described, in order.
3. Watch for: wrong timing, missing enter/exit, wrong element moving, effect not matching the ask.

## Route B — Controlled chaos

On the same screen as the effect:

1. Scroll in uneven bursts (short, long, reverse) instead of one smooth gesture.
2. Click/tap near targets with small offsets when safe (not destructive actions).
3. Interrupt mid-animation when possible (navigate away, open modal, switch tab).
4. Repeat 2–3 times. Jank often shows on the second or third pass.

Look for stutter, tremor, lag spikes, layout jumps, and opacity flicker.

## Route C — Cross-navigation

Typical Raparigator shell path:

1. Trigger the motion on the starting screen.
2. Go to another tab or route (feed ↔ chat ↔ panel, or public ad → back).
3. Scroll and click there briefly.
4. Return to the start.
5. Trigger the motion again and compare to the first run.

Pass only if state and animation still behave: no stuck FAB/overlay, no dead transition, no duplicated layered UI, no animation that only worked on first mount.

## Route D — Partial state and settle (only when relevant)

Use when the effect has exclusivity, layered handoffs, or layout/fit that can settle late. Skip for simple independent fades/hovers/spins.

1. Pause mid-gesture / mid-scroll / mid-timeline and assert the invariant that applies in that slice (wrong layer must not already be active).
2. Stop abruptly; wait ~300–500ms; position, size, and copy must not visibly resettle.
3. Reverse direction mid-effect; no stuck outgoing layer and no double-mounted UI.

## Decision after runs

- Any anomaly → fix code, then rerun A/B/C (and D if used) with the same Playwright product before delivery.
- Softness that breaks an exclusivity or completion invariant is a failure even if the curve “feels nicer.”
- If tooling cannot reach the screen (auth, missing server, MCP disconnected mid-run), say what blocked verification and what was checked instead. Do not pretend chaos QA ran.
- If Playwright MCP was selected but becomes unusable mid-run, announce the fallback to Python helpers before continuing, then finish the remaining routes there only.
