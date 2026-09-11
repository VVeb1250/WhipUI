# WhipUI: faithful implementation

Use for a component, a whole page, reference adaptation, or a scoped visual edit.
The deliverable is the requested UI and behavior, not a new product concept.

## Establish the target

Read the relevant repository components, tokens, assets and current rendered UI.
Identify the target element/route, source of visual authority, intended viewport,
and what may change. Honor explicit text specifications even without an image.
For recreate, preserve composition and details at the source viewport; derive
responsive behavior from constraints, recording assumptions where no source exists.
Adapt/inspire permits only the latitude the user requested.

Inspect each supplied source that matters:
- Screenshot: inspect pixels; mark inferred fonts, spacing and interactions.
- Figma: use connected MCP design context and rendered frame evidence.
- Live URL: inspect with host browser tools, Playwright MCP preferred.
- Selected element: use [Pick from Web](pick-from-web.md), including DOM,
  computed styles, bounding box, screenshot and observed interaction states.
- Repository: preserve component contracts and reuse compatible primitives.

Missing browser/Figma access is a disclosed limitation, not invented evidence.
Request an export only if it blocks fidelity; continue with available evidence.

## Build the bounded change

Map evidence to project components, typography, assets, spacing and responsive
rules. Consult [providers](../specialists/providers.md) for a particular gap.
Reference fidelity outranks a specialist's default aesthetic preference.
Keep established task flows, content, API behavior and accessibility.
If the reference has a usability/accessibility defect, identify the concrete
tradeoff and make the least visual departure needed for safe use; seek direction
when correcting it would substantially change the requested design.

A small UI edit needs no product-discovery exercise or mandatory alternatives.
When new design decisions are required, settle only those decisions. Hand off to
WhipDesign only if the user asks for new product/experience direction.

## Verify and finish

Follow [visual QA](visual-qa.md) against the actual source and relevant viewports.
For interactive changes, also exercise the affected task and recovery path using
[UX review](ux-review.md). A reproduction is not required to invent novelty.
Report observed mismatches, source gaps and checks not run. Review-only work
finishes with findings, not patches.
