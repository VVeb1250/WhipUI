# R5 — Frontend Implementation & Visual Verification

Track: R5 · Author: research subagent R5 · Date: 2026-10-10
Labels used: **[Doc]** official documentation/spec · **[Research]** peer-reviewed or arXiv study · **[Vendor-research]** study published by a tool vendor · **[Measured-here]** observed in this session's prototype runs · **[Inference]** my reasoning, not directly sourced.

---

## 1. Most consequential findings (prioritized)

### F1. Cheap DOM-geometry checks plus axe catch most AI-UI technical defects; ship them as an executable script, not as prompt rules
**[Measured-here]** I built the `render-check` prototype (§4). It takes about 2.5 s per viewport. On a page with 13 seeded defects it detected all 13. It produced 0 warn/error findings across 6 runs on a control page (3 viewports × light/dark, plus text stress). On a realistic Thai dashboard fixture it caught 4 of 4 seeded defects without flagging legitimate patterns: scrollable chip row, scroll-wrapped table, off-canvas drawer, sticky header, z-indexed stretched-link button. It also found an **unseeded** real defect in my own fixture: the KPI value "฿1,284,900" overflows its card at 375 px. Every defect class it checks for (horizontal overflow, clipped labels, covered buttons, tiny adjacent targets, missing focus styles, broken images and fonts, console errors) is something a model can rarely see from code alone, and all of them are mechanically decidable.
**Implication:** this supports HY4. The verification layer should be a script the agent runs and reads (a JSON summary plus PNGs it looks at), not a checklist in SKILL.md.

### F2. axe-core is required but covers a different slice than layout QA; it misses most of what makes AI UI look broken
**[Vendor-research]** Deque reports that axe-core found 57.38% of issues *by issue volume*. The sample was about 13k pages/states and about 295k issues, from first-time audits only. By WCAG success criterion, the figure is only 16 of 50 AA criteria (20–30%). [Deque] The axe-core README makes the same "57%" claim. It promises "zero false positives (bugs notwithstanding)" and puts uncertain results in `incomplete` for manual review. [axe-core]
**[Measured-here]** axe did **not** flag: horizontal overflow, clipped button text, text spilling out of a fixed-height card, a link covered by an absolutely positioned button, a nested button covered by a stretched-link `::after`, `outline:none` focus removal, a missing web font, or **a placeholder-only input (no `label` violation, because a placeholder counts as an accessible name)**. axe *did* catch contrast, missing `alt`, `target-size`, `region`, and `scrollable-region-focusable`. That last one exposed a real gap in my supposedly "clean" control page, and axe was right.
**[Doc]** Playwright's own accessibility guide says "many accessibility problems can only be discovered through manual testing." It recommends `withTags` scoping and fingerprinting known violations (rule id + selector) rather than snapshotting the whole array. [PW-a11y]
**Implication:** keep axe for accessibility and add custom layout heuristics for visual breakage. Never report "accessible" from an axe pass alone.

### F3. Pixel diff is a regression tool for unchanged areas in the same environment. It is not a fidelity metric and not a taste metric
**[Doc]** Playwright `toHaveScreenshot` uses pixelmatch. It generates a baseline on first run, names baselines per browser and platform, and warns that rendering varies with "host OS, version, settings, hardware, power source, and headless mode", so baselines must come from the same environment. [PW-snap] Defaults: `animations:"disabled"`, `caret:"hide"`, `scale:"css"`, `threshold:0.2`. [PW-assert] pixelmatch ignores anti-aliased pixels by default and uses an OKLab/HyAB colour metric. It requires identical image dimensions. [pixelmatch]
**[Measured-here]** A static page diffed against itself across runs gave 0 px at every viewport. A one-colour CSS change gave 79–95 px. A page with a JS `requestAnimationFrame` animation and a 50 ms clock gave **78 px of noise even with `animations:'disabled'`**, because that option freezes CSS and Web Animations only, not JS-driven motion.
**Implication:** use pixel diff after a *surgical* edit to prove that untouched viewports and regions did not change. This directly supports the brief's "no unrequested restyling" guardrail. Mask dynamic regions. Never use it to judge reproduction quality (F7) or aesthetics.

