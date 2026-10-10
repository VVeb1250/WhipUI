# Pilot P1 (mini): A vs C on 3 briefs. AI-side results

Date 2026-10-10 · Claude Code 2.1.295 headless · `--model sonnet` (claude-sonnet-5-5) for both arms ·
max 60 turns, 25-minute cap · one seed per arm · pre-registration hash `315fee5462c0` (draft; briefs written by the builder: a threat to validity).
Arms: **A** = Claude Code + installed `frontend-design` skill + "you may verify in a browser"; **C** = A + WhipUI invoked explicitly.

**Status: human preference NOT yet judged.** Everything below is objective/technical. It says nothing
about which output the owner prefers. That is `judging.html` → `judgments.csv` → `analyze.mjs`.

## Cost (from Claude Code's own usage report)

| Brief | A $ / turns / s | C $ / turns / s |
|---|---|---|
| B1 sparse landing | 0.24 / 8 / 84 | 0.37 / 20 / 155 |
| B7 repair | 0.13 / 4 / 29 | 0.18 / 9 / 85 |
| B8 motion | 0.17 / 7 / 171 | 0.16 / 6 / 61 |
| **Median ratio C/A** | | **1.06× $** (total 1.32×; median input+cache tokens +53%) |

The historical ~2.34× cost of earlier WhipUI packs did not recur here. With n=3 this is an observation, not an estimate.

## Objective outcomes (re-checked by the builder with the fixed tools, pages served over http)

- **B1:** A shipped 1 measured error (axe colour-contrast on `.btn-small`); C 0 errors. C rendered, looked at its screenshots and adjusted; its keyboard-demo test did not run (see bug 2), and it said so. A did not take screenshots.
- **B7 (5 planted defects):** both arms fixed **5/5**. After fixes, standard-tier render-check: A 3 warnings (including the KPI value "฿1,284,900" spilling 19 px out of its card at 375 px, an unplanted real defect, plus a missing landmark); C **0**. C fixed the KPI overflow by reducing the value size on narrow screens. Pixel change vs the seed: A ≈0%, C 2.5–4.7%. On inspection, C's change is the KPI fix plus content reflowing up, not a redesign. **Lesson:** pixel diff can't judge "out-of-scope change" when a fix changes heights; that needs region-level or human review.
- **B8 motion:** both pass the technical probe in both motion modes (transform/opacity only, sequence ≤ ~0.6 s, nothing missing under reduced motion). Under reduced motion A switches to instant changes, while C replaces movement with short fades (closer to WhipUI's "replace, don't just disable" guidance). Whether either *feels* better is for the owner (videos in the judging page).

## Field bugs found in WhipUI by this pilot (all fixed and covered by tests)

1. **Outputs went to an unrelated ancestor `.whipui/`** and were printed as long relative paths; the C agent failed to open its screenshots twice. Fixed: `.whipui` is adopted only if it holds `state.json` and lies within the project root; all paths are printed absolute; render-check lists the exact PNGs to open.
2. **Hand-written Playwright import crashed** (wrong path) in C, so the keyboard test never ran. Fixed: new `interact.mjs` gives a ready `page` plus `check()`/`shot()`; SKILL.md points to it.
3. **Environment noise reported as page errors:** blocked Google Fonts (sandbox proxy) and `file://` fetch limits. Fixed: classified as `kind: environment`; the pilot harness now serves pages over http.
4. **motion-probe false positives:** (a) frame gaps caused by the probe's own screenshots and video recording; (b) 0 ms animations flagged as residual motion; (c) duration-only reduced-motion changes reported as "ignored". Fixed; a real 300 ms main-thread block is still detected (regression fixture).
5. **Judging page leaked arm names** through embedded file paths. Caught by the leak check before sending. Fixed.

## What this pilot can and cannot say

- Can: the harness works end to end. WhipUI loads, routes and runs its tools in headless Claude Code. Its overhead on these 3 tasks was modest. It produced fewer measured defects on B1/B7. The pilot surfaced 5 real tool bugs.
- Cannot: whether WhipUI's outputs are *preferred* (no human judgments yet), or any statistical claim (n=3 pairs, one seed, Sonnet only, builder-written briefs). Non-inferiority (D10) is untested until the owner judges.
