# Evaluation: discriminate skill benefit from tools, prompt and taste

**Status**: test plan, not completed design-quality results. The check_pack and state scripts are deterministic smoke tests only.

## Pre-registration questions

1. **WhipUI:** Does it produce an interface that the owner/designers prefer to a strong baseline *with the same references/tools/time budget* while preserving function/intent?
2. **WhipDesign:** Does it reduce rounds to reach a human-approved direction and repeat design decisions less, beyond reference-only discussion?
3. **Overhead:** Does progressive skill loading reduce input tokens/time compared with loading every upstream source skill?
4. **Regression:** Does the pack sometimes damage baseline output via stale style restrictions or specification-to-fixture conversion?

## Arms to compare (at least 4 UI, 3 design)

| Arm | Description |
| --- | --- |
| U0 | Strong frontier model, default prompting; same repo, same browser access |
| U1 | U0 + Anthropic Frontend Design OR Impeccable (best single existing skill); source version pinned |
| U2 | U0 + same curated refs and same explicit screenshot feedback policy as Whip |
| U3 | U0 + WhipUI only |
| U4 | U0 + WhipUI + WhipDesign, only for tasks with material owner choices |
| D0 | Strong model consultation with no custom skill |
| D1 | Model + exact same contrastive refs without WhipDesign instructions |
| D2 | Model + WhipDesign with references held constant |

Do not compare Whip+great references against baseline with no references. Lock model/version, system prompt/harness, tools, task, repo state, token/tool-call budget and actual reference media. If one approach uses more tokens or steps, record that as cost. Keep evaluator-only design rubric out of agent prompts. No selected perfect exemplars in baseline prompt.

## Task corpus

From `behavior-cases.jsonl`, pick ten-plus diverse tasks; at least one each: creative marketing/portfolio; product dashboard; mobile; `MATCH`; `POLISH`; existing design system extension; motion; ambiguous co-design. Include briefs with domain-specific artifacts, not blank "build SaaS landing page." For each task freeze the natural user prompt and working repo. Human participants should only see anonymized artifacts, not source skill names.

## Phase A paired QA-efficiency experiment

Use identical code and defect fixtures on 3.0 browser-agent inspection and the new script-first path. Record prompt, model, tool/harness versions, actual screenshot/interaction evidence, browser calls, input/output tokens, wall time, findings, false negatives and false positives. Evaluate small local REPAIR, multi-viewport CREATE and broken critical interaction separately. Pass condition is fewer tokens/tool calls *without increasing critical missed defects*, not fewer screenshots alone. Browser-script unit tests are not evidence of a real browser run or design-quality advantage.

## Actual measurements

**UI:** blind pairwise forced choice; preference reasons; brief fit (1–7), coherence/hierarchy/type (1–7), distinctiveness without mismatching audience (1–7), realistic functionality (pass/fail), responsive defects count, accessibility defects, deviation from approved decisions, render/interaction evidence, total input/output tokens, wall time and tool calls. Use separate rater groups for owner taste, design craft, and target-user usability. Do not infer task completion from screenshots.

**WhipDesign:** count owner questions, high-impact questions (changed design choice?) vs wasted questions, time to clear decision, reference quality/diversity, decisions misattributed as approved, rejected-direction recurrence, accuracy of predicting held-out preference reaction, owner-rated feeling of control, implementation adherence to approved intent.

**Taste:** owner evaluation is primary for personal/brand preference. If there are multiple independent raters, report inter-rater agreement and avoid pretending a single numeric mean reflects consensus. Collect qualitative reason for preference (compositional effect vs prompt mismatch).

## Scenarios that can falsify the pack

- Strong baseline produces more distinctive UI than Whip under same budget.
- Owner needs more dialogue under WhipDesign than D1 without higher clarity.
- Agent treats direction as a rigid fixture, resulting in bland repeats.
- Whip automatically rewrites approved blue palette or content; fails preservation.
- No screenshot tool: Whip falsely reports visual QA done.
- Excessive reference search for a trivial CSS patch.
- Specialist overlay induces a style conflicting with an approved project direction.

## Pilot plan and decision rules

Start with 8 tasks × 3 UI arms (U0, U1, U3) and 4 owner/designers rating each blinded pair, plus 4 design consultations × 3 arms (D0, D1, D2). Add U2 immediately if U3 looks better than U0, because matching reference quality/tool workflow may explain the gain. Repeat with randomized order and a second seed only for unclear cases. This is a smoke/pilot, not statistical proof.

**Ship candidate as validated** only after: no false approved-decision claims in behavior evals, no unresolved critical functional/a11y issues, no systematic regression in preservation, and user-rated preference/brief fit at least competitive with best single skill. If U1 or U2 wins most tasks with lower cost, simplify Whip rather than enlarge it.

## Running manual behavior checks

For every JSONL item: send only the `prompt` field to the same agent baseline and to the agent with skills, inspect output and tool traces, and score whether `key_assertions` are actually demonstrated (not merely claimed). Record prompts, commits, screenshots, clips, user labels, budget, token counts and environment. `expected_primary` and `expected_route` are adjudication hints, **not a hardcoded keyword router**. Adjust if the user has more context than the short prompt suggests.
