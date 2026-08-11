---
name: whipui
description: Route frontend work through Project DNA, Design Fingerprints, existing design skills, Figma MCP, Playwright MCP, and visual QA without creating a new runtime.
---

# WhipUI

Use this skill for frontend design and vibe-coding requests.

## Routing

- Prompt: use the existing UI/UX Pro Max-like or frontend design skill.
- Screenshot: inspect the image and preserve durable visual identity.
- Figma: use connected Figma MCP for variables, components, assets, and
  hierarchy.
- URL: use Playwright MCP in an isolated browser context.
- Pick from Web: follow .whipui/workflows/pick-from-web.md.
- Existing repo: inspect its components, tokens, fonts, assets, routes, and
  conventions first.

## Required context

Read WhipUI.md, PROJECT-DNA.md, .whipui/project-dna.json, and
.whipui/design-fingerprint.json before writing UI code.

## Pick from Web

Use Playwright MCP as primary. Let the user select an element and capture DOM,
computed styles, bounding box, screenshots, accessibility context, and
interaction states. Save structured evidence under .whipui/web-captures/ and
map it to existing project components.

## Quality bar

Run .whipui/workflows/visual-qa.md across identity, hierarchy, typography,
color/contrast, spacing/density, responsive behavior, interaction states, and
accessibility. Fix the highest-impact mismatch first. Never claim visual
validation without rendered browser or screenshot evidence.

Avoid generic AI-slop patterns unless the Design Fingerprint gives them a
specific product or brand reason.
