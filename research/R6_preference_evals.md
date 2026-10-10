# R6 — Human Preference, Feedback & Evaluation

Track: R6 (WhipUI Next-Generation research). Author: research subagent. Date: 2026-10-10.
Scope: preference elicitation, feedback capture, approval policy, LLM-as-judge reliability for visual quality, small-pilot evaluation design, existing UI-generation benchmarks.
Evidence labels: **[research]** peer-reviewed or arXiv study · **[documentation]** official product/guideline docs · **[practitioner]** industry/UX practice writing · **[anecdote]** secondary report or single-source claim not verified at the primary source.

---

## 1. Most consequential findings (prioritized)

**F1. Aesthetic preference for UI is substantially personal; even professional designers disagree with each other, and off-the-shelf VLM judges sit only slightly above chance at predicting one person's choice.**
DesignPref (Peng, Bigham, Wu; arXiv Nov 2025) had 20 professional designers each judge the same 600 UI pairs. Binary agreement between designers averaged 0.624 (Cohen's kappa / Krippendorff's alpha ≈ 0.25). Zero-shot judges predicting an individual designer's binary choice scored GPT-5 57.7%, Gemini-2.5-Pro 53.7%, Qwen3-VL-235B 55.4%, UIClip 55.1%. Personalized models trained on one designer's labels did better than pooled "majority" models with about 20x less data. The divergence came from recurring axes: information density, light/neutral vs dark/saturated tone, decorative imagery vs utility focus, single vs many primary actions. **[research]**
Implication: the owner's report that AI judging could not separate slop from attractive design (H6) is consistent with published evidence. There is no "objective beauty" target to optimize. The thing worth capturing is *this client's* position on a few contested axes.

**F2. The level of aggregation decides whether an AI judge looks reliable.** ArtifactsBench (Tencent Hunyuan; arXiv Jul 2025) reports 94.4% ranking consistency with WebDev Arena and >90% pairwise agreement with human experts. That number comes from ranking *models* over 1,825 tasks using per-task checklists plus time-sampled screenshots. FrontendBench reports 90.54% agreement with experts, but it scores *functional* test cases. These results do not contradict F1. AI judges can be good at **model-level rankings on checklistable criteria**, such as whether something works or meets a requirement, and still poor at **item-level, person-level taste**. WhipUI needs the second, so benchmark agreement figures should not be imported as evidence that AI can judge WhipUI's outputs. **[research]**

**F3. Comparative presentation beats single-option presentation, for both elicitation quality and design quality.**
- Tohidi et al. (CHI 2006): users shown one design rated it significantly higher and criticized it less than users who saw the same design alongside alternatives. Showing alternatives gives more honest and more critical feedback. **[research]**
- Dow et al. (TOCHI 2010): with prototypes, feedback and time held equal, novices who prototyped in parallel (3, then 2) produced ads with higher click-through, higher expert ratings and more diverse concepts than those who prototyped serially. **[research]**
- NN/g (Fessenden 2024, updating Nielsen 2011): recommends at least 3 alternatives, at most about 5, and **merging** the best ideas rather than picking one winner. It cites a 1996 study in which merged designs beat picking the best single version. **[practitioner, older underlying data]**
- Mantiuk et al. (Computer Graphics Forum 2012): among four subjective quality methods, forced-choice pairwise comparison had the lowest measurement variance and was the most time-efficient for moderate numbers of conditions. **[research, image-quality domain]**
- MLLM-as-a-Judge (ICML 2024): MLLM judges were close to humans on *pair comparison* and diverged on *scoring* and *batch ranking*. **[research]**
Together these support HY5: compare 2–3 rendered options rather than interviewing, and use pairwise choice rather than 1–10 ratings for both human and AI assessment.

**F4. "Too many options" is real but conditional, so keep the option count small for taste decisions.** Scheibehenne et al. (J. Consumer Research 2010; 63 conditions, N=5,036) found a mean choice-overload effect of about zero, with large variance between studies. Chernev et al. (J. Consumer Psychology 2015; 99 observations, N=7,202) found the effect becomes significant under four moderators: choice-set complexity, decision difficulty, **preference uncertainty**, and an effort-minimizing goal. **[research]** A full-page design direction for a client unsure of their taste hits three of the four. Practical rule: show **2–3 genuinely distinct** whole-page directions, and allow more only for small, low-complexity decisions such as palette swatches or type pairings shown on the same layout.

