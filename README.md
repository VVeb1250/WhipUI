# WhipUI

Make AI-built frontends feel designed.

WhipUI is a thin frontend design router for Codex, Claude Code, and VS Code Agent.

It packages and orchestrates capabilities that already exist in the host:

    Prompt / Screenshot / Figma / URL / Existing repo
        -> Project DNA + Design Fingerprint
        -> existing design intelligence
        -> existing frontend components
        -> Playwright MCP visual QA

WhipUI does not create a new frontend agent, browser, editor, MCP server, or
vision runtime. Its value is the routing contract, durable project context,
Pick from Web capture schema, anti-slop rules, and repeatable visual QA loop.

## Install once

When published:

    npx whipui init

Initialize a specific project directory with every host integration:

    npx whipui init .\my-app --ai all

For local development:

    npm install
    npm link
    cd path/to/your-existing-frontend
    whipui init

The default target is Codex, Claude Code, and VS Code. Use a narrower target when
needed:

    whipui init --ai codex
    whipui init --ai vscode
    whipui init --ai claude
    whipui init --ai all

Run init once. Generated files are safe by default: existing generated files
are skipped, and existing AGENTS.md or Copilot instructions receive one
idempotent managed section.

## User experience after init

The user should not need to know MCP or skill names:

    Build a calm editorial landing page for this product.

    Use the attached screenshot as visual direction, but redesign the mobile layout.

    Use this Figma design for the settings page: https://www.figma.com/design/FILE_KEY/name?node-id=12-34

    Open https://example.com and let me pick the pricing card. Capture its styles and adapt it to our app.

    Inspect this existing repo and keep the visual language consistent while adding a new route.

The generated AGENTS.md, CLAUDE.md, Claude skill, Copilot instructions, and VS Code prompt route these
requests automatically.

## What init creates

    WhipUI.md
    PROJECT-DNA.md
    AGENTS.md
    CLAUDE.md
    .claude/skills/whipui/SKILL.md
    .github/copilot-instructions.md
    .github/prompts/whipui-frontend.prompt.md
    .whipui/
    ├── config.json
    ├── project-dna.json
    ├── design-fingerprint.json
    ├── workflows/
    │   ├── pick-from-web.md
    │   └── visual-qa.md
    └── examples/README.md

Project DNA stores durable product, repository, design-system, routing, and QA
context. The Design Fingerprint stores page/task-specific visual decisions.

## Five input routes

| Input | Primary route |
| --- | --- |
| Prompt | Existing UI/UX Pro Max-like or frontend design skill |
| Screenshot | Host image understanding plus Design Fingerprint |
| Figma | Connected Figma MCP |
| URL | Playwright MCP in an isolated context |
| Existing repo | Local components, tokens, fonts, assets, and conventions |

## Pick from Web

Pick from Web is the main V0 feature:

1. open a real URL with Playwright MCP;
2. let the user choose an element;
3. capture DOM, computed styles, bounding box, screenshots, accessibility
   context, and interaction states;
4. save a structured record under .whipui/web-captures/;
5. map the evidence to existing project components and update the fingerprint;
6. implement and run multi-axis Visual QA.

Chrome DevTools is optional for hosts that already expose it. WhipUI does not
launch a browser or attach to the users real profile.

## Design intelligence

The package uses UI/UX Pro Max-like design intelligence as a route, not as a
vendored database. If the host has that skill or another established frontend
design skill, use it. Otherwise the generated WhipUI contract still supplies a
structured pass for product type, audience, art direction, hierarchy,
typography, palette, UX rules, and anti-patterns.

## Visual QA

Visual QA is evaluated across identity, composition and hierarchy, typography,
color and contrast, spacing and density, responsive behavior, interaction
states, and accessibility. It uses Playwright MCP first, checks desktop,
tablet, and mobile, fixes the highest-impact mismatch, reloads, and repeats for
a bounded number of iterations.

## Optional CLI helpers

The normal UX is natural language after init. These helpers are available for
debugging, scripting, and creating a handoff artifact:

    whipui route "Open https://example.com and let me pick the card" --json
    whipui fingerprint --prompt "Build the pricing route" --screenshot ./ref.png
    whipui brief --url https://example.com/reference --prompt "Adapt this page"
    whipui pick https://example.com --selector ".pricing-card"
    whipui critique http://localhost:3000/pricing
    whipui dna

## Development

    npm test
    npm run syntax-check
    npm pack --dry-run

Releases are PR-driven. After a conventional commit lands on `main`, Release
Please opens or updates a release PR with the version bump and changelog. Merge
that release PR to create the GitHub release and publish the package to npm.
The release job runs the same tests and package checks before publishing. Keep
the `NPM_TOKEN` repository secret configured for the `whipui` package.

Dependabot patch and minor updates are auto-merged after CI passes. Major
updates remain open for review.

The package has no runtime dependencies and targets Node 18+.
