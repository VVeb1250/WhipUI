# R1 — Modern Agent Skills & Harness (research track)

Access date for all sources: **2026-10-10**. Labels: **[DOC]** official documentation · **[RES]** research paper · **[PRAC]** practitioner claim with data · **[ANEC]** anecdote/opinion. "Unverified" = I could not confirm it from a primary source in this session.

---

## 1. Most consequential findings (prioritized)

1. **Auto-invocation is the weakest link; the evidence says "don't depend on it."** Vercel's Next.js 16 evals: with a default skill, the skill was **never invoked in 56% of cases** and pass rate was unchanged vs baseline (53%→53%); explicit "use the skill" instructions lifted it to 79%; an ~8 KB always-on AGENTS.md index hit 100% [PRAC, S12]. Spence's sandboxed Claude Code tests (Sonnet 4.5, 22 prompts): no-hook activation **50–55%**, forced-eval hook **100%**; when a skill fired, the *right* one was always chosen — failure is activation, not selection; conceptual phrasing was missed, keyword phrasing hit [PRAC, S13]. → WhipUI needs an **explicit entry** (slash/`$` invocation) as the primary path, with auto-trigger as a bonus.

2. **More/bigger skill content can hurt.** SkillsBench (87 tasks, 7,308 trajectories): curated skills +16.6 pp on average, but only **+4.5 pp in software engineering**, **16/84 tasks got worse**, "comprehensive" skills scored **−2.9 pp** vs compact/detailed **+17–19 pp**, and **4+ skills gave +5.9 pp vs +17.8–18.6 pp for 1–3**; self-generated skills ≈ no gain (−1.3 pp) [RES, S14]. This matches WhipUI's own history (3.15× input tokens, baseline sometimes better). → One entry skill, few modules, compact.

3. **Agent Skills (SKILL.md) is a real cross-host standard — the portable core.** Spec: `name` ≤64 chars (lowercase/digits/hyphens, must match folder), `description` ≤1024 chars, optional `license`, `compatibility` (≤500), `metadata`, `allowed-tools` (experimental); body <5000 tokens / <500 lines; references one level deep [DOC, S9]. Verified implementers: Claude Code, Codex, Cursor, VS Code/Copilot, Gemini CLI (plus ~40 listed clients) [DOC, S10, S5, S16, S17, S18].

4. **Discovery paths differ; `.agents/skills/` is the near-universal path *except* Claude Code.** Codex: `$CWD/.agents/skills` → repo root, `~/.agents/skills`, `/etc/codex/skills` [DOC, S5]. Cursor: `.agents/skills`, `.cursor/skills`, plus compat `.claude/skills`, `.codex/skills` and user equivalents [DOC, S16]. VS Code: `.github/skills`, `.claude/skills`, `.agents/skills`, `~/.copilot|.claude|.agents/skills` [DOC, S17]. Gemini CLI: `.gemini/skills` or `.agents/skills` alias [DOC, S18]. Claude Code: `.claude/skills/`, `~/.claude/skills/`, plugin `skills/` — **`.agents/skills` is not documented** [DOC, S1]; Claude Code does follow **symlinked** skill folders and dedupes same-target links [DOC, S1].

5. **Prompt rules are soft; hooks are the only hard gates — and both main hosts now have them.** Claude Code docs say explicitly: if a skill rule "must hold every time", move it into a hook; CLAUDE.md is "context, not enforced configuration" [DOC, S1, S8]. Claude Code blocking events include `PreToolUse` (exit 2 / `permissionDecision: deny`), `UserPromptSubmit`, `Stop`/`SubagentStop` (exit 2 or `decision:"block"` = *keep working*), `PreCompact`, etc.; exit 1 is **non-blocking** [DOC, S2]. Hooks can live in settings, plugin `hooks/hooks.json`, **skill frontmatter `hooks`** (active from invocation for rest of session), or subagent frontmatter [DOC, S2]. Codex has hooks too (`PreToolUse`, `PermissionRequest`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `Pre/PostCompact`, `SessionStart/End`…), enabled by default, in `~/.codex/hooks.json`/`config.toml` or `<repo>/.codex/…`, **must be trust-reviewed via `/hooks` before running**, plugins can bundle `hooks/hooks.json` [DOC, S6]. Event names and JSON contracts are host-specific → hooks are **adapters**, not core.

