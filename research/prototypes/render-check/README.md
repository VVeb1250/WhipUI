# render-check (prototype, R5)

Status: **research prototype**. It ran and passed its own seeded-defect tests on 2026-10-10. It has **not** been tried on real production sites (see "Not tested" below).

render-check renders a page at several viewports and writes a **JSON evidence report plus PNG screenshots** for a coding agent to read. It catches technical defects. It does **not** score design quality or taste.

## Run

```bash
cd research/prototypes/render-check
npm install                      # playwright 1.56.0, @axe-core/playwright 4.13.0, pixelmatch 8, pngjs 7
# Browsers: needs a Chromium that matches playwright 1.56 (`npx playwright install chromium`),
# or point PLAYWRIGHT_BROWSERS_PATH at an existing bundle (this sandbox: /opt/pw-browsers).

node render-check.mjs <url|file.html> [--out DIR] [--viewports 375x812,768x1024,1440x900]
     [--schemes light,dark] [--stress-text] [--baseline PREV_OUT_DIR]
     [--focus-tabs 25] [--settle-ms 800] [--no-axe] [--no-full-page] [--fail-on error|warn|never]

npm test                         # seeded-defect suite (serves fixtures over local HTTP)
```

Exit codes: `0` means no findings at the `--fail-on` level. `1` means findings at that level. `3` means the tool crashed. Per-target navigation failures do not crash the tool; they are reported as `run-error` findings.

## What it checks (per viewport × color scheme)

| check | method | kind |
|---|---|---|
| screenshots | viewport + full-page PNG; `animations:'disabled'`, `caret:'hide'`, `reducedMotion:'reduce'`, mouse parked off-page | – |
| `axe:*` | @axe-core/playwright with tags wcag2a/2aa/21a/21aa/22aa + best-practice; `incomplete` kept for manual review | measured (axe) |
| `horizontal-overflow` | `scrollWidth > clientWidth`; culprits = outermost visible elements past the edge that are not inside an in-viewport clip/scroll container or a fixed box | measured |
| `offscreen-content-masked` | root has `overflow-x:hidden/clip` (scrollbar hidden), but text or controls still sit past the edge | heuristic |
| `text-clipped` | text-node range rects vs. an ancestor with `overflow:hidden/clip`, checked per axis; ellipsis/line-clamp is downgraded to `info` | heuristic |
| `text-spill` | text rects go >4px outside their own box while overflow is visible (fixed height/width) | heuristic |
| `interactive-overlap` | geometric overlap between interactive boxes (skips ancestor/descendant pairs and fixed/sticky vs. flow pairs) | measured |
| `interactive-obscured` | scrolls each control to the viewport centre and runs `elementFromPoint` at its centre, then repeats at max scroll for the bottom band (fixed bars) | measured |
| `tap-target-small` | approximates WCAG 2.2 SC 2.5.8: 24×24 CSS px, spacing exception (24px circles), inline-in-sentence exception; labelled native checkbox/radio → info | measured/heuristic |
| `placeholder-only-label` | input with placeholder but no label/aria-label (axe accepts a placeholder as the accessible name, so axe misses this) | heuristic |
| `focus-not-visible` | Tab through up to N stops; flag when there is no rendered outline **and** no computed-style change vs. rest | heuristic |
| `broken-image`, `font-load-error` | `img.complete && naturalWidth===0`; `document.fonts` entries with status `error` | measured |
| `console-error`, `uncaught-exception`, `request-failed` | Playwright `console`, `pageerror`, `requestfailed`, HTTP ≥400 | measured |
| `layout-shift` | PerformanceObserver `layout-shift` sum (no session windows, so it is approximate) > 0.1 | measured (approx.) |
| `--stress-text` | appends ~40% extra Thai text to every text node, then re-runs the overflow/clip/overlap checks and takes a screenshot | heuristic |
| `--baseline` | pixelmatch (threshold 0.1) per viewport screenshot vs. a previous run; writes a diff PNG | measured |

## Test results (2026-10-10, Chromium 141.0.7390.37 headless shell, Playwright 1.56.0, axe-core 4.13.0)

`npm test` → **51 passed, 0 failed**. Run 3 times with the same result, about 37 s per run. Full log: `sample-output/test-run.txt`.

