# UX methods: diagnose the right problem, not just the surface

Load for new workflows, IA, product decisions, usability audits, ambiguous outcomes, or user research. Choose one method that resolves the current uncertainty rather than running them all.

## Method selection

| Decision at risk | Lean method | Artifact |
| --- | --- | --- |
| What job must be accomplished? | Jobs/scenario framing and task analysis | Primary user goal, trigger, completion signal, constraints |
| Is navigation understandable? | Task-based flow walkthrough, tree testing when participants available | Path diagram, wrong-turn points, terminology problems |
| What should be prioritized? | Content inventory + information scent and progressive disclosure | Content hierarchy, primary/secondary content rationale |
| Why did users struggle? | Usability observation: tasks, attempts, failures, verbal reactions | Observation log separate from explanations |
| Is the proposed flow viable? | Paper/clickable prototype + critical-path test | Tested task sequence and unknowns |
| Why does existing UX feel broken? | Heuristic review + alternative explanation | Ranked findings with evidence and severity |
| Does design work for diverse users? | Accessibility inspection + assistive tech checks | Specific WCAG/platform issues, evidence, constraints |
| Multi-step operational workflow? | State/sequence mapping with reversibility and recovery | Trigger→action→feedback→failure→recovery chart |

## Flow-first reasoning

For a primary task express:

```
Actor & situation → Trigger → Needed information → First action
→ System feedback → Branch/error → Recovery/undo → Completion/confirmation
```

Use the task, not the site's sitemap, as the starting point. Make navigation language reflect user concepts rather than API/module names. Call out where content is missing, contradictory, or fabricated. For high-risk flows, consider error prevention, confirmation for destructive operations, undo, privacy and clarity.

## Hypothesis discipline

Separate:

- **Observation:** three of five participants failed to locate export (only if real sessions took place).
- **Inference:** navigation label might not signal export functionality.
- **Alternative:** export control may have loaded late or task instruction was misleading.
- **Test:** rename action in a prototype and rerun the same task with comparable participants.

Never turn "common UX best practice" into empirical evidence about this product. A designer's intuition is a useful prior, not a measured fact.

## Nielson-style heuristics as diagnosis, not score worship

Check feedback visibility, match to user concepts, user control, consistency, error prevention, recognition vs recall, efficiency, simplicity, informative errors, help. For each issue indicate who is affected, which task breaks, concrete evidence, likely severity (not a false numeric precision), and cheapest way to test the fix.

## Co-design role

The owner is expert in their personal/brand preferences and product strategy; designers contribute design methods and professional dissent; actual users supply evidence about usability. These roles can disagree. Document the distinction rather than taking majority vote on unrelated criteria.

## Output

A brief with **primary job, user scenario, critical path, hierarchy, known evidence, unresolved assumptions, UX acceptance criteria**. If implementation follows, specify essential states and constraints but not rigid UI fixtures unless explicitly approved.