6. **`/goal` is already a built-in on both Claude Code and Codex — do not name a WhipUI skill `goal`.** Claude Code `/goal <condition>` = session-scoped prompt-based Stop hook; a small fast model judges the condition **from the transcript only** (doesn't run tools); condition ≤4,000 chars [DOC, S3]. A user/project skill with a built-in's name **replaces** it in local terminal sessions [DOC, S1] — a `goal` skill would silently break the native loop. Codex lists `/goal` among slash commands [DOC, S20]; practitioner sources describe pause/resume/clear since v0.128 [PRAC, S21]. → WhipUI entry = `/whipui …` (Claude) / `$whipui …` (Codex), **composable with** native `/goal`.

7. **Description budget and truncation are real constraints.** Claude Code: description+`when_to_use` truncated at **1,536 chars**; whole listing budget = **1% of context window**; on overflow it drops descriptions of least-used skills [DOC, S1]. Codex: skill list ≤ **2% of context or 8,000 chars**, shortens descriptions first, may omit skills [DOC, S5]. The owner's 80+ personal skills make WhipUI's description likely to be truncated → explicit invocation again matters, and the key use case must be in the first ~200 chars.

8. **Skill content persistence & compaction.** In Claude Code, invoked SKILL.md enters the conversation once and **is not re-read**; after compaction only the **first 5,000 tokens** per skill are re-attached (25k total) [DOC, S1]. → Put routing/authority/approval rules at the top; keep the entry well under 5k tokens.

9. **Frontier-model guidance converges: lean, specific, reasoned, no shouting.** Anthropic: dial back "CRITICAL: You MUST…" (causes overtriggering on Opus 4.5/4.6), explain *why*, positive phrasing [DOC, S22]. Opus 4.8: literal instruction following; persistent default house style (cream bg, serif display, italic accents, terracotta); generic "don't look like AI" just swaps one default for another; two methods work: **concrete alternative spec** or **propose ~4 directions and let the user pick** [DOC, S23]. Opus 5.5: falls back on "a few default styles"; respond better to *named* patterns to avoid, iteratively; Opus 5 over-verifies if old verification prompts are carried over [DOC, S24]. OpenAI GPT-6 Astra: more sensitive to skills/AGENTS.md; **unclear/conflicting skill guidance can make it pause and block early**; state "user instructions take precedence over a skill" [DOC, S25]. GPT-5.6: "removing repeated instructions… can improve task performance", reserve ALWAYS/NEVER for true invariants [DOC, S26]. GPT-5.4 frontend blog: start at **low** reasoning, mood boards/references, Playwright verification "significantly improves" polish [DOC/blog, S27].

10. **Official tooling exists to measure trigger rate and overhead (Claude).** `claude plugin eval` runs cases with **with-plugin vs no-plugin arms** (default 3 runs), graders incl. `tool_used: Skill`, `llm` judge, and reports Δ and cost; `claude plugin details <name>` shows **Always-on** tokens; `/doctor`/`/context` show listing cost [DOC, S4, S7]. No equivalent verified for Codex.

---

## 2. Primary sources

| # | Source | URL | Pub. date | Type |
|---|---|---|---|---|
| S1 | Claude Code — Skills | https://code.claude.com/docs/en/skills | not shown | DOC |
| S2 | Claude Code — Hooks reference | https://code.claude.com/docs/en/hooks | not shown | DOC |
| S3 | Claude Code — `/goal` | https://code.claude.com/docs/en/goal | not shown | DOC |
| S4 | Claude Code — Plugin evals | https://code.claude.com/docs/en/plugin-evals | not shown | DOC |
| S5 | Codex — Build skills | https://learn.chatgpt.com/docs/build-skills (redirect from developers.openai.com/codex/skills) | not shown | DOC |
| S6 | Codex — Hooks | https://learn.chatgpt.com/docs/hooks | not shown | DOC |
| S7 | Claude Code — Install plugins / manifest ref | https://code.claude.com/docs/en/plugins/install ; https://code.claude.com/docs/en/plugins-reference | not shown | DOC |
| S8 | Claude Code — Memory (CLAUDE.md/AGENTS.md) | https://code.claude.com/docs/en/memory | not shown | DOC |
| S9 | Agent Skills specification | https://agentskills.io/specification | not shown | DOC |
| S10 | Agent Skills overview/client list | https://agentskills.io/home | not shown | DOC |
| S11 | Codex — AGENTS.md; subagents; MCP; plugins build | https://learn.chatgpt.com/docs/agent-configuration/agents-md ; https://learn.chatgpt.com/docs/agent-configuration/subagents.md ; https://learn.chatgpt.com/docs/extend/mcp?surface=cli ; https://developers.openai.com/plugins/build/plugins | not shown | DOC |
| S12 | Vercel — "AGENTS.md outperforms skills in our agent evals" (J. Gao) | https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals | 2026-01-27 | PRAC (vendor eval, models not stated) |
| S13 | S. Spence — "Measuring Claude Code Skill Activation With Sandboxed Evals" (+ earlier Haiku post) | https://scottspence.com/posts/measuring-claude-code-skill-activation-with-sandboxed-evals ; https://scottspence.com/posts/how-to-make-claude-code-skills-activate-reliably | 2026-02-08 ; 2025-11-16 | PRAC (small n) |
| S14 | SkillsBench (Li et al.), arXiv 2602.12670 | https://arxiv.org/abs/2602.12670 ; https://arxiv.org/html/2602.12670v1 | 2026-02-13 (v4 2026-06-14) | RES |
| S15 | Claude Code — Subagents | https://code.claude.com/docs/en/sub-agents | not shown | DOC |
| S16 | Cursor — Skills; Hooks | https://cursor.com/docs/context/skills ; https://cursor.com/docs/agent/hooks | not shown | DOC |
| S17 | VS Code — Agent skills; Hooks (Preview) | https://code.visualstudio.com/docs/copilot/customization/agent-skills ; https://code.visualstudio.com/docs/copilot/customization/hooks | not shown | DOC |
| S18 | Gemini CLI — Skills; Hooks | https://geminicli.com/docs/cli/skills/ ; https://geminicli.com/docs/hooks/ | not shown | DOC |
| S19 | Anthropic — Skill authoring best practices | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices | not shown | DOC |
| S20 | Codex — developer commands (lists `/goal`) | https://learn.chatgpt.com/docs/developer-commands?surface=cli | not shown | DOC (description not retrieved) |
| S21 | D. Vaughan — Codex `/goal` workflows; custom prompts→skills migration | https://codex.danielvaughan.com/2026/05/01/codex-cli-goal-workflows-persistent-long-horizon-task-execution/ ; https://codex.danielvaughan.com/2026/04/10/migrating-custom-prompts-to-skills/ | 2026-05-01 ; 2026-04-10 | PRAC |
| S22 | Anthropic — Claude prompting best practices | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | not shown | DOC |
| S23 | Anthropic — Prompting Claude Opus 4.8 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8 | not shown | DOC |
| S24 | Anthropic — Prompting Claude Opus 5.5 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5 | not shown | DOC |
| S25 | OpenAI — Prompt guidance (GPT-6 section) | https://developers.openai.com/api/docs/guides/prompt-guidance | not shown | DOC |
| S26 | OpenAI — GPT-5.6 prompt guidance | https://developers.openai.com/api/docs/guides/prompt-guidance-gpt-5p6 | not shown (~2026-07 per S21-type secondary) | DOC |
| S27 | OpenAI — "Designing delightful frontends with GPT-5.4"; Frontend prompt guide (GPT-5.5) | https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4 ; https://developers.openai.com/api/docs/guides/frontend-prompt | 2026-03-20 ; not shown | DOC/blog |
| S28 | Anthropic — "Improving frontend design through Skills" | https://claude.com/resources/articles/improving-frontend-design-through-skills | 2025-11-12 | DOC/blog (qualitative only) |
| S29 | Codex custom prompts deprecated | https://learn.chatgpt.com/docs/custom-prompts | not shown | DOC |

---

## 3. Implications for WhipUI (concrete)

### 3.1 Recommended pack layout (portable: Claude Code + Codex, degrades to Cursor/VS Code/Gemini)

```
whipui/                                  # git repo = plugin root (+ marketplace)
├── .claude-plugin/plugin.json           # Claude plugin manifest (name: "whipui")
├── .claude-plugin/marketplace.json      # lets `/plugin marketplace add VVeb1250/whipui`
├── .codex-plugin/plugin.json            # optional Codex plugin overlay (TEST)
├── skills/
│   └── whipui/                          # THE single entry skill (portable core)
│       ├── SKILL.md                     # spec-only frontmatter; ≤ ~250 lines / ≤ ~3k tokens
│       ├── agents/openai.yaml           # Codex UI metadata (ignored elsewhere)
│       ├── references/                  # on-demand modules, each ≤ ~300 lines w/ TOC
│       │   ├── modes-and-approval.md  ux-diagnosis.md  art-direction.md
│       │   ├── motion.md  reference-sources.md  design-state.md  verification.md
│       └── scripts/                     # deterministic tools (node, no deps where possible)
│           ├── render-check.mjs  a11y-check.mjs  motion-capture.mjs  state-validate.mjs
├── hooks/hooks.json                     # Claude-only OPTIONAL gates (off by default or opt-in)
└── install/                             # copy/symlink installer for non-plugin hosts
```
- **Install paths.** Claude Code: plugin (`/plugin marketplace add <owner>/<repo>` then `/plugin install whipui@<marketplace>`, or `claude plugin install … --scope user|project|local`) → invoked as `/whipui:whipui`; or standalone copy/symlink to `~/.claude/skills/whipui` or `.claude/skills/whipui` → `/whipui` [S1, S7]. Codex: copy/symlink to `~/.agents/skills/whipui` or `<repo>/.agents/skills/whipui`; invoke `$whipui …` or via `/skills` [S5]; Codex plugin path via `codex plugin marketplace add owner/repo` exists but install is documented through the app UI (TEST) [S11]. Cursor/VS Code/Gemini: `.agents/skills/whipui` works for all three [S16–S18].
- **One canonical copy:** store at `.agents/skills/whipui`, symlink `.claude/skills/whipui` → it (Claude dedupes symlinks [S1]). Risk: Cursor/VS Code read *both* `.claude/skills` and `.agents/skills` — duplicate listing behavior unverified (TEST).
- **Frontmatter:** use only spec fields (`name`, `description`, `license`, `compatibility`, `metadata`) in the portable SKILL.md. Claude-only fields (`argument-hint`, `hooks`, `context: fork`, `when_to_use`) cause **hard errors** on claude.ai upload/Skills API [S1] and have unknown effects on Codex → keep them out of the shared file; if needed, generate a Claude-specific variant in the plugin build.
- **Script paths:** write `scripts/render-check.mjs` relative to the skill dir (spec convention [S9]); avoid `${CLAUDE_SKILL_DIR}` in the shared body (Claude-only substitution [S1]).

### 3.2 Max SKILL.md size
Hard ceilings: spec <500 lines / <5,000 tokens [S9, S19]; Claude re-attaches only the first 5,000 tokens after compaction [S1]. **Recommendation: entry SKILL.md ≤ ~250 lines and ≤ ~3,000 tokens; first ~60 lines must contain mode selection, authority precedence, approval policy, and the module index.** Reference files ≤ ~300 lines each, with a TOC if >100 lines [S19]; load at most 1–3 per task (SkillsBench 4+ effect [S14]).

### 3.3 Writing the description (reliable triggering)
- ≤1,024 chars (portable hard limit), aim ~400–600; **key use case in the first sentence** (Claude truncation at 1,536, Codex shortens under budget) [S1, S5].
- Third person, what + when, concrete user words: "UI, UX, frontend design, landing page, dashboard, component, redesign, polish, Figma, screenshot, reproduce this site, animation/motion, design system, accessibility audit" [S19, S13 — keywords trigger, concepts miss].
- No "MUST/ALWAYS use this skill" language (overtriggering on newer Claude [S22]; conflicting skill guidance stalls GPT-6 [S25]).
- Add one line of negative scope (e.g., "Not for backend-only or non-visual tasks") — reduces over-triggering (hypothesis; TEST).
- Treat explicit invocation (`/whipui`, `$whipui`) as the documented primary path; auto-trigger is measured, not promised.

### 3.4 Prompt vs script vs hook

| Concern | Prompt (SKILL/refs) | Script | Hook (hard gate) |
|---|---|---|---|
| Mode choice, approval economics, taste dialogue, design judgment | ✔ | – | – |
| Authority precedence ("user > approved state > refs > AI guesses") | ✔ (top of SKILL.md, plus GPT-6-style "user overrides skill" line [S25]) | state-validate checks schema/status transitions | optional |
| Render/screenshot, viewport matrix, axe, motion capture | instruction to run | ✔ deterministic | — |
| "Don't finish UI work without rendered evidence" | ✔ soft | render-check writes evidence file + prints summary to transcript | **Claude `Stop` hook / Codex `Stop` hook**: block stop if UI files changed after last evidence timestamp (TEST) |
| "Never mark a decision `approved` without user approval" | ✔ soft | state-validate rejects `approved` without `authorized_by: user` + turn ref | Possible `PreToolUse` on writes to state file + `UserPromptSubmit` capture of approvals — fragile (TEST LATER) |
| Destructive or asset-copy safeguards | ✔ | license/provenance check in reference log | `PreToolUse` deny patterns (optional) |

Never call anything "enforced" unless it is a hook on that host and the user has enabled/trusted it (Codex requires trust review [S6]; VS Code hooks are Preview [S17]).

### 3.5 Exposing a `/goal`-style entry
- **Claude Code:** `/whipui <goal/brief>` (standalone install) or `/whipui:whipui <…>` (plugin); `$ARGUMENTS` carries the brief [S1]. For long autonomous runs, compose with native **`/goal <verifiable condition>`**; because the evaluator reads only the transcript [S3], WhipUI scripts must **print** verification evidence (e.g., "render-check: 3 viewports OK, 0 overlaps, axe 0 serious") so the evaluator can judge.
- **Codex:** `$whipui <goal/brief>` or `/skills`; native `/goal` for persistence (per practitioner sources) [S5, S21]. Custom prompts are deprecated → no custom slash command route [S29].
- **Cursor / VS Code:** `/whipui` (both expose skills as slash commands) [S16, S17]. **Gemini CLI:** activation via `activate_skill` with a user consent prompt; slash invocation of a specific skill unverified [S18].
- **Do not** create a skill or command named `goal` (replaces Claude's built-in in local sessions [S1]).

---

## 4. Portability matrix

✔ = verified in docs this session · ~ = partial/caveated · ? = unverified · ✗ = documented absent

| Feature | Claude Code | Codex (CLI/IDE) | Cursor | VS Code Copilot | Gemini CLI |
|---|---|---|---|---|---|
| Agent Skills SKILL.md | ✔ | ✔ | ✔ | ✔ | ✔ |
| Reads `.agents/skills/` | ✗ (not documented; use symlink/plugin) | ✔ | ✔ | ✔ | ✔ (alias) |
| Reads `.claude/skills/` | ✔ | ? | ✔ (compat) | ✔ | ? |
| Explicit invocation | `/name` or `/plugin:name` ✔ | `$name`, `/skills` ✔ | `/name` ✔ | `/name` ✔ | `activate_skill` + consent ✔; slash ? |
| Disable implicit invocation | `disable-model-invocation` ✔ | `agents/openai.yaml` `policy.allow_implicit_invocation: false` ✔ | `disable-model-invocation` ✔ | `disable-model-invocation` ✔ | `/skills disable` (whole skill) ~ |
| Custom slash commands (non-skill) | `.claude/commands` ✔ (legacy) | ✗ custom prompts deprecated/removed | ? | ? | ? |
| Native `/goal` | ✔ built-in | ✔ listed (details via practitioners) | ? | ? | ? |
| Custom subagents | `.claude/agents/*.md` ✔ auto-delegation by description; nesting ≤3 | `.codex/agents/*.toml` ✔ spawn only on request/instruction | ? | custom `.agent.md` ~ | ? |
| Hooks (hard gate) | ✔ many events, exit 2 / JSON deny; Stop can force continue | ✔ PreToolUse/Stop etc.; trust review required | ✔ `.cursor/hooks.json`, exit 2; `stop` followup (loop_limit 5) | ~ Preview; `.github/hooks/*.json` | ✔ `BeforeTool` etc. in settings.json |
| Skill-scoped hooks | ✔ (`hooks` frontmatter) | ? | ? | ? | ? |
| MCP | ✔ (plugin `.mcp.json`) | ✔ `[mcp_servers.x]` in config.toml, stdio + streamable HTTP | ? (not re-verified) | ? (not re-verified) | ? (not re-verified) |
| File references (progressive disclosure) | ✔ | ✔ (list includes paths) | ✔ | ✔ | ✔ (folder added to allowed paths) |
| Script execution from skill | ✔ (Bash; `allowed-tools` pre-approval) | ✔ (sandboxed shell; network default unverified) | ✔ | ✔ (terminal auto-approve settings) | ✔ |
| Instruction file | CLAUDE.md; reads AGENTS.md if no CLAUDE.md (v2.1.277+) | AGENTS.md (32 KiB cap) | ? | ? | ? |
| Plugin packaging | ✔ `.claude-plugin/plugin.json`, marketplace | ✔ portable `plugin.json` / `.codex-plugin/`; marketplace `.agents/plugins/marketplace.json` (also reads `.claude-plugin/marketplace.json` legacy) | ? | ✔ (plugin hook files mentioned) | extensions ~ |
| Trigger/overhead eval tooling | ✔ `claude plugin eval`, `plugin details`, `/context` | ? | ? | ? | ? |

---

## 5. Counterevidence / failure modes / falsifiers

| Recommendation | Counterevidence / failure mode | What would falsify it |
|---|---|---|
| Single entry skill + lazy refs | Vercel: passive always-on index beat skills [S12] → maybe a compact always-on AGENTS.md snippet beats a skill | A/B: small AGENTS.md "WhipUI index" (~1–2 KB) ≥ skill on matched tasks at lower tokens |
| Explicit invocation as primary | Newer models notice skills better (Spence baseline rose Haiku→Sonnet) [S13]; may become unnecessary | Natural-prompt trigger rate ≥90% with ≤5% false positives on current Opus 5.5 / GPT-6 |
| Compact SKILL.md (≤3k tokens) | SkillsBench "detailed" (+18.8) ≥ "compact" (+17.1): some detail helps [S14] | Detailed variant beats compact on human-rated outcomes at acceptable cost |
| Stop-hook render gate | Can loop or annoy; hook may be untrusted/disabled; evaluator/hook can't judge taste; forced verification may cause Opus 5 over-verification [S24] | Gate adds turns/tokens without reducing shipped render defects |
| Ask-for-directions on taste uncertainty | Opus 4.8 doc supports "propose 4 directions" [S23] but adds a round-trip | Users reach approval no faster / prefer autopilot output |
| Name-specific avoid-lists for aesthetics | Opus 5.5 doc says generic "avoid AI look" swaps defaults [S24]; but fixed avoid-lists can become new fixtures (WhipUI history H5) | Recurring visual patterns across unrelated tasks with the list on |
| `.agents/skills` canonical + symlink | Duplicate listings in hosts that read both dirs; Windows symlink issues | Duplicate skills observed in Cursor/VS Code |

General confound: all trigger evidence is small-n, vendor- or single-author-run, on other domains (Next.js, Svelte). None is on design tasks.

---

## 6. Keep / reject / test later

| Item | Verdict | Rationale | Cost |
|---|---|---|---|
| Single portable entry skill `whipui` (spec-only frontmatter) | **Keep** | Cross-host, minimal listing cost, matches SkillsBench 1–3 skill optimum | Low |
| Separate auto-invoked specialist skills (Motion/Review/Design) | **Reject for v1** | Listing budget, overlap, 4+ skills effect; make them reference modules | — |
| Explicit `/whipui` / `$whipui` primary entry; compose with native `/goal` | **Keep** | Avoids 50% non-activation; no name collision | Low |
| Skill named `goal` | **Reject** | Overrides Claude built-in | — |
| Deterministic scripts (render, a11y, motion capture, state validate) | **Keep** | "Low freedom for fragile ops" [S19]; Playwright improves polish [S27] | Medium (Node+Playwright dependency; must degrade) |
| Claude/Codex Stop-hook "rendered evidence" gate | **Test later (opt-in)** | Only true hard gate; risk of loops/over-verification | Medium |
| Approval-integrity hook (PreToolUse + UserPromptSubmit) | **Test later** | Fragile, host-specific | High |
| Compact always-on AGENTS.md/CLAUDE.md index snippet | **Test** (as competing arm) | Vercel evidence | Low |
| Subagents (e.g., isolated reviewer) | **Test later** | Claude auto-delegates, Codex only on request; Opus 5 over-delegates [S22] | Medium tokens |
| WhipUI-run MCP server | **Reject for v1** | Not portable-minimal; scripts suffice | — |
| Claude plugin + marketplace packaging | **Keep** (Claude) | Official install path, eval tooling | Low |
| Codex plugin packaging | **Test later** | Install flow documented via app UI; CLI install command not documented | Low–Med |

---

## 7. Suggested evaluation

1. **Trigger-rate test (per host).** 30–40 prompts: ~20 natural design requests (sparse `/goal`-like, repair, reproduce, motion), ~10 near-misses (backend, docs, non-UI CSS refactor), ~5 explicit invocations. Measure activation (Claude: `claude plugin eval` with `tool_used: Skill` grader, `--runs 3` [S4]; Codex: parse session transcript for SKILL.md read — method unverified, use `codex exec` logs), false-positive rate, and with **the owner's real 80+ skill library installed** (truncation condition) vs clean profile.
2. **Token overhead.** Claude: `claude plugin details whipui` (Always-on tokens), `/context` Skills row, and with/without-arm input tokens from eval results [S4, S7]. Codex: compare input tokens of matched runs with skill disabled via `[[skills.config]] enabled=false` [S5]. Report always-on (listing) vs on-invocation vs per-module loads separately.
3. **Attribution arms (aligns with brief §11).** Same model/effort/tools: (A) baseline, (B) baseline+same refs, (C) WhipUI entry only, (C′) compact AGENTS.md index instead of skill, (D) full incl. hooks. Change one factor per ablation; hooks on/off as its own ablation.
4. **Gate efficacy.** Count UI tasks ending without rendered evidence, with vs without Stop hook; also extra turns/tokens and loop incidents.
5. **Instruction-conflict probe (GPT-6).** Run the S25 transparency prompt ("name the SKILL.md and quote the instruction that caused a pause") on WhipUI to detect stalls from conflicting rules.

---

## 8. Uncertainty / unsupported claims

- Claude Code reading `.agents/skills/`: **not documented** (absent from the location table; last ~6% of the page unread).
- Codex: behavior of unknown frontmatter fields, default sandbox network policy, and a CLI `codex plugin install` command — **unverified**. Codex `/goal` semantics come from practitioner posts; official page only lists the name.
- Whether Codex reads `.claude/skills/` — unverified. Whether Codex skills can declare hooks — not stated.
- Cursor/VS Code/Gemini MCP and subagent details not re-verified this session.
- No source measures skill triggering or overhead on **design/UI** tasks; all numbers are from other domains and small samples (Spence n≈22–24; Vercel models unstated; SkillsBench SWE gain only +4.5 pp).
- Anthropic's frontend-skill article (S28) has no quantitative results.
- The SKILL.md size targets (≤250 lines, ≤3k tokens) are my inference from spec limits + compaction + SkillsBench, not a measured optimum.
- Version-sensitive: Claude Code features cited include version gates (e.g., AGENTS.md read v2.1.277+, `onFailure: block` v2.1.295+); confirm against the owner's installed versions.