**F5. Current LLM agents under-ask more than they over-ask, and asking helps when the task is genuinely underspecified.** Ambig-SWE (Vijayvargiya et al.; arXiv Feb 2025, rev. Feb 2026; listed at ICLR 2026) found agents struggle to detect underspecification and default to unwarranted assumptions. Allowing interaction raised resolve rates on underspecified tasks by up to 74%. "Ask or Assume?" (Edwards & Schuster; arXiv Mar 2026) found that a scaffold separating underspecification *detection* from execution asked fewer questions on simple tasks and more on complex ones, reaching 69.4% resolve on an underspecified SWE-bench Verified variant. QuestBench (arXiv Mar 2025) found models that solve well-specified problems often still fail to pick the *right* question (40–50% on logic and planning splits). **[research]** These are coding studies, not design studies. Their transferable lesson is that ask-or-proceed should be an explicit, separate decision step, and the *content* of the question needs the same care as the decision to ask.

**F6. The decision-theoretic framing in the brief is well-founded and has a third option the brief omits: do less.** Horvitz (CHI 1999) models act / ask / do nothing as expected-utility curves over the probability that the agent's guess is right, with thresholds that move with context such as interruption cost. Among his principles: "minimize the cost of poor guesses" and "scope the precision of service to match uncertainty", meaning a correct smaller action is better than a risky full one. The Microsoft HAX guidelines (Amershi et al., CHI 2019) include G9 "support efficient correction", G10 "scope services when in doubt", G15 "encourage granular feedback" and G12 "remember recent interactions". **[research/documentation]** For WhipUI, "scope down" means building structure, content and interactions with a neutral, swappable visual layer while a direction choice is pending, rather than either blocking or guessing.

**F7. Interruptions have a real but modest cost: people speed up and feel more stressed.** Mark, Gudith & Klocke (CHI 2008): interrupted participants finished faster with no loss of quality, but reported more stress, frustration, time pressure and effort. **[research]** Batch questions into a few checkpoints, make each answerable in seconds by picking or marking up, and avoid drip-feeding questions.

**F8. Explicit, structured feedback is more useful than implicit signals, and users should see what their feedback changes.** Google PAIR's *Feedback + Control* chapter: implicit signals are ambiguous ("dual feedback"), explicit options should be mutually exclusive and exhaustive, users should be told what will change, and they keep control when the task is enjoyable, high-stakes, personally owned, or the preferences are hard to articulate. **[documentation]** Aesthetic direction for a personal or brand project meets all four conditions, so the agent should keep the human in the loop for direction even in Autopilot.

**F9. Public human-vote arenas are useful references but have known distortions.** WebDev Arena (LMArena blog, Mar 2025, updated Jun 2025) ranks models by Bradley–Terry over pairwise community votes: more than 80k votes, a 26% tie rate, and about 18% "both bad" votes, often caused by build failures. "The Leaderboard Illusion" (arXiv Apr 2025, NeurIPS 2025) documents private variant testing and selective disclosure that inflate arena standings. Design Arena (designarena.ai) calls itself the largest crowdsourced benchmark for AI-generated design, but its homepage does not state the ranking method. **[research/documentation]** Crowd aggregate preference is a different target from one client's preference (see F1), and the methodology is partly opaque.

**F10. Statistical reality for a solo pilot: 10–30 paired judgments detect only large effects.** Calculated here with an exact binomial sign test, two-sided α=0.05, ties excluded. With 20 decisive pairs you need ≥15 wins (75%) to reject 50/50. Power is about 0.42 if the true preference rate is 70% and about 0.80 if it is 80%. With 30 pairs you need ≥21 wins, and power is about 0.59 at 70%. The 95% Wilson interval for 14/20 is [0.48, 0.85]. **[own calculation, scipy]** A pilot can show a *large, obvious* advantage or the lack of one. It cannot establish small or moderate gains. Lindgaard et al. (2006, reported in Nature News) found visual-appeal judgments at 50 ms largely matched longer viewing. **[research, secondary report]** Fast gut-level pairwise choices are therefore a reasonable primary measure, and short exposure keeps sessions affordable.

---

## 2. Primary sources (accessed 2026-10-10)

