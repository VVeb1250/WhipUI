# R7: Competitive Landscape and Failure Analysis

Track: R7 · Author: research subagent · Access date for every source: **2026-10-10**
Status labels: **[DOC]** official documentation · **[VENDOR]** vendor blog or marketing · **[RESEARCH]** peer-reviewed paper or preprint · **[REPO]** repository README or metadata · **[PRACT]** practitioner article · **[ANEC]** anecdote or single-run informal test · **[INSPECTED]** read or executed directly in this session.

GitHub star counts come from GitHub search results on 2026-10-10. "Updated" means GitHub `updated_at` (2026-10-09 for nearly all of them), which only signals that the repo is active. Stars show popularity. They are not evidence of quality.

---

## 1. Most consequential findings (prioritized)

**F1. Prose that steers aesthetics is now commodity, and the market is saturated.**
- Anthropic and OpenAI both ship first-party frontend-aesthetics guidance:
  - the `frontend-design` skill [INSPECTED];
  - the frontend section of Anthropic's prompting docs [DOC];
  - OpenAI's `frontend-skill` for Codex [VENDOR].
- Four third-party packs dominate stars: ui-ux-pro-max (~134k), taste-skill (~94k), Impeccable (~79k) and Hallmark (~30k).
- `frontend-design` is already installed as a skill in this very environment. A strong baseline on Claude Code will often include it implicitly.
- Consequence: WhipUI cannot differentiate on "better design principles" or "anti-slop rules". Any such content competes with free, well-maintained defaults.

**F2. No independent controlled evidence shows any design skill beating a strong baseline on human preference.**
- Every inspected claim falls into one of three groups:
  - vendor-curated before/after screenshots (Anthropic, OpenAI, Impeccable case study);
  - informal single-run tests scored by AI judges;
  - review-style articles with no control condition.
- The only informal test with a no-skill baseline scored all six skill setups between 81 and 86 out of 100, against 81 for native output. That is one prompt, one run and an AI judge. Gaps that small are within plausible noise.
- Implication: the brief's competing hypothesis HY1 (that a frontier model with good references and a screenshot loop roughly matches Full WhipUI) is entirely plausible. It must be allowed to win.

**F3. Fixed anti-slop lists move the default rather than remove it.**
- Anthropic's own cookbook admits models converge on new choices after the classic ones are banned. It names Space Grotesk, and its typography prompt even lists Space Grotesk as a recommended choice.
- The June 2026 rewrite of `frontend-design` names new generated-design clusters with hex values: cream with serif and terracotta, black with an acid accent, broadsheet hairlines, the SaaS card kit, and template chrome. A practitioner reads the rewrite as a response to convergence under the earlier "be bold on every axis" version [PRACT]. That reading is inference, not an Anthropic statement.
- An informal multi-skill test observed a shared vocabulary across different skills: dark or warm gradients, glass cards, glowing accents.
- Implication: hard-coded blacklists have a half-life and can seed fixtures. This confirms the brief's anti-pattern on fixture contamination.

**F4. Research on skills favors small, focused packs. Comprehensive packs can hurt.**
- SkillsBench (Feb 2026) [RESEARCH]:
  - Curated skills: +16.2pp on average.
  - Comprehensive skills: −2.9pp.
  - 4 or more skills: only +5.9pp, versus +18.6pp for 2–3.
  - Software engineering had the smallest domain gain (+4.5pp).
  - Self-generated skills gave roughly zero or negative effect.
  - 16 of 84 tasks got worse with skills.
- OpenAI's GPT-5.6 guide reports that deleting redundant instructions raised internal coding-agent evals by about 10–15% and cut tokens by 41–66% [DOC, directional].
- Anthropic warns that aggressive "MUST/CRITICAL" phrasing overtriggers on newer models [DOC].
- These match the owner's historical observations: about 2.34× cost, and the baseline sometimes winning.

**F5. AI judges are weak exactly where WhipUI needs judgment, and human taste is genuinely personal.**
- MLLM-as-UI-judge study [RESEARCH]: models underrate aesthetic pleasure and "interesting", and are unreliable when two designs are close.
- LLM-simulated preference study (29 real studies, 2,073 participants) [RESEARCH]: synthetic choice distributions differed significantly in 44% of tasks. Newer models did not fix this.
- DesignPref [RESEARCH]: 20 professional designers agreed with each other only weakly (binary κ ≈ 0.25). Personalized models beat pooled ones on some metrics.
- This independently supports owner intent C7, the historical observation H6, and the idea that taste discovery for this specific client is a real gap.

