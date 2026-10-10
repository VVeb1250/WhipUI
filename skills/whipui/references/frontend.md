# Frontend implementation

Load when working in an existing repo, extending a design system, implementing a provided
design, or reproducing a target.

## 1. Detect before you define

Run `detect-project.mjs`. Then:
- **Tokens:** use what exists (Tailwind v4 `@theme`, `tailwind.config`, `:root` variables,
  shadcn `components.json` semantic variables, `*.tokens.json`/Style Dictionary, CSS-in-JS
  theme). Introduce DTCG token files only if the project already has a token pipeline or the
  user asks (DTCG 2025.10 is a stable Community Group report, not a W3C Standard).
- **Components:** reuse the project's primitives (shadcn/Radix/MUI/…). Don't add a second
  component library. Build custom components where the design needs them. Don't bend an
  approved design to fit an existing component without asking.
- **Drift check after edits:** new code uses existing tokens/utilities, not raw hex values,
  arbitrary `[13px]` values or one-off shadows (a quick `grep` over your diff).
- **Dependencies:** none added without saying why; prefer platform features (CSS, WAAPI,
  View Transitions, container queries) over libraries.

## 2. Structure

- Component-first: split by responsibility (layout shell, sections, reusable pieces, data and
  state hooks). No 800-line single file, and no premature abstraction for one use either.
- Respect the project's conventions (file naming, styling approach, state management, test style).
- Semantic HTML first (button, a, nav, main, form, label, table); ARIA only for gaps.
- Real content and realistic lengths (long names, Thai text, big numbers like ฿1,284,900) from the start.

## 3. State & viewport matrix

| Tier | When | Covers |
|---|---|---|
| min (every iteration) | any render-affecting change | 375×812, 768×1024, 1440×900 · light · reduced motion · axe + layout checks |
| standard (before "done") | CREATE, EXTEND, REPAIR | + dark (if supported) + Thai/long-text stress + keyboard focus walk + content variants: empty, one item, many, long unbroken string, missing image |
| extended (on demand) | design systems, broad UI, i18n | + 320 and 1920 px · component in narrow container slots · loading/skeleton, error, disabled, hover, focus-within · `forced-colors`, `prefers-contrast: more` · 200% zoom · motion playback |

Components can respond to their **container** (container queries are Baseline), so a card
that is fine at 1440 can break in a narrow sidebar slot. Test the slot, not only the viewport.

Drive states with `render-check --setup states.mjs`:
```js
// states.mjs: runs after load, before checks
export default async ({ page }) => {
  await page.route('**/api/orders*', (r) => r.fulfill({ json: [] }));   // empty state
  await page.reload();
  await page.getByRole('button', { name: /menu/i }).click();           // open menu
};
```

## 4. Regression strategy (protects approved work)

- Baseline = the last **approved** render (store the run dir as a state artifact). Same machine,
  same browser. Never compare across environments.
- After a targeted fix: `render-check --baseline <approved-run>`. Pixel changes outside the
  intended region are a question for the user, not a silent update. Mask clocks, carousels and
  JS animation (JS motion produces diff noise even with CSS animations frozen).
- Re-baseline only after the user approves the new version.
- If the project has `@playwright/test`, add `toHaveScreenshot` tests so regression lives in its CI.

## 5. Implementing a provided design (Figma/spec)

Fidelity first: spacing, type, colour and states as specified. If the spec is missing a state,
ask or scope down (build it neutrally and flag it). If the spec conflicts with accessibility,
implement the spec, flag the issue with a compliant option, and let the user decide. Use a Figma
MCP/Dev Mode if it's available, but don't require one.

## 6. Reproducing a target (screenshot or site)

1. Confirm the user owns or is authorized to reproduce it (record in state). Otherwise switch to REFERENCE_ADAPT.
2. `ref-capture.mjs capture <target> --viewport <W>x<H>` for measured type, colour, rhythm and blocks (or measure from the screenshot).
3. Build structure first (blocks and positions), then type, then colour, then details.
4. `ref-capture.mjs compare <targetDir> <yoursDir>` gives block recall, offsets, size/font/colour
   mismatches. Fix missing blocks and large offsets first: humans weigh layout over exact text.
   Pixel diff is a secondary signal once layout matches.
5. Show side-by-side screenshots. The user makes the final fidelity call.
