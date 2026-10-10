# Motion & interaction

Load for animation, transitions, scroll effects, "janky/laggy/sluggish", game feel, or
reduced motion. Models already know "animate transform/opacity, respect
prefers-reduced-motion, 200–300 ms". This module adds the decisions and traps they miss,
and the playback-based check.

## 1. Purpose test (every motion)

Name its job: **feedback** (acknowledge input) · **orientation/continuity** (where did it come
from / go) · **attention** (what changed) · **status** (progress, loading) · **character** (brand,
delight). No job → remove it. Frequent interactions get little or no motion; let people interrupt or cancel.

## 2. Registers and tokens

All major systems split a **productive** register (frequent, small, fast) from an **expressive**
one (rare, significant). Adopt the project's tokens. If there are none, propose a small set and
record it as *proposed*. Calibration values (not a house style):

| System | Durations | Curves |
|---|---|---|
| Material 3 | short 50–200 · medium 250–400 · long 450–600 · extra-long 700–1000 ms | standard `cubic-bezier(.2,0,0,1)`; emphasized-decelerate `(.05,.7,.1,1)`; emphasized-accelerate `(.3,0,.8,.15)` |
| Carbon | 70 / 110 / 150 / 240 / 400 / 700 ms | productive `(.2,0,.38,.9)`; expressive `(.4,.14,.3,1)` |
| Fluent | 83 / 167 / 250 ms | enter `(0,0,0,1)`, exit `(1,0,1,1)` |
| Apple | springs by perceptual duration + bounce (start at 0; caution above ~0.4) | — |
| NN/g | ~100 ms feedback; 200–300 ms modal-scale; ≤400 ms large moves; exit shorter than enter | — |

## 3. Decisions that matter

- **Choreography:** stagger only to show order or grouping; total time grows linearly with
  item count, so cap staggers to the first visible items. One focal motion at a time.
- **Springs vs bezier is about interruption, not style:** springs keep velocity when retargeted
  (drag release, gesture hand-off). Use a JS spring only where gestures/interruption exist;
  bezier or CSS `linear()` elsewhere.
- **Transitions:** same-document View Transitions are supported in all major browsers (Firefox 144+).
  Cross-document `@view-transition`: Chromium 126+ and Safari 18.2+; Firefox support is
  disputed (MDN says no), so treat it as progressive enhancement.
- **Scroll-driven animation** (`animation-timeline`): Chromium 115+, Safari 26+, not in Firefox
  release (Oct 2026). Always `@supports` with a static fallback. Avoid scrolljacking,
  motion against scroll direction and multi-speed parallax (vestibular triggers).
- **Performance:** animate `transform`/`opacity` (`filter`/`clip-path` with care). Height/top/margin
  animate layout every frame. Library trap: Motion's `x`/`scale` shorthands animate CSS variables
  and aren't hardware-accelerated; animate the `transform` string when it matters. rAF/JS motion
  freezes when the main thread is busy; CSS/WAAPI compositor motion keeps going. Keep input → next
  paint under 200 ms (INP "good").
- **Accordion/expand:** `grid-template-rows: 0fr → 1fr` or a transform-based reveal instead of
  `max-height` hacks; reserve space where possible.
- **Game feel / "juice"** (game UI, playful brands, explicit request only): evidence comes from
  games. In apps, use it on rare, high-value moments (completion, reward), never on frequent
  controls. Always provide a reduced variant.
- **Libraries:** CSS/WAAPI first. Motion (MIT) for React springs/gestures/layout. Anime.js v4 (MIT) for light
  timelines. Lottie/Rive runtimes (MIT) for designer-authored vectors. GSAP is now free, but its licence
  forbids use in no-code animation builders that compete with Webflow; fine in a normal product. Don't add a
  library the project doesn't need.

## 4. Reduced motion means "replace", not "disable everything"

- Replace spatial movement, zoom and parallax with a short cross-fade (≤150–200 ms) or an instant change.
- Keep focus, state and progress indicators. Stop autoplay loops or give them pause controls (WCAG 2.2.2).
- JS animations must read `matchMedia('(prefers-reduced-motion: reduce)')` and listen for `change`.
- Never leave content hidden that only an animation reveals: `animation:none` on an element whose
  base style is `opacity:0` makes it vanish. Make the final state the default style. Avoid
  `animation:none` where code waits for `animationend`; use a near-zero duration.
- WCAG 2.3.3 (AAA) treats opacity/colour changes as not motion; 2.3.1: no more than 3 flashes per second.

## 5. Verify from playback

```
node <skill>/scripts/motion-probe.mjs <url> --trigger "<selector>" [--action click|hover|focus|scroll] [--video] [--budget 600]
```
It runs normal and reduced motion and reports: the animation inventory (properties, durations,
per-keyframe easing), filmstrips cropped to the animated region, optional video, frame gaps,
long animation frames, slow interactions, layout shifts during motion, residual spatial motion
under reduce, **content missing under reduce**, and end-state differences.

- Facts it reports are verified. Feel ("too slow? too bouncy? distracting by the 10th time?") is
  the user's call: show them the filmstrip or video (normal vs reduced) and ask exactly that.
- "Motion outside WAAPI" means JS/canvas-driven animation; review the video, because the filmstrip can't seek it.
- Headless Chromium isn't a phone. A clean probe doesn't prove smoothness on low-end devices.
  Say so when it matters.

## 6. Diagnoses

| Symptom | Cause | Check | Fix | Counterexample |
|---|---|---|---|---|
| Stutters when the page is busy | main-thread animation (JS, layout props, CSS-var shorthands) | inventory props; frame gaps; long frames | transform/opacity via CSS/WAAPI; defer work | physics/gesture follow may need JS: cut main-thread work instead |
| Content below jumps when a panel opens | height/max-height animation reflows siblings | layout shifts during motion; filmstrip | grid-rows trick, transform reveal, reserve space | accordions legitimately push content; test that the push is smooth |
| Feels sluggish | long durations on frequent actions; ease-in on entrance | inventory durations/easings vs frequency | 100–200 ms for frequent; decelerate in, accelerate out | rare expressive moments may run 400–700 ms: ask |
| List entrance takes forever | linear stagger × many items | sequence end vs budget | cap/compress stagger; animate groups | deliberate short hero sequence (record as approved) |
| Reduced motion on, things still slide | only CSS gated; JS/library ignores the query | probe in reduce: residual spatial props | gate JS via matchMedia; swap to fade | essential motion (drag follow) |
| Something never appears in reduced mode | `animation:none` on an element starting hidden | "content missing under reduce" | default style = final state | none: always a defect |
| Drag release snaps | tween can't inherit velocity | video of drag/release | spring with initial velocity | non-gestural changes: bezier is fine |
| Page transition double-animates | View Transition + legacy enter animations | inventory during transition | name only continuity elements; suppress duplicates | — |
| Celebration annoying on repeat | juice on a frequent action | count occurrences in the core flow | first/rare occurrences only; shorten; skippable | games: repeated feedback is the point |