| # | Source | Pub. date | Label | URL |
|---|---|---|---|---|
| S1 | Peng, Bigham, Wu — *DesignPref: Capturing Personal Preferences in Visual Design Generation* | 2025-11-25 | research | https://arxiv.org/abs/2511.20513 (details: https://arxiv.org/html/2511.20513v1) |
| S2 | Zhang et al. — *ArtifactsBench* | 2025-07-07 (v2 2025-09-29) | research | https://arxiv.org/abs/2507.04952 ; code https://github.com/Tencent-Hunyuan/ArtifactsBenchmark |
| S3 | Si et al. — *Design2Code* (NAACL 2025) | 2024-03-05 (v3 2025-02-09) | research | https://arxiv.org/abs/2403.03163 |
| S4 | Lu et al. — *WebGen-Bench* (NeurIPS 2025) | 2025-05-06 (v2 2025-08-11) | research | https://arxiv.org/abs/2505.03733 |
| S5 | *FrontendBench* (ByteDance) | 2025-06-16 | research | https://arxiv.org/abs/2506.13832 |
| S6 | Chen et al. — *MLLM-as-a-Judge* (ICML 2024) | 2024-02-07 | research | https://arxiv.org/abs/2402.04788 |
| S7 | Zheng et al. — *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* | 2023-06-09 | research | https://arxiv.org/abs/2306.05685 |
| S8 | Shi et al. — *Judging the Judges: Position Bias in LLM-as-a-Judge* (AACL-IJCNLP 2025) | 2024-06-12 (v9 2025-11-11) | research | https://arxiv.org/abs/2406.07791 |
| S9 | Panickssery, Bowman, Feng — *LLM Evaluators Recognize and Favor Their Own Generations* | 2024-04-15 | research | https://arxiv.org/abs/2404.13076 |
| S10 | Wu et al. — *UIClip* | 2024-04-18 | research | https://arxiv.org/abs/2404.12500 |
| S11 | Duan et al. — *UICrit* (UIST 2024) | 2024-07-11 | research | https://arxiv.org/abs/2407.08850 |
| S12 | *Can VLMs Assess Graphic Design Aesthetics?* (AesEval-Bench) | 2026-03-01 | research | https://arxiv.org/abs/2603.01083 |
| S13 | LMArena — *WebDev Arena* blog | 2025-03-10 (upd. 2025-06-13) | documentation | https://arena.ai/blog/webdev-arena |
| S14 | Singh et al. — *The Leaderboard Illusion* | 2025-04-29 | research | https://arxiv.org/abs/2504.20879 |
| S15 | Design Arena homepage | n/a (live site) | documentation | https://designarena.ai |
| S16 | Vijayvargiya et al. — *Ambig-SWE* | 2025-02-18 (v3 2026-02-21) | research | https://arxiv.org/abs/2502.13069 |
| S17 | Edwards & Schuster — *Ask or Assume?* | 2026-03-27 (v2 2026-06-03) | research | https://arxiv.org/abs/2603.26233 |
| S18 | *QuestBench* | 2025-03-28 | research | https://arxiv.org/abs/2503.22674 |
| S19 | Li, Tamkin et al. — *Eliciting Human Preferences with Language Models* (GATE) | 2023-10-17 | research | https://arxiv.org/abs/2310.11589 |
| S20 | Horvitz — *Principles of Mixed-Initiative User Interfaces* (CHI 1999) | 1999 | research | https://www.interruptions.net/literature/Horvitz-CHI99-p159-horvitz.pdf |
| S21 | Amershi et al. — *Guidelines for Human-AI Interaction* (CHI 2019) | 2019-05 | research/documentation | https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf |
| S22 | Google PAIR — *People + AI Guidebook: Feedback + Control* | n/a (living doc) | documentation | https://pair.withgoogle.com/chapter/feedback-controls/ |
| S23 | Mark, Gudith, Klocke — *The Cost of Interrupted Work* (CHI 2008) | 2008 | research | https://www.interruptions.net/literature/Mark-CHI08.pdf |
| S24 | Tohidi, Buxton, Baecker, Sellen — *Getting the Right Design and the Design Right* (CHI 2006) | 2006 | research | https://www.microsoft.com/en-us/research/?p=151922 |
| S25 | Dow et al. — *Parallel Prototyping…* (TOCHI 2010) | 2010 | research | https://cs303.stanford.edu/papers/ParallelPrototyping2010-final.pdf |
| S26 | Fessenden (NN/g) — *Parallel & Iterative Design* | 2024-12-03 | practitioner | https://www.nngroup.com/articles/parallel-and-iterative-design/ |
| S27 | Mantiuk et al. — *Comparison of Four Subjective Methods for Image Quality Assessment* | 2012 | research | https://www.cl.cam.ac.uk/~rkm38/pdfs/mantiuk12cfms.pdf |
| S28 | Scheibehenne et al. — choice-overload meta-analysis (JCR) | 2010 | research | https://ideas.repec.org/a/oup/jconrs/v37y2010i3p409-425.html |
| S29 | Chernev, Böckenholt, Goodman — choice-overload meta-analysis (JCP) | 2015 | research | https://www.kellogg.northwestern.edu/faculty/research/detail/2015/when-product-assortment-leads-to-choice-overload-a-conceptual |
| S30 | Reinecke & Gajos — *Quantifying Visual Preferences Around the World* (CHI 2014) | 2014 | research | https://eecs.harvard.edu/~kgajos/papers/2014/reinecke14visual.shtml |
| S31 | Nature News on Lindgaard et al. 50 ms judgments | 2006-01-13 | research (secondary report) | https://www.nature.com/news/2006/060109/full/news060109-13.html |
| S32 | Anthropic — *Improving frontend design through Skills* | 2025-11-12 | practitioner (vendor) | https://claude.com/blog/improving-frontend-design-through-skills |
| S33 | Agentation README (visual feedback for AI coding agents) | npm 3.1.2 modified 2026-09-22 | documentation | https://cdn.jsdelivr.net/gh/benjitaylor/agentation@main/README.md |
| S34 | marker.js site (licensing/features) | live site | documentation | https://markerjs.com/ |
| S35 | BestHub summary of Contra Labs "Design Crit" study | 2026-06-20 | **anecdote** (secondary; primary not located) | https://www.besthub.dev/articles/can-ai-really-judge-good-design-findings-from-the-design-crit-study-251cb83bc8e8 |

