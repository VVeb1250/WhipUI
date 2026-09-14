# Sources and adaptation record

Reviewed 2026-09-12. Source availability and popularity do not prove UX or visual
quality. Retain this file and the adjacent license when copying the adaptations.

## Bundled UX references

Sumi, Phazur Labs LLC, Apache-2.0.
Pinned revision: 6bfd5c6e3b821191cedf8dc5e0bb5fb9c9e32258.
https://github.com/phazurlabs/sumi/tree/6bfd5c6e3b821191cedf8dc5e0bb5fb9c9e32258

| Upstream file under skills/ | Local adaptation | Selection |
| --- | --- | --- |
| nng-ux-heuristics/SKILL.md | specialists/ux-foundations.md | Heuristic lenses and actionable findings |
| screen-flow-patterns/SKILL.md | specialists/flows-and-navigation.md | Task sequence and relevant state coverage |
| navigation-pattern-encyclopedia/SKILL.md | specialists/flows-and-navigation.md | Orientation, labels and pattern tradeoffs |

These are modified excerpts/syntheses, not a Sumi installation. Removed broad
unsupported statistics, rigid numeric thresholds, mandatory evaluator counts and
references to unbundled resources. Preserved attribution and the complete
upstream LICENSE at licenses/sumi-apache-2.0.txt. No upstream executable code,
hooks or MCP configuration is bundled.

## Bundled composition reference

Hallmark, Copyright (c) 2026 Hallmark contributors, MIT.
Reviewed 2026-09-14. Pinned revision: 13ac0ec7e148655948100b6396439e481361d690.
https://github.com/Nutlope/hallmark/tree/13ac0ec7e148655948100b6396439e481361d690

The macrostructures.md and structure.md files under skills/hallmark/references/
inform [visual-composition.md](specialists/visual-composition.md). This modified
synthesis retains task-fit page shapes and coherent composition axes. WhipDesign
owns UX and the creative workflow; this reference is not a full Hallmark install.

Excluded mandatory cross-page diversification, aesthetic blacklists, fixed
question/candidate quotas, upstream gates and separate design/log storage.
Those would conflict with product consistency, natural short briefs and existing
DNA/fingerprint ownership. Keep browser evidence and explicit reference authority.
No executable code, hooks, MCP or additional provider download is included.
The complete pinned [MIT license](licenses/hallmark-MIT.txt) accompanies the adaptation.

## External providers, not vendored

- Impeccable: https://github.com/pbakaus/impeccable
  Retained for bounded visual craft, critique and state/copy refinement.
- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  Retained as an optional per-question specialist for installed users, not the
  default owner of design. Installation is opt-in with --with-pro-max; existing
  installations are preserved and discoverable.
- Playwright MCP: https://github.com/microsoft/playwright-mcp
  Retained for web capture and browser/task evidence.
- Figma MCP: https://github.com/figma/mcp-server-guide
  Conditional on Figma input and host availability.
- Anthropic frontend-design: https://github.com/anthropics/skills/tree/main/skills/frontend-design
  Optional already-installed creative specialist only. No source copied;
  file-specific license terms must be checked before redistribution.

WhipUI's original workflow/CLI remains MIT. The Sumi-derived references retain
Apache-2.0 terms; the Hallmark adaptation retains MIT attribution. Upstream provider installation and authentication remain with
the host and the explicit setup flow; these references need no extra install.
