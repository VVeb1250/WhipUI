# WhipUI + WhipDesign

Two skills, one thin package for coding agents.

**WhipUI** implements specified components and pages faithfully.
**WhipDesign** helps shape a usable, visually considered experience from a rough
product request, with UX as the starting point. You do not need a detailed design
prompt or reference images.

The existing repository, npm name `whipui`, CLI and release pipeline stay in
place. WhipDesign is a skill included in this package, not a separately published
npm package. Both share setup, Project DNA, Design Fingerprint and host tools.

## Install once

```sh
npx whipui init
```

Initialize a target project with all supported host integrations:

```powershell
npx whipui init .\my-app --ai all
```

Init asks before downloading Impeccable. UI/UX Pro Max is opt-in with
`--with-pro-max`; existing installations are retained and discoverable.
Use `--yes` to approve downloads non-interactively, or `--skip-skills` to use the bundled UX
references and skills already available in your host. `--skip-mcp` leaves MCP
configuration unchanged.

Setup is project-local. No global instructions, skills or configuration are
overwritten. Codex, Claude Code and VS Code Agent are supported. The host runs
the models/browser; WhipUI is not an agent, editor, browser or MCP server.

This README describes the renovated source tree. Until a new release is
published, registry `npx whipui` still resolves the published version. To try this
checkout now, run `node /path/to/WhipUI/bin/whipui.mjs init /path/to/my-app --ai all`.

## Upgrade an existing project

```powershell
npx whipui init .\my-app --ai all --refresh --skip-skills --skip-mcp
```

Use the renovated local CLI in place of `npx whipui` until released.
`--refresh` replaces package-owned skill/workflow templates and preserves a copy
of each changed file under `.whipui/backups/<id>/`. It keeps Project DNA,
Design Fingerprint, config and unmanaged AGENTS/CLAUDE/Copilot instruction text.
The managed instruction block is refreshed idempotently. Backups allow restoring
custom template edits. Without refresh, existing template files are skipped.

Do not use `--force` as the normal upgrade path: that older option overwrites
generated project/design state. `--refresh` preserves state even with `--force`.

## Natural-language use

| Request | Workflow |
| --- | --- |
| Recreate this pricing card from the screenshot | WhipUI |
| Implement this Figma page and responsive layout | WhipUI |
| Change the button radius to 8px | WhipUI |
| I want an app to track the books I read | WhipDesign |
| Review checkout UX; keep the appearance and do not edit code | WhipDesign, UX review only |
| Propose onboarding approaches; do not build yet | WhipDesign, planning only |

Both skills are discoverable; the generated instructions route normal language.
They preserve explicit UX-only, visual-only, review-only and planning requests.
An image accompanying a UX request does not turn it into a visual cloning task.

### WhipUI: implement the specified UI

Prompt, Screenshot, Figma, URL and Existing repo remain supported.
Match the supplied authority and scope, reuse compatible components, implement
responsive states, then compare the rendered result. A faithful reproduction
does not need invented novelty or a product-discovery exercise.

Pick from Web remains supported: open a real page using host browser tools
(Playwright MCP preferred), let the user select an element, capture DOM, computed
styles, bounding box, screenshot and interaction states, then implement within
the requested scope. Chrome DevTools is optional; Figma MCP is conditional.

### WhipDesign: UX-led design from a rough idea

Understand the primary user task and consequential assumptions, shape the flow
and information hierarchy, then develop visual direction. The agent finds useful
references or creates concept assets with available tools when needed. Missing
references are not homework for the user.

Build a small clickable slice before expanding the app. Compare alternatives
only when materially useful or requested. UX review checks task completion,
clarity and recovery. Visual review checks composition, type, imagery and craft.
Keep both outcomes separate; visual polish does not cancel a task blocker.

## Reused ecosystem, selectively loaded

- **Bundled Sumi-derived UX references:** compact, credited adaptations for
  heuristic review, flows and navigation. No extra installation required.
