# Bounded expertise and source adapters

Retained upstream files are unchanged Git blobs, except `SKILL.md` is named
`REFERENCE.md` to keep only the two Whip entrypoints discoverable. The complete
pins, original paths, installed paths, byte counts and SHA-256 hashes are in the
generated [SOURCES.json](SOURCES.json). Load only the named reference needed now.
Relative links resolve from that retained file. A link ending `SKILL.md` resolves
to `REFERENCE.md`; an upstream `/command` means its retained family reference,
not an instruction to install or recursively invoke another global skill.

| Source | Responsibility and useful entry | Boundary / adapter |
| --- | --- | --- |
| [Intent](library/intent/skills/intent/REFERENCE.md) | Product/UX strategy. Select `skills/strategize`, `investigate`, `journey`, `organize`, `wireframe`, `articulate`, `measure`, `specify`, `evaluate`, `include`, `fortify`, `transpose`, `localize` or `blueprint`, each containing REFERENCE.md. Shared research/IA/interaction/content/measurement references are under `skills/intent/references/`. | Research plans and heuristic judgments are not observed user evidence. Its format-selection questions, separate context files, mandatory specialist chains and loop checkpoints follow Whip's scope/pace and existing authority. Use native document/diagram tools; do not add a presentation pipeline to an ordinary UI task. |
| [Garden Web Design Engineer](library/garden/REFERENCE.md) | Existing identity, reference/asset fidelity and preservation. Read `references/redesign-protocol.md` before an existing UI change; calibration/recipes only for an unresolved fidelity or expression question. | Preserve real assets/contracts and reuse existing identity records. A new Impeccable direction does not need a second Garden calibration. Dials are private choices, not scores. Confirmation applies to unresolved consequential owner choices; rendered verification follows Whip completion. |
| [Taste v2](library/taste/frontend/REFERENCE.md) | Optional challenge to a named expressive-web weakness, using only the relevant composition, materiality or motion sections. [Image-to-code](library/taste/image-to-code/REFERENCE.md) is conditional on an actual image-first path; [redesign](library/taste/redesign/REFERENCE.md) is a diagnostic supplement. | Do not load its whole frontend body or start a second design pipeline by default. Its core excludes dashboards, tables and multi-step product UI; it is not the game HUD authority. Approved direction and task evidence outrank its aesthetic bans/dials. Pattern familiarity, visual quality and subject identity are separate judgments; preserve purposeful conventions. No forced stack, packages, images, dark mode or icon/font replacement. |
| [UI/UX Pro Max](library/promax/REFERENCE.md) | Searchable knowledge: styles, type, color, charts, UX, motion and real stack guidance. Execute `library/promax/scripts/search.py` for a specific unresolved question; see [host-integration.md](host-integration.md). Read its relevant quick/pro rules when needed. | Results are candidates, not user preferences or validated requirements. Check category, top-result identity, platform and applicability. Retry once if off-topic. Do not generate a new design system on every page, run `--persist`/`--force`, or duplicate DESIGN.md with MASTER.md. Search with generalized terms, not private data; verify consequential standards/library facts from their primary sources. |
| [Impeccable](library/impeccable/REFERENCE.md) | Default visual method for a new/unresolved world: choose the surface mode, ground a direction, make a viewable first slice, receive owner feedback, then continue. Read `reference/new-work.md` and `craft-floor.md`; select `critique`, `distill`, `layout`, `clarify`, `polish`, `harden`, `live` or variants only for the actual question. | Reuse settled product/player facts instead of another init/Shape interview. Existing identity, precise matches and local fixes skip world-building. Preserve concrete direction/contract/finish methods within the authorized scope; label unavailable seed/boards/helpers rather than inventing completion. Tools are optional capabilities: check cached runtime and network/side effects before invoking a launcher or verb (concept-seed can use an API). Follow [host-integration.md](host-integration.md). Host policy governs delegation, services and installation. |
| [Anthropic frontend-design](library/frontend-design/REFERENCE.md) | Compact challenger when a specific concept remains generic, or a smaller fallback where the selected visual method is unavailable. | Optional, not a compulsory second plan/render review after Impeccable. Choose it or Taste for the named question; neither silently replaces accepted direction or factual copy. |
| [Game UI Design](library/game-ui/REFERENCE.md) | Player decisions, density by play context, HUD/menu/inventory states, input navigation, accessibility and checking UI over gameplay. Read its checklist for an actual game-flow review. | Specializes Intent rather than repeating product discovery. Preserve mechanics, save formats and state owners. Comparison screens may need simultaneous detail; urgency/disclosure follows play context, not a universal low-density target. Architecture suggestions require demonstrated needs. |
| [Game UI Frontend](library/game-browser/skills/game-ui-frontend/REFERENCE.md) | Browser-game UI layer, scene/input boundaries, readable HUD, menus and overlays. Its prompt/playtest references are conditional; framework references apply only to the existing stack. | Browser adapter, not a second visual director or a game-scaffolding pipeline. Its low-chrome/20–25% HUD defaults concern ordinary real-time 3D play, not every management/inventory/menu surface. Preserve existing renderer, simulation and camera/clock contracts; no forced DOM/canvas split, new framework or dependencies. Native-engine projects use the game decision layer and their actual platform, not browser recipes. |

## Choose visual methods by the actual uncertainty

For unresolved/new identity, Impeccable leads the mode/world and first viewable
prototype. Inspect real assets/constraints first. In guided work, ask about the
visible decision and capture accepted/rejected traits before a full speculative
build. Delegated one-shot work chooses reversible direction autonomously and
checks it. Cached-engine/board unavailability does not block a local prototype;
disclose the unperformed mechanism. A named challenger diagnoses one deficiency
inside that chosen world rather than selecting another palette/layout.

For working apps, Intent's task/state/IA reasoning and existing identity lead.
For games use [game.md](workflows/game.md) first: player decisions own density and
disclosure before visual simplification. Pro Max answers targeted gaps; Impeccable
actions operate at that scope. UX audits are selected by an observed flow/state
problem, not a universal pre-build checklist or several audit engines in sequence.

Style recipes, catalog worlds and database styles are starting systems. Show what
fits and what must change for this product. Never claim that selecting a catalog
style discovered the owner's taste, or that avoiding a named pattern proves craft.

## Shared tools are capabilities, not extra design authorities

Use the available native browser, Figma, image, document and reference tools for
their concrete operations. Read their host skills when required. For Mobbin flows,
screens or sections, inspect the returned images, extract transferable traits and
anti-references, and distinguish visual inspiration from evidence of task success.
Use only the fields/assets needed; do not export private material unnecessarily.

Stitch can supply screen/variant generation and code-to-design when its actual MCP
capability is connected. Follow the relevant official stitch-skills protocol at
https://github.com/google-labs-code/stitch-skills; do not pretend it is installed.
21st MCP can search and retrieve real components/themes; discover its current
tools and account capabilities before using generation. The old Magic package is
a compatibility proxy, not the recommended new integration:
https://github.com/21st-dev/magic-mcp. Verify provenance, license, dependencies,
semantics and behavior before adapting retrieved code. Use existing components
first when they already solve the task. Missing optional services get an honest
fallback, not an automatic installation or a blocked ordinary UI task.