### F4. Agent browser access now has three credible official channels. A script-first core stays portable; MCPs should be optional
**[Doc]** **Playwright MCP** (`@playwright/mcp`, 0.0.83, published 2026-09-28) drives pages from the **accessibility-tree snapshot** rather than pixels. It has opt-in capability groups (vision, pdf, devtools, network, storage, testing, config) and flags such as `--viewport-size`, `--device`, and `--headless` (the default is headed). The README itself points coding agents to **Playwright CLI + skills** as "more token-efficient" and states that MCP "is not a security boundary." [PW-MCP] **Playwright CLI** (`@playwright/cli` 0.1.22) supports `open`, `snapshot`, `screenshot`, `resize`, `console`, `requests`, named sessions, and `install --skills`. Its token-efficiency claim comes with no published benchmark. [PW-CLI]
**[Doc]** **Chrome DevTools MCP** (`chrome-devtools-mcp` 1.10.1; announced as public preview 2025-09-23) lists 57 tools. Relevant ones: `emulate` (viewport with DPR/mobile/touch, `colorScheme`, network throttling, CPU throttling), `take_screenshot` (fullPage or element), `take_snapshot`, `list_console_messages` with source-mapped stacks, network inspection, `performance_start/stop_trace` + `performance_analyze_insight`, and `lighthouse_audit` (accessibility, SEO, best practices; excludes performance). Screencast is experimental and behind a flag. Usage statistics are **on by default**, and performance tools may send trace URLs to the CrUX API unless you pass `--no-usage-statistics` / `--no-performance-crux`. [CDT-MCP][CDT-tools][CDT-blog]
**Implication:** a Node script reached through the host's shell works the same in Claude Code and Codex and needs no MCP install. Offer Playwright MCP or DevTools MCP as *optional* adapters for interactive exploration, such as clicking into states or reading performance traces. Document DevTools MCP's telemetry defaults.

### F5. Design tokens: DTCG 2025.10 is stable but is not a W3C Standard. Tailwind v4 makes CSS variables the de-facto token layer in many repos. *Detect before you define*
**[Doc]** On 2025-10-28 the DTCG published its first stable version, "2025.10". The Format Module is a **Final Community Group Report**, "not a W3C Standard". It specifies JSON files with `$value`/`$type`/`$description`, `{group.token}` aliases, `.tokens`/`.tokens.json`, and `application/design-tokens+json`. [DTCG-ann][DTCG-format][DTCG-TR] The announcement lists Style Dictionary, Tokens Studio and Terrazzo as reference implementations, and Figma, Penpot, Sketch, Framer and others as supporting it. [DTCG-ann]
**[Doc]** Tailwind v4 (2025-01-22) moved configuration to CSS via `@theme`. Theme variables generate utilities *and* are emitted as `:root` custom properties. Namespaces include `--color-*`, `--font-*`, `--breakpoint-*`, `--container-*`, `--spacing`. `--color-*: initial` resets a namespace, and `@theme inline` changes how variable references resolve. [TW-v4][TW-theme] shadcn/ui's `components.json` records `style`, `tailwind.css`, `baseColor`, `cssVariables` (semantic tokens such as `background`/`primary`) and `aliases`. For v4, `tailwind.config` is left blank, and some fields cannot be changed after init. [shadcn]
**Implication:** for `EXTEND_EXISTING_SYSTEM`, the agent's first job is to *discover* the token source, not invent a DTCG file. Fast detection signals [Inference, from the docs above]:
- `package.json` dependencies and version of `tailwindcss`
- `@import "tailwindcss"` / `@theme` in CSS, or a `tailwind.config.*`
- `components.json` (shadcn)
- `*.tokens.json` / Style Dictionary config
- CSS-in-JS theme files, plus MUI/Chakra/Mantine dependencies
- `:root{--…}` blocks

Drift check: new code should use existing utilities and variables, not raw hex values or arbitrary `[13px]` values. That is a grep-level lint, cheap to script, but **not built or evaluated in this track**.

### F6. Responsiveness now has two axes, viewport and container, so the state matrix must include content stress, not just breakpoints
**[Doc]** Size container queries became **Baseline Widely available in August 2025**. [Baseline-Aug25] MDN states that style queries only work with custom properties. [MDN-CQ] Components can therefore legitimately respond to their container, so checking only 3 viewport widths can miss a card that breaks in a narrow sidebar slot.
**[Measured-here]** Two classes of defect appeared *only* under non-default conditions. First, a dark-scheme link-contrast failure: the light pass was clean, and the defect appeared only with `colorScheme:'dark'`. Second, a fixed-width button that fits its current label but clips under +40% text. The stress pass also showed that a stress percentage needs calibrating: my first seeded button had enough slack that +40% still fit.
**Implication:** the matrix in §3.3 should vary content and preference media (dark scheme, reduced motion), not only width.