- **Impeccable:** scoped visual exploration, critique, copy/state refinement and
  polish, not a competing product-design authority.
- **UI/UX Pro Max:** retained for compatibility and optional focused questions.
  Its industry/palette recommendations do not determine the whole design.
- **Playwright MCP:** live reference capture and browser/task evidence.
- **Figma MCP:** when the user supplies Figma and the host is connected.
- Existing frontend skills and image tools: used only when available and needed.

Read the [source/adaptation record](templates/sources.md) for pinned sources,
what was retained/removed and licensing. The Sumi-derived notes are Apache-2.0;
original WhipUI code/workflows are MIT. No complete third-party plugin is vendored.
The package has no runtime dependencies. One selected workflow owns each task;
specialists are consulted progressively instead of concatenating entire packs.

## Generated structure

- `AGENTS.md`, `CLAUDE.md` and Copilot instructions: managed routing pointer.
- `.agents/skills/{whipui,whipdesign}/SKILL.md`: Codex skills.
- `.claude/skills/{whipui,whipdesign}/SKILL.md`: Claude skills.
- `.github/skills/{whipui,whipdesign}/SKILL.md`: VS Code skills.
- `.whipui/router.md`: shared workflow selection.
- `.whipui/workflows/`: implementation, design, UX review, visual exploration,
  Pick from Web and visual QA.
- `.whipui/specialists/`, `sources.md`, `licenses/`: scoped references and notices.
- `.whipui/project-dna.json`: product facts, tasks, assumptions and repository context.
- `.whipui/design-fingerprint.json`: chosen visual direction and separate QA records.
- `.whipui/capabilities.json`, `providers.md`: detected providers, not live health checks.
- `.whipui/examples/evaluation.md`: controlled comparison protocol.

Host files are generated only for selected `--ai codex|claude|vscode|both|all`
targets. `both` keeps its original Codex + VS Code meaning. Configuration files
remain project-local and host authentication stays with the host.

## Optional CLI helpers

```sh
whipui route "I want a book tracking app" --json
whipui route "Change the radius to 8px" --workflow ui
whipui brief "Review the checkout UX; do not edit" --workflow design
whipui fingerprint --prompt "Recreate this card" --screenshot ./ref.png
whipui pick https://example.com --selector ".pricing-card"
whipui critique http://localhost:3000/pricing
whipui doctor --json
```

`route`, `brief` and `fingerprint` accept `--workflow auto|ui|design`.
Automatic CLI routing is a heuristic hint, not natural-language understanding
or permission to act. The host follows the complete user request. Helpers
generate metadata/handoffs; they do not execute designs or claim QA succeeded.

## What is and is not validated

Automated tests cover routing contracts, host scaffolding, upgrade safety,
packaging and the existing platform-safe setup launcher. They do not establish
that the new workflow produces better aesthetics or real human usability.

Use [the comparison protocol](templates/examples/evaluation.md) with the same
short prompts, model and budget, retaining screenshots, task observations and
owner preferences. Agent walkthroughs are heuristic/functional evidence, not
human usability studies. That comparative design evaluation has not been run
as part of this renovation.

## Development

    npm test
    npm run syntax-check
    npm pack --dry-run

GitHub Actions runs the setup smoke test on Linux, Windows, and macOS across Node 18, 20, and 22. The
smoke test validates the installer plan, the platform-safe `npx` launcher, and
project-local Codex, VS Code, and Claude MCP configuration.

Releases are PR-driven. After a conventional commit lands on `main`, Release
Please opens or updates a release PR with the version bump and changelog. Merge
that release PR to create the GitHub release and publish the package to npm.
The release job runs the same tests and package checks before publishing. Keep
the `NPM_TOKEN` repository secret configured for the `whipui` package.

Dependabot patch and minor updates are auto-merged after CI passes. Major
updates remain open for review.

The package has no runtime dependencies and targets Node 18+.