**F6. Persistent design-context files are becoming commodity. Approval status and authority are not.**
- Many products now persist design context:
  - Impeccable (`PRODUCT.md` / `DESIGN.md` via `init`);
  - Claude Design (an org-level design system inherited by projects);
  - Google Stitch (`DESIGN.md` export and an MCP server);
  - superdesign (cross-session project memory);
  - ui-ux-pro-max (a persisted design-system file with hierarchical retrieval).
- In the docs and READMEs I inspected, none model decision status (proposed / approved / rejected / superseded) with who authorized it and the evidence behind it. This is a narrow but real differentiation opportunity. It is unverified whether their internals do this.

**F7. Reference access is becoming tooling, so the edge moves to selection, translation and record-keeping.**
- Existing reference tools:
  - Mobbin launched an MCP server (May 2026; paid plan, beta; about 621k screens and 142k flows) [VENDOR].
  - superdesign has URL "design DNA" extraction.
  - Hallmark has `study <url>`.
  - Claude Design accepts web element captures.
  - Stitch extracts a design system from a URL.
- What remains differentiating: choosing a few diverse, task-relevant references; stating which mechanism to borrow, which to avoid and why; recording the user's liked and disliked properties; and refusing to clone.
- Mobbin is paid, so under C14 it can only ever be an optional adapter.

**F8. Rendered verification tools are commodity. Orchestration and temporal (motion) evidence are still thin.**
- Playwright MCP (~38k stars) and Chrome DevTools MCP (~53k) are standard.
- `openai/skills` ships `playwright`, `playwright-interactive` and `screenshot` skills [INSPECTED listing].
- Playwright's CLI is reported to use about 4× fewer tokens than the MCP on one benchmark [PRACT, directional]. Microsoft's docs say CLI calls are more token-efficient.
- Nothing inspected offers a portable, cheap capture covering viewports, states and motion recordings, tied to a decision log.

**F9. Legacy WhipUI's best asset is its honesty about evidence. Its weakest mechanisms are the regex router, the large empty fingerprint schema, and the dependency on competing third-party packs.**
- I ran the legacy router on 7 unseen prompts. About 3 routed implausibly. All 41 tests pass, but the routing tests use 13 hand-picked prompts written to match the regexes. Details in §4.

**F10. The closest competitor is Impeccable, not the model vendors.**
- Impeccable already has, in one skill:
  - one setup flow writing durable product truth;
  - 24 named commands (craft, shape, critique, audit, polish, animate…);
  - live browser variant iteration;
  - 59 deterministic detector rules runnable without an LLM;
  - provider-native hooks for multiple hosts.
- It started from Anthropic's `frontend-design` [REPO].
- WhipUI must define itself against Impeccable plus a good baseline. Re-implementing Impeccable's surface would be duplication.

---

## 2. Primary sources

All accessed 2026-10-10.

