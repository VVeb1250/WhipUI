# WhipDesign: UX-led product design

Use for a vague product request, a new experience, or a requested UX redesign.
The user need not know their preferred design or provide references.

## Understand the job

Read existing product/code evidence and establish:
- who is trying to do what, in which situation;
- their primary task and the information needed to decide or act;
- constraints, existing behavior to preserve and what success would look like.

Separate user-provided/observed facts from hypotheses. Never fabricate interviews,
personas presented as research, conversion lifts, or user-test results.
Summarize consequential assumptions briefly. Infer routine details; ask only
when the answer changes the product, safety or intended scope. Avoid a compulsory
questionnaire. For planning-only work, propose the experience and direction but
stop before code. For review-only work, use the relevant review workflow and
deliver findings without application edits.

## Shape the experience

Translate requested features into a primary journey, information hierarchy and
state transitions. Account for first use, repeat use, loading, empty data,
errors, recovery, back navigation and relevant accessibility from the start.
Select an appropriate entry point instead of assuming every app needs a dashboard.
Use realistic representative content, including long labels and mobile conditions.

For screen/flow or navigation decisions, read
[flows and navigation](../specialists/flows-and-navigation.md).

Consult [providers](../specialists/providers.md) for a specific interaction,
information architecture or domain question when useful. A guideline database
does not establish what this product's actual users need.

For UX-only work, preserve visual identity. Use [UX review](ux-review.md) and stop
without commissioning a new visual direction.

## Develop a direction that can be seen

For new UI identity, use [visual exploration](creative-direction.md).
The agent may find references or generate visual assets with available host tools;
the user is not responsible for bringing them. Keep discovery bounded to the
decisions at hand. Record sources and rights, inspect references visually, and
derive principles instead of splicing unrelated sections into a page.

Create the primary screen plus one meaningful clickable path before expanding.
The screen must combine considered composition, type, content, images and states.
If two plausible structures need comparison, build small alternatives using the
same task and content. If one direction is sufficient or the user wants autonomy,
recommend one and proceed. Text descriptions alone do not establish visual quality.

Inspect the slice in the browser. Compare task clarity and visual quality
separately; a beautiful screen does not offset an unusable path. Invite concise
feedback on the actual artifact without forcing the user to choose every detail.
Record selected decisions and evidence in the Design Fingerprint. Record task,
assumptions and constraints in Project DNA; keep rejected concepts out of authority.

## Deliver and evaluate

For a build request, continue into [implementation](implement.md) with the chosen
direction, preserving the experience decisions. Validate [UX](ux-review.md) and
[visual quality](visual-qa.md) separately. Fix the most consequential observed
problem, inspect again, and keep a better earlier version when an iteration regresses.

An independent reviewer may help when available and authorized. Give it the
task, constraints, screens and runnable path before the author's justification.
A separate LLM opinion is still a heuristic evaluation, not user research.

Finish with the working result, observed task outcomes, visual evidence and
remaining assumptions. Never mark aesthetics/usability proven by CLI tests,
filled JSON fields or self-assigned scores.