Notes on sources: S35 reports that the best pretrained judge reached 54.3% agreement with designer majority versus 74.1% human–majority agreement, on *text-to-image* outputs. This is directionally consistent with S1, but I could not find the primary paper, so it should not carry weight. S9's self-preference evidence is **text-only**. I found no study verifying self-preference for VLM judges on screenshots, so treat that as a plausible hypothesis. S32 shows only vendor-selected before/after screenshots with no quantitative evaluation.

Annotation libraries verified on npm (2026-10-10): `agentation` 3.1.2 and `agentation-mcp` 1.3.2 use the **PolyForm Shield 1.0.0** license (source-available, *not* OSI open source) and require React 18+ on desktop. `markerjs3` and `markerjs2` are under a custom license (free "linkware" with logo, paid tiers $499–$2,990 per S34). `tldraw` 5.5.2 is under a custom license. MIT/BSD options: `fabric` 7.4.0 (MIT), `konva` 10.7.1 (MIT), `@excalidraw/excalidraw` 0.18.1 (MIT), `@annotorious/annotorious` 3.9.4 (BSD-3-Clause).

---

## 3. Implications for WhipUI

### 3a. Adaptive approval policy (decision rule)

Before each *design decision* (not each tool call), the agent classifies three factors and records them in Design State when it asks or assumes:

- **U, preference uncertainty:** `low` if there is an explicit user statement, an approved decision, repo truth, or the task is Match/Reproduce or Implement-existing. `med` if it is inferred from references or indirect signals. `high` if nothing is known and the decision falls on a contested axis (F1: density, tone/palette, imagery vs utility, action scope, type personality, motion intensity).
- **C, cost of being wrong:** `low` if it is local and reverted in under ~1 minute of user attention plus a small edit. `med` if it is component-level or touches several screens. `high` if it is page-wide or global direction, identity/brand expression, architecture that shapes many later choices, overwriting approved work, deviating from an approved spec, or rights/licensing exposure.
- **A, cost of asking:** higher when the user said "just do it", is in Autopilot, is likely away (long `/goal` run), or a checkpoint was just used.

**Rule:**
1. **Hard ask, regardless of U.** Changing or overriding an *approved* decision, reinterpreting a provided spec or Figma, using third-party assets with unclear rights, or professional disagreement where the user's request would materially harm accessibility or usability (state options and consequences).
2. **Ask with a visual choice** when U ≥ med **and** C = high, unless the user explicitly delegated taste ("surprise me", "your call"). In that case proceed, mark the result `proposed`, and present it as such.
3. **Scope down, then ask at the next checkpoint** when U ≥ med and C = med, or when the user is away. Build what doesn't depend on the answer (structure, content, states, responsive behavior) behind swappable tokens, and collect pending questions for one batched checkpoint.
4. **Proceed with an assumption** when U = low, or C = low. Log the assumption in one line and make it easy to correct (HAX G9).
5. **Budget:** at most one blocking checkpoint per phase (direction, then pre-ship review). Every question must be answerable by picking, marking up, or one sentence. Never send open-ended "what style do you like?" as the first move (F3, S19).

