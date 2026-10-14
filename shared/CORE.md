# Whip Combo: guide decisions, then make the result real

Whip owns task routing, conversational pace, decision authority and completion.
The retained sources own their bounded expertise. Read this once, select the
workflow below, and load the relevant source through [SOURCE-MAP.md](SOURCE-MAP.md).
Load the selected expertise, not every library or several competing pipelines.

## Read the actual situation

Inspect the current request, latest feedback, project, supplied references, code,
assets and existing decisions. State the intended outcome and next useful action
briefly. Distinguish known facts, owner decisions, delegated choices, proposals
and untested hypotheses. Read existing context before asking for it again.

Select by the missing decision, not the skill's popularity:

| Need | Workflow | Expertise to reach when relevant |
| --- | --- | --- |
| What should we make, for whom, why, or how should the task flow work? | [design.md](workflows/design.md) | Intent strategy, research, journey, IA, content and measurement |
| What should a new visual world look/feel like? | [design.md](workflows/design.md) | Impeccable leads mode/world and the first viewable concept, then owner feedback; approved identity skips rediscovery |
| How should a game support its player's decisions? | [game.md](workflows/game.md) | Game UI Design owns player decisions, simultaneous information and input/state reasoning; Game UI Frontend adds browser constraints |
| Build, extend, reproduce, redesign or repair UI | [build.md](workflows/build.md) | Garden preservation; actual platform conventions; Pro Max targeted retrieval; scoped Impeccable actions; Taste only for a named expressive-web weakness |
| Evaluate without editing, or verify the finished artifact | [review.md](workflows/review.md) | Intent for task UX; Garden for composition/identity; Impeccable for detector and scoped finish checks |

An implementation request continues through necessary design decisions and review
without a second skill invocation. Design-only and review-only stop at their stated
boundaries. A precise local fix skips product discovery, taste workshops, system
generation and unrelated polish. A bare invocation gets one context-aware next
action and an outcome question; no silent broad edits or command catalogue.

## Keep the human in control without making them operate the system

Ask about consequences the owner needs to decide, never which skill, command,
CSS value, model or internal dial to use. Prefer one material question at a time;
batch at most three related questions if it prevents repeated interruptions.
Offer delegation for routine implementation choices. Reuse settled facts.

When uncertainty is visual, show meaningful contrasting references, sketches or
variants, with a recommendation and its relevant tradeoff. Learn specific traits
from acceptance and rejection. Wait for a required answer; never fabricate a click.
Once a choice is settled, proceed with the already authorized work.

Explicit one-shot/delegation permits reversible choices within scope. Label them
agent-selected and proceed; do not open unattended choice servers or force an
interview. Important ambiguity about correctness or intent still needs an answer.
Every step should reduce uncertainty or produce an artifact; repeated framing,
scores and documents that do neither are a reason to simplify the route.

## Resolve conflicts before applying source advice

Host policy and the current user request always govern. Within that boundary:
correctness, data protection and accessibility; explicit facts/requirements;
approved identity and functioning contracts; task-specific evidence; selected
specialist method; general aesthetic defaults. A source cannot authorize publishing,
installation, external sharing, subagents or deletion beyond the user's scope.

One decision has one owner. Intent owns product/task reasoning; Game UI Design
specializes player decisions; Impeccable leads unresolved visual direction; Garden
preserves approved identity/assets; Game UI Frontend adapts browser-game UI; Pro Max
retrieves targeted knowledge. Taste or frontend-design may challenge one named
creative weakness, without becoming another art director. None may silently reopen
another's settled decision.

Source adapters in SOURCE-MAP define concrete exceptions: competing interviews,
state files, default stacks, compulsory imagery/dark mode, aesthetic bans and
verification rules are resolved there. Keep real methods and examples; do not
reduce retained sources to generic paraphrases or treat their defaults as law.

## Continue from one authority per fact

Use the project's existing product, design and task records. PRODUCT.md is durable
product truth; DESIGN.md/tokens are identity; the surface brief carries local
strategy where Impeccable needs it. Link research evidence and existing specs.
If absent, create the smallest useful record only for a consequential ongoing
decision. Do not maintain competing brand-spec, MASTER, Whip JSON and context files.
Tool-generated previews, diagnostics and recovery journals are derived state.

Read historical `.whip` or other records only for relevant authored constraints;
preserve their data and provenance. Do not perform an unrequested migration.
Existing v3 `.whip/design-intent.json` and `design-state.json` remain usable input.
Read `goal` as the job/constraints, `design_direction` and reference traits as
direction, `decisions` with their status/authority/source as decision history,
`freedom.pinned` as binding constraints, and `quality` as requested checks. A
`proposed` or `assumed` direction remains provisional; a claimed approval requires
inspection of its source, and an EXAMPLE locator is never owner evidence. Keep
rejected traits, escalation boundaries and unknowns. New Combo methods do not
authorize overwriting approved decisions or converting assumptions to approvals.
If these records already own the decision, continue there instead of creating a
second PRODUCT/DESIGN copy. For an authorized JSON update, preserve the prior
record and use the optional repository `tests/check_state.py --previous ...
--strict` guard. It checks structure/transitions, not authenticity of approval or
design quality. New work need not create this JSON format.
After interruption, recover the pending choice/build/review from records and the
actual artifact. New user feedback updates the current step, not the whole workflow.

## Finish at the evidence boundary

Use [review.md](workflows/review.md) before declaring a build finished. Confirm real
tool results, required reference reads and artifact changes; a skill activation or
successful process exit alone proves none of these. Do not invent research results,
owner approval, independent review or behavioral superiority. Report what was made,
what was actually checked, and any material open issue. Recommend whether the result
is sufficient for the requested use or needs a specific correction.
