# Verification playbook

Use this after implementing or fixing motion. Goal: force anomalies to appear before the user finds them.

## Setup

- Prefer an already-running `npm run dev` on port 3000.
- If using `webapp-testing`, run script `--help` first and treat bundled helpers as black boxes.
- If using browser MCP: navigate → lock → interact → screenshot/snapshot → unlock when fully done.
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

- Any anomaly → fix code, then rerun A/B/C (and D if used) before delivery.
- Softness that breaks an exclusivity or completion invariant is a failure even if the curve “feels nicer.”
- If tooling cannot reach the screen (auth, missing server), say what blocked verification and what was checked instead. Do not pretend chaos QA ran.