| Situation | U | C | Action |
|---|---|---|---|
| `/goal` landing page for a new indie game, no references, no brand | high | high | Show 2–3 rendered directions on real content; user picks or marks up |
| Same goal, user attached 3 liked sites and said "fast, I trust you" | med | high | Proceed with a direction derived from refs; label `proposed`; show at first checkpoint |
| Fix misaligned button in existing app | low | low | Proceed; report fix with before/after screenshot |
| Add settings page to an app with an established token system | low | med | Proceed following existing system; no question |
| Existing system lacks a pattern (e.g., data table density) and two plausible options exist | med | med | Scope down: build table with density token; ask at checkpoint with two screenshots |
| Reproduce a screenshot; agent thinks the target's contrast is poor | low (fidelity) | high (spec deviation) | Reproduce faithfully; note the a11y issue with an optional fix; do not change unasked |
| User requests 11px light-gray body text on a public site | n/a | high (a11y) | Hard ask: explain consequence, offer 2 compliant alternatives close to intent |
| Motion intensity for a portfolio hero, no signals | high | med | Implement a restrained default with an intensity variable; show a short recording of 2 intensities at checkpoint |
| Choosing between two equally good icon libraries | low relevance | low | Proceed; log |

What counts as approval: the user's explicit words or action on an artifact ("go with B", a marked checkbox in the review page). Picking option B approves **B's direction at the level it was shown**, not every pixel (brief §7). Silence, continued conversation, or "looks fine so far" while the user is mid-task are *observed signals*, not approvals.

### 3b. Human feedback protocol

**Presenting options (co-design checkpoint)**
1. Render 2–3 directions that differ on the 1–2 contested axes that matter most for this brief (F1, F4). They should use the same real content, the same viewport set (desktop plus mobile), and stay *genuinely distinct*, not three tints of one layout. Include a "both/none" exit.
2. Label options neutrally (1/2/3) and shuffle the on-screen order. Show the visuals **before** the agent's rationale so the user reacts to the image, not the pitch. Reveal a 2–3 line rationale and the main trade-off after the first reaction.
3. Ask for three things: (a) which direction to develop, or "none"; (b) on *any* option, mark what to keep and what to lose ("this, not that"); (c) optional one-line "why". Alternatives produce more critical feedback than a single design (S24), and a merged direction often beats a single winner (S26). The agent should explicitly offer "B with A's typography" merges.
4. For low-complexity sub-decisions (palette, type pairing), up to ~4–6 swatches on one fixed layout is acceptable.
5. If the user rejects all options twice, switch to reference reactions (show 4–6 external references and ask for like/dislike tags), then regenerate. Do not keep generating blind variations.

**Capturing annotated feedback.** Default: a dependency-free single HTML review page generated by a script (no build step, works offline). It shows the screenshot(s) at known viewport sizes with an SVG overlay. Tools: rectangle/ellipse, arrow, pin-with-comment, and a tag per mark (`keep | change | remove | bug | question`), plus a page-level verdict (`approve | approve-with-changes | not-yet`). It exports `feedback.json` (download or copy). If the project is React and the owner accepts PolyForm Shield terms, Agentation is an optional live-DOM alternative that already emits selectors (S33). MIT libraries (Konva, Fabric, Excalidraw) are options if the hand-rolled overlay proves insufficient. Recommend testing the custom page first, since a ~200-line overlay avoids license and dependency questions.

**Annotation → scoped change.** For each mark:
- Map the bbox to DOM nodes by replaying the same viewport and calling `elementFromPoint` / bounding-box intersection. Record selector, component file, and confidence.
- Write a change ticket: `{id, target, user_words (verbatim), interpreted_change, scope: element|component|page|global, confidence, needs_confirmation}`.
- Default to the **narrowest scope** consistent with the words. Widen to component or global only if the user said so ("everywhere", "all headings") or confirms. "This font feels cheap" circled on one heading means change that heading's style token *proposal* and ask whether it applies globally at the next checkpoint.
- After applying, regenerate the review page with before/after and tickets marked done, so the user sees what changed (S22).

