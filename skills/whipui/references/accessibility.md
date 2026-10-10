# Accessibility verification

Target: **WCAG 2.2 AA**. WCAG 3 is a Working Draft (latest Sep 2026). W3C says it is years
from completion and not citable for conformance; mention it only as context.

## What automation can and can't tell you

- axe-core is low-false-positive, but it covers roughly 20–30% of WCAG success criteria. Deque's
  "57% of issues" counts issue *volume* (common easy issues dominate). In GDS's planted-barrier test the best
  single tool found ~40% and all tools combined ~71%. Report "automated: pass; manual: N pending", never "accessible".
- axe does **not** flag: horizontal overflow, clipped text, covered controls, removed focus
  outlines, missing web fonts, placeholder-only fields (a placeholder counts as an accessible
  name). `render-check` adds these heuristics.
- Pages with more ARIA averaged more detected errors (WebAIM Million, correlational). Prefer native elements.

## Three tiers

**Machine (render-check / motion-probe / a short Playwright script):**
- axe at wcag2a/2aa/21a/21aa/22aa: 0 serious/critical; list `incomplete` items for manual review
- Reflow: no horizontal scroll at 320 CSS px (1.4.10); Thai/long-text stress shows no clipping
- Target size ≥24×24 or spacing exception (2.5.8); inline links exempt
- Focus visible on every tab stop; focus not hidden under sticky/fixed bars (2.4.11); no traps; Esc closes dialogs and returns focus
- Forms: programmatic + visible persistent labels; `autocomplete` on personal fields; error summary or inline errors that clear; double-submit prevented
- One `h1`, no skipped heading levels, `lang` set, landmarks; DOM order ≈ visual order in the main flow
- Reduced motion: no non-essential spatial motion; no content that only appears via animation
- Auto-playing motion > 5 s has pause/stop/hide (2.2.2); nothing flashes > 3×/s (2.3.1)

**Advisory (you judge, with confidence):** alt text meaningful (decorative = empty alt);
link/button text descriptive out of context; errors say how to fix; headings informative;
reading level appropriate; colour not the only carrier of meaning.

**Human-required:** real screen reader and switch/voice-control use; cognitive load;
whether a custom widget is understandable; severity ranking for the actual user base.

## 2.2 criteria that generated UI most often fails

2.4.11 Focus Not Obscured (sticky headers) · 2.5.7 Dragging alternatives (drag-only reorder/sliders) ·
2.5.8 Target Size Minimum · 3.3.7 Redundant Entry (re-asking known data) · 3.3.8 Accessible
Authentication (no cognitive puzzles without alternatives) · 3.2.6 Consistent Help. 4.1.1 Parsing was removed.

## When taste conflicts with accessibility

State the consequence plainly and offer two compliant options close to the intent, for example
for "light grey 11 px body text": (a) the same grey at 4.5:1 with 15 px text; (b) the light
grey kept for metadata only, body text darker. The user decides. Record the decision and the
known risk if they keep the non-compliant version. Don't block, don't moralize.

## Contrast quick math

Normal text 4.5:1; large text (≥24 px, or ≥18.66 px bold) 3:1; UI components and graphical
objects 3:1 against adjacent colours (1.4.11). Check both themes: dark mode often fails on
links and muted text even when light passes.
