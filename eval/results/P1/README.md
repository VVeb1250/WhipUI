# Pilot P1: superseded (confounded). Kept for transparency

An independent review found that P1 should not be used for preference claims:
1. The builder described distinguishing traits of the arms to the owner in chat before judging (B7, B8): the owner is unblinded for those briefs.
2. Only arm C got the "client not available, state assumptions" sentence: the prompts were not matched.
3. Workspaces sat inside the repo, so agents could reach the B7 answer key and the blinding key. Arm C's `--plugin-dir` pointed at the whole repo, including eval/.
4. The B7 seed contained comments naming the planted defects, and planted defect #5 did not exist.
5. Child runs inherited the builder session's environment.
6. The first cost summary was a ratio of medians (1.06×). Paired: median **1.42×** cost, **1.68×** tokens; totals 1.32× cost, **1.97× tokens** (B1 4.06×).

All six are fixed in the harness (`run-pilot.mjs`, seed, `analyze.mjs`, `make-judging.mjs`), and the
mini pilot was rerun as **P1b**. The field bugs P1 surfaced in WhipUI's own tools (see the sealed report) are real and fixed.
`SEALED-AI-side-report.md` describes output differences: don't read it before judging P1b.

## Owner judgments received for P1 (2026-10-10 19:05 JST) — interpret with the confounds above
| Brief | Result | Blind? |
|---|---|---|
| B1 | C preferred, strong, decided in 2 s | yes (no traits had been described) |
| B8 | C preferred, slight; same choice on the side-swapped retest | **no**: owner had been told C used fades under reduced motion |
| B7 | tie, and tie again on retest | **no**: owner had been told C shrank the KPI value |
Retest consistency 2/2. Decisive main judgments: 2 for C, 0 for A, 1 tie (exact sign test p = 0.5).
Nothing here is statistically meaningful. The only clean signal is a single blind B1 preference for C.
