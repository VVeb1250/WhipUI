# WhipUI pilot P1: pre-registration

Status: **DRAFT until the owner edits/approves it.** Once approved, freeze it: its SHA-256 (first 12 hex)
is written into every run and judgment row. Any change after the first run means a new pilot ID.

## Question

Does WhipUI add value over a **strong, realistic baseline** (Claude Code with its normal tools
and whatever design skill the user already has, e.g. `frontend-design`) at an acceptable cost?
And is it at least **not worse** on first-shot visual quality (non-inferiority, decision D10)?

## Arms

| Arm | Configuration | Question it answers |
|---|---|---|
| A | host default + same "you may verify in a browser" sentence | how good is the baseline? |
| B | A + the brief's reference list | are references most of the gain? |
| C | B + WhipUI skill invoked explicitly (`/whipui:whipui`) | does the skill add value beyond refs? |
| Cp | B + WhipUI AGENTS snippet always-on (no skill) | is a compact index as good as the skill? |
| D | C + owner's pre-registered answer sheet (elicitation) | is the full collaborative loop worth it? |
| Aa | A + the same answer sheet | separates the value of *asking* from the rest of WhipUI |

Held equal across arms: model and version (`--model`, recorded), effort/defaults, tools and
permissions, seeded repo, viewport set, `--max-turns 60`, 25-minute wall clock cap, one seed per
arm per brief (plus a second seed of A and C on two briefs for within-arm variance).
Reference sets are identical for B, C, Cp, D. Known asymmetry: D sees the owner's answers. It is
reported, and Aa isolates it.

## Briefs

`eval/briefs/B1–B8` cover CREATE (sparse + detailed), DESIGN_ONLY, REFERENCE_ADAPT, REPRODUCE,
EXTEND, REPAIR (seeded defects; key hidden in `seeds/B7.PLANTED.md`) and MOTION.
**Threat to validity:** the briefs were drafted by the agent that built WhipUI. The owner should
edit or replace them before freezing.

## Outcomes

Primary (human, blinded): owner pairwise preference per contrast (B-A, C-B, C-A, D-A; Cp-C if run).
For B5, the judgment is fidelity ("closer to the target"); for B8, recordings, not stills.
Secondary: Phase-2 rounds and owner minutes to approval (review page, ≤3 rounds); render-check
errors; B7 planted defects fixed / regressions / out-of-scope changes; B5 block recall
(`ref-capture compare`); reduced-motion compliance (B8).
Cost: tokens, $, wall time, turns per run (`runs.csv`).
Diagnostic: fixture audit (repetition across briefs), WhipUI invocation rate, questions asked.
AI judges: optional, order-swapped, **diagnostic only**, never primary.

## Blinding

Random output IDs; the key (`KEY-do-not-open-before-judging.json`) and pair→contrast map
(`judging-key.json`) stay closed until judging is done. Left/right randomized. 6 retest pairs
with sides swapped are mixed in.

## Analysis (fixed)

`node eval/analyze.mjs --pilot P1`: per contrast win rate (ties excluded) with 95% Wilson CI,
exact two-sided sign test, brief-clustered bootstrap CI; Bradley–Terry (descriptive); retest
consistency; cost ratios vs A.

## Decision thresholds (practical, fixed before data)

- **Non-inferiority defect:** C-A (or D-A) owner win rate < 40% → WhipUI makes first-shot output worse: fix before anything else.
- **Shrink/redirect:** win ≤ 60% and cost ≥ 1.5× A, or B-A carries most of the C-A margin.
- **Promising:** win ≥ 75% with no regressions in secondary outcomes and Phase-2 owner minutes ≤ A's. Then replicate with new briefs; don't claim superiority yet.
- **Between thresholds:** next step is 6–8 new briefs, not re-judging.
- **Fixture contamination:** repeated fonts/accents/skeletons across ≥60% of unrelated briefs in one arm → investigate.
- **Retest consistency ≤ 4/6:** close contrasts count as noise.

## Stopping rule

Fixed sample: all planned briefs × arms, analyzed once. Reruns only for infrastructure failures
(logged). Never stop early because an arm "looks like it's winning".

## Power statement (copy into the report)

With about 8 decisive judgments per contrast, this pilot can only flag very large effects
(near-unanimous preference). Pooled to about 20–30 judgments, it detects a true 80% preference with
≈0.8 power and a 70% preference with ≈0.4–0.6 power. A null result does not show equivalence; a
positive result is preliminary.
