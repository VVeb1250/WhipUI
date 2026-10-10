# WhipUI · v2.0.0

A UX/UI **design-partner skill** for coding agents (Claude Code, Codex, Cursor, VS Code, Gemini CLI).
It doesn't impose a style. It adds what a frontier model lacks on its own:

- **When to ask vs act:** uncertainty × cost-of-a-wrong-guess, with "scope down and batch" as a third option, and options shown as renders, not interviews.
- **Decision continuity:** `.whipui/state.json` records what was proposed, approved (with the user's words), rejected or superseded. Suggestions never silently become spec.
- **References as evidence, not fixtures:** a free-first source catalog, mechanism deconstruction (borrow / avoid / transform), no-copy safeguards.
- **Rendered verification:** scripts that render at real viewports, check what axe misses, play motion back in normal and reduced modes, script interactions, and measure reproduction fidelity.
- **Human taste stays human:** an offline options/annotation page whose marks become narrowly scoped tickets. No AI aesthetic scores.

> **ภาษาไทยโดยย่อ:** WhipUI คือ skill เดียว (`/whipui`) + module ความรู้ที่โหลดเฉพาะงาน + script ตรวจ render/motion/interaction + ไฟล์ state ที่จำว่าผู้ใช้อนุมัติอะไร. ไม่มี house style ไม่มี blacklist. งานสวยหรือไม่ให้คนตัดสิน ส่วน AI ตรวจ defect ทางเทคนิค/UX

## Install

**Claude Code (plugin):**
```
/plugin marketplace add VVeb1250/WhipUI
/plugin install whipui@whipui        → invoke: /whipui:whipui <goal>
```
**Any host (copy or symlink the skill):**
```
node install/install.mjs --host all [--scope user|project] [--link] [--with-deps]
# Claude Code: ~/.claude/skills/whipui → /whipui     Codex/Cursor/VS Code/Gemini: ~/.agents/skills/whipui → $whipui or /whipui
```
**Rendered checks (optional, recommended):** `cd skills/whipui/scripts && npm install && npx playwright install chromium`,
then `node skills/whipui/scripts/doctor.mjs`. Without a browser, the scripts say "NOT RENDERED" instead of guessing.
Optional always-on index: `adapters/AGENTS.snippet.md`. Optional one-time reminder before finishing unverified UI work (Claude Code Stop hook, blocks once): `adapters/claude-code/`.

## Use

```
/whipui landing page for my indie rhythm game, goal: wishlists
/whipui fix: pricing toggle overlaps cards on mobile
/whipui rebuild target.png exactly
```
It works with the built-in `/goal` of Claude Code and Codex. Every script prints a `WHIPUI-EVIDENCE …`
line, so the goal evaluator (which reads only the transcript) can see what was verified. See `examples/`.

## Layout

```
skills/whipui/SKILL.md          entry (≈4k tokens on invoke, ≈210 always-on; measured with `claude plugin details`)
skills/whipui/references/       10 on-demand modules (framing, ux-diagnostics, accessibility, art-direction,
                                references, collaboration, motion, frontend, verification, design-state)
skills/whipui/scripts/          doctor, detect-project, render-check, motion-probe, interact, ref-capture, review-page, state
skills/whipui/agents/openai.yaml Codex UI metadata
.claude-plugin/                  Claude plugin + marketplace manifests (validated --strict)
adapters/                        AGENTS snippet; opt-in Stop hook
install/install.mjs              multi-host installer
tests/run-all.mjs                structural + tool tests
eval/                            pre-registered pilot: briefs, seeds, runner, blinded judging page, analysis, fixture audit
research/R1–R7                   research tracks with dated sources
SYNTHESIS.md · ASSUMPTIONS_AND_DECISIONS.md   rationale and decision log
```

## Status: what is and isn't established

| Claim | Status |
|---|---|
| Installs and validates as a Claude Code plugin; skill format follows the Agent Skills spec | **Built + tested** (`claude plugin validate --strict`; installer tests) |
| Loads and routes in headless Claude Code via `/whipui:whipui` | **Tested** (smoke + 6 pilot runs; tools used in every WhipUI run) |
| Codex / Cursor / VS Code / Gemini loading | **Not tested** (paths and metadata per docs only) |
| Skill/manifest/installer structure | **Tested** (static checks in `tests/run-all.mjs --static`) |
| Scripts detect what they claim on seeded fixtures (render-check, motion-probe, interact, ref-capture, review-page, state, detect-project) | **Tested** (tool suites in `tests/run-all.mjs`; total count printed at the end) |
| Scripts' false-positive rate on real production sites | **One real site checked** (owner's Astro portfolio, 7 pages): first run surfaced 6 false-positive classes, all fixed with regression tests; warn/error findings 65 → 10, all 10 verified real. One site is not a rate. See `examples/real-site-portfolio/` |
| Outputs better than / not worse than a strong baseline | **Promising, not established.** Owner blind judgments (P1b + ablation, n = 3 briefs, Sonnet): full skill vs baseline **3–0**, vs tools-only **2–0 + 1 tie**; tools-only alone lost to baseline 1–2. Pre-registered status: replicate before claiming. Cost ≈1.4–1.7× baseline. See `eval/results/P1b/RESULTS.md` |
| Statistical superiority | **Not claimed.** Would need the full pre-registered pilot plus replication |

## Run the tests and the pilot

```
node tests/run-all.mjs                       # ~2 min, needs Chromium for render suites (--static otherwise)
node eval/run-pilot.mjs --pilot P2 --briefs B1,B2 --arms A,B,C,Cp --model sonnet
node eval/make-judging.mjs --pilot P2 --contrasts B-A,C-B,C-A
node eval/analyze.mjs --pilot P2             # after judgments.csv is saved into eval/results/P2/
```

MIT licence. Built clean-room. The legacy `whipui@1.2.0` was read for lessons only; no code or prompts were copied.
