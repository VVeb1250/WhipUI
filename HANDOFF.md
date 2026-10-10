# WhipUI Next: handoff

**What it is:** one explicit-entry skill (`/whipui`, `$whipui`) that governs intent, ask-or-act economics,
approved-decision memory, reference translation and rendered verification. Visual craft is left to the
model and any installed host design skill. Rationale: `SYNTHESIS.md`. Decisions: `ASSUMPTIONS_AND_DECISIONS.md`.

## Built / tested / human-evaluated / not validated

| | Status |
|---|---|
| Skill, modules, scripts, installer, plugin manifests, Codex metadata, eval harness | Built |
| 180 structural + tool checks (incl. real-site false-positive regressions); `claude plugin validate --strict`; installer into a throwaway HOME; headless `/whipui:whipui` | Tested |
| Mini pilot P1: confounded (independent review), superseded; 5 field bugs it found are fixed | `eval/results/P1/README.md` |
| Mini pilot P1b (fixed harness): 6 runs, cost median 1.55× / tokens 1.95× (over threshold) | Run; AI-side report sealed until you judge |
| Owner preference / non-inferiority (D10) | P1b + ablation: full skill 3–0 vs baseline, 2–0–1 vs tools-only; non-inferiority passed; PROMISING → replicate (`eval/results/P1b/RESULTS.md`) |
| Codex, Cursor, VS Code, Gemini CLI loading; Opus 5.5 / GPT-6 behaviour; real-site false-positive rate; trigger rate without explicit invocation | Not validated |

## Old ideas: kept, transformed, rejected

See `SYNTHESIS.md §5`. In short: kept evidence-honesty wording, Project-DNA-style facts vs assumptions,
an executable version of Pick-from-Web capture (`ref-capture`), screenshot annotation (`review-page`).
Transformed: staged workflow → reasoning dependencies; specialists → lazy modules; creative vocabulary → optional,
expressive briefs only. Rejected: regex router, Design Fingerprint, anti-slop blacklists, provider routing to other packs.

## Migration from whipui@1.2.0

Different layout, nothing to migrate automatically. Uninstall the old project scaffolding (`.whipui/` router,
workflows, fingerprint) or leave it. The new pack only treats `.whipui/state.json` as state. If you keep the npm
name, publish this as a major version, since the CLI surface changed.

## Prioritized backlog

1. **Replicate (P2):** 6 new owner-written briefs, weighted toward creative/taste work, full skill vs baseline, on the model you actually use (Opus 5.5 and/or GPT-6); add a second rater if possible. Don't cut the skill text: the ablation showed tools alone lose on taste.
2. **Cut overhead without cutting judgment:** `--tier min` while iterating and `standard` once before done; re-measure tokens (currently ≈1.7×).
3. **Owner edits the briefs + writes answer sheets** → full pilot P2 (8 briefs × A, B, C, Cp [+D, Aa]) on the model you actually use (Opus 5.5 and/or GPT-6 via Codex).
4. **Real-site false-positive audit** of render-check on 30–50 production pages (needs a networked machine). Label each heuristic warning TP/FP; target ≥80% precision for `warn`.
5. **Codex smoke test:** install to `~/.agents/skills/whipui`, run `$whipui` on B7, compare with Claude Code.
6. **Trigger-rate test without explicit invocation** (`claude plugin eval`, natural prompts + near-misses), with and without your 80+ skill library installed (description truncation).
7. **Phase-2 measurement:** rounds and owner minutes to approval through `review-page`. This is where decision continuity should pay off, if it pays off anywhere.
8. Test later: Stitch DESIGN.md as an export format for state; token-drift lint; block-level fidelity on real targets; paid reference MCPs vs the free ladder (only with your approval).