**Recording preferences vs approvals (Design State):**
- `decisions[]`: `status: proposed | approved | rejected | superseded`, `approved_by: user`, `evidence: feedback.json#mark-7 | message turn`, `scope`.
- `preferences[]`: observed signals with `axis` (e.g., density: sparse), `polarity`, `evidence`, `confidence: low|med|high`, `scope: this-project | this-page`. They never auto-promote to `approved`, and they never become global personal facts.
- Rejections are first-class: "rejected: dark saturated palette (mark-3, 'too gamer')" prevents re-proposing it.

### 3c. Pilot evaluation design (arms A–D)

**Pre-registration (anti-cherry-picking).** Before any run, commit `eval/preregistration.md` containing the brief texts, reference sets for B–D, arm configs, model and effort, budgets, metrics, analysis plan, decision thresholds, and the stopping rule. Record its git hash in every result row. Every run is reported, including failures. No reruns unless a run crashed for infrastructure reasons, and each such rerun is logged.

**Brief set (8 briefs, each tied to a task family; mix of sparse/detailed and creative/utilitarian):**

| ID | Family | Brief sketch | Primary human judgment |
|---|---|---|---|
| B1 | CREATE_TO_SHIP, sparse, creative | One-line `/goal`: landing page for an indie rhythm game | Preference + identity fit |
| B2 | CREATE_TO_SHIP, detailed, utilitarian | Full spec for a small-team expense dashboard (data, roles, states) | Preference + task fit; usability check |
| B3 | DESIGN_ONLY | Three-screen onboarding concept for a study-planner mobile app | Preference |
| B4 | REFERENCE_ADAPT | Translate the mechanisms of 2 supplied editorial sites to a university lab homepage | Preference + "borrowed, not copied" check |
| B5 | REPRODUCE_TARGET | Rebuild a supplied permissively licensed screenshot | **Fidelity** (pick closer to target), not preference |
| B6 | EXTEND_EXISTING_SYSTEM | Add a settings page to a seeded repo with tokens and components | Consistency with system + preference |
| B7 | POLISH_OR_REPAIR | Seeded page with ~8 planted visual, a11y and responsive defects | Defects fixed / regressions (objective) + preference |
| B8 | MOTION_ONLY | Add page-transition and hover choreography with reduced-motion fallback | Preference on **recordings**, not stills |

Brief texts should be written by the owner or taken from realistic needs, not by the agent being tested. If the agent writes them, flag this as a threat to validity.

**Arm control (what is held equal):** model and version, thinking effort, tool permissions (browser, screenshot, build, a11y), seeded repo, viewport set, a **wall-clock cap and token cap per run**, and a **max of N self-review render iterations** (same N for all arms). The reference set is identical for B, C and D. D may *add* retrieved refs; log every added ref so its effect is visible. Human feedback budget: Phase 1 below gives *no* arm human feedback beyond D's elicitation step. Run **one seed per arm per brief**, plus a second seed of A and D on two briefs to estimate within-arm variance. If two A seeds differ as much as A vs D, conclusions weaken.

**Phase 1: blinded first-delivery comparison.**
- D's elicitation questions are answered by the owner *before* any outputs exist, using a written answer sheet that is saved and pre-registered as part of D's input. Arms A–C receive the same brief without those answers. This is part of D's tested value, and the asymmetry must be reported. Ablation option: give A the same answer sheet ("A+answers") to separate the value of *asking* from the rest of the system.
- Outputs are captured by a script: full-page screenshots at 1440 and 390 widths, plus a ≤15 s recording for B8 and interactive pages. Files get random IDs, and a separate key file maps IDs to arms. The owner never opens the key until analysis.
- The judging page shows pairs side by side with **left/right randomized**. Judgment is forced choice with an explicit tie button ("can't choose / both bad"), plus an optional 1-line reason and a goal-fit tick. Aim for about 30–60 s per pair (F10).
- Pairs per brief: the three planned contrasts **B–A** (are refs most of the value?), **C–B** (does workflow add beyond refs?), **D–A** (is the full system worth it?), plus D–C if time allows. That gives 24–32 judgments. Add **6 retest pairs** (repeats with sides swapped, mixed in late or on another day) for intra-rater consistency.
- Optional extra raters: 2–5 people judge the same pairs for an end-user view. Analyze them separately from the owner, since F1 says they measure a different target.