### F7. Screenshot→code fidelity should be measured structurally plus visually, and humans weigh layout over exact text
**[Research]** Design2Code (Si et al., arXiv 2403.03163; v1 2024-03-05, v3 2025-02-09) uses 484 real web pages. It scores **Block-Match** (recall of visual blocks), **Text** (Dice similarity), **Position**, **Color** (CIEDE2000), and **CLIP** similarity with text masked. In a logistic regression predicting human pairwise wins (79.9% accuracy), Block-Match, Position, Color and CLIP were positive and significant, while Text was *negative* and the least significant. Models' main failures were **recall of elements and layout**: on the HARD set they missed 30–40% of blocks. [D2C]
**[Inference]** Raw pixel diff punishes a 2 px global offset as heavily as a missing section and cannot tell them apart. SSIM is more tolerant but still only measures pixels. Neither knows that a block is missing.
**Implication:** for `REPRODUCE_TARGET`, run block/element matching (missing or extra blocks, bounding-box deltas, colour deltas) plus side-by-side and overlay images for a human. Use pixel or perceptual diff only as a secondary signal once layout matches.

### F8. Flakiness comes mostly from readiness and motion, not from the checks themselves
**[Doc]** Playwright marks `waitForLoadState('networkidle')` **DISCOURAGED** ("rely on web assertions to assess readiness instead"). [PW-page] Lighthouse warns that performance scores "will change due to inherent variability" and advises multiple runs. [LH] CLS uses session windows (bursts with ≤1 s gaps, ≤5 s total; shifts within 500 ms of input excluded; good ≤ 0.1, poor > 0.25). [CLS]
**[Measured-here]** All flake sources I hit:
- JS-driven animation, which `animations:'disabled'` cannot freeze
- font loading, which needs `document.fonts.ready`
- a late-injected banner that shifts content
- hover state left behind by the mouse, solved by `mouse.move(-1,-1)`

My CLS value is a plain sum without session windows, so it is approximate. Lighthouse 12.8.2 on the same flawed page reported CLS 0.239, and my approximation gave 0.241 at 375 px. That is close on this simple page but not guaranteed.
**Implication:** the tool should accept a "ready" selector and a setup script from the agent, and should report what it could not stabilize.

### F9. Severity calibration matters more than detection: report evidence with `measured` / `heuristic` labels, never a verdict
**[Measured-here]** Five false positives or negatives appeared during development and were fixed. Example: Chromium changes `outline-offset` on focused links even under `outline:none`, so a naive check reported focus as visible. An agent that trusts a heuristic blindly would "fix" non-problems or miss real ones. WCAG 2.5.8 shows why nuance is needed. The minimum is 24×24 CSS px, but a spacing exception (non-intersecting 24 px circles), an inline exception, and others apply [WCAG-258], so a small-but-spaced target is `info`, not `error`.
**Implication:** every finding carries `kind` (`measured`/`heuristic`) and `severity`. The skill should tell the agent to **look at the screenshot crop** before acting on a heuristic finding.

---

## 2. Primary sources (accessed 2026-10-10)

