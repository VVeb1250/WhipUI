# Verification: reading the evidence

Load when interpreting render-check / motion-probe / ref-capture output, writing the
"what was verified" part of a reply, or doing a regression check.

## 1. render-check output

- stdout gives unique findings grouped by check, with the viewports where each occurred.
  The full list is in `report.json`; screenshots are next to it. **Open the PNGs.**
- `kind: measured` = mechanically decided (overflow width, overlapping boxes, failed request,
  axe rule). Fix or explain.
- `kind: heuristic` = may be wrong. Look at the screenshot crop first. Known false positives:
  - `focus-not-visible` when the indicator comes from a parent (`:focus-within`) or a canvas/SVG overlay. (`::before/::after` changes count as visible; a change that only restyles a child is reported as `focus-indicator-indirect`: look at it focused and judge whether it's clearly visible.)
  - `text-clipped` for intentional truncation without `text-overflow: ellipsis` (e.g. a marquee).
  - `text-spill` for intentional bleed/overlap typography. (Tight display leading is already discounted.)
  - `interactive-obscured` with partial cover at the edge (only the centre point is tested) or for intentional overlays.
  - `offscreen-content-masked` for off-canvas drawers and carousels (usually handled, sometimes not).
- `kind: environment` = a limit of where it ran (third-party host unreachable, `file://` blocking fetch/modules). Re-run over http / on a connected machine; don't "fix" the page for it.
- `axe:*` is low-false-positive. `incomplete` items need a manual look. For `color-contrast`, the printed colour pairs usually point to one token: fix the token (and the project's contrast gate, if it has one), not each element.
- `layout-shift` is an approximate CLS (plain sum, no session windows).
- Not covered: shadow DOM internals (axe does pierce them), canvas UIs, iframes, states the
  page isn't in (use `--setup`), real devices, other browsers.

## 1b. interact output

PASS/FAIL per `check(label, cond)` from your steps module, console errors, returned value, screenshots.
A FAIL is a verified behaviour defect; a script ERROR means the test didn't run, so don't report the behaviour as verified.

## 2. motion-probe output

- Inventory facts (properties, durations, easing, sequence end) are exact for CSS/WAAPI animations.
- Filmstrip frames are seeked deterministically (ready → pause → 2 rAF → seek forward → 2 rAF → shot).
  Naive pause-and-seek produced stale frames in testing.
- `content-missing-under-reduce` and `reduced-motion-ignored` are high-value: treat as defects.
- `frame-gaps` / `long-animation-frames` / `slow-interaction` are headless measurements. Real devices differ.
- Feel is not measured. Ask the user with the filmstrip/video.

## 3. ref-capture output

Measurements of what rendered: type sizes/families/weights by text area, colour roles by
painted area, common gaps/paddings, radii/shadows, sections, blocks. Use them to fill the
deconstruction template or to compare a reproduction. They describe; they don't judge.

## 4. Writing the evidence part of a reply

```
Verified (rendered): 375/768/1440, light+dark, Thai stress — 0 errors; 2 heuristic warnings checked (intentional ellipsis on card titles).
Verified (motion): menu open/close probed normal + reduced; reduced uses opacity only; nothing missing.
Assumed: brand colour #… from the old site (not confirmed by you).
Not tested: Safari/Firefox, real phone, screen reader.
Needs your eye: whether the hero feels "premium enough" (screenshot attached).
```
Never: "fully accessible", "pixel-perfect", "looks great", or any 1–10 score.

## 5. Under `/goal`

Built-in `/goal` (Claude Code, Codex) keeps working until a condition holds. Claude's evaluator
reads only the transcript. Keep each script's `WHIPUI-EVIDENCE …` line in your messages, and
suggest verifiable conditions, e.g.:
`/goal render-check reports 0 errors at standard tier and motion-probe shows no reduce-mode content loss, and the user has picked a direction`.
Taste can't be a `/goal` condition you satisfy yourself. If a condition needs the user's
choice, stop at the checkpoint with options ready.

## 6. Regression

Baseline diff (`--baseline`) is for proving untouched areas didn't change after a surgical edit, in
the same environment. It is not a fidelity metric and not a taste metric.
