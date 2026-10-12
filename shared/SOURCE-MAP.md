# Whip Source Map v0.1 (checked 2026-10-12)

## Ground rule: "used by people" is not a causal design-quality benchmark

An official vendor repo, many installations, shipping product, or a well-made demo supports the **existence and adoption of a practice**, but generally does **not** prove that merging its prose into Whip improves interface quality over a strong model with the same tools and references. This pack was authored anew from evaluated mechanisms, NOT a concatenation of external skill text. We have not copied source scripts, databases, curated examples or proprietary designs.

Evidence tags: **O** official implementer / specification; **D** documented deployable workflow; **C** community third-party skill; **R** research/guideline; **B?** no controlled Whip-vs-baseline advantage demonstrated. `Use` means borrow a mechanism or refer to upstream on demand, not vendor or claim equivalent tooling.

| Source (real primary URL) | Evidence | Unique mechanism to reuse | Use in pack | Avoid / limits |
| --- | --- | --- | --- | --- |
| [Anthropic Frontend Design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | O, B? | Subject-grounded aesthetic POV, actual content, self-critique, restraint | UI art-direction/visual-craft | Not proof that banning fonts or fixed anti-slop examples works across tastes; separate file license terms |
| [Impeccable](https://github.com/pbakaus/impeccable) & [current skill](https://github.com/pbakaus/impeccable/blob/main/plugin/skills/impeccable/SKILL.md) | O/D, B? | Product/design context separation, craft/shape/critique/audit, bounded visual feedback and detectors | UI execution/QA, WhipDesign framing | Its bundled CLI and deterministic detectors are NOT included; avoid copy of 24 commands and heavyweight setup; license Apache-2.0 |
| [UI UX Pro Max upstream](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md) | O/D, B? | Searchable design-system/UX/style/stack data and intent-oriented retrieval | Tool/reference selection, no in-core data dump | Counts/version change; note [license metadata inconsistency issue](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/issues/481) even though root LICENSE is MIT |
| [Appllama App Design](https://github.com/Appllama/appllama-skills/blob/main/skills/appllama-app-design-skill/SKILL.md) | O/D, B? | Study actual app category, native navigation semantics, real simulator and motion validation | UI mobile surface, motion | Mobile/Expo orientation; external MCP optional; "study 20–30 screens" not universal; license listed MIT |
| [Appllama Usage](https://github.com/Appllama/appllama-skills/blob/main/skills/appllama-usage/SKILL.md) | O/D, B? | Research tool routing and flow/element query plan | Design reference intelligence | Requires their service/MCP; not an offline image library |
| [Google Stitch Skills](https://github.com/google-labs-code/stitch-skills) | O/D, B? | Design variants, code-to-design, design-system management, prototype & code workflows | Optional external tool/variants | Requires Stitch MCP credentials; cannot assume enabled; NOT copied into pack |
| [Lovable-oriented third-party skill](https://github.com/headline-design/design-craft/blob/main/lovable/SKILL.md) | C, B? | Specific product/copy, restrained signature decisions, Tailwind/shadcn patterns | Art direction + engineering ideas | Not official Lovable policy; stack-specific, 900-line body would waste context; no vendor endorsement implied |
| [Microsoft Frontend Design Review](https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/SKILL.md) | O/D, B? | Frictionless insight→action, craft and trustworthy review dimensions | UI QA and critique | Avoid converting multi-criteria judgment into unsupported scalar score |
| [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md) | O/D, B? | Source-linked review of web interface rule compliance | UI audit + a11y | Fetch/rules tool conditional; lint doesn't evaluate taste |
| [Vercel Composition Patterns](https://github.com/vercel-labs/agent-skills/blob/main/skills/composition-patterns/SKILL.md) | O/D, B? | Compose complex React components instead of boolean prop proliferation | UI engineering | React-version-dependent; not a reason to refactor an unrelated project |
| [Vercel React Best Practices](https://github.com/vercel/vercel-plugin/blob/main/skills/react-best-practices/SKILL.md) | O/D, B? | Prioritized React/Next performance/code pitfalls | UI engineering optional | Not style guidance; check actual React version |
| [Vercel agent-browser](https://github.com/vercel-labs/agent-browser/blob/main/skill-data/core/SKILL.md) | O/D, B? | Inspect real DOM/screenshots and interact using compact refs | UI rendered QA when installed | Browser tool is external, may require install/config; screenshots need image visibility |
| [Vercel agent-browser dogfood](https://github.com/vercel-labs/agent-browser/blob/main/skill-data/dogfood/SKILL.md) | O/D, B? | Reproducible functional/UX defects with screenshots and steps | UI rendered QA/audit | Test workflow overhead disproportionate for a tiny change |
| [Browser Use QA](https://github.com/browser-use/browser-use/blob/main/skills/qa/SKILL.md) | O/D, B? | Real browser-driven visual verdict + flow test | UI QA alternative | Its hosted vision service not built in to Whip; AI verdict ≠ owner's taste |
| [Interaction Design Skills](https://github.com/rastian/interaction-design-skills/blob/main/SKILL.md) | C, B? | Trigger→system response→feedback→failure→recovery state specification | Design UX methods and UI engineering | "10 states for every component" overbroad; implement reachable states |
| [Refactoring UI agent skill](https://github.com/gnurio/refactoring-ui-plugin/blob/main/SKILL.md) | C, B? | Atomic transformations with input/output, visual signals & failure conditions | UI visual craft methodology | Secondary adaptation of commercial material; not reproducing content from book |
| [Design Taste](https://github.com/h3nryprod01/design-taste/blob/main/SKILL.md) | C, B? | Visual review heuristics and craft vocabulary | Investigate/compare later | Claims of "elite taste" are positioning, not owner-specific preference accuracy |
| [Agent Skills specification](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx) | O | Name/description and progressive disclosure | Pack format | Format compliance doesn't imply quality benefit |
| [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) | R / normative | Explicit criteria for accessible web interfaces | UI QA + Design validation | Automated tests don't establish full conformance |
| [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | R / platform | Motion as feedback/continuity, reduced motion, nonblocking input | UI motion | Native-platform rules are not universal web style laws |
| [Apple HIG Design Principles](https://developer.apple.com/design/human-interface-guidelines/design-principles) | R / platform | Accessibility/platform-specific intent | UI surface modes | Platform-specific, check device and OS requirements |

## Capability coverage and selection decisions

| Capability needed | Primary borrowed mechanism | Local implementation | Deferred tool/dependency |
| --- | --- | --- | --- |
| Distinct visual identity from domain | Anthropic + Impeccable | UI `art-direction.md` | External image/reference search as available |
| Co-design, personal taste | Preference probing and contradictory references from prior research | Design `preference-dialogue.md` | Stitch variants / image boards optional |
| Real screen intelligence | Appllama + UX Pro Max retrieval architecture | Design `reference-intelligence.md` | Their MCPs/data optional |
| UX flow and errors | Interaction design + standard UX methods | Design `ux-methods.md` | User recruitment / usability lab optional |
| Component architecture | Vercel composition + project conventions | UI `engineering.md` | Stack-specific verifiers/tools |
| Motion craft | Apple HIG + mobile simulator | UI `motion.md` | Playwright/simulator/video tool optional |
| Visual/a11y QA | Impeccable + Vercel + browser workflows + W3C | UI `rendered-qa.md` | Impeccable detectors/Browser Use not bundled |
| Design intent handoff/approval | Project's prior failures and owner-approved rules | Shared JSON packet / validator | Memory Base adapter deliberately not required |

## Explicit rejection / non-adoption decisions

- Do **not** combine every upstream SKILL.md, numeric style catalog, or anti-slop ban into the model hot path.
- Do **not** enforce "reference 20–30 screens every job," hardcoded typography/palette, or one required interview.
- Do **not** ship fake wrapper scripts that purport to be Stitch, Appllama, Impeccable or browser tooling.
- Do **not** make a separate specialist skill per visual discipline until direct A/B evaluations show a gain.
- Do **not** treat star count, marketing screenshots, revenue rank or model-issued design grades as causal quality proof.

## How to update sources

Pin repository commit/release and license for any third-party code you actually vendor; none vendored in v0.1. Before running external commands, inspect the current upstream docs. Re-check licensing, installation and supported APIs on tool integration, especially where upstream metadata conflicts. User or project approved choices outrank upstream defaults.