| Key | URL | Published / version | Label |
|---|---|---|---|
| DTCG-ann | https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ | 2025-10-28 | Doc (W3C CG announcement) |
| DTCG-format | https://www.designtokens.org/tr/2025.10/format/ | 2025-10-28, Final CG Report | Doc (spec) |
| DTCG-TR | https://www.designtokens.org/technical-reports/ | lists 2025.10 Stable | Doc |
| TW-v4 | https://tailwindcss.com/blog/tailwindcss-v4 | 2025-01-22 | Doc (vendor) |
| TW-theme | https://tailwindcss.com/docs/theme | undated docs | Doc |
| shadcn | https://ui.shadcn.com/docs/components-json | undated docs | Doc |
| Baseline-Aug25 | https://web.dev/blog/baseline-digest-aug-2025 | 2025-09-11 | Doc (Google web.dev) |
| MDN-CQ | https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries | text dated "February 2024" for style queries | Doc |
| PW-snap | https://playwright.dev/docs/test-snapshots | current docs | Doc |
| PW-assert | https://playwright.dev/docs/api/class-pageassertions | current docs | Doc |
| PW-page | https://playwright.dev/docs/api/class-page (emulateMedia; waitForLoadState) | current docs | Doc |
| PW-a11y | https://playwright.dev/docs/accessibility-testing | current docs | Doc |
| PW-MCP | https://github.com/microsoft/playwright-mcp ; npm `@playwright/mcp` 0.0.83 | npm modified 2026-09-28 | Doc |
| PW-CLI | https://github.com/microsoft/playwright-cli ; npm `@playwright/cli` 0.1.22 | npm modified 2026-09-28 | Doc (efficiency claim unbenchmarked) |
| CDT-MCP | https://github.com/ChromeDevTools/chrome-devtools-mcp ; npm `chrome-devtools-mcp` 1.10.1 | npm modified 2026-09-23 | Doc |
| CDT-tools | https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/tool-reference.md | current | Doc |
| CDT-blog | https://developer.chrome.com/blog/chrome-devtools-mcp | 2025-09-23 | Doc (vendor blog) |
| axe-core | https://github.com/dequelabs/axe-core ; npm 4.14.0 (used 4.13.0 via @axe-core/playwright 4.13.0) | current | Doc (vendor claims) |
| Deque | https://www.deque.com/automated-accessibility-testing-coverage/ | page modified 2026-07-10; study date not stated | Vendor-research |
| WCAG-258 | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | WCAG 2.2 Understanding | Doc (W3C) |
| pixelmatch | https://github.com/mapbox/pixelmatch ; npm 8.0.0 | npm modified 2026-10-06 | Doc |
| LH | https://github.com/GoogleChrome/lighthouse ; npm 13.5.0 (tested 12.8.2 locally) | npm modified 2026-10-09 | Doc |
| CLS | https://web.dev/articles/cls | current | Doc |
| D2C | https://arxiv.org/abs/2403.03163 (HTML v3: https://arxiv.org/html/2403.03163v3) | v1 2024-03-05, v3 2025-02-09 | Research |
| Thai | https://w3c.github.io/sealreq/thai/ | Editor's draft, undated | Doc (W3C i18n). Did **not** substantiate claims about Thai line-height/clipping |

---

## 3. Implications for WhipUI

### 3.1 Tool list

| Tool | Status | Why |
|---|---|---|
| **render-check script** (Node + Playwright + @axe-core/playwright) | **Required core** (degrades: if Playwright/Chromium is missing, say "not rendered, unverified") | Multi-viewport screenshots, axe, layout heuristics, console/network/font/image errors, text stress, baseline diff in one call. Portable through the shell. |
| Playwright `page.screenshot` / `toHaveScreenshot` | Required (via script); `@playwright/test` optional for projects that already use it | Regression baselines in the project's own test suite. |
| pixelmatch | Required (via script) | Region and viewport regression after surgical edits. |
| Playwright MCP *or* Chrome DevTools MCP | **Optional adapter** | Interactive exploration of states and flows. DevTools MCP adds traces, `lighthouse_audit`, CPU/network emulation and source-mapped console. Note its telemetry defaults. |
| Playwright CLI (+ its skills) | Optional; **test later** | Possibly a cheaper interactive channel; its efficiency claim is unverified. |
| Lighthouse CLI | Optional | Performance score and audits. Overlaps with axe on accessibility (in my run it flagged the same contrast/alt/target-size issues). Variable; run multiple times. |
| Video capture (`recordVideo`) / DevTools screencast | Optional; owned by **R4** (motion) | Stills can't verify motion (brief §2). |
| Token-drift lint (raw hex/px outside the token source) | **Test later** | Cheap, but not built or evaluated here. |
| Block-matching fidelity scorer for REPRODUCE_TARGET | **Test later** | Supported by D2C; not prototyped. |

### 3.2 Implementation guidelines that change decisions
1. **Detect conventions before writing UI.** Read `package.json`, the Tailwind version and `@theme`/config, `components.json`, token files and `:root` variables. Extend what exists. Introduce DTCG JSON only if the project already uses a token pipeline or the user asks. DTCG is a stable CG report, not a standard every repo needs. [F5]
2. **Verification is a loop step, not a final ceremony.** After every non-trivial render-affecting edit, run render-check at the matrix's *minimum* tier, read the summary, **open the screenshots**, and fix measured errors. Treat heuristic warnings as prompts to look, not as automatic fixes. [F1, F9]
3. **Report verified vs. assumed.** The agent should say "render-checked at 375/768/1440 light: 0 errors; 2 heuristic warnings reviewed (intentional ellipsis)". It should never say "accessible" or "responsive" without naming what was checked. Automated accessibility covers a minority of WCAG criteria. [F2]
4. **Keep the agent's context small.** Feed only `summary` and the top N findings with selectors into context. The full JSON can be large. I measured run time (~2.5 s/viewport), not token cost. [Inference]
5. **Put the page into the state before checking.** Menus open, error state, empty data, loading: the tool currently checks only what is on screen. A `--setup` script hook is the next feature to add. [F8]

