# Rendered truth: verify what ships

Load for `CREATE`, `MATCH`, `POLISH`, `REDESIGN`, `MOTION`, `REPAIR` once the artifact can render. QA is a **tool loop**, not a promise that a skill alone can enforce visual quality.

For scope, cost and tool choice, follow `verification-budget.md` as the single budget authority. Do not run every check below on every task.

## Minimum sequence

```
Establish baseline / requirement
  → Run build or app
  → Screenshot relevant viewport(s) / state(s)
  → Inspect actual pixels + key interactions
  → Rank concrete defects (functional, intent, visual)
  → Fix a causal batch in scope
  → Rerender changed paths / regression states
  → Report verified + unverified
```

For a responsive web page inspect representative narrow/mobile and wide/desktop widths. For an operational panel, inspect both normal data and stress cases (long labels, empty/error, overflow). For a screenshot match, compare at the same viewport and content with overlays where tools support them. For motion, a static screenshot is insufficient: inspect a recording or controlled timeline and reduced-motion mode.

## What to check against evidence

| Evidence | Failure examples | Test |
| --- | --- | --- |
| Desktop/mobile screenshots | clipped heading, unnecessary cards, wrong hierarchy, image crop, sticky overlap | side-by-side 2–3 viewports |
| UI interaction | nav dead ends, invisible focus, inaccessible menu, hover-only access | keyboard + pointer/touch walkthrough |
| Console/network | broken assets, runtime errors, missing font, hydration failure | logs and network check |
| Build/typecheck/lint | stale imports, type errors, broken dependencies | local scripts |
| State coverage | loading never completes, impossible retry, empty screen without CTA | simulate realistic state transitions |
| Motion playback | jarring continuity, blocked input, distracting loops, motion sickness | play/video frames, reduced-motion check |
| Performance | huge images, excessive JS/animation load, render thrash | relevant profiler/audit when available |
| Accessibility | contrast, heading structure, focus, labels, touch targets, reading order | automated plus manual checks (WCAG 2.2 / platform guidance) |

Do not claim "WCAG compliant" from one automated checker. Automated checks detect only a subset. Prefer exact issue with evidence and remediation.

## Creative versus technical judgment

For new expressive `CREATE`/`REDESIGN` work only, reuse the first screenshots to perform the concept check in `art-direction.md` before fine-grained polish. A build, accessibility scan, screenshot match or pixel-diff is **not** a test of originality or owner taste. Do not add another browser tour solely for creative critique. If art direction is fundamentally wrong, correct the single highest-impact structural cause and then return to risk-sized technical QA; do not endlessly restyle. For `MATCH`, `EXTEND`, `REPAIR` and other preservation routes, focus on scope/fidelity instead.

## Defect severity and repair boundary

1. Primary functionality/keyboard inaccessible/broken visual on target viewport.
2. Disagreement with approved design intent or target fidelity.
3. Hierarchy/legibility/responsive/composition issues affecting product use or expression.
4. Cosmetic inconsistency or optional flourish.

When polishing, preserve the accepted composition and fix local causes. When redesigning, replace visual world but preserve product truth and features. If an edit threatens a pinned invariant, stop and ask or present alternatives rather than alter state.

## Browser tool choice

For known, repeatable local checks prefer `../scripts/visual-qa.mjs` with existing project Playwright and a compact report; see `verification-budget.md`. Use interactive browser only when needed. Use browser already available in the host (Playwright, Puppeteer, Chrome DevTools, agent-browser, Browser Use) rather than installing a browser stack automatically. For visual evidence, capture local screen/viewport image to inspect, not just text DOM or accessibility snapshots. Agent-browser and Browser Use have their own instructions; consult only when those tools are installed. Tool availability is not guaranteed; never invent invocation syntax.

## Report example

```
Verified: npm run build passed; 1440x900 and 390x844 screenshots inspected;
project selector operated by mouse and keyboard; reduced motion tested.
Fixed: primary CTA wraps over hero at 390px; dropdown escaped safe area.
Not verified: iOS Safari physical device, low-bandwidth image loading.
Intent: preserved approved type/color; shifted crop only at mobile.
```
