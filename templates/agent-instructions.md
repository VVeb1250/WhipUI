<!-- WhipUI:BEGIN -->
## WhipUI frontend design router

For frontend requests, read WhipUI.md, PROJECT-DNA.md,
.whipui/project-dna.json, and .whipui/design-fingerprint.json before coding.

WhipUI is a thin router. Do not build or install a new agent, browser, editor,
or MCP server for a normal request. Route the work to capabilities already
available in the host:

- Prompt: use the available UI/UX Pro Max-like or existing design-intelligence
  skill, then reuse the repository design system.
- Screenshot: inspect the image as evidence and record durable visual traits.
- Figma: use connected Figma MCP for variables, components, assets, and
  hierarchy.
- URL: use Playwright MCP to inspect the real page in an isolated context.
- Pick from Web: use .whipui/workflows/pick-from-web.md with Playwright MCP as
  primary and Chrome DevTools only as optional support.
- Existing repo: inspect local components, tokens, routes, fonts, assets, and
  existing frontend conventions first.

Always update the Design Fingerprint with concrete decisions. Finish with
.whipui/workflows/visual-qa.md across all configured axes and viewports. Do not
claim browser or visual validation when the host did not provide evidence.

Avoid generic AI-slop output: default purple gradients, arbitrary glass cards,
excessive rounded containers, invented variants, and decorative motion without
a product, hierarchy, wayfinding, or brand reason.
<!-- WhipUI:END -->
