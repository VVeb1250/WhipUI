<!-- WhipUI:BEGIN -->
## WhipUI frontend design router

When VS Code Agent receives a frontend request, read WhipUI.md, PROJECT-DNA.md,
.whipui/project-dna.json, and .whipui/design-fingerprint.json first.

Use existing host skills and tools rather than creating a new runtime. Route
prompt work to available design intelligence, Figma inputs to connected Figma
MCP, live URLs and Pick from Web to Playwright MCP, and every request through
the existing repository design system and visual QA workflow.

For Pick from Web, follow .whipui/workflows/pick-from-web.md. Capture DOM,
computed styles, bounding box, screenshots, accessibility context, and
interaction states. Finish with .whipui/workflows/visual-qa.md across all axes.
<!-- WhipUI:END -->