**Phase 2: iteration to approval (interaction economics).** Each arm's output goes through the same annotation review page until the owner marks `approve` or 3 rounds pass. The owner sees "Variant 7", not the arm. Record rounds, owner active minutes (timer in the page), number and severity of change tickets, and agent tokens and cost per round. D's own extra questions count toward owner minutes. Blinding is partial here, since D's style of interaction is recognizable; report that.

**Secondary/objective checks (AI + tools, not taste):** axe violations count, console errors, responsive breakage at 3 widths, planted-defect recall (B7), reduced-motion compliance (B8), fidelity diff (B5), and lines and components changed outside requested scope (spec drift).

**AI judge (diagnostic only).** Run a VLM pairwise judge on the same pairs **in both orders**. Count a win only if it is consistent across orders (S7, S8). Report the judge's agreement with the owner. Use different model families from the generator where possible, because of self-preference risk (S9). Never use it as a primary outcome.

**Analysis.**
- Per contrast: wins/losses/ties, ties excluded from the sign test. Report the win rate with a 95% Wilson CI and an exact binomial p-value. Also report a **brief-clustered bootstrap** CI that resamples briefs, since pairs within a brief are correlated.
- Overall ranking: a Bradley–Terry fit across A–D with bootstrap CIs (resample briefs). Present it as descriptive.
- Costs: median and range of tokens, wall-clock, tool calls, and cost per arm, plus the D/A ratio.
- Phase 2: median rounds-to-approval and owner minutes per arm, and the share approved within 3 rounds.
- Intra-rater consistency: the share of the 6 retests with the same choice. If ≤ 4/6, treat close contrasts as indistinguishable from noise.

**Honest power statement (include verbatim in the report):** "With about 8 decisive judgments per contrast this pilot can only flag very large effects, near-unanimous preference. Pooling across contrasts or briefs to about 20–30 judgments detects a true 80% preference with about 0.8 power and a 70% preference with only about 0.4–0.6 power. A null result does *not* show equivalence. A positive result is preliminary and needs replication with more briefs or raters."

**Pre-registered decision thresholds (practical, not significance-driven):**
- **Shrink/redirect WhipUI** if D–A owner win rate ≤ 60% (point estimate) *and* D/A cost ratio ≥ 1.5, or if B–A carries most of the D–A margin (references explain the gain).
- **Promising, replicate** if D–A ≥ 75% with no secondary regressions (a11y, fidelity, spec drift) and Phase 2 owner minutes for D are ≤ those of A.
- **Investigate fixture contamination** if outputs across unrelated briefs share recurring visual patterns, judged by the owner on a contact sheet of all D outputs.

**Stopping rule:** fixed sample. Run all 8 briefs × planned arms, then analyze once. Early stop only for (a) infrastructure failure in more than 2 runs of one arm (fix, rerun that arm entirely, log it), or (b) owner fatigue. Never stop because one arm is "clearly winning". If the result lands between the thresholds, the pre-registered next step is adding 6–8 new briefs, not re-judging existing ones.

**Scoring sheet (`eval/judgments.csv`):**
```
prereg_hash,session_id,rater_id,timestamp,phase,brief_id,task_family,pair_id,contrast,left_output_id,right_output_id,left_arm_hidden,right_arm_hidden,choice(left|right|tie|both_bad),strength(1|2),goal_fit_left(0|1),goal_fit_right(0|1),reason_text,seconds_to_decide,is_retest,retest_of_pair_id,viewport_or_media(desktop|mobile|video)
```
Arm columns are filled from the key file *after* judging.

**Run log (`eval/runs.csv`):**
```
prereg_hash,run_id,brief_id,arm,seed,model,effort,start_ts,end_ts,wall_clock_s,input_tokens,output_tokens,cost_usd,tool_calls,render_iterations,refs_given,refs_added,questions_asked,owner_minutes_elicitation,build_ok,console_errors,axe_violations,responsive_breaks,planted_defects_fixed,out_of_scope_changes,phase2_rounds,phase2_owner_minutes,phase2_tickets,approved(0|1),failure_notes
```

---

## 4. Counterevidence, failure modes, keep/reject/test, uncertainty