| # | Source | URL | Published | Label |
|---|---|---|---|---|
| S1 | Anthropic `frontend-design` SKILL.md (current, rewritten) | https://github.com/anthropics/skills/tree/main/skills/frontend-design | rewrite commit reported 2026-06-18 (S3); repo active | [INSPECTED][REPO] |
| S2 | Anthropic: Improving frontend design through Skills | https://claude.com/resources/articles/improving-frontend-design-through-skills | 2025-11-12 | [VENDOR] |
| S3 | Practitioner analysis of frontend-design rewrite | https://dev.to/kenimo49/anthropic-rewrote-frontend-design-skill-3-ai-design-cliches-named-with-hex-codes-22m4 | 2026-07-03 | [PRACT] |
| S4 | Claude cookbook: prompting for frontend aesthetics | https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics | 2025-10-21 | [DOC] |
| S5 | Claude prompting best practices (frontend section; overtriggering) | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | undated, current | [DOC] |
| S6 | OpenAI: Designing delightful frontends with GPT-5.4 (`frontend-skill`) | https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4 | 2026-03-20 | [VENDOR] |
| S7 | OpenAI: Frontend with GPT-5 cookbook | https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_frontend | not checked | [DOC] (existence only) |
| S8 | OpenAI GPT-5.6 / GPT-6 model guide (lean prompts) | https://developers.openai.com/api/docs/guides/gpt-5.6 | undated | [DOC] |
| S9 | openai/skills catalog (curated: figma-*, playwright, playwright-interactive, screenshot; system: imagegen, skill-installer…) | https://github.com/openai/skills | repo active; ~28k stars | [INSPECTED][REPO] |
| S10 | Impeccable | https://github.com/pbakaus/impeccable · https://impeccable.style | active; ~79k stars | [REPO] |
| S11 | UI UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | active; ~134k stars | [REPO] |
| S12 | Taste Skill | https://github.com/Leonxlnx/taste-skill | active; ~94k stars | [REPO] |
| S13 | Hallmark (Together AI) | https://github.com/Nutlope/hallmark | active; ~30k stars | [REPO] |
| S14 | Vercel agent-skills (`web-design-guidelines` fetches rules at runtime) + web-interface-guidelines | https://github.com/vercel-labs/agent-skills · https://github.com/vercel-labs/web-interface-guidelines | active; ~32k / ~1k stars | [INSPECTED][REPO] |
| S15 | superdesign skill (and legacy extension repo) | https://github.com/superdesigndev/superdesign-skill · https://github.com/superdesigndev/superdesign | active; ~0.6k / ~7k stars | [REPO] |
| S16 | Sumi (UX skills pack; legacy WhipUI adapted parts of it) | https://github.com/phazurlabs/sumi | active; 54 stars | [REPO] |
| S17 | Claude Code plugin `frontend-design` | https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design | active | [INSPECTED listing] |
| S18 | Claude Design overview (third-party summary of the 2026-04-17 launch) | https://www.datacamp.com/blog/claude-design | 2026 | [PRACT]; first-party page not fetched |
| S19 | Google Stitch 2026 update | https://noqta.tn/en/blog/google-stitch-vibe-design-ai-ui-tool-2026 | 2026-03-19 | [PRACT] |
| S20 | Figma: Design context everywhere you build (remote MCP, Code Connect, Make indexing) | https://www.figma.com/blog/design-context-everywhere-you-build/ | undated | [VENDOR] |
| S21 | Figma MCP server docs (remote recommended; write to canvas) | https://developers.figma.com/docs/figma-mcp-server/ | undated | [DOC] |
| S22 | Mobbin MCP press release | https://www.rutlandherald.com/news/business/mobbin-launches-mcp-server-giving-ai-tools-621-500-real-app-screens-to-reference/article_27c6b6bb-5bac-57cb-9e47-c620b2307a49.html | 2026-05-12 | [VENDOR] |
| S23 | v0 Design Mode | https://www.createwith.com/tool/v0/updates/v0-launches-design-mode-with-visual-editing-and-layer-management | 2026-06-17 | [PRACT] |
| S24 | Lovable Aesthetics | https://www.createwith.com/tool/lovable/updates/lovable-launches-aesthetics-to-give-users-more-control-over-design-output | 2026-05-11 | [PRACT] |
| S25 | Playwright MCP | https://github.com/microsoft/playwright-mcp | active; ~38k stars | [REPO] |
| S26 | Chrome DevTools MCP | https://github.com/ChromeDevTools/chrome-devtools-mcp | active; ~53k stars | [REPO] |
| S27 | Playwright CLI vs MCP tokens | https://bug0.com/blog/playwright-cli-vs-playwright-mcp-ai-browser-testing-2026 | 2026-06-26 | [PRACT] |
| S28 | shadcn MCP docs | https://ui.shadcn.com/docs/mcp | undated | [DOC] |
| S29 | SkillsBench (arXiv 2602.12670) | https://arxiv.org/html/2602.12670v1 | 2026-02-13 | [RESEARCH] (preprint; internal inconsistencies noted by me: 86 vs 84 tasks) |
| S30 | MLLM as a UI Judge (arXiv 2510.08783) | https://arxiv.org/html/2510.08783v1 | 2025-10-09 | [RESEARCH] |
| S31 | DesignPref (arXiv 2511.20513) | https://arxiv.org/html/2511.20513v1 | 2025-11 | [RESEARCH] |
| S32 | Distorted Perspectives of LLM-Simulated Preferences (arXiv 2605.18311) | https://arxiv.org/pdf/2605.18311 | ~2026 (undated in PDF) | [RESEARCH] |
| S33 | Happycapy Skill Arena: frontend-design | https://happycapy.ai/skill-arena/frontend-design | 2026 (undated) | [ANEC] (AI judges, 1 run) |
| S34 | CSDN/AtomGit multi-skill test (Chinese) | https://gitcode.csdn.net/69eb14f554b52172bc6fc03e.html | 2026-04-24 | [ANEC] (1 prompt, AI scorer) |
| S35 | claudeskills.info: frontend-design vs Impeccable vs UI UX Pro Max (issue-tracker review) | https://claudeskills.info/blog/frontend-design-vs-impeccable-vs-ui-ux-pro-max/ | 2026-07-25 | [PRACT] |
| S36 | "Why your AI keeps building the same purple gradient website" | https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website | 2025-10-26 | [PRACT] |
| S37 | Legacy WhipUI repo, npm whipui@1.2.0 (local clone) | /home/claude/legacy-inspect/repo · https://github.com/VVeb1250/WhipUI | v1.2.0 | [INSPECTED] |

