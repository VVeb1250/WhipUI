# Renovation evaluation

This is a runnable-by-host evaluation protocol, not a claim that the skills
have improved aesthetics. Unit tests cover routing and file safety only.

Compare old and renovated workflows on the same model, project baseline,
short prompt and time/token allowance. Keep runs in separate temporary projects.
Do not provide extra design detail/references to only one condition.

Use representative tasks:
- "I want an app to track books I read." No supplied visual references.
- "Build a booking page for small workshops." Include full/empty/error states.
- "Recreate this pricing card." Supply the same reference to both conditions.
- "Review the checkout UX; keep the appearance and do not edit code."
- "Change this button radius to 8px." This should remain a bounded UI edit.

For delivered builds, retain initial and final screenshots at the same viewport,
the brief, actual provider/model versions, elapsed effort, task observations and
changes between iterations. For review-only tasks, retain findings and verify
source files were unchanged.

Compare screenshots without revealing which workflow produced them. Ask the
owner for visual preference and reasons, then try the primary task. Report
functional observations and heuristic concerns separately from human evidence.
Include mobile and a recovery case. If only a single owner participates, describe
this as owner feedback, not a general usability result.

Record: task | condition | screenshot | primary-task outcome | recovery outcome |
owner preference/reason | provider/model | budget used | untested assumptions.

Keep this evaluation not-run until artifacts and observations exist. Improvement
means better owner-rated visual work without worsening observed task outcomes,
while reference-led and scoped-edit cases remain faithful. Revise based on actual
failures; adding more instructions is not itself progress.
