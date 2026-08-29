# WhipUI

WhipUI is a thin frontend design router. It packages a small, durable contract
around skills, MCP servers, and tools that already exist in the coding host.
It does not create a new frontend agent, browser, editor, or MCP server.

## One-time setup

Run `whipui init` once in the existing frontend repository. It writes project
instructions, detects capabilities, configures project-local Playwright MCP for
the selected hosts, and can install UI/UX Pro Max plus Impeccable after an
explicit confirmation. Use `whipui setup --yes` in non-interactive environments
and `whipui doctor` to inspect the result. It never edits global config.

After setup, speak to Codex, Claude Code, or VS Code Agent in normal language.
The generated instructions route the request without requiring the user to
know which skill or MCP is underneath.

## Five inputs

### Prompt

When the prompt has no usable visual direction, follow
`.whipui/workflows/creative-direction.md` before writing UI code. Establish the
product truth, generate three structurally distinct directions, select one,
and lock its thesis and product-linked signature move in the Design
Fingerprint. Choose autonomously unless the user asks to compare directions.

Use UI/UX Pro Max when installed to derive suitable product patterns, type,
palette, UX rules, and anti-patterns. Treat those as ingredients rather than
the final concept. Use Impeccable when installed to critique and refine the
result. Otherwise use an existing design-intelligence skill.

### Screenshot

Treat the image as visual evidence. Extract hierarchy, composition,
typography, color relationships, spacing rhythm, imagery, effects, and
interaction clues. Separate identity from accidental pixels before adapting it
to responsive layouts.

### Figma

When Figma MCP is connected, prefer its variables, components, assets,
hierarchy, and named styles over guesses from pixels. WhipUI accepts the URL and
routes to the connected MCP; authentication remains with the host.

### URL

Use Playwright MCP to inspect the real page in an isolated browser context.
Chrome DevTools is optional for extra runtime diagnostics when already exposed
by the host.

### Existing repository

Inspect local routes, components, tokens, fonts, assets, Storybook or other
design-system references before inventing new UI. The existing repository is
the default source of truth for implementation conventions.

## Project DNA and Design Fingerprint

Project DNA describes the durable product, repository, design-system, tool
routing, and visual QA context. The Design Fingerprint describes the visual
identity of a particular page or task. Keep both concrete and update them as
the implementation becomes clearer.

## Creative Direction Gate

Prompt-only work must pass the Creative Direction Gate before implementation.
The selected direction needs a product truth, tension pair, thesis, layout
grammar, type and color logic, responsive promise, one signature move with a
product reason, and at least three visible product-specific proofs.

Three candidates must differ structurally, not only by color, font, radius, or
decoration. If removing the logo and product name leaves an interchangeable
SaaS template, the gate has not passed. Keep standard controls familiar;
distinctiveness should come from product-shaped composition, identity, content
treatment, or one high-signal interaction.

## Capability routing

`.whipui/capabilities.json` is the local capability manifest. Treat it as a
routing hint, not a new runtime. Playwright MCP is the primary provider for
live URL inspection, Pick from Web, and visual QA. Chrome DevTools MCP,
Figma MCP, Firecrawl, Fudge, Agentation, and onUI are optional adapters used
only when the host or project already exposes them.

## Anti-slop rules

- Pass the Creative Direction Gate before building a prompt-only interface.
- Choose one product-linked memorable idea rather than many unrelated effects.
- Do not default to purple-gradient-on-white, generic SaaS cards, or
  interchangeable typography unless the product asks for them.
- Do not use glass, pills, giant rounded cards, shadows, gradients, texture, or
  motion without a clear product, hierarchy, wayfinding, or brand reason.
- Reuse existing components and tokens before creating variants.
- Preserve source character at mobile widths; do not just shrink desktop.
- Make focus, hover, active, disabled, loading, empty, error, and reduced-motion
  states intentional.

## Visual QA

Use Playwright MCP as the primary browser runtime. Evaluate identity, product
specificity, concept coherence, generic-pattern debt, composition and
hierarchy, typography, color and contrast, spacing and density, responsive
behavior, interaction states, and accessibility across desktop, tablet, and
mobile. Fix the highest-impact mismatch, reload, and inspect again for a
bounded number of iterations.