Not verified: Magic Patterns, UX Pilot, Bolt and Builder.io Fusion. Search only surfaced listicles and marketing pages, so their feature claims are not used below. Galileo AI is widely reported as acquired by Google and folded into Stitch. That rests on secondary sources only.

---

## 3. Landscape table

"Commodity" means available free or from the model or host by default. "Differentiating" means something that is not widely provided.

| Name | Type | Mechanism | Commodity vs differentiating | Evidence of effectiveness |
|---|---|---|---|---|
| Anthropic `frontend-design` (S1, S2, S17) | Official skill / plugin | Prompt prose. Studio-lead persona, subject grounding, named AI clusters, two-pass plan → self-review → build → screenshot critique, copy guidance | **Commodity.** Bundled and widely installed. Its plan-then-review loop and "boldness in one place" are now table stakes | Vendor screenshots only; no metrics (S2). Rewritten once, implying the earlier version was imperfect (S3) |
| Claude prompting docs `<frontend_aesthetics>` (S4, S5) | Official prompt snippet | Prose: typography, color, motion, backgrounds; avoid list; vary themes | Commodity | Qualitative; admits convergence on new defaults (S4) |
| OpenAI `frontend-skill` + GPT-5.4 guide (S6) | Official skill / blog | Prose: visual thesis, content plan, interaction thesis; constraints (2 typefaces, 1 accent…); recommends references, mood boards, Playwright verification, **low reasoning effort** | Commodity. The "low effort can be better" note matters for benchmark design | Qualitative videos only. The skill is described in the blog; its repo location was not found in `openai/skills` curated (unverified) |
| ui-ux-pro-max (S11) | Third-party skill + Python CLI | **References as data.** Searchable CSVs of styles, palettes and rules ("192 reasoning rules", "79 styles"); generates a design system; persists it to files | Data retrieval is a mildly distinct mechanism. Its style-by-industry recommendations are generic | No benchmark. README labels its demos "not a benchmark". Issue reports of contradictory outputs (S35). Scored lower than frontend-design in one AI-judged arena (S33) |
| Impeccable (S10) | Third-party skill + binary engine + hooks + browser extension | Prose + **24 commands** + **59 deterministic detectors** (no LLM) + `PRODUCT.md`/`DESIGN.md` + live in-browser variants + edit hooks | Most complete competitor. Deterministic detectors and live variant mode are differentiating versus prose packs | One vendor case study. Issue reports of detector misses and monorepo hook failures (S35). Informal test: small score changes (S34) |
| Taste Skill (S12) | Third-party skill family | Prose + numeric "dials" (variance/motion/density) + style variants (soft, minimalist, brutalist) + image-generation reference skills | Dials and style variants are a style-preset approach, which risks a house style | AI-judged arena: tied top on score but highest context use (~1.9M tokens over 3 tasks) (S33) |
| Hallmark (S13) | Third-party skill | Macrostructure catalogue + 21 themes + "57 slop-test gates" + self-critique; `study <url>` extracts design DNA | Theme catalogue = preset fixtures. `study` (mechanism extraction, refuses clones) is interesting | Showcase pages only |
| Vercel `web-design-guidelines` (S14) | Official skill | Fetches a guideline file at runtime, then reviews code as `file:line` findings | Commodity rule checking. **Runtime fetch of guidance** is a good pattern for keeping content fresh | None published |
| superdesign skill (S15) | Skill + paid-account CLI/canvas | Prompt library search, URL design-DNA extraction, branchable drafts on a canvas, cross-session memory, asks requirements | Branching drafts + continuity are close to WhipUI's goals. Requires login/service | AI-judged arena: tied top, lowest tokens (~65k) (S33) |
| Sumi (S16) | Claude Code plugin | 43 skills, 168 references, commands, "anti-slop engine" | Large-pack approach. The SkillsBench "comprehensive" warning applies | None found |
| Claude Design (S18) | Hosted product (Anthropic Labs, launched 2026-04-17) | Canvas + chat + inline comments + sliders; org design system built from repo/assets; web capture; handoff to Claude Code | Org design system + comment-based iteration + handoff. Hosted, not portable | Third-party summary says output without a design system is "functional but generic" (attributed to Anthropic) |
| Google Stitch (S19) | Hosted product + MCP + SDK | Multiple directions per brief, voice canvas, design-system extraction → `DESIGN.md`, MCP for coding agents | **Variants as taste elicitation** + portable `DESIGN.md` | None independent |
| v0 Design Mode (S23) | Hosted builder | Visual edits, layers, **click-to-annotate comments batched into one prompt**, design-system library | Annotation → batched prompt is now a mainstream pattern | None |
| Lovable Aesthetics (S24) | Hosted builder | Typography/layout/color preferences, multiple concepts to compare | Preference capture at project start; variants | None |
| Figma MCP (S20, S21) | Official MCP (remote recommended) | Design context, Code Connect mappings, Make code indexing, write to canvas | Commodity for Figma inputs; WhipUI should consume it | Vendor claims only |
| Playwright MCP / CLI; Chrome DevTools MCP (S25–S27) | MCP / CLI | Browser automation, screenshots, a11y snapshots, traces | Commodity. CLI is cheaper in context | Token comparison directional (S27) |
| Mobbin MCP (S22) | Paid MCP (beta) | Search ~621k real app screens and flows | Real-product reference corpus; paid → optional only | Vendor only |
| shadcn MCP (S28) | Official MCP | Registry search/install | Commodity implementation helper | n/a |
| Legacy WhipUI 1.2.0 (S37) | npm CLI + 2 skills + templates | Regex router hint, workflows, provider routing to Impeccable/UUPM, Project DNA + Design Fingerprint JSON, Pick-from-Web capture contract, multi-host scaffolding | Only multi-host scaffolding and the evidence-boundary wording are distinctive | README states plainly that no design-quality evaluation was run |

