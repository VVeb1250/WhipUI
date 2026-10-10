# WhipUI Next — Research Synthesis & Architecture Decision

Date: 2026-10-10 · Inputs: `research/R1–R7` (7 parallel subagents, all sources dated) + owner messages during the session.
Labels: **[E]** evidence-backed (cite track) · **[I]** lead inference · **[O]** owner-confirmed.

---

## 1. What the research changed

| # | Finding | Evidence | Design consequence |
|---|---|---|---|
| 1 | Skill auto-invocation fires ~50% of the time; failure is activation, not selection | R1: Vercel evals (56% never invoked), Spence (50–55% without hook) | Primary entry is **explicit** `/whipui` (Claude Code) / `$whipui` (Codex). Auto-trigger is a bonus, measured not promised |
| 2 | `/goal` is a built-in on both Claude Code and Codex; a skill named `goal` would shadow Claude's | R1 (Claude docs); **[O]** owner: only needs to fit built-in `/goal` | No `goal` skill. WhipUI prints compact evidence lines so the `/goal` evaluator (transcript-only) can judge completion |
| 3 | Comprehensive skills hurt (−2.9pp); 4+ skills ≈ +5.9pp vs +18pp for 1–3; SWE gains smallest | R1/R7: SkillsBench | **One** entry skill, lazily loaded modules, load ≤1–3 per task |
| 4 | Aesthetic prose is commodity (Anthropic `frontend-design`, OpenAI `frontend-skill`, 4 packs with 30k–134k stars) and no controlled evidence shows any design skill beats a strong baseline | R7 | WhipUI does **not** compete on style rules. It sits on top of whatever aesthetic defaults the host already has |
| 5 | Anti-slop blacklists move the default (Inter/purple → Space Grotesk → cream/terracotta) | R3, R7, R1 (Opus 4.8/5.5 docs) | No blacklist. Use the diagnostic "**chosen or defaulted?**" against the brief, plus project-scoped *rejected* lists from the user |
| 6 | Designers agree on UI pairs only weakly (α≈0.25); AI judges predict one person's pick at 54–58% | R6/R7: DesignPref | AI never judges taste. Taste = this client's position on a few contested axes, elicited comparatively |
| 7 | Comparison beats single option (Tohidi CHI'06, Dow TOCHI'10); 2–3 options, not more, under preference uncertainty | R6 | Co-design shows 2–3 *rendered* directions differing on contested axes; visuals before rationale |
| 8 | Agents under-ask on genuinely underspecified tasks; a separate "should I ask?" step helps; a third option exists: **scope down** | R6: Ambig-SWE, Ask-or-Assume, Horvitz, HAX | Approval rule = U × C × A with four outcomes: hard ask / visual choice / scope-down-and-batch / proceed |
| 9 | Design-context files are commodity; **none** of the inspected tools track decision status + authorizer | R7 | Decision log (proposed/approved/rejected/superseded + who + evidence + scope) is WhipUI's clearest differentiator |
| 10 | axe misses overflow, clipping, occlusion, focus removal, placeholder-only labels; DOM-geometry checks catch them cheaply | R5 (prototype: 13/13 seeded, 0 FP on control, 51/51 tests) | Ship `render-check` as a script; findings labelled `measured`/`heuristic` |
| 11 | Motion can be verified from playback; naive pause-seek gives stale frames 3/12; validated order 30/30 | R4 (tested) | Ship `motion-probe` with the validated seek order + reduced-motion A/B + contact sheet |
| 12 | Automated a11y covers 20–30% of WCAG criteria; AI heuristic review precision ~0.60, recall ~0.2–0.4 | R2 | Three-tier criteria: machine-verified / agent-advisory / human-required. Never "accessible" from axe |
| 13 | Several popular UX laws are misapplied by models (3-click, 7±2, choice overload, F-pattern, Fitts on touch) | R2 | Small "myths + counterexamples" table inside UX diagnostics |
| 14 | Free reference retrieval works for web visuals, fails for app flows; paid MCPs exist (Mobbin, Refero, Appllama) | R3 + §8/§9; **[O]** owner wants free-first | Free-first ladder per role; "run the real flow in a headless browser" as the free app-flow path; paid MCPs optional last rung |
| 15 | Brand DESIGN.md collections / prompt libraries package someone else's finished style | R3 §9 | Excluded from automatic use (fixture + trade-dress risk) |

## 2. Challenges to the brief (with reasons)

1. **"Deep expertise" mostly means diagnostic, counter-intuitive knowledge — not more design prose.** The model already knows Nielsen, contrast, 8-pt grids. Modules carry *symptom → cause → check → intervention → when-not* patterns, verified counterexamples, and calibrated tool use. Expected gain is concentrated in tools + continuity, not knowledge text [E: R1 F2, R7 F1–F2]. The pilot is designed to show whether the modules add anything over the scripts (seeded-defect arms).
2. **Modes as user-facing concepts are unnecessary.** The agent picks fidelity vs latitude internally and states it in one line; the user never fills a form.
3. **The "Design Fingerprint" idea is rejected.** Legacy v1.2's ~60 empty visual-value fields with no status/authorizer were the main fixture-contamination vector [E: R7 §4]. Replaced by the decision log; visual values exist only as decisions with a status.
4. **Separate Motion/Review skills are rejected for v1.** No criterion in R4 §5 is met by measurement; listing budget and 4+-skill effect argue against [E: R1, R4].
5. **Arm A must be the realistic baseline**, i.e. the host with its default skills (`frontend-design` may load) — beating a bare model is not the claim [E: R7 eval §1].
6. **A small owner-only pilot can only detect large effects** (20 decisive pairs: power ≈0.42 at a true 70% preference) [E: R6 F10]. "Empirically superior" will not be claimable from this session.
7. **Domain packs (R8) deferred.** No evidence yet that domain modules change outcomes; game UI gets a short section inside motion/art-direction modules for now.