Fixtures (`test/fixtures/`):
- `flawed.html`: 13 seeded defects (F1–F13). **All 13 detected.** Several were caught by two independent methods: for example, our `tap-target-small` (error) and axe `target-size` agree on the tiny buttons.
- `control.html`: a clean page with deliberate traps (ellipsis title, scrollable `<pre>`, sr-only text, inline link, dark mode). **Zero warn/error findings in 6 runs** (3 viewports × light/dark, plus stress).
- `masked.html`: `body{overflow-x:hidden}` hides the scrollbar while cards are cut off. Detected as `offscreen-content-masked` + `text-clipped` at 375 and 768, and not at 1440.
- `realistic.html`: a Thai-language dashboard. It has a sticky top bar, an off-canvas drawer, a scrollable chip row and table, a stretched-link card, a fixed mobile bottom nav, an unbreakable URL, and a fixed-width button that only breaks under text stress. All seeded defects (R1–R4) were detected, and the legitimate patterns were not flagged.

Determinism: re-running a static fixture against its own baseline gave **0 differing pixels** at every viewport. A one-colour CSS change gave 79–95 px. A page with an rAF-driven JS animation plus a 50 ms clock gave 78 px of diff even with `animations:'disabled'`, because Playwright can only freeze CSS/Web Animations, not JS-driven motion.

Sample output: `sample-output/flawed/report.json` and the full-page PNGs (viewport PNGs were removed to save space; the report still references them).

## False positives / negatives observed while building (and what was fixed)

1. **FP, focus check (fixed):** Chromium's UA stylesheet changes `outline-offset` on focused links even when the author set `outline:none`. A naive "computed style changed" test therefore treated focus on links as visible. The fix compares outline sub-properties only when an outline actually renders.
2. **FN, clipping with `overflow-x:hidden` (fixed):** CSS turns `overflow-y` into `auto` when `overflow-x` is `hidden`. The ancestor walk stopped at that "scroll container" and missed horizontal clipping. The fix walks each axis independently.
3. **FP, sticky/fixed overlap (fixed):** comparing the geometry of a fixed bottom nav with flow content in document space reported overlaps that depend on scroll position. The fix skips pinned-vs-flow pairs in the overlap check and lets the scroll-aware occlusion pass cover them.
4. **FP, occlusion at max scroll (fixed):** hit-testing every element after scrolling to the bottom blamed the sticky header for covering content that is simply scrolled under it. The fix only tests the bottom 40% band at max scroll.
5. **Test-fixture error (fixed):** the "stress-only" seeded button first had too much slack. +40% text still fit, so the test was wrong and the checker was right. The lesson: stress percentages must be calibrated to real translation lengths.
6. **Known FN, accepted:** axe reports **no** `label` violation for an `<input placeholder>` with no label, because a placeholder counts as an accessible name. The extra `placeholder-only-label` heuristic covers this case.
7. **Known limits (not fixed):** `focus-not-visible` cannot see indicators drawn via `::before/::after`, on a parent (`:focus-within`), or through `outline-color: transparent` with forced-colors. Tap-target size ignores the label click area of native checkboxes. Overlap and occlusion only test the **centre point**, so partial covering at the edges is missed. CLS is a plain sum without session windows. Findings repeat per viewport, so `summary` counts are inflated and dedupe is still to be done.

## Not tested / environment limits

- **Real production sites:** not tested. This sandbox's egress policy blocked `playwright.dev` and `example.com` (proxy 403 on CONNECT), so every run used local fixtures over `file://` or `http://127.0.0.1`. Expect new false positives on real sites: carousels, marquee/overflow-by-design hero art, cookie banners, shadow DOM, iframes, canvas UIs.
- **SPAs:** waits use `load` + up to 5 s of `networkidle` + `document.fonts.ready` + 800 ms. Playwright itself discourages `networkidle` for tests; a real integration should take a "ready" selector from the agent.
- **Shadow DOM:** `querySelectorAll` does not pierce shadow roots. axe does.
- **Interactions/states** (open menu, error state, loading): not driven. The agent must put the page into a state first. A future `--setup script.mjs` hook would cover this.
- **Lighthouse:** checked separately. Lighthouse 12.8.2 ran headless against the Playwright Chromium (`CHROME_PATH`) on the flawed fixture. It flagged errors-in-console, layout-shifts (CLS 0.239), color-contrast, image-alt and target-size. That overlaps with render-check, plus a performance score. It found no overflow, clipping, occlusion, focus or font problems.