---

## 4. Legacy WhipUI analysis (inspected read-only)

**Architecture.** The legacy package has three parts:
- **CLI** (`src/cli.mjs`, `setup.mjs`, `scaffold.mjs`, `capabilities.mjs`). It writes project-local skills for Codex (`.agents/skills`), Claude (`.claude/skills`) and VS Code (`.github/skills`), plus a managed instruction block and a `.whipui/` folder. That folder holds the router, 6 workflows, 4 specialist notes, sources/licenses, config, `project-dna.json` and `design-fingerprint.json`.
- **Two skills.** WhipUI handles faithful implementation; WhipDesign handles UX-led design. Both are thin pointers into `.whipui/router.md`.
- **Helper JS modules** that emit JSON or Markdown handoffs (route, brief, fingerprint, pick, critique, doctor).

There are no runtime dependencies and no executable verification. The helpers only produce text briefs.

**What tests actually test** (41 pass, run 2026-10-10):
- regex routing on 13 fixed prompts;
- scaffold file creation and idempotency;
- refresh with backups;
- license-file closure;
- schema upgrade of the fingerprint;
- the cross-platform npx spawn spec;
- capability detection from fake project files.

Nothing tests design quality, routing on unseen language, or agent behavior. The README says this itself.

**Router probe.** I ran `selectWorkflow` on 7 prompts the tests do not cover:
- "Update the landing page so it looks less AI-generated" went to the bounded-edit lane (`ui`). A restyle request should get design latitude.
- "Add a pricing page that feels premium and unlike competitors" went to `ui` ("reference-led or bounded"). This is a new design-direction task.
- "Build a dashboard like linear.app but for farmers" went to `ui`. The URL triggers reproduce/implement, but the task is reference adaptation.
- "Fix the hero animation, it feels janky" went to `ui`, which is acceptable. There is no motion lane.

The code labels routing a "hint". But the same regex output decides whether the creative-direction workflow is required and whether the Hallmark reference is loaded. So in practice it is more than a hint.

