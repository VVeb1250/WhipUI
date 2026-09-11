# Visual QA

Use available host browser/image tools; Playwright MCP is preferred for the live
page. A tool configuration or passing source test is not rendered evidence.

1. Inspect the changed route/component at the relevant configured viewports.
2. For WhipUI, compare against the explicit specification/reference at matching
   size and state. Preserve its identity even if it uses familiar patterns.
   For WhipDesign, compare against the chosen visual slice, primary user task
   and any actual reference evidence.
3. Evaluate composition/hierarchy, typography, color/contrast, spacing/density,
   imagery, responsive behavior, states and accessibility. For a new direction
   also assess product fit, coherence and deliberate visual choices.
4. Record concrete findings with screenshot/state, impact and proposed change.
   Prioritize the strongest evidence rather than filling a fixed number of issues.
5. For an authorized build/fix, refine and re-inspect. For a review request,
   report findings without editing. Respect maxIterations in config (default 3);
   a budget limit means unfinished checks remain unfinished, not passed.
6. Preserve a better earlier version if a change regresses the work. If evidence
   shows a direction problem, revisit that decision rather than piling on effects.

Exercise the relevant task with [UX review](ux-review.md) when behavior changes.
Track UX outcomes separately: good visual craft cannot offset a task blocker.
Check responsive behavior, focus, reduced motion and meaningful state feedback.
An unusual layout is not automatically good or bad; judge its effect in context.

Report observed / blocked / not tested for each relevant check, evidence paths,
remaining mismatches and changes after re-inspection. Do not infer human
usability, aesthetic preference or successful visual validation from code alone.
