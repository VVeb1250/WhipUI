# WhipDesign + WhipUI

Two standalone Agent Skills, published as `whipui@3.0.0`.

| Skill | Responsibility |
| --- | --- |
| **whip-design** | Human-guided UX/UI co-design: frame goals, explore taste through contrasting references, work through flows, critique, validate and preserve owner decisions. |
| **whip-ui** | Build, reproduce, extend, polish and repair real frontend UI. Choose product-specific art direction, preserve approved intent, and inspect the rendered result with available host tools. |

Use either skill directly. For work that needs both, WhipDesign resolves material open choices and hands off compact intent to WhipUI. A clear implementation request does not require a design workshop.

## Install

Requires Node.js 18+ for the installer. The skills themselves are Markdown, with no runtime dependency.

```sh
npx whipui@latest --host all
```

Codex and other Agent Skills hosts use `~/.agents/skills/`; Claude Code uses `~/.claude/skills/`. The default installs into both user directories. For one project:

```sh
npx whipui@latest --host codex --scope project --project ./my-project
npx whipui@latest --host claude --scope project --project ./my-project
```

Preview with `--dry-run`. `--host agents` is an alias for the `.agents` layout. Start a new host session after installation.

### Upgrade from 2.0.0

```sh
npx whipui@latest --host all --replace
```

The installer archives existing Whip directories to `<host-config>/whip-backups/<timestamp>/` outside the active skill search paths. It preserves custom files and recognized legacy `whipui` installations in that backup. Your project content, `.whipui` state, hooks and MCP settings are not changed. Unrelated `shared` directories are refused even with `--replace`; use an isolated project scope instead.

Invoke **`$whip-design`** or **`$whip-ui`** in Codex, **`/whip-design`** or **`/whip-ui`** in Claude Code. The old `/whipui` skill name and its scripts are retired. `--link`, `--with-deps` and destructive `--uninstall` from 2.0.0 are not supported. Archived user state is evidence to inspect, not automatically imported approvals.

### Claude Code plugin

```text
/plugin marketplace add VVeb1250/WhipUI
/plugin install whipui@whipui
```

Plugin commands are `/whipui:whip-design` and `/whipui:whip-ui`. Existing plugin users can update the marketplace/plugin rather than also installing user copies. The plugin loads the same two skills and shared references, with no hooks or MCP servers.

### Manual installation

Copy `whip-design`, `whip-ui` and `shared` together into the host's skills directory. They must remain siblings for relative references to resolve. The optional [AGENTS snippet](AGENTS.snippet.md) can help explicit routing when the host's automatic discovery is unreliable.

## Examples

- `Use whip-design to explore contrasting directions for my engineering portfolio. Help me identify which traits work. Don't code yet.`
- `Use whip-ui to implement the approved design in .whip/design-intent.json. Check desktop/mobile renders and the primary keyboard flow.`
- `Use whip-ui to match this screenshot. Preserve its layout and content.`
- `Use whip-ui to repair this broken menu without redesigning the page.`

## What changed

3.0.0 replaces the 2.0.0 single-skill architecture with the WhipDesign + WhipUI clean-room pack. Conditional playbooks live in each skill's `references/`. Shared source maps and intent/state examples remain small, optional resources. Host browser/design tools provide rendering and research capabilities. No bundled browser stack, state engine, Stop hook or specialist router is installed.

The base was `whip-skills-v0.1.zip`, SHA256 `6917fcc9bb8734348aed1394f862a87e362fb8ab0a2d595f49ea33c5a7106391`, followed by local provenance-guard fixes. Old release code and experiment results remain available in Git history and the [v2.0.0 tag](https://github.com/VVeb1250/WhipUI/tree/v2.0.0). See [CHANGELOG](CHANGELOG.md).

## Phase B creative direction (experimental)

For unconstrained `CREATE` and `REDESIGN` work, WhipUI briefly compares materially different design mechanisms, selects one product-grounded visual anchor, then critiques the first render *before* cosmetic polish. No mandatory moodboards, owner interviews or three implementations. `MATCH`, `REPAIR`, `EXTEND`, `MOTION`, scoped `POLISH` and approved designs retain fidelity-first execution. This is a behavior hypothesis; no measured anti-slop improvement is claimed.

## Local script-first visual QA (experimental)

For a frontend project with Playwright and Chromium already installed, run the bundled tool from the project directory. It never auto-installs packages and only connects to loopback URLs:

```sh
node /path/to/whip-ui/scripts/visual-qa.mjs --url http://127.0.0.1:5173 --profile standard
node /path/to/whip-ui/scripts/visual-qa.mjs --url http://127.0.0.1:5173 --profile focused --selector '.hero' --viewport mobile
```

See [verification budget](whip-ui/references/verification-budget.md). Output is a compact report plus local screenshots. It checks common technical symptoms, not aesthetics, accessibility conformance, motion or actual task usability. No measured token savings yet.

## Verification and status

This is a candidate design workflow. Packaging, installer transactions and provenance regressions are tested. They do not establish better UI quality, user preference or usability than a strong baseline. Render and interact with actual output, then evaluate with people where the claim requires it.

```sh
npm test
npm run syntax-check
npm run test:skills
npm run validate
```

Python 3.10+ is optional for these provenance/pack checks. Before changing real design state, run:

```sh
python tests/check_state.py new-state.json --previous prior-state.json --strict
```

Changed approved statements/scopes and removed pinned constraints require new explicit owner evidence. The guard checks source-locator structure and changes; inspect the cited user message yourself. It cannot authenticate approval. Example locators intentionally fail strict mode.

[Evaluation plan](tests/EVALUATION.md) and [scenarios](examples/SCENARIOS.md) live in the GitHub source checkout. The npm artifact contains the skills, shared resources, plugin metadata and installer; use the repository checkout for Python tests. Upstream source maps describe inspiration and its limits, not measured superiority or bundled external assets.

MIT. No third-party skill databases or paid reference media are bundled.
