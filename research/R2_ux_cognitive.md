# R2: UX and cognitive design research for WhipUI Next

Track: R2 · Author: research subagent · Date: 2026-10-10 · All sources accessed 2026-10-10.
Labels used here: **[R]** = peer-reviewed or controlled research. **[D]** = standards or design-system documentation. **[P]** = practitioner or industry research, often proprietary, method only partly visible. **[A]** = anecdote or example-based argument. **[INF]** = my own inference, not stated by the source.

---

## 1. Most consequential findings (prioritized)

1. **No single reviewer finds most usability problems, and that includes an AI reviewer. Treat agent UX review as a partial-recall screen, not a verdict.**
   - Evaluator effect: across 33 studies, the median agreement between any two evaluators is 27% (range 4–75%). When evaluators watch the same sessions, it rises to about 59% [P, summarizing R]. In Jacobsen/Hertzum 1998, only 20% of problems were found by all evaluators and 46% by just one [R].
   - GPT-4 heuristic feedback on mockups (Duan et al., CHI'24) had precision 0.60 vs 0.83 for human evaluators and recall 0.38 vs 0.34. Its typical failures were over-applying guidelines (it asked for labels on universally recognized icons), repeating the same issue for every element, missing global or contextual problems, and getting worse in later iterations once the easy issues were fixed [R].
   - GPT-4o on screenshots found only 21.2% of the issues experts found, and produced hallucinated or speculative issues [R].
   - GPT-4o on source code was internally consistent at deciding whether an issue exists (κ≈0.5) but weak on severity (exact agreement about 56%) [R].
   - → WhipUI should rely on render-based checks and diagnostic patterns tied to evidence, and should report AI critique with its confidence and as advisory.

2. **Automated accessibility testing covers a minority of WCAG and a variable share of real issues. An axe pass is not a claim of accessibility.**
   - GDS planted 143 barriers. The best single tool found 37–41% of them, all tools combined about 71%, and 29% were missed by every tool. Complex widgets were not even included in the test page [D/P, 2017].
   - Deque reports that axe finds 57% of issues *by volume*: 13k pages and about 300k issues, a vendor study from 2021. The figure is high because common, easily detected issues dominate the count. The often-cited 20–30% figure counts *success criteria* instead [P].
   - WebAIM Million 2026: 95.9% of home pages had detectable failures, with 56.1 errors per page on average. Top failures were low contrast (83.9%), missing alt text (53.1%), missing input labels (51%), empty links (46.3%) and empty buttons (30.6%). Pages with ARIA averaged 59.1 errors vs 42 without. WebAIM says this is correlational, partly explained by complexity [P].
   - An LLM repair agent study (May 2026) found detection F1≈0.65, strongest on semantic issues. Fewer than 26% of cases were fully resolved, and iterative refinement cost 52% more compute without better outcomes [R, preprint].
   - → Split acceptance criteria into "machine-verified", "agent-judged (advisory)" and "human-required" (§4). Avoid adding ARIA reflexively.

3. **WCAG 2.2 AA is still the target. WCAG 3 is a Working Draft and must not be used for conformance claims.**
   - The latest WCAG 3 Working Draft is dated 10 Sep 2026. It is explicitly a work in progress, and its conformance model (requirements, assertions, tiers) is still under review [D].
   - W3C says WCAG 3 is "a few more years" from completion, and recommends meeting WCAG 2.2 now. WCAG 2 will not be deprecated until years after WCAG 3 is final [D].
   - The 2.2 additions that most affect generated UI are:
     - 2.4.11 Focus Not Obscured: the sticky-header trap.
     - 2.5.7 Dragging alternatives.
     - 2.5.8 Target Size Minimum: 24×24 CSS px, or the spacing exception and four others.
     - 3.3.7 Redundant Entry.
     - 3.3.8 Accessible Authentication.
     - 3.2.6 Consistent Help.
     - 4.1.1 Parsing was removed [D].

4. **Several popular UX "laws" are overstated or misapplied. These are the knowledge most worth encoding, because models repeat them uncritically.**
   - **Three-click rule.** Porter/UIE analysed 44 users, 620 tasks and more than 8,000 clicks. Click count did not correlate with success or satisfaction, and users did not quit more after 3 clicks than after 12 [P].
   - **Miller's 7±2 for menus.** It is a recall limit, while menus rely on recognition. Cowan's later work puts working-memory capacity nearer 4 chunks, which also isn't a menu rule [P citing R].
   - **Choice overload.** A meta-analysis of 50 experiments (N=5,036) found a mean effect of "virtually zero" with high heterogeneity, and no *sufficient* conditions for the effect [R].
   - **F-pattern.** NN/g frames it as a *failure mode* of unformatted text, not a layout to design for. Other scanning patterns: layer-cake, spotted, marking, bypassing, commitment [P].
   - **Fitts on touch.** Edges and corners are *harder* to tap on touch screens, the opposite of the mouse "infinite edge" rule. Grip varies and shifts every few seconds: one-handed 49%, cradled 36%, two-handed 15% (n=780 touch users). Hoober later disowned his own "thumb zone" drawings [P].
   - → Encode each with its counterexample so the agent stops citing it as justification.

5. **The cost of a flow comes from the work done at each step, not the number of steps or clicks.**
   - Baymard: one-page vs multi-step checkout matters less than per-step burden [P].
   - The average checkout has 11.3 fields (2024) against roughly 8 needed [P].
   - GOV.UK recommends "one thing per page" by default but allows grouping when research shows it helps, e.g. internal expert users switching tasks [D].
   - Removing a 12-step progress indicator had no effect on completion (Carer's Allowance) [D/A].
   - → The diagnostic question is "what does each step ask of the user?", not "how many steps?".

6. **Authoritative sources disagree on form validation timing. That is decision-relevant knowledge, not noise.**
   - Baymard (e-commerce testing) recommends inline validation on blur, live removal of errors once fixed, and positive confirmation. It warns against premature errors shown while typing and stale error messages. 31% of sites have no inline validation at all [P].
   - GOV.UK recommends validating on submit, not on blur, because live validation hurts slow typists. Show an error summary that receives focus, with links to the fields, and prefix the page title with "Error: " [D].
   - Both advise against validating while the user is still typing.
   - → The agent should choose based on context (audience diversity, form length, regulatory or assistive-tech weight, checkout speed) and state the trade-off.

7. **Hidden navigation reduces use of the navigation, and the effect is strongest on desktop.**
   - NN/g (2016, 179 users, 6 sites) found hidden navigation lowered discoverability on both desktop and mobile, with a larger impact on desktop [P].
   - On mobile, combined navigation (some items visible, the rest collapsed) did significantly better than a small, low-contrast hamburger: 89% vs 44% navigation use [P].
   - Guidance: show navigation if there are about 4–5 top-level items, otherwise use combined navigation. If you must hide it, make the trigger salient and labelled [P].
   - Baymard: horizontal tabs on product pages caused testers to miss core content repeatedly. Use expanded sections on desktop and collapsed sections on long mobile pages [P].

8. **States and onboarding: the evidence favours in-context help over front-loaded tutorials, and exact semantics for each state.**
   - NN/g: deck-of-cards tutorials did not improve task performance. Onboarding is justified only when the app needs data to start, depends heavily on context, or has a genuinely novel feature [P].
   - Empty states should communicate system status, give learning cues and offer direct pathways. Showing "No records" while content is still loading erodes trust [P].
   - Loading indicators by expected wait: none under 1 s; a spinner for a single module or a skeleton for a full page at 2–10 s; a progress bar with an estimate beyond 10 s. These thresholds are the author's guidance, not measured results [P].

9. **The cheapest valid test depends on the question. "5 users" is a discovery heuristic with known variance, not a validation standard.**
   - Faulkner (n=60, simulated subsets) found 5 users uncover 85% of problems on average, but as few as 55% in some samples. Ten users averaged 95% with a lower bound of 82% [R].
   - Sauro: 5 users have an 85% chance of seeing a problem that affects at least 31% of users. For problems affecting about 10% of users, roughly 18 users are needed. Iterate in rounds [P].
   - Comparing IA trees needs about 50 or more participants per tree. Median tree-test success is 62% [P].
   - First-click tests: in Bailey & Wolfson's live-site data, users succeeded 87% of the time when their first click was correct vs 46% when it wasn't. Image click tests broadly match live clicks (about 6% average difference), but diverge where hover menus or responsive layouts matter [P].
   - Synthetic AI users are sycophantic and idealized, and show reduced variance. A 2026 review of 12 papers found 9 encouraging vs 14 discouraging findings. They are useful only for hypotheses and for piloting interview guides [P].

10. **Turn vague goals into criteria with goals → signals → metrics and job stories. Each question or field needs a justification.**
    - Google's HEART framework (CHI 2010) maps goals → signals → metrics [R/P].
    - Job stories use the form "When [situation], I want to [motivation], so I can [outcome]". They suit cases where roles don't differ much [P].
    - GOV.UK's "question protocol" asks for every field: why it is needed, what will be done with it, who provides it, how it is checked, and how it is kept secure [D].
    - These give the agent a compact, checkable bridge from a `/goal` to acceptance criteria without running an interview.

---

## 2. Primary sources (all accessed 2026-10-10)

| # | Source | Pub. date | Type |
|---|---|---|---|
| S1 | MeasuringU, "How Large Is the Evaluator Effect…" https://measuringu.com/evaluator-effect/ | 2018-03-28 | P (meta-summary of R) |
| S2 | Jacobsen, Hertzum, John, HFES 1998 abstract https://researchprofiles.ku.dk/en/publications/the-evaluator-effect-in-usability-studies-problem-detection-and-s/ | 1998 | R |
| S3 | Duan et al., "Generating Automatic Feedback on UI Mockups with LLMs", CHI'24 https://people.eecs.berkeley.edu/~bjoern/papers/duan-heuristic-chi2024.pdf | 2024-05 | R |
| S4 | Guerino et al., "Can GPT-4o Evaluate Usability Like Human Experts?" https://arxiv.org/abs/2506.16345v1 | 2025-06-19 | R (preprint/LNCS) |
| S5 | Platt et al., "Catching UX Flaws in Code" https://arxiv.org/html/2512.04262v1 | 2025-12-03 | R (preprint) |
| S6 | GDS, tools on the least accessible webpage https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/ | 2017-02-24 | D/P |
| S7 | Deque 57% coverage study https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues | 2021-03-10 | P (vendor) |
| S8 | WebAIM Million 2026 https://webaim.org/projects/million/ | updated 2026-03-30 | P |
| S9 | Oyelayo et al., "LLM Based Web Accessibility Repair" https://arxiv.org/abs/2605.27716 | 2026-05-26 | R (preprint) |
| S10 | W3C WCAG 3 intro https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/ ; WD https://www.w3.org/TR/wcag-3.0/ | page 2026-09-25; WD 2026-09-10 | D |
| S11 | W3C What's new in WCAG 2.2 https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ | 2023-10-05 | D |
| S12 | W3C WAI Evaluating accessibility https://www.w3.org/WAI/test-evaluate/ | n/d | D |
| S13 | Porter, "Testing the Three-Click Rule" (UIE/Center Centre) https://articles.centercentre.com/?p=17 | ~2003 (not on page) | P |
| S14 | Walter, "Your menu doesn't need Miller's 7±2" https://stephaniewalter.design/blog/your-menu-doesnt-need-millers-7%C2%B12-rule/ | n/d | P citing R |
| S15 | Scheibehenne et al. 2010, J. Consumer Research https://ideas.repec.org/a/oup/jconrs/v37y2010i3p409-425.html | 2010 | R |
| S16 | NN/g, F-shaped pattern https://nngroup.com/articles/f-shaped-pattern-reading-web-content/ | 2017-11-12 (rev. 2026-08-19) | P |
| S17 | Hoober, "Fitts' Law in the Touch Era" https://smashingmagazine.com/2022/02/fitts-law-touch-era/ | 2022-02-09 | P |
| S18 | Hoober, "How Do Users Really Hold Mobile Devices?" https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php | 2013-02-18 | P (observational) |
| S19 | Baymard, one-page vs multi-step checkout https://baymard.com/blog/one-page-checkout | 2011-04-26 | P |
| S20 | Baymard, checkout form fields https://baymard.com/blog/checkout-flow-average-form-fields | 2024-06-26 | P |
| S21 | GOV.UK question pages https://design-system.service.gov.uk/patterns/question-pages | n/d (live) | D |
| S22 | GOV.UK Service Manual, form structure https://www.gov.uk/service-manual/design/form-structure | 2016-12-07 (upd. 2018) | D |
| S23 | Baymard, inline validation https://baymard.com/blog/inline-form-validation | 2024-01-09 | P |
| S24 | GOV.UK validation pattern https://design-system.service.gov.uk/patterns/validation/ ; error summary https://design-system.service.gov.uk/components/error-summary/ | live | D |
| S25 | NN/g hidden nav desktop https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/ ; mobile https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/ | 2016-07-24 | P |
| S26 | Baymard, avoid horizontal tabs https://www.baymard.com/blog/avoid-horizontal-tabs | 2018-10-17 (upd. 2026-07-08) | P |
| S27 | NN/g mobile onboarding https://www.nngroup.com/articles/mobile-app-onboarding/ | 2020-06-21 | P |
| S28 | NN/g empty states https://nngroup.com/articles/empty-state-interface-design | 2021-09-19 | P |
| S29 | NN/g skeleton screens https://www.nngroup.com/articles/skeleton-screens/ | 2023-06-04 | P |
| S30 | Faulkner 2003 (via HFI newsletter) https://www.humanfactors.com/newsletters/enough_is_enough.html ; PubMed https://pubmed.ncbi.nlm.nih.gov/14587545/ | 2003 (newsletter 2004-05) | R |
| S31 | Sauro, five users explained https://measuringu.com/five-users/ | 2010-03-08 | P |
| S32 | Nielsen, test with 5 users https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/ | 2000-03-18 | P |
| S33 | NN/g interpreting tree tests https://nngroup.com/articles/interpreting-tree-test-results/ | 2024-01-19 | P |
| S34 | MeasuringU, click tests vs live https://measuringu.com/do-click-tests-predict-live-site-clicks/ | 2023-03-21 | P (controlled, n=130) |
| S35 | NN/g synthetic users https://www.nngroup.com/articles/synthetic-users/ | 2024-06-21 | P |
| S36 | MeasuringU, review of synthetic-user experiments https://measuringu.com/review-of-experiments-with-synthetic-users/ | 2026-04-14 | P (review of 12 R) |
| S37 | Rodden, Hutchinson, Fu, HEART, CHI 2010 https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/ | 2010 | R/P |
| S38 | Mountain Goat, job stories https://www.mountaingoatsoftware.com/blog/job-stories-offer-a-viable-alternative-to-user-stories | upd. 2024-07-11 | P |
| S39 | NN/g flat vs deep hierarchy https://www.nngroup.com/articles/flat-vs-deep-hierarchy/ | 2013-11-10 | A/P (example-based) |
| S40 | NN/g placeholders https://www.nngroup.com/articles/form-design-placeholders/ | 2014-05-11 | P |
| S41 | NN/g scrolling and attention https://www.nngroup.com/articles/scrolling-and-attention/ | 2018-04-15 | P (eyetracking) |
| S42 | GOV.UK button (disabled, double-click) https://design-system.service.gov.uk/components/button/ | live | D |
| S43 | NN/g data tables https://www.nngroup.com/articles/data-tables/ | 2022-04-03 | P |
| S44 | Holst/Baymard, pagination vs infinite vs load-more https://smashingmagazine.com/2016/03/pagination-infinite-scrolling-load-more-buttons | 2016-03-01 | P |
| S45 | NN/g heuristic evaluation how-to https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/ | 2023-06-25 | P |

---

## 3. Implications for WhipUI

### 3a. Proposed knowledge modules (lazily loaded)

| Module | Contents | Load trigger |
|---|---|---|
| **UX-1 Framing → Criteria** (~1.5k tokens) | Job-story template; a 5-question task analysis (who, trigger situation, key task, success signal, failure cost); HEART goals→signals→metrics; GOV.UK question protocol for every field; a recipe for turning a goal into 3–7 testable criteria, each tagged machine / agent-advisory / human; a rule for when to ask the user (unknown audience, or an unknown primary task on a multi-purpose page) | Sparse `/goal`; CREATE_TO_SHIP or DESIGN_ONLY without a stated audience or task; DIAGNOSE ("why doesn't this work?"); requests like "improve conversion/usability" |
| **UX-2 Flows, IA & State Patterns** (diagnostic table, ~3k tokens; the agent reads only matching rows) | The diagnostic patterns in §3b; navigation choice rules; form validation trade-offs; loading, empty and error semantics; tables, lists and pagination; onboarding; the "law" counterevidence list | Task touches navigation, multi-step flows, forms, tables or lists, onboarding, or loading/empty/error states, *or* the agent is about to cite a UX law as justification |
| **UX-3 Accessibility Verification** (~2k tokens plus scripts from R5) | A WCAG 2.2 AA map split into automatable, agent-judged and human-required checks (§4); notes on what axe misses; the 2.2 deltas; WCAG 3 status line; "ARIA last" rule; screen-reader claims require human or AT testing | Any implementation with a render check; AUDIT or REPAIR tasks; user mentions a11y, gov, edu, health or finance |
| **UX-4 Evidence & Validation Planning** (~1k tokens) | When expert or heuristic review is enough vs when testing is needed; cheapest valid test per question (first-click, tree test, 5-user rounds, unmoderated); sample-size caveats; synthetic-user limits; AI-review limits (S3–S5) and how to word confidence | Contested or high-stakes UX decision; user asks "will users understand / which is better?"; disagreement between client preference and usability (§4 of the brief) |

UX-4 could be folded into UX-1 if routing tests show it is rarely loaded on its own. **[INF]**

### 3b. Diagnostic patterns

Each pattern reads: symptom → likely causes → checks → interventions → when *not* to apply.

1. **Navigation ignored, or users rely on search on desktop**
   - Causes: hamburger on desktop; small, low-contrast menu trigger; low-scent labels.
   - Checks: is navigation visible at ≥1024 px? How many top-level items? Trigger contrast and size? Label specificity?
   - Interventions: show the top 4–5 items, put the rest in combined navigation; give the trigger a text label. (S25)
   - Not when: immersive or game UI, single-task tools, or "nothing else to click" pages, where a hamburger works acceptably.
2. **Specs or reviews missed on detail pages**
   - Causes: horizontal tabs.
   - Checks: is primary decision content behind a non-default tab?
   - Interventions: expanded sections on desktop; collapsed sections on long mobile pages. (S26)
   - Not when: tabs switch between *parallel alternatives* of the same content (code language, chart vs table) where users want only one.
3. **Users frustrated by form errors**
   - Causes: errors shown while typing; stale errors after correction; placeholder used as label.
   - Checks: when is validation triggered? Does the error clear once fixed? Is there a persistent visible label?
   - Interventions: never validate mid-typing; validate on blur with live clearing (Baymard) *or* on submit with a focused error summary (GOV.UK); use visible labels. (S23, S24, S40)
   - Not when: fixed-length fields (card number, ZIP code) can validate when the expected length is reached; a character count can be live.
4. **"Form feels too long"**
   - Causes: unjustified fields; mixed concerns on one page.
   - Checks: run the question protocol on each field; count fields against necessity. (S20, S22)
   - Interventions: delete or defer fields; branch eligibility questions first; one thing per page for infrequent or diverse users.
   - Not when: expert internal users doing repeated tasks, where grouping is better. (S21)
5. **Pressure to "reduce steps/clicks"**
   - Causes: the three-click myth; step count mistaken for effort.
   - Checks: measure per-step burden and the information scent of each click.
   - Interventions: improve labels and scent; reduce per-step work. (S13, S19)
   - Not when: a step adds no information (a pure confirmation interstitial). Remove those.
6. **"No results" flashes before data appears**
   - Causes: empty state rendered while loading; no separate error state.
   - Checks: throttle the network and observe the state sequence.
   - Interventions: separate states for loading, empty (first use), empty (no results for this filter), error and no permission, each with status, a learning cue and a direct action. (S28)
   - Not when: never; this pattern is always a defect.
7. **Wrong loading feedback**
   - Causes: a spinner for a full page; a skeleton that shows only the frame; no progress shown for long jobs.
   - Checks: measure the expected wait.
   - Interventions: under 1 s show nothing; 2–10 s use a skeleton for a page or a spinner for a module; over 10 s use a progress bar with an estimate. (S29)
   - Not when: a skeleton is being used as a substitute for a performance fix. Shimmer animation must respect reduced motion.
8. **Onboarding carousel proposed**
   - Causes: a desire to explain the UI up front.
   - Checks: does the app need data to start? Is a feature genuinely novel?
   - Interventions: contextual tips and empty-state learning cues. (S27)
   - Not when: setup data is truly required, or the core interaction is unfamiliar.
9. **Users can't find content in an IA**
   - Causes: overlapping categories; generic levels; deep paths without shortcuts.
   - Checks: a label-overlap review by the agent, then a tree test (human).
   - Interventions: distinct categories; visual grouping within flat lists; shortcuts, breadcrumbs, a "most viewed" list. (S39, S33)
   - Not when: a flat list is already huge. Group it; don't add levels blindly.
10. **Agent about to cite Miller's 7±2, Hick's law or choice overload to cut options**
    - Causes: misapplied laws.
    - Checks: are the options visible (recognition) or remembered (recall)? Are users choosing or searching?
    - Interventions: organise, group and order the options; set a default. (S14, S15)
    - Not when: there is real evidence of decision paralysis, or the options are unfamiliar and need comparison. **[INF]** Hick-Hyman describes choice reaction time for equally likely, practiced options; menus that users must read are better modelled as visual search. I did not find a primary source to cite for this.
11. **Key content below the fold ignored**
    - Causes: a false floor; no continuation cue.
    - Checks: what appears in the first viewport at 390×844 and at 1440×900?
    - Interventions: put the most important points in the first screenful; give content cut off at the fold. About 57% of viewing time is spent in the first screen and 74% in the first two. (S41)
    - Not when: users have a strong reason to scroll (long-form reading, comparison). Don't cram.
12. **Wall-of-text scanning failure (F-pattern)**
    - Causes: unformatted prose.
    - Checks: headings start with information-bearing words; lists; bolded keywords.
    - Interventions: front-load content, use the layer-cake structure, write descriptive links. (S16)
    - Not when: committed readers (editorial pieces). Don't over-chunk narrative.
13. **Icon-only controls misread**
    - Causes: ambiguous glyphs.
    - Checks: does every icon have an accessible name? Is there a visible label for non-standard icons?
    - Interventions: add text labels.
    - Not when: icons are universally recognized (search, close, play). The LLM reviewer in S3 over-flagged these, so suppress that false positive.
14. **"Why can't I submit?"**
    - Causes: a disabled submit button with no explanation.
    - Checks: is a disabled primary action present? Does it have contrast and a reason?
    - Interventions: keep the button enabled and validate on submit; add double-submit protection on the client *and* the server. (S42)
    - Not when: research shows disabling clarifies the UI.
15. **Data table hard to use**
    - Causes: no identifier column; headers lost while scrolling; actions buried.
    - Checks: which of the four table tasks matter here (find, compare, view or edit a row, act on records)?
    - Interventions: sticky header and first column; a human-readable ID first; visible active filters; batch actions with select-all. (S43)
    - Not when: small, read-only tables. Avoid control clutter.
16. **Product or search list paging problems**
    - Causes: pagination tedium; infinite scroll blocking the footer; the back button losing scroll position.
    - Checks: is the footer reachable? Is scroll restored on back?
    - Interventions: load-more (plus lazy loading for categories); `pushState` for position. (S44)
    - Not when: social feeds without footer tasks, or numbered pages where users need to cite a location. The evidence is e-commerce only.
17. **Touch targets missed, or controls at screen edges**
    - Checks: target ≥24×24 CSS px or the spacing exception (2.5.8); critical actions placed at extreme corners.
    - Interventions: enlarge targets; move risky actions away from accidental-tap zones; don't assume a right-thumb grip. (S11, S17, S18)
    - Not when: inline text links are exempt.
18. **"axe passes, so it's accessible"**
    - Causes: equating automated coverage with conformance.
    - Checks: list the manual checks still outstanding.
    - Interventions: report "automated: pass; manual: N items pending". (S6–S8, S12)
    - Not when: never; this pattern always applies.
19. **ARIA-heavy custom widgets**
    - Causes: re-implemented native controls.
    - Checks: is a native element available?
    - Interventions: native first; ARIA only to fill gaps. (S8, correlational)
    - Not when: there is no native equivalent (combobox, tree). Then follow the APG pattern and test with assistive technology.
20. **Sticky header hides the focused element**
    - Checks: tab through the page and test whether the focused element's bounding box intersects fixed or sticky overlays (2.4.11).
    - Interventions: `scroll-padding-top`; reduce sticky height.
    - Not when: user-opened overlays are allowed, provided focus can be revealed.

---

## 4. Testable UX acceptance criteria

**A. Machine-verifiable via browser automation** (Playwright plus axe; scripts belong to R5):
- **axe-core rules at WCAG 2.2 AA tags:** zero violations, with incomplete or needs-review items listed rather than hidden.
- **Keyboard:** every interactive element is reachable by Tab, the focus indicator is visible (screenshot diff of focused vs unfocused), there are no focus traps, and Esc closes dialogs and returns focus to the trigger.
- **Focus not obscured (2.4.11):** for each focus stop, the focused element's rect intersected with sticky/fixed rects is smaller than the element.
- **Target size (2.5.8):** every pointer target is ≥24×24 or meets the spacing exception (computed geometry).
- **Reflow (1.4.10):** at 320 CSS px there is no horizontal scroll. Text spacing overrides (1.4.12) cause no clipping, and 200% zoom causes no loss of content.
- **Forms:**
  - Every input has a programmatic label, and the visible label persists when the field has a value.
  - Personal fields have `autocomplete`.
  - Submitting empty produces an error summary or inline errors. The page title is prefixed if the GOV.UK style is used, focus moves to the summary, summary links focus their fields, and errors clear once fixed.
  - Double click submits once.
- **State matrix:** with a mocked network (delay, 200-empty, 500, 403), each data region renders a distinct loading, empty, error or permission state. No empty copy appears during loading.
- **Navigation:** at the desktop breakpoint, top-level navigation items are visible, or a labelled trigger exists. The back button restores list scroll position. No primary content sits behind a non-default horizontal tab (flag for review).
- **Viewport presence:** a declared primary task element is within the first viewport at the agreed viewports (e.g. 390×844, 1440×900).
- **Reduced motion:** with `prefers-reduced-motion: reduce`, non-essential animation stops (R4 supplies the details).
- **Structure:** a single h1, no skipped heading levels, `lang` set, landmarks present, DOM order matches visual order for the main flow (heuristic comparison of DOM index vs y/x position).

**B. Agent-judged, advisory only** (always report with confidence; recall around 20–40% per S3/S4):
- Alt text is meaningful; link and button text is descriptive; error messages say how to fix the problem; headings carry information; label scent and category overlap; copy reading level; the empty state contains a direct action.

**C. Human-required:**
- Task success and comprehension (usability test or first-click test); IA mental-model fit (tree test); real screen-reader and switch-access experience; cognitive-accessibility judgments; severity prioritization; taste and identity (owner); the trade-off between client preference and usability when they conflict.

---

## 5. Counterevidence, failure modes and what would falsify each recommendation

- **Partial-recall AI review (F1).** Falsified if WhipUI's agent with UX-2 reaches near-expert recall *and* precision on a seeded-defect set. The S3/S4 numbers are from GPT-4/4o, and newer models may be better. Re-measure rather than assume.
- **Automated a11y limits (F2).** Coverage estimates depend on the metric (by volume vs by criterion) and are dated (2017, 2021). A 2026 axe version may cover more. The direction, that manual checks are required, is robust; the percentages are not.
- **Navigation, tabs and pagination (F7, patterns 1, 2 and 16).** The evidence is from 2016–2018, from specific sites, and from e-commerce. Mobile conventions have since shifted, e.g. bottom tab bars. Falsified if fresh first-click or tree tests on the target product show equal findability.
- **Validation timing (F6).** The conflict itself is the finding. A WhipUI rule that hard-codes one side would be wrong in some contexts.
- **Counterevidence to the "laws" (F4).** The choice-overload meta-analysis shows heterogeneity, so overload *can* occur under some moderators. Porter's study is a single observational dataset of unknown date. Treat these as "don't use as justification" rather than "the opposite is true".
- **One thing per page.** GOV.UK cites limited formal evidence and its users are infrequent, diverse citizens. It may hurt expert or repeated-use tools.
- **Loading thresholds.** These are practitioner guidance; the underlying study's results were not summarized in the source.
- **Failure mode for WhipUI itself:** the diagnostic patterns become new "fixtures". The agent might apply "use load-more" or "expanded sections" everywhere and flatten design variety, the same failure as handoff H5. Mitigation: every pattern requires its symptom *and* its check to fire, and carries its "not when" clause.
- **Failure mode: criteria explosion.** Too many machine checks become noise and cost tokens. Prioritize by task family.

---

## 6. Keep / reject / test later

| Item | Decision | Rationale and cost |
|---|---|---|
| Diagnostic-pattern table with "not when" clauses (UX-2) | **Keep** | This is knowledge models lack or misuse. About 3k tokens, but only matching rows need to load |
| Three-tier criteria (machine / advisory / human) | **Keep** | Directly supports the brief's "verified vs assumed" requirement. Low prose cost; scripts come from R5 |
| WCAG 2.2 AA as the target, WCAG 3 as an informational note | **Keep** | Matches W3C status as of Sep 2026 |
| Myth-counterevidence list | **Keep** | Cheap and prevents bad justifications |
| Generic Nielsen-10 or "laws of UX" primers | **Reject** | Models already know them, and they add context cost (handoff H2) |
| AI as UX severity judge or usability verdict | **Reject** | Weak precision and severity agreement (S3, S5) |
| Synthetic users as validation | **Reject** | S35, S36. At most, use them to pilot an interview guide |
| Always-on job-story or HEART interview | **Reject** | Violates adaptive autonomy. Load only on vague goals |
| UX-4 as a separate module vs merged into UX-1 | **Test later** | Depends on routing frequency |
| Agent-run first-click "proxy" (the model predicts first clicks) | **Test later** | Unvalidated. Only worth keeping if it correlates with human first-click data |
| Auto-generated state matrix with network mocking | **Test later, likely keep** | High value, but needs app-specific hooks |
| Sticky-focus and target-size geometry scripts | **Test later, likely keep** | Deterministic, but needs false-positive tuning |

---

## 7. Suggested evaluation

1. **Seeded-defect benchmark,** modelled on GDS's "least accessible page" method.
   - Build 6–10 small apps with planted UX and accessibility defects drawn from §3b: hidden desktop navigation, horizontal tabs, premature validation, an empty state shown while loading, a disabled submit button, sticky focus occlusion, small targets, placeholder labels. Also include **decoys**: intentional, correct choices such as universal icons without labels, tabs used for parallel alternatives, and grouped questions for experts.
   - Arms: baseline agent; baseline plus the same tools/scripts; plus UX-2/UX-3 text; plus both. Hold model, effort and iteration budget equal.
   - Metrics: recall, precision, decoy false-positive rate, tokens, time. This isolates the effect of knowledge from the effect of tools.
2. **Criteria-generation test.** Give 10 sparse `/goal` briefs. Measure whether the generated criteria are testable (a human can say pass or fail), correctly tiered, and not boilerplate. Compare against the baseline. Use blinded human rating.
3. **Over-application audit.** Run on 10 *good* reference UIs. Every flagged issue is a candidate false positive. Track pattern-trigger counts to detect fixture contamination (the same intervention appearing across unrelated tasks).
4. **Human check where it matters.** For 2–3 CREATE_TO_SHIP outputs per arm, run a 5-user first-click or unmoderated task test, or the owner as a minimum. Report this as a small pilot, not proof. Pre-register the tasks.
5. **Attribution controls.** Hold reference sets and tool access constant. Log module loads, so that gains are attributed to the modules actually loaded, not to extra iterations.

---

## 8. Uncertainty and unsupported claims

- **AI-review figures** come from GPT-4/4o (2024–2025), small samples (12 UIs in S3; one system in S4) and low inter-rater agreement (κ≈0.1 in S3). Frontier 2026 models are untested here.
- **Baymard** findings are proprietary. Methods and sample sizes were not visible in the articles fetched, and there is an inconsistent 17/18/22% abandonment figure in S20, so it is not cited.
- **NN/g navigation (2016)** and **scrolling (2018)** data are dated. **Porter's** three-click study has no date on its page.
- **Faulkner 2003** numbers come from a secondary newsletter (S30), because PubMed did not render.
- **Hick's law nuance** (choice vs visual search) is my inference; I found no authoritative source to cite in this session.
- **Not verified this session:** Baymard paywalled guidelines; WCAG 3's detailed contents; axe's current rule coverage; Hoober's later touch-accuracy numbers.
- **The F-pattern** is NN/g eyetracking; a contrary view exists (EyeQuant blog) but I didn't read it.
- **Unchecked attributions:** that job stories originated at Intercom comes from S38 only. The HEART category names are from my background knowledge (Happiness, Engagement, Adoption, Retention, Task success); the Google abstract page does not list them.
