# UX critique and validation

## Decide what is being evaluated

1. **Intent fit:** Does the artifact match the owner-approved identity, message and target task?
2. **Task usability:** Can target users understand and complete the job, including errors and recovery?
3. **Visual craft:** Is hierarchy, composition, legibility, imagery and interactive feedback coherent?
4. **Technical accessibility/quality:** Keyboard/focus, semantics, responsive layout, performance, platform requirements.

Do not collapse these into a single "looks great" score. A pretty design can fail a task. A functional design can have an unacceptable brand identity. An AI judge can review apparent hierarchy or accessible code but does not know the owner's personal preference without observation.

## Evidence hierarchy

- Real task observation from representative users with task and context documented.
- Instrumented behavior or controlled study appropriate to the hypothesis.
- Rendered interaction/screenshots and reproducible technical checks.
- Expert heuristic critique explicitly labeled as judgment.
- Aesthetic preference prediction from AI (tentative, not approval).

Never say "tested with users" because an LLM simulated their behavior.

## Feedback protocol: screenshot or clip annotations

Turn comments into local change tickets:

```
EVIDENCE: screenshot.png, viewport 390x844, red circle near primary CTA
OBSERVATION: CTA occupies two lines and overlaps image at 390px
OWNER FEEDBACK: "this feels crammed"
HYPOTHESIS: layout minimum width + insufficient vertical space
CHANGE SCOPE: hero CTA row and sibling text; preserve header, type face, blue accent
CHECK: 390, 768, 1440; keyboard focus; hero snapshot diff
```

Do not rewrite the whole design when a localized repair explains the defect. If the feedback implies a new design philosophy rather than a local defect, return to WhipDesign decision-making.

## Usability test sketch (only when real participants exist)

Specify target people, exact tasks, representative artifact/prototype, what counts as success, data capture, and known biases. Distinguish task success and subjective preference. Small formative tests surface problems but cannot prove universal superiority or precise conversion lift. Note participant recruitment, ordering effects, unfamiliarity and device.

## Prioritize

P0: destructive action or major accessibility/security/functional risk.
P1: primary job blocked or severely misunderstood.
P2: recurring friction or major intent mismatch.
P3: cosmetic refinement without demonstrated effect on task success.

Use labels as operational triage, not numerical scientific certainty. For aesthetic disagreement, explicitly return decision to owner with a concrete visual alternative.
