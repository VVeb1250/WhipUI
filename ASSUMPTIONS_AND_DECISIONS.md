# WhipUI Next — Assumptions & Decisions Log

Status legend: **CONFIRMED** (owner said it) · **HISTORICAL** (reported, not reproduced here) · **HYPOTHESIS** (to be tested) · **OPEN** (undecided) · **DECISION** (lead decision, with reason; reversible unless noted)

Last updated: 2026-10-10 (Phase A)

## 1. Confirmed owner intent (from WHIPUI_NEXTGEN_HANDOFF.md §1 + kickoff prompt)
- C1 Clean-room new pack; learn from old, don't copy by default.
- C2 Behave like designer↔client collaborator *and* implementer.
- C3 `/goal` = one instruction → many autonomous tool calls/iterations allowed.
- C4 Adaptive autonomy: ask only when uncertainty × cost-of-wrong > cost-of-asking.
- C5 References essential; dynamic retrieval over fixtures; translate mechanisms, not layouts.
- C6 Deep expertise, lazily loaded.
- C7 Human is final judge of taste; AI judges technical/UX defects, not preference.
- C8 Approved decisions outrank agent guesses; suggestions never silently become spec.
- C9 Rendered verification (browser, interaction, responsive, motion playback).
- C10 Nine task families (CREATE_TO_SHIP … DIAGNOSE).
- C11 No house style.
- C12 Real research with sources; no fake agents / fabricated claims.
- C13 Target hosts: frontier coding agents (Opus 5.5, GPT-6) — implies Claude Code + Codex at minimum.
- C14 No paid MCP / custom memory DB / host-exclusive feature as hard dependency without approval.
- C15 (owner, 2026-10-10 05:02) Reference retrieval should be **free-first**; owner supplied their own source list (verified in R3 §9).
- C16 (owner, 2026-10-10 05:04) `/goal` was only a guess about how advertised MCP+skill demos work; requirement is just that WhipUI **fits the built-in `/goal`** of Claude Code and Codex.

## 2. Historical observations (all: historical, unverified unless noted)
- H1 16-run GPT-6 "Luna" comparison: mixed wins/ties/losses. Run artifacts **not available** in this session.
- H2 ~2.34× cost, ~3.15× input tokens vs baseline in one comparison. Not reproduced.
- H3 61-file legacy pack; 42-file clean-room prototype (26 tests). **Neither found** in accessible locations.
- H4 Baseline sometimes looked better; restoring earlier spec helped → overconstraint/poisoning risk.
- H5 Spec descriptions treated as fixtures → repetitive UI.
- H6 AI judge failed to separate slop from good design in owner tests.
- H7 Motion reviewed from code/stills.
- **Inspected (verified):** public `VVeb1250/WhipUI` repo / npm `whipui@1.2.0` (40 files: router, WhipUI + WhipDesign skills, workflows, specialists, provider routing, creative-direction gate, CLI installer, 7 test files, 20 commits). Inspected read-only for lessons; **not** used as base.