### 3.3 State / viewport matrix

| Tier | When | Dimensions |
|---|---|---|
| **Minimum (every iteration)** | Any render-affecting change | 375×812, 768×1024, 1440×900 · light · `reducedMotion: reduce` · axe + layout checks |
| **Standard (before reporting done)** | CREATE_TO_SHIP, EXTEND, REPAIR | Minimum + **dark** (if the project supports it) + **text stress** (Thai/long copy) + keyboard focus walk + content variants: empty, 1 item, many items, long unbroken string (URL/number), missing image |
| **Extended (on demand)** | Broad UI, design systems, i18n products | + 320 px and 1920 px · component-at-container-widths (narrow slot / sidebar) · loading/skeleton, error, disabled, hover, focus-within · `forcedColors: active`, `contrast: more` (Playwright `emulateMedia` supports these [PW-page]) · 200% zoom (untested here) · motion playback (R4) |

Thai-specific stress [Inference; not substantiated by the W3C draft]: Thai has no inter-word spaces (the W3C page notes spaces separate phrases), so long runs depend on the engine's line breaking. Stacked vowels and tone marks raise the risk of vertical clipping under tight `line-height` or `overflow:hidden`. The prototype stress pass appends Thai text, but its +40% figure is arbitrary and needs calibrating against real translations.

### 3.4 Regression strategy
- **Baseline = last user-approved render**, stored with the Design State (`current_artifacts`) per environment (browser + OS + DPR). Never compare across machines. [PW-snap]
- After a **targeted** fix, diff all viewports against the baseline. Changes outside the intended region become a question for the user, not a silent update. This turns the brief's "no unrequested restyling" into a checkable step (the check itself is a hard check; acting on it remains up to the agent).
- Mask dynamic regions (clocks, carousels, ads) and freeze JS motion where possible. Otherwise expect noise (78 px observed).
- Re-baseline only on explicit approval.
- In projects with `@playwright/test`, emit `toHaveScreenshot` tests so regression lives in the repo's CI rather than in WhipUI.

---

## 4. Prototype results

**Location:** `/home/claude/whipui-next/research/prototypes/render-check/` (`render-check.mjs`, `test/run-tests.mjs`, `test/fixtures/*`, `README.md`, `sample-output/`).
**Environment:** Node 22.22.0. The npm registry was reachable, so the Node `playwright` package installed fine (pinned 1.56.0 to match the preinstalled Chromium 141.0.7390.37 bundle at `/opt/pw-browsers`). `@axe-core/playwright` 4.13.0, pixelmatch 8.0.0, pngjs 7.0.0.

**What I ran:**
1. `npm test`: serves 4 fixtures over local HTTP and asserts on the reports. **51 passed / 0 failed**, three consecutive runs, about 37 s each.
2. Determinism: static fixtures re-run against their own baselines gave 0 px diff at every viewport, light and dark. A colour change gave 79–95 px. A JS animation gave 78 px of noise.
3. Lighthouse 12.8.2 headless against the Playwright Chromium on `flawed.html`: a11y 0.76, best-practices 0.96, perf 0.88. Failing audits: errors-in-console, layout-shifts, color-contrast, image-alt, target-size. That is a **subset** of render-check's catch, plus the perf score.
4. Real websites: **not tested**. The sandbox egress policy returned 403 for `playwright.dev` and `example.com`, and I did not retry.

**Output summary (flawed.html, 375 px):**
- **Errors:** horizontal overflow (scrollWidth 656 > 375; culprits `header > nav`, `div.wide`); link/close-button overlap (63%) and occlusion; three 16 px buttons failing the 2.5.8 spacing exception; broken image ×2; uncaught exception; console error; failed image and font requests; axe color-contrast, image-alt, target-size.
- **Warnings:** clipped CTA label; card text spill; focus not visible (12 elements); placeholder-only field; font load error; CLS 0.241.
- **Info:** a spaced input under 24 px tall.
- Inline link in a sentence: correctly exempt.