| Mechanism | Verdict | Reason |
|---|---|---|
| Regex router (`workflow.mjs`, `router.mjs`) | **Reject** | Brittle on unseen phrasing and tests are overfit. Frontier models classify intent better from the full request. If routing is tested later, use a labeled prompt set with held-out cases, not regexes |
| Two separately discoverable skills (WhipUI / WhipDesign) | **Transform** | The split between fidelity and design latitude is the right axis. Separate auto-invoked skills add routing ambiguity, and the owner reports unreliable auto-invocation. Prefer one entry with a "mode = fidelity vs latitude" decision |
| Creative-direction gate object (signature move, tension, swap test) | **Reject as schema; keep vocabulary as optional knowledge** | Empty forms invite filling. The templates already deprecate the gate, yet the code still builds the object |
| Design Fingerprint (schema v3, ~60 empty fields for type, color, spacing, motion…) + always-on `antiSlopChecks` | **Reject / transform** | Main **fixture-contamination vector**: it asks the agent to write concrete visual values into a persistent "authority" file with no status or authorizer. Replace with a decision log (status, authorizer, evidence, scope), with values only when approved |
| Project DNA (product facts, observed vs assumed, input precedence) | **Keep, slimmed** | Separating facts from assumptions and stating "current request wins" match the brief's §7. Overlaps with Impeccable `PRODUCT.md`. Consider reading an existing `PRODUCT.md`/`DESIGN.md` rather than duplicating them, which the legacy text already suggests |
| Provider routing to Impeccable / UI UX Pro Max / frontend-design | **Reject as dependency; optional interop only** | Makes WhipUI a meta-router over competing design authorities, adds installs, version drift and context, and gives no unique value. At most: detect them and avoid conflicting instructions |
| Capabilities detection ("installed ≠ callable") | **Keep idea** | Detecting real tools before claiming results is cheap, real value. The implementation is a file-presence heuristic; the runtime check should be done by the agent |
| Pick-from-Web capture contract (DOM, computed styles, box, states, a11y, screenshots) | **Keep, make executable** | The most concretely useful artifact. It is prose only today. Turn it into a script, preferably Playwright CLI for token cost. Do **not** auto-write captured traits into the design authority |
| Workflows: implement / design / ux-review / visual-qa wording | **Keep principles, rewrite** | Strong evidence boundaries: observed / blocked / not tested; UX separated from visual; no self-scores; keep the better earlier version; review-only means no edits. These are the legacy pack's best ideas |
| Visual QA axes incl. "generic-pattern-debt", "identity" | **Transform** | Asking the AI to judge "genericness" conflicts with C7 and F5. Keep technical axes for AI; route taste axes to the human |
| Hallmark-derived page-shape table | **Test later, likely reject as default** | A catalogue of page shapes is a mild fixture. The legacy pack already planned an ablation for it; it was never run |
| Sumi-derived heuristics + flows notes | **Keep as lazily loaded knowledge (rewrite)** | Short, task-scoped and evidence-aware. Licensing (Apache-2.0) was handled properly |
| Multi-host scaffolding, `--refresh` with backups, managed block | **Keep (engineering)** | Real portability value; CI on 3 OSes. Note the Impeccable installer and `npx skills` already cover multi-host install, so keep this thin |
| `sources.md` provenance with pinned commits | **Keep practice** | Good hygiene for the reference catalog |
| Evaluation protocol template (blind owner preference, same budget) | **Keep, and actually run it** | The design is sound, but it was never executed |

**Overhead and contamination summary:**
- Biggest risks: the empty fingerprint schema; always-on anti-slop checks; regex-driven mandatory steps; delegation to competing packs.
- Biggest assets: the evidence-honesty language and the Pick-from-Web contract.

---

## 5. Implications for WhipUI positioning

**Where WhipUI realistically cannot beat a strong baseline:**
- Generic aesthetic quality on a first single page. The model plus `frontend-design` or `frontend-skill` is already decent, and the informal gains seen are small (F1, F2).
- Rule-based anti-slop. It is commodity, and blacklists move the default (F3).
- Raw browser verification. Playwright and DevTools are commodity (F8).
- Rule-database style recommendations. ui-ux-pro-max already occupies that space and the evidence for it is weak.
- Rebuilding a feature set like Impeccable's. That is a strong incumbent with deterministic tooling (F10).

