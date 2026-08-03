# Implementation principles for refined motion

Portable rules for building smooth, unbroken motion from scratch — any screen, any product. Use these before tuning curves or “making it feel nicer.”

## 1. Invariants before feel

Write hard pass/fail rules first — but only rules that belong to **this** effect. Do not invent dependencies the request does not have.

Common invariant types (use only if relevant):

- **State exclusivity** — only when two states/layers must not overlap (B must not appear while A is still true). Skip for independent single-element motion.
- **Completion** — only when the user cares that motion is finished at a specific moment
- **No leak** — only when one layer yields to another
- **No secondary settle** — useful whenever size/position/fit can change after interaction stops
- **No jank** — always relevant: no bounce, stutter, hitch, or fight between channels

Feel (soft, fast, premium) is tuned only inside bands that keep the applicable invariants true. If softness breaks a real invariant, the invariant wins unless the user explicitly overrides it.

## 2. Separate driver from display

Many breaks come from mixing two clocks:

- **Driver** — authoritative progress (scroll position, gesture, route phase, clock)
- **Display** — smoothed value shown on screen (damping, spring, eased follow)

Safe pattern:

- Compute the driver target every frame from stable anchors
- Smooth only the display channel
- Never feed a lagged display value back into geometry that also depends on a live moving rect without a clamp

Unsafe pattern:

- Interpolate position between a live moving source and a fixed destination using lagged progress → overshoot, bounce, reverse hitch on fast input

When interpolating from a moving source toward a dock/target, clamp so the displayed pose cannot cross past the destination when the source has already passed it.

## 3. Softness lives in a safe band

To get light / delicate motion without breakage:

- Widen the driver band so progress changes over enough distance or time
- Use moderate exponential damping or a gentle spring — not undamped snap unless the ask is mechanical
- Prefer balanced easings (`easeInOut*`, `smootherstep`) for luxury follow; avoid stacking aggressive ease-outs on short bands (looks rushed then dead)
- Fade scroll/gesture introduction over the first units of input when a hard cliff at zero causes a pop

Do not “soften” by starting the next state early if that violates exclusivity.

## 4. Layered handoffs: hold, then commit

Skip this entire section when the effect is a single independent element with no swap.

When one element yields to another (chrome, labels, panels, steps):

1. Hold the outgoing layer fully opaque/stable until the incoming layer has a clear claim
2. Exit with a short, decisive motion (`transform` + opacity), preferably the same vocabulary as the rest of the effect (push, slide, scale)
3. Clip with overflow when exiting off a slot so leftovers cannot stain content underneath
4. Drop pointer events on the outgoing layer once it has exited
5. Keep opacity and translate windows aligned — opacity finishing while position is still sliding reads as unfinished

Long linear fades across the whole driver range usually look like a leak, not a refined exit.

## 5. Measure against stable geometry

If size, font, or layout depends on available space:

- Measure the destination / settled container, not an in-flight width or height
- Prefer immediate or same-frame measurement once the stable size is known
- Avoid debounced refit that visibly settles after the user stops interacting
- Precompute both sides of a swap when two labels/layouts share the same slot

## 6. One responsibility per channel

Keep channels from fighting:

- Position/scale → `transform`
- Visibility → `opacity` (or presence), not layout thrash
- Document flow collapse → separate, slower, or snapped so it does not yank the flight geometry mid-path
- Avoid per-frame React state for the hot path; prefer motion values / rAF-written values

## 7. Surgical refinement

When adjusting an existing effect:

- Touch only the motion path required
- Do not “improve” unrelated transitions in the same pass
- After each feel-only change, re-run the invariant checks and the verification routes that proved the previous version

A prettier curve that regresses a fixed bug is a failed delivery.

## 8. Build sequence (from zero)

1. Scope gate — trigger, order, feel, reduced motion, breakpoints, must-haves
2. List invariants in one sentence each
3. Choose tech (CSS only if trivially sufficient; else primary motion library)
4. Implement driver + display separation with clamps
5. Implement handoffs as hold-then-commit
6. Soften inside the safe band
7. Verify faithful path → chaos → leave/return (and partial-state probes when exclusivity matters)
8. Diff against the request; fix mismatches before polish

## 9. Verification extras (any effect)

Beyond the main playbook:

- **Partial states** — pause mid-gesture / mid-scroll; assert the invariant that applies in that slice
- **Settle** — stop abruptly; wait briefly; nothing should reflow or refit
- **Interrupt** — reverse direction mid-effect; no stuck layers, no double mount
- **Context switch** — leave the screen, return; effect still owns a single coherent state