**False positives / negatives observed** (details in the README):
- FP (fixed): UA `outline-offset` change counted as a focus indicator.
- FN (fixed): `overflow-x:hidden` forces `overflow-y:auto`, so the single-axis ancestor walk missed horizontal clipping.
- FP (fixed): document-space geometry of fixed or sticky bars vs. flow content.
- FP (fixed): sticky header blamed at max scroll.
- Fixture error: a stress seed with too much slack.
- **Remaining known limits:**
  - centre-point-only occlusion
  - no `::before/::after`/`:focus-within` focus indicators
  - shadow DOM not traversed by the custom checks
  - CLS without session windows
  - findings duplicated per viewport (no dedupe)
  - no state driving
  - `networkidle` used as a 5 s best-effort wait despite Playwright's discouragement

**Honest assessment:** the checks are reliable on fixtures I wrote, which is a biased test set. The real-site false-positive rate is unknown and is the most important next measurement.

---

## 5. Counterevidence, decisions, evaluation, uncertainty

### Counterevidence / competing explanations
- **Frontier models with plain screenshots may already catch most of this.** If a model given three viewport screenshots finds overflow and clipping as reliably as the script, render-check's value shrinks to the non-visual items: console, fonts, focus, axe, occlusion. *Falsifier:* seeded-defect recall of screenshot-only review vs. render-check review on held-out pages.
- **Heuristic noise can cause harm.** False warnings may push agents into needless "fixes" that degrade a design, for example removing an intentional bleed or marquee overflow. *Falsifier:* count user-rejected fixes triggered by heuristic findings.
- **axe "57%"** is a vendor figure, measured by issue volume on first-time audits. By WCAG criteria, coverage is 20–30%. Neither number means automated testing is enough. [Deque]
- **Playwright CLI's token savings** are claimed, not benchmarked. **MCP vs. script** context cost was not measured here.

### Keep / reject / test later
| Item | Decision | Rationale / cost |
|---|---|---|
| render-check script as the core verification tool | **Keep** | Works, fast, portable. Needs Playwright plus about 150 MB of Chromium; degrade gracefully. |
| axe via @axe-core/playwright | **Keep** | Low false-positive design; WCAG 2.2 tags. |
| Pixel diff for regression of untouched areas | **Keep** | Supports intent preservation; same-environment only. |
| Pixel diff / AI score as fidelity or taste metric | **Reject** | Contradicted by D2C findings and owner intent (C7). |
| Mandatory MCP dependency | **Reject** | Brief C14, portability, telemetry defaults (DevTools MCP). |
| Optional Playwright MCP / DevTools MCP adapters | **Keep (optional)** | Useful for state exploration and perf traces. |
| Lighthouse in the default loop | **Reject for default; optional** | Slow, variable, overlaps axe. |
| Text-stress pass | **Keep, calibrate** | Found a stress-only defect; the percentage is arbitrary. |
| Token-drift lint, `--setup` state hook, block-match fidelity scorer, finding dedupe | **Test later** | Plausible high value; unbuilt. |

### Suggested evaluation
1. **Seeded-defect benchmark on held-out pages.** At least 20 real or open-source UIs, with defects injected by someone other than the tool author, each recorded with type and location. Compare arms: (a) code-only review, (b) screenshot-only review by the model, (c) render-check JSON + screenshots, (d) (c) + MCP exploration. Measure recall, precision, tokens and time per arm. This isolates the *tool* from skill text and references, matching the brief's ablation requirement (§11).
2. **False-positive audit on unmodified real sites.** 30–50 diverse production pages; hand-label each heuristic warning TP/FP. Target ≥ 80% precision for `warn` before an agent may auto-act on it.
3. **Regression-guard test.** Ask the agent for a targeted fix and count unrequested visual changes outside the target region, with and without the baseline-diff step.
4. **Reproduction tasks.** Score block recall, position and colour per D2C, alongside blinded human pairwise preference. Report agreement.

### Uncertainty / unsupported claims
- I did not verify Playwright MCP's or Playwright CLI's token cost, or DevTools MCP's `lighthouse_audit` output format, by running them.
- My claim that SSIM is insufficient for structure is reasoning, not a cited study.
- The Thai line-break and diacritic-clipping risk is practitioner knowledge, not established by the W3C draft I could access.
- Container queries' effect on what to test is a design inference from Baseline status.
- All prototype numbers come from my own fixtures in one headless Chromium 141 on Linux. Firefox, WebKit, real devices and real sites were not tested.