**Counterevidence and competing explanations**
- *AI judges can be good:* S2, S5 and S7 report ≥80–94% agreement. This is plausible for checklistable or functional criteria and model-level rankings. It would falsify the "don't use AI for taste" stance only if an AI judge reached owner-level agreement (≥ the owner's own retest consistency) on the owner's pairs. The pilot measures exactly this, so let it decide.
- *Personalization could make AI useful after all:* S1 shows retrieval of a person's own labels nudged GPT-5 up (57.7% → 58.9% binary), a small gain. A WhipUI "taste profile" from about 20–50 owner pairwise labels could become a cheap pre-filter. Test later; never treat it as an approval.
- *Comparison has costs:* producing 2–3 rendered directions costs about 2–3x the tokens of one. Dow's parallel-prototyping evidence held time constant for *humans*. For agents, the cost is compute, and the benefit is unmeasured. If D's direction step does not reduce Phase 2 rounds, the economics fail.
- *Anchoring and fixation:* options shown first can anchor the client, and references can fixate the generator. This is the design-fixation literature (e.g., Jansson & Smith 1991; I did not re-verify it at the primary source this session). Mitigations: randomized order, genuinely distinct axes, visual-before-rationale, and an explicit "none" path.
- *Owner as sole rater:* the owner's taste is the legitimate target for owner projects, but not for end-user usability (brief §4) or for client work with other stakeholders. Results generalize to "this owner" only. Reinecke & Gajos (S30) show aesthetic preference varies systematically by demographic group.
- *Learning effects:* the owner sees many outputs on the same brief, so judgments may drift. Retest pairs and randomizing brief order partly control this.
- *Coding-agent clarification evidence may not transfer to aesthetics:* S16–S18 concern bugs and specifications. In design, a visual option is often a better "question" than words, which is untested here.

**Keep / reject / test later**

| Item | Verdict | Rationale / cost |
|---|---|---|
| Pairwise forced choice as primary human measure | **Keep** | Most reliable per S27, S6; cheap per judgment |
| 2–3 distinct rendered directions for high-U×C decisions | **Keep** | S24, S25, S26, S29; ~2–3x generation cost on those decisions only |
| "Scope down" while awaiting taste input | **Keep** | S20 principle 9; low cost, preserves `/goal` flow |
| Approval vs observed-signal separation in state | **Keep** | Brief §7; S22; negligible cost |
| Custom HTML annotation page with JSON export | **Keep (build and test)** | No license or dependency risk; validate usability with owner in pilot |
| Agentation as a hard dependency | **Reject** (optional adapter) | PolyForm Shield license, React-only (S33) |
| 1–10 aesthetic rating scales (human or AI) | **Reject** as primary | S6, S27: higher variance, weaker human alignment |
| AI aesthetic judge as outcome or approval proxy | **Reject** | S1, S35, H6; keep as order-swapped diagnostic |
| Open-ended taste interviews as first move | **Reject** | S19, S24: elicitation through concrete artifacts is more informative |
| Personal taste-profile model from owner labels | **Test later** | S1 suggests modest gains; needs ≥ a few dozen labels |
| AI critique for technical/UX defects (a11y, states, layout breakage) | **Keep** | Checklistable, verifiable by tools; S2, S5 |
| AI design-critique prose (UICrit style) | **Test later** | S11: LLM critiques below human level; few-shot plus visual prompting improved them ~55% |
| Using public arenas (WebDev/Design Arena) as evidence for WhipUI | **Reject** as evidence; **keep** as model-selection hint | S13–S15 measure crowd preference over models, with known distortions |

**Uncertainty and unsupported claims**
- The Design Crit numbers (S35) are from a secondary article. I could not locate the primary paper.
- I found no published study of VLM *self-preference* on UI screenshots. That risk is inferred from text-judge results.
- Practitioner conventions like "present 2–3 concepts", "show don't ask" and "this not that" are widely repeated, but I found no controlled study of agent-generated design directions with real clients. HY5 remains a hypothesis that the pilot's Phase 2 can test.
- Power figures are my own exact-binomial calculations under an independence assumption. Clustering by brief reduces effective sample size further.
- The thresholds (60%, 75%, 1.5x cost, 4/6 retest) are judgment calls chosen for a small pilot, not established standards. They must be fixed in pre-registration before data is seen.
- WebGen-Bench (S4) measures functional correctness through an agent tester with low absolute accuracy (best 27.8% for an open agent stack, 38.2% after fine-tuning). Design2Code (S3) found humans judged GPT-4V outputs better designed than the original reference in 64% of cases, and position and CLIP similarity correlated best with human win/lose. Both are useful as reference designs for fidelity and functional checks, not as judges of WhipUI's aesthetic value.
