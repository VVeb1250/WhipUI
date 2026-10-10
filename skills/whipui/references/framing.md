# Framing → testable criteria

Load when the goal is vague, the audience or primary task is unknown, the request is
"improve conversion/usability", or the task is DIAGNOSE. Goal: turn a one-line `/goal`
into a short brief and 3–7 criteria you can actually check. Infer, state, continue: don't
interview.

## 1. Five-line brief (infer first, ask only for what you can't infer)

1. **Who** (primary user, context of use, device): "first-time visitor on mobile from a game trailer".
2. **Trigger situation → job → outcome** (job story): *When [situation], I want to [motivation], so I can [outcome].*
3. **Primary task on this screen** (one). Secondary tasks listed, ranked.
4. **Success signal**: what the user or owner would observe if it worked (sign-up, finding the price in one look, finishing the form without errors).
5. **Cost of failure**: what goes wrong if the design misses (lost trust, wrong data entered, legal exposure).

Ask (one batched question) only when a wrong guess changes the structure: unknown audience
on a multi-purpose page, unknown primary task, or a regulated domain. Otherwise write your
inference into the brief (`state.mjs brief --set …`) and continue.

## 2. Goals → signals → criteria (HEART-style, scaled down)

For each goal, name an observable signal, then a check. Tag every criterion by **who can verify it**:

| Tier | Meaning | Examples |
|---|---|---|
| `machine` | a script can pass/fail it on the render | no horizontal scroll at 320 px; primary CTA in first viewport at 390×844 and 1440×900; every input has a visible label; each data region has distinct loading/empty/error states; axe: 0 serious; reduced motion leaves no spatial animation |
| `advisory` | you can judge it, with stated confidence | headings carry information; error messages say how to fix; empty state offers a next action; copy matches the user's vocabulary |
| `human` | needs the owner or end users | the direction feels like *their* brand; users find X on first click; the dense layout is acceptable to daily operators |

Write 3–7 criteria, not 20. A criterion nobody can check is a wish; rewrite or drop it.

## 3. Field and step justification (forms, onboarding, checkout)

For every field or step, answer: why is it needed, what happens with the answer, who
provides it, how it is checked, can it be deferred? (GOV.UK question protocol.) Delete or
defer anything without an answer. Steps cost by the *work they ask for*, not their count.

## 4. When expert review is enough vs. when to test with people

| Question | Cheapest valid method | Notes |
|---|---|---|
| Is anything broken/inaccessible? | render-check + manual keyboard pass | Machine tier. Automated a11y covers a minority of WCAG. |
| Will people find X? | first-click test (image) or tree test | Correct first click strongly predicts task success; tree tests need many participants for comparisons. |
| Which of two directions does *this client* prefer? | paired comparison, neutral labels | That's taste: the owner decides. |
| Is the flow usable? | 5-user moderated or unmoderated rounds, iterate | "5 users" is a discovery heuristic with wide variance, not validation. |
| Is it better than before for real users? | analytics / A-B with enough traffic | Usually out of scope; say so. |

AI critique (including yours) finds a subset of usability problems with mediocre precision
(published GPT-4-era studies: precision ≈0.6, recall ≈0.2–0.4). Present it as advisory,
with confidence, and never as a usability verdict. Synthetic "AI users" are for drafting a
test plan, not for validation.

## 5. Output of framing

Two to four lines to the user ("I'm treating this as …; primary task …; I'll check …"),
plus the brief and criteria in the state file when continuity matters. Then move on.
