# Real-site run: the owner's deployed portfolio (Astro 7, EN/TH/JA)

First run of `render-check` on a production site rather than fixtures (2026-10-11).
Site: repo `VVeb1250/VVeb1250.github.io` @ a439850, built locally (`npm run build`, 49 pages) and served over http,
because the sandbox can't reach github.io. Pages: `/`, `/about/`, `/work/`, `/th/`, `/th/about/`, `/th/work/`, `/ja/`.
Tier `standard` (375/768/1440 × light/dark + Thai text stress).

## What the tool got wrong the first time (all fixed, each has a regression test in `tests/fixtures/realsite-patterns.html`)

| False positive | Cause | Fix |
|---|---|---|
| `font-load-error` on every page | Astro's metric-matched fallback faces (`src: local("Arial")`) "fail" when that system font isn't installed | Faces whose family has only `local()` sources are ignored; a missing `url()` font is still reported |
| 40 `text-spill` on display headings (3 pages; 44 more under stress) | Tight leading (line-height 0.85–1.0): the font's content area is taller than the line box. Measured overhang = exactly (content height − line-height) / 2 | Vertical spill discounts that overhang; a fixed-height box that really overflows is still reported |
| `tap-target-small` error, `interactive-overlap`, `interactive-obscured`, `text-clipped` on the caption reel | Off-window reel lines are `inert` (correctly), but were still treated as interactive | Elements in `[inert]` are not interactive; text clipped inside `[inert]`/`[aria-hidden]` is info |
| `focus-not-visible` on the custom scrollbar | Its focus style widens a child track (5px → 7px), which the check didn't look at | New `focus-indicator-indirect` ("look at it: is it clearly visible?"); compares focused vs. blurred at the same scroll position |
| One contrast problem shown as several findings with `nodes: 1` | axe findings were keyed by their first target | One finding per axe rule per page, merged targets, plus the failing colour pairs (`3.3:1 #75828f on #e8ecef ×14`) |
| Title link overlapping its "open" link | Both go to the same URL | Same-URL overlap is info |

Warn/error findings outside the text-stress pass: **65 → 10** across `/`, `/about/`, `/work/`. All 10 remaining were checked against screenshots and source and are real.

## What is real (ranked)

1. **Contrast, measured, every page.** Captions/notes/figure numbers (~15 elements per page, 10–11px) use `--ink3`: 3.3:1 light, 3.99:1 dark (needs 4.5). Root cause: the token generator's contrast gate (`scripts/tokens.config.mjs` CHECKS) covers `ink`/`ink2` but not `ink3`, while `ink3` is used as text 52 times in 36 files. `ink3-contrast.patch` adds `ink3` to the gate and moves its lightness the minimum that passes (light L 0.60 → 0.52 = `#5E6B77`, dark 0.56 → 0.62 = `#7E8791`). After the patch, axe reports 0 contrast violations on those pages. `ink3-before-after.png` shows the visual change (light/dark × before/after). It also darkens the dashed rules and tracks that use `ink3`, so whether the hierarchy still feels right is the owner's call.
2. **Custom page scrollbar** (`PageScrollbar.astro`): keyboard-operable (`role=scrollbar`, arrows/PageUp/PageDown), but (a) its focus indicator is a 2px widening at the screen edge, (b) on `/work/` its 18px strip sits too close to the right-aligned index links (fails the WCAG 2.5.8 spacing exception), (c) it sits outside landmarks (axe `region`, best practice).
3. **Text-stress only** (+40% Thai text appended): horizontal overflow at 375 on `/about/`, `/` and `/work/`. The real TH and JA pages do **not** overflow, so this is robustness headroom, not a current bug.

Not touched: the portfolio repo. The patch is a proposal; nothing was pushed.
