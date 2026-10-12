# Changelog

## 3.0.0 (2026-10-13)

Replaces 2.0.0 with two standalone skills: `whip-design` for co-design and `whip-ui`
for frontend execution. Each loads its own references as needed; shared intent and
source material stay adjacent. The npm package name remains `whipui`.

### Migration

- New invocation names: `$whip-design` / `$whip-ui`, or the equivalent Claude commands.
- `npx whipui@latest --replace` archives recognized old installations and existing
  skill files outside active discovery before installing the pair.
- Claude plugin metadata loads both skills. No Stop hook or MCP setup is included.
- Retires the old `whipui` skill, bundled render/state scripts, browser dependency
  setup, legacy installer flags and JavaScript library exports. Existing project
  content and state files are preserved; approvals are not inferred or auto-imported.

### Verification

Fixes recycled approval evidence, malformed locators, unauthorized scope changes
and pinned-constraint removal in the pack's provenance guard. Adds regression and
transactional installer coverage. Candidate status remains: these checks do not
prove design-quality gains. Historical releases and experiments remain in Git history.