**Where it plausibly can win.** Each item below is a hypothesis to test, not a claim:
1. **Decision continuity across iterations and sessions.** A small log with proposed / approved / rejected / superseded status, authorizer and evidence. This addresses spec drift and "suggestion becomes spec", which none of the inspected tools explicitly model (F6). Measure: drift and regression rate over a 3–5 turn refinement sequence.
2. **Taste discovery for this specific client.** Comparative choices (2–3 structurally different directions on the same content), captured as scoped preference signals. This is supported by DesignPref's low inter-designer agreement and the failures of AI judges (F5). Measure: time and rounds to owner approval versus baseline.
3. **Reference translation discipline.** A few task-relevant references, each with "borrow / avoid / transform" notes and liked/disliked properties recorded. Use free or dynamic sources; Mobbin and other paid sources only as optional adapters (F7). Measure: owner preference with identical references across arms (Arm B versus C isolates this).
4. **Cheap, portable rendered evidence including motion.** Scripts for multi-viewport and state screenshots, plus short recordings or frame strips for motion. Use the CLI rather than the MCP where possible (F8). Measure: defects caught versus a screenshot-only loop, and token cost.
5. **Fidelity guardrails for reproduce and implement-existing tasks.** Mode separation stops "creative" drift on faithful work, which was the legacy pack's correct instinct. Measure: diff against the target and unrequested changes.

**Positioning statement (proposed).** WhipUI is a thin collaboration layer: intent and mode, approval policy, decision log, reference translation and an evidence capture kit. It sits on top of whatever aesthetic defaults the host model and skills already provide. It is not another style pack. It should interoperate with `frontend-design` or Impeccable if they are present, without routing authority to them.

---

## 6. Risk register

| # | Risk | Likelihood | Impact | Mitigation | Detection |
|---|---|---|---|---|---|
| R1 | WhipUI ≈ baseline on blinded owner preference (HY1 wins) | High | High | Design the pilot so that Arm A/B can win. Scope WhipUI to continuity, taste and fidelity value. Shrink it if confirmed | Paired blind preference; Arm B vs C ablation |
| R2 | Context overhead repeats the historical ~2.3× cost | High | Med–High | One small entry skill; lazy modules; scripts over prose; CLI over MCP snapshots; measure tokens per arm | Token and time logs per run; overhead budget gate |
| R3 | Fixture contamination: same layouts or fonts recur across unrelated briefs | Med–High | High | No style catalogues or themes as defaults; no empty visual-value schemas; store intent and principles, not values, unless approved | Cross-brief similarity check (fonts, palette, section structure) over N outputs |
| R4 | Anti-slop rules create new defaults (Space Grotesk / cream-terracotta effect) | High if lists are used | Med | Avoid fixed blacklists. Use per-project "what did we already do" notes and user-rejected lists, scoped to the project | Track font and palette frequency across runs |
| R5 | Competing instructions with an installed `frontend-design` / Impeccable / taste skill cause conflicting authority | Med | Med | Detect co-installed design skills; state precedence (user decisions first); never chain-load two style authorities | Transcript review for contradictory directives; A/B with co-installed skills |
| R6 | Over-questioning: co-design mode asks too much and hurts `/goal` speed | Med | Med | Ask only when uncertainty × cost is high; offer visual choices rather than interviews; cap questions per turn | Count questions per task; owner friction rating |
| R7 | AI critique treated as a taste verdict | Med | High | Restrict AI review to technical and UX defects; route taste axes to the human; label heuristic findings as heuristic | Audit reports for unlabeled aesthetic scores |
| R8 | Reference copying, rights or prompt-injection issues from fetched pages | Med | Med–High | Mechanism notes, not asset reuse; provenance recorded; external pages treated as untrusted data | Similarity check vs reference screenshots; review of copied assets and strings |
| R9 | Paid or hosted dependencies (Mobbin, superdesign, Figma seats) creep in as de facto requirements | Med | Med | Adapters optional; free fallback path tested; C14 enforced in the decision log | Run the pilot with all paid tools disabled |
| R10 | Router or mode misclassification (legacy regex misroutes about 3 of 7 probes) | Med | Med | Let the model classify with a short rubric; confirm the mode in one line when ambiguous; held-out labeled prompt set | Routing accuracy on held-out prompts including Thai |
| R11 | Benchmark confounds: extra iterations, references or tools credited to the skill | High | High | Matched budgets, identical references in B/C/D, iteration caps, one-factor ablations | Pre-registered arm configs; per-arm iteration counts |
| R12 | Ecosystem churn: vendor skills and host features change quickly (frontend-design rewritten within months) | High | Med | Keep the core small; reference vendor skills by link, not copies; date-stamp the catalog; runtime fetch where sensible (Vercel pattern) | Quarterly re-check; CI link checks |
| R13 | Single-rater evaluation (owner only) is mistaken for general usability | High | Med | Label results as owner preference; add small end-user task tests where possible | Report wording review |