## 3. Architectures compared

| | **M — Strong baseline** (no WhipUI) | **I — Index only** (≈1.5 KB AGENTS.md/CLAUDE.md snippet + scripts) | **L — Single entry skill + lazy modules + scripts + state** (chosen) | **S — Router + specialist skills** (legacy-like) |
|---|---|---|---|---|
| Always-on context | 0 | ~400 tokens every turn | ~100 tokens (description) until invoked; ~3k on invoke | 4–6 descriptions; overlap |
| Activation | n/a | always present | explicit `/whipui`; auto ~50% | each skill ~50%; mis-selection risk |
| Decision continuity | none (model memory only) | weak (no protocol) | state file + CLI with transition rules | depends on router |
| Rendered verification | model's own ad-hoc screenshots | scripts available | scripts + when/how to read them | scripts |
| Taste elicitation | ad hoc | none | approval rule + option/review pages | specialist |
| Enforceability | — | none | soft (prompt) + script validation + optional Stop hook | same |
| Portability | — | very high | high (Agent Skills spec; 5 hosts) | medium (more files, more routing) |
| Failure recovery | — | — | state survives sessions; evidence files | complex |
| Risk | — | under-specifies collaboration | overhead if modules over-load | SkillsBench "4+ skills" penalty; regex/route drift (legacy probe 3/7 misroutes) |

**Choice: L**, with **I** shipped as an optional variant (`adapters/AGENTS.snippet.md`) because Vercel's evidence says an always-on index can beat skills — it becomes a pilot arm (C′), not an assumption. **M** is the pilot's Arm A. **S** rejected.

## 4. Smallest useful core (what L contains)

- `SKILL.md` (≤~250 lines): task recognition → fidelity vs latitude; authority order; approval rule; state protocol; evidence reporting; module index with load triggers; tool index. Nothing about how a good design looks.
- **Modules** (each loaded only on its trigger): framing & criteria · UX diagnostics · accessibility verification · art direction · reference sourcing & translation (free-first catalog) · collaboration & feedback · motion · frontend implementation · verification (how to read the scripts).
- **Scripts** (Node ≥18, Playwright optional dependency with graceful "NOT RENDERED" fallback): `detect-project`, `render-check`, `motion-probe`, `ref-capture`, `state`, `review-page` (options + annotation, exports JSON), `doctor`.
- **State**: `.whipui/state.json` (source of truth, validated by `state.mjs`) + `state.mjs show` renders Markdown. JSON chosen over Markdown because transitions (proposed→approved needs `by: user` + evidence) are checkable by script; human readability via `show`. Stitch DESIGN.md is a *test-later* interop format [R3 §9].
- **Optional adapters**: Claude Code plugin manifest + marketplace; Codex `agents/openai.yaml`; opt-in Stop hook "UI changed after last render evidence" (experimental, not on by default); AGENTS snippet (arm C′).
- **Eval harness**: pre-registration template, brief set, run log/judgment CSV schemas, blinded judging page generator, analysis (Wilson CI, exact sign test, brief-clustered bootstrap, retest consistency), seeded-defect fixtures (layout/a11y + motion), fixture-contamination audit.

## 5. Old ideas: retained / transformed / rejected

| Idea | Verdict |
|---|---|
| Purpose → Structure → Concept → Visual → Implementation → Review | **Transformed** into reasoning dependencies inside SKILL.md ("don't decide visuals before purpose and structure are known"), not a staged ceremony |
| Creative Tension, Visual Grammar, Page Choreography, Controlled Breaks | **Transformed**: vocabulary inside the art-direction module, only for expressive briefs |
| Reference Ground / Expand / Stress / Collision | **Transformed**: "search wide, shortlist 3–4 diverse, ≤1 collision ref for expressive briefs" |
| Component-first implementation | **Retained** in frontend module, with "detect conventions first" |
| WhipMotion / WhipReview / WhipDesign / WhipCraft as skills | **Rejected** as skills; kept as modules |
| Screenshot annotation | **Retained** and built (`review-page`) |
| Router, route cards, phase packets, hard gates | Router **rejected** (model classifies); hard gate only as opt-in hook |
| Design Fingerprint, Creative-direction gate object | **Rejected** (fixture vector) |
| Project DNA (facts vs assumptions, current request wins) | **Retained, slimmed** into state `brief` + authority order |
| Pick-from-Web capture contract | **Retained, made executable** (`ref-capture`) |
| Provider routing to Impeccable / UUPM | **Rejected** as dependency; detect co-installed design skills and avoid conflicting authority |
| Evidence-boundary wording (observed / blocked / not tested) | **Retained** |

## 6. Unresolved assumptions (recorded, not frozen)

- Module boundaries (UX-4 merged into framing) — revisit after routing logs.
- Whether modules add value beyond scripts on frontier models — pilot seeded-defect arms decide.
- Whether `ref-capture` measurements improve translation vs. plain screenshots — test later.
- Real-site false-positive rate of `render-check` — unknown (sandbox blocks external sites); first thing to measure on the owner's machine.
- Codex hook/plugin install specifics — unverified; Codex path is skills-folder install only.
