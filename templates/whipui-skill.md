---
name: whipui
description: Implement specified UI components or pages, reproduce screenshot/Figma/web references, or make scoped visual edits while preserving the requested behavior. Use whipdesign for open-ended product design or UX analysis.
---

# WhipUI

Find the initialized project root containing .whipui/router.md. Read that
router and .whipui/workflows/implement.md. These paths are project-root-relative,
not relative to this skill directory. If not initialized, ask for the project
root or offer init; do not silently modify global configuration.

Follow the supplied design and requested scope. A precise text specification
is sufficient; references are optional. Use Playwright MCP for web capture and
rendered checks, Figma MCP for supplied Figma, and existing repository components.
Read .whipui/specialists/providers.md only to choose a needed specialist such as
Impeccable. Preserve the stopping point: review and planning do not authorize edits.