---

## 7. Counterevidence, keep / reject / test later, evaluation, uncertainty

**Counterevidence to my own findings:**
- **F2 (no evidence of benefit) is not evidence of no benefit.** The informal tests are tiny and AI-scored. Skills may help more on weaker models: SkillsBench shows Haiku with skills beating Opus without, and Anthropic says its skill can be uneven on weaker models (S35). If WhipUI targets mixed model tiers, prose guidance may still pay off for the smaller ones.
- **F4 (small is better)** comes from SkillsBench tasks with pass/fail verifiers, not aesthetic tasks. Software engineering showed the smallest gain, which is also the domain closest to UI coding. Transfer to design preference is inference.
- **F6 (approval status is a gap).** Proprietary tools such as Claude Design, Stitch and superdesign may track approvals internally. I only saw public docs and READMEs. Branching drafts in superdesign and Stitch partially address continuity.
- **F5.** The MLLM-judge study found reasonable agreement on cognitive and perceptual factors. AI technical critique is useful; only the taste verdict is weak.
- **Popularity.** Very high star counts (100k+) for design packs suggest perceived value. Stars are not outcome evidence, and the counts are unusually high for skills repos, so I treat them only as a market signal.

**Keep / reject / test later:**
- **Keep:**
  - single thin entry;
  - fidelity versus latitude mode;
  - decision log with status and authority;
  - an executable capture kit, extended for motion;
  - legacy evidence-boundary wording (rewritten);
  - provenance with pinned sources;
  - interop detection of co-installed design skills.
- **Reject:**
  - regex router;
  - empty fingerprint or visual-value schemas;
  - always-on anti-slop lists;
  - theme or page-shape catalogues as defaults;
  - routing authority to third-party packs;
  - AI "genericness" scores as verdicts.
- **Test later:**
  - whether a short "known AI clusters" calibration note (like S1's) adds anything when `frontend-design` is already present. Expect redundancy.
  - Mobbin MCP as an optional reference adapter.
  - deterministic detectors (Impeccable-style): consider interop rather than rebuilding.
  - the Playwright CLI versus MCP cost trade-off in this harness.
  - annotation-based feedback (v0/Claude Design pattern) versus chat feedback.

**Suggested evaluation (R7-specific additions to the brief's A–D arms):**
1. **Baseline definition matters.** Run Arm A twice: without and with `frontend-design` (or `frontend-skill` on Codex). The vendor skill is the realistic baseline. Beating a bare model is not the claim.
2. **Add an "incumbent arm"** (A + Impeccable or superdesign) on two or three briefs to check whether WhipUI beats the closest competitor, not just the model.
3. **Use reasoning-effort controls.** OpenAI suggests lower effort can improve frontend output, so fix effort across arms and optionally sweep it.
4. **Fixture check.** Generate 6–10 unrelated briefs per arm and measure the repetition of fonts, palettes and section skeletons. This detects R3 and R4.
5. **Continuity test.** A five-turn scripted refinement including one explicit rejection and one superseded decision. Score drift and reintroduction of rejected elements. This is where WhipUI should win if it wins anywhere.
6. **Cost ledger:** tokens, wall time, tool calls, questions asked, iterations.
7. **Judge policy:** human paired preference for taste. AI only for checklisted technical defects, never as the primary outcome.

**Uncertainty and unsupported claims:**
- Star counts and activity come from GitHub search on one day. Some repos may have inflated stars. I did not verify release dates or last-commit dates, only `updated_at`.
- Location of OpenAI `frontend-skill`: the blog describes the install command, but I did not find it by name in `openai/skills/.curated`. Unverified.
- Claude Design details come from a third-party summary, not the first-party page.
- Magic Patterns, UX Pilot, Bolt and Builder.io were not verified, so they are excluded from claims.
- The informal tests (S33, S34) are anecdotes: AI judges, single runs.
- SkillsBench has internal numeric inconsistencies (86 vs 84 tasks; −1.3pp vs implied −3.3pp for self-generated skills).
- I did not inspect the 61-file and 42-file historical packs or the 16-run benchmark artifacts. They are not available.
- The legacy router probe used 7 prompts I wrote myself. That is an illustration, not an accuracy estimate.
