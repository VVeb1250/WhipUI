---
name: whipui
description: Route frontend work through WhipUI Project DNA, Design Fingerprints, existing design skills, Figma MCP, Playwright MCP, and visual QA.
---

# WhipUI

Read WhipUI.md, PROJECT-DNA.md, .whipui/project-dna.json, and
.whipui/design-fingerprint.json before frontend work.

Use the existing host ecosystem:

- prompt to existing design intelligence;
- screenshot to image understanding;
- Figma to connected Figma MCP;
- URL and Pick from Web to Playwright MCP;
- existing repo to local components, tokens, fonts, assets, and conventions.

For Pick from Web, let the user select a real element, then capture DOM,
computed styles, bounding box, screenshots, accessibility context, and
interaction states. Save evidence under .whipui/web-captures/.

Run .whipui/workflows/visual-qa.md across identity, hierarchy, typography,
color/contrast, spacing/density, responsive behavior, interaction states, and
accessibility. Do not build a new browser, editor, agent runtime, or MCP server.
