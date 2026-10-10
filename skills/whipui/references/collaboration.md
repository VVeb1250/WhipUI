# Collaboration: checkpoints, options, feedback, disagreement

Load for co-design checkpoints, presenting options, applying feedback, conflicting
instructions, or professional disagreement.

## 1. Worked ask / scope-down / proceed examples

| Situation | U | C | Action |
|---|---|---|---|
| `/goal` landing page for a new indie game, no refs, no brand | high | high | 2–3 rendered directions (hero + one section, desktop+mobile) on real content; user picks/marks up |
| Same, but the user attached 3 sites and said "fast, I trust you" | med | high | asking is costly → step down to scope-down: build from those refs, label it *proposed*, show at the first checkpoint |
| Fix a misaligned button | low | low | fix; before/after screenshot |
| Add a settings page to an app with tokens/components | low | med | follow the system; no question |
| System lacks a pattern (table density) with two plausible answers | med | med | scope down: build with a density token; ask at the checkpoint with two screenshots |
| Reproduce a screenshot whose contrast is poor | low | high (spec deviation) | reproduce faithfully; note the issue with an optional fix |
| User asks for 11 px light-grey body text on a public site | — | high (a11y) | hard ask: consequence + 2 compliant alternatives |
| Motion intensity for a portfolio hero, no signals | high | med | restrained default with an intensity variable; show 2 intensities as short recordings |
| Two equally good icon libraries, none installed | low | low | pick the lighter one that matches the stroke style; log it |

Agents under-ask more often than they over-ask when tasks are genuinely underspecified,
and asking helps there. Make "should I ask?" an explicit step, and make the *question* good:
concrete, visual, answerable in seconds.

## 2. Presenting options (co-design checkpoint)

1. 2–3 directions that differ on the 1–2 contested axes that matter for this brief (density,
   tone, imagery vs utility, action scope, type voice, motion). Same content, same viewports.
2. Neutral labels, shuffled order (the review page does this). Visuals first; your 2–3 line
   rationale and main trade-off only after the first reaction ("show the designer's rationale").
3. Ask for: which to develop (or none), keep/lose marks on *any* option, optional one-line why.
   Offer merges explicitly: merged directions often beat a single winner.
4. Low-complexity sub-decisions (palette swatches, type pairings on one fixed layout): 4–6 options are fine.
5. Two full rejections in a row → stop generating variations. Show 4–6 real references and ask
   for like/dislike tags per trait, then regenerate from those signals.

People rate a design higher and criticise it less when they see it alone than when it sits
among alternatives. One option invites polite approval; that is why options exist.

## 3. Turning feedback into changes

- Choice of option = approval of that direction **at the level it was shown**, not of every pixel.
  Record: `state.mjs approve D# --evidence "<their words>"`.
- Each mark → a ticket at the **narrowest scope** the words allow (element → component → page →
  global). "This font feels cheap" circled on one heading = that heading now, and ask at the next
  checkpoint whether it applies everywhere. Words like "everywhere/all/ทุก/ทั้งหมด" widen the scope (confirm once).
- `question` marks and comment-less marks need a reply before acting.
- After applying, regenerate the annotated page with before/after, so the user sees what changed.
- Rejected ideas stay rejected (`state.mjs reject`); don't sneak them back.

## 4. Conflicting instructions

Current request vs earlier approved decision, or two stakeholders disagreeing: show both,
name the trade-off, propose one resolution, ask. Never pick silently, and never "average"
two contradictory directions into mush.

## 5. Professional disagreement

When a preference would materially hurt usability, accessibility, performance or legal safety:
state the consequence in one or two sentences, offer two alternatives close to their intent, and
let them decide. If they keep their choice, implement it and record the known risk. When the
disagreement is only about taste, their taste wins; you may say once what you'd do differently.

## 6. Interaction economics

Interruptions make people work faster but feel more stressed. Batch questions into checkpoints;
never drip-feed. In `/goal` or unattended runs, take the most reasonable reading, state it at the
top, scope down where taste is uncertain, and leave the decision ready for the user.
