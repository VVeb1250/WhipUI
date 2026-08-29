---
name: whipui
description: Route frontend work through WhipUI Project DNA, Design Fingerprints, existing design skills, Figma MCP, Playwright MCP, and visual QA.
---

# WhipUI

Read WhipUI.md, PROJECT-DNA.md, .whipui/project-dna.json, and
.whipui/design-fingerprint.json before frontend work.

Use the existing host ecosystem, starting with the project capability report:

- read .whipui/capabilities.json and .whipui/providers.md;
- use UI/UX Pro Max for design-system direction when installed;
- use Impeccable for critique, refinement, and anti-slop rules when installed;
- fall back to other existing design skills exposed by Claude.

- screenshot to image understanding;
- Figma to connected Figma MCP;
- URL and Pick from Web to Playwright MCP;
- existing repo to local components, tokens, fonts, assets, and conventions.

For prompt-led work without usable visual direction, follow
`.whipui/workflows/creative-direction.md` before implementation. Generate three
structurally distinct directions, select one unless the user asks to compare,
and write the selected thesis, product-linked signature move, responsive
promise, and three product-specific proofs to the Design Fingerprint.

For Pick from Web, let the user select a real element, then capture DOM,
computed styles, bounding box, screenshots, accessibility context, and
interaction states. Save evidence under .whipui/web-captures/.

Run .whipui/workflows/visual-qa.md across identity, product specificity,
concept coherence, generic-pattern debt, hierarchy, typography,
color/contrast, spacing/density, responsive behavior, interaction states, and
accessibility. Do not build a new browser, editor, agent runtime, or MCP server.