## 3. Hypotheses to test
- HY1 (competing, must be allowed to win) Frontier model + same brief + ~3 good refs + screenshot loop ≈ Full WhipUI at lower cost.
- HY2 Most measurable value comes from (a) reference retrieval/translation, (b) decision continuity across turns/sessions, (c) rendered verification tooling — not from design-principle prose.
- HY3 A single entry skill + lazily loaded modules beats multiple auto-invoked skills on routing reliability (Claude Code auto-invocation is reportedly unreliable for the owner's library — see skill-library notes).
- HY4 Executable scripts (render/screenshot/a11y/motion capture/state validation) give more reliable benefit than prompt rules.
- HY5 Comparative visual choice (2–3 directions) reaches approval faster than open-ended interviewing for taste-uncertain tasks.

## 4. Open decisions (do not freeze without evidence)
- O1 File tree, number of skills, whether Motion/Review are separately invocable.
- O2 Reference provider(s); whether any MCP/paid API is worth it.
- O3 Design State format (MD vs JSON vs both).
- O4 Shape of any brief/contract artifact.
- O5 Measured benefit vs baseline.

## 5. Lead decisions so far
- D1 Work dir `/home/claude/whipui-next`; legacy kept in `/home/claude/legacy-inspect` (quarantine, read-only).
- D2 Research R1–R7 run as real parallel subagents (Agent tool available). R8 deferred until synthesis shows need.
- D3 Verification tooling may assume Node 22 + Playwright/Chromium (available here) but must degrade when absent.
- D4 Architecture **L** chosen (single entry skill `whipui` + lazy modules + scripts + JSON state); **I** (AGENTS snippet) shipped as optional variant/pilot arm; **S** rejected. Rationale: SYNTHESIS.md §3.
- D5 No skill named `goal`; entry is `/whipui` / `$whipui`; scripts print one-line evidence summaries for the `/goal` evaluator. (R1, C16)
- D6 Design State = `.whipui/state.json` validated by `state.mjs`; `approved` requires `by: user` + evidence. Markdown view via `state.mjs show`. (O3 closed provisionally; Stitch DESIGN.md interop = test later)
- D7 No aesthetic blacklist, no house tokens, no Design Fingerprint. (R3, R7)
- D8 Motion/Review are modules, not skills, until R4 §5 criteria are met by measurement. (O1 closed provisionally)
- D10 (owner asked, 05:14) **Non-inferiority** on first-shot aesthetics vs. host + `frontend-design`/`frontend-skill` is a requirement, not "don't care". WhipUI defers visual craft to a co-installed host design skill (interop, not routing authority); its own art-direction module covers hosts without one. Pre-registered: D-vs-A first-shot owner win rate < 40% or token ratio ≥ 1.5× with no compensating gain = defect.
- D9 Paid reference MCPs = optional last rung; brand-style DESIGN.md collections and prompt libraries excluded from automatic use. (C14, C15, R3 §9)

## 6. Blockers / owner questions (only ones that change design)
- B1 Human evaluation requires the owner's (and ideally end users') time. Pilot can be *prepared* and *AI-side run*, but human preference data can only come from the owner. → Will ask when pilot artifacts are ready, not now.
- B2 Old benchmark artifacts (H1–H3) — if the owner has them locally, they'd strengthen the eval baseline. Non-blocking.
- D11 (owner, 16:30) Mini pilot approved: B1, B7, B8 × arms A and C on Sonnet (6 runs). Larger pilot needs owner-edited briefs and answer sheets.
- D12 Field fixes from pilot P1 (all regression-tested): project-bounded `.whipui` lookup + absolute paths; new `interact.mjs`; `environment` finding kind (blocked network, file://); motion-probe measures health without screenshots/video and ignores ≤16 ms animations; judging page carries no file paths.
- D13 Pixel diff is not used as an "out-of-scope change" metric when fixes reflow layout (P1 B7). Use region-level checks or human review.

## 7. Status at handoff (2026-10-10)
- Built: entry skill + 10 modules + 8 scripts + installer + adapters + eval harness.
- Tested: 170 structural/tool checks; plugin validate --strict; headless invocation; mini pilot P1 ran (6 runs).
- Human-evaluated: **nothing yet**. Owner's blind judgments for P1 pending.
- Not validated: preference/non-inferiority vs baseline; real-site false-positive rate; non-Claude hosts; Opus 5.5 / GPT-6 behaviour (pilot used Sonnet).
- D14 (after independent review) P1 declared confounded and superseded; harness fixed; mini pilot rerun as P1b (6 runs). P1 owner judgments recorded with confound labels (P1/README.md).
- D15 P1b paired cost median 1.55× / tokens 1.95× (over the pre-registered 1.5× threshold); C ran WhipUI tools in every run but did not open screenshots in 2 of 3. SKILL.md §5 strengthened ("open at least smallest + largest viewport even at 0 errors"). P1b measured the version BEFORE this edit.
- D16 (owner: "ตามนั้น", 2026-10-11) Tools-only ablation run on P1b briefs: arm T (tools card, no skill text) and Cv2 (current skill), 6 runs. Baseline A reused. Results sealed until the owner judges `judging-ablation.html`. Token medians vs A: T 0.73×, Cv2 1.72×. Dollar cost for T is inflated by prompt-cache misses from --append-system-prompt (harness artifact).
- D17 (2026-10-11) Owner blind judgments on the ablation: full skill (Cv2) 3–0 vs baseline, 2–0–1 vs tools-only; tools-only 1–2 vs baseline. **Reverses** the builder's sealed inference that skill text adds nothing beyond tools: objective metrics couldn't see taste. Decision: keep the skill text; PROMISING per pre-registration → replicate (P2) before any superiority claim. Retest consistency 2/3 (low); B7/B8 partly unblinded.
- D18 (2026-10-11) First real-site run (owner's deployed portfolio, built locally). Six render-check false-positive classes fixed (local()-only fallback fonts, tight-leading text-spill, inert reel subtrees, child-only focus styles, axe findings split by first target, same-URL link overlap); 180 tests. Real findings handed to the owner as a proposal patch; the portfolio repo was not modified.
