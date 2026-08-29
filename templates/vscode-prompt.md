---
name: whipui-frontend
description: Build or refine a distinctive responsive frontend from a prompt, screenshot, Figma context, live URL, or existing repository.
argument-hint: Describe the UI task in plain language and attach a screenshot or paste a URL when useful.
agent: agent
---

Read WhipUI.md, PROJECT-DNA.md, .whipui/project-dna.json, and
.whipui/design-fingerprint.json.

Route the request to existing host capabilities. Use the available design
intelligence skill for prompt work, connected Figma MCP for Figma input, and
Playwright MCP for live URLs and Pick from Web. Do not create a new agent,
browser, editor, or MCP server.

For a prompt-led request without usable visual direction, follow
.whipui/workflows/creative-direction.md before implementation. Generate three
structurally distinct directions, select one unless the user asks to compare,
and pass the Creative Direction Gate before writing UI code.

Preserve the existing project design system, update the fingerprint with
concrete decisions, and run .whipui/workflows/visual-qa.md across every axis
and viewport before declaring the work complete.
