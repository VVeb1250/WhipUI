# R4 — Motion & Interaction Craft

Track owner: research subagent R4. Date: 2026-10-10. Status: research only, nothing in here is a frozen interface.
Evidence labels: **[DOC]** official documentation/spec · **[RES]** peer-reviewed research · **[PRAC]** practitioner guidance · **[ANEC]** anecdote · **[TESTED]** I ran it on this machine (Chromium 141 headless via Playwright 1.56, Node 22.22, Python Playwright 1.56, ffmpeg) · **[INFER]** my own inference.

---

## 1. Most consequential findings (prioritized)

1. **An agent can verify motion temporally, and deterministically, with tools it already has. [TESTED]** `document.getAnimations()` lists every running CSS transition, CSS animation, WAAPI animation and View Transition pseudo-element animation, with duration, delay, keyframes and animated properties. Pausing every animation and setting `currentTime` gives exact frames at chosen timestamps, regardless of CPU speed. I checked this against computed styles at 10 timestamps and got 0 pixel mismatches. Playwright's `recordVideo` adds the real-time playback. This answers historical failure H7 ("motion reviewed from code/stills") with a script, and a script is more reliable than a prompt rule.

2. **The naive seek-and-screenshot recipe gives wrong frames intermittently. [TESTED, new finding]** If you pause and seek a just-started compositor animation (opacity/transform) and then screenshot, the image can show a stale compositor frame. Computed style reports opacity 0 but the pixels show opacity of about 0.58. In 12 runs the naive approach was wrong 3 times. The reliable order is: `await a.ready` → `pause()` → wait 2× rAF → set `currentTime` → wait 2× rAF → screenshot. This was 8/8 and 10/10 correct. Without this protocol an agent would make confident false judgments ("the element starts visible"). It is the kind of hard-won detail a WhipUI motion module should carry.

3. **What AI can judge from frames differs sharply from what it cannot. [TESTED + INFER]** Machine-checkable: timing values, which properties animate (layout-triggering vs compositor), stagger order, overlap or clipping at intermediate frames, layout shift (PerformanceObserver), main-thread stalls (rAF gaps, Long Animation Frames, Event Timing), and whether reduced motion actually changed anything. Not machine-judgeable: whether motion *feels* right, its personality and brand fit, and whether delight turns into annoyance on the 20th repetition. Those need the owner (C7). The owner already saw AI aesthetic judges fail (H6).

4. **Main-thread JS animation and compositor CSS/WAAPI animation behave differently under load. Video shows it. [TESTED]** With a 300 ms main-thread block, a rAF-driven `margin-left` box froze for 9 consecutive video frames, while a CSS `transform` animation kept moving. The same run produced a 316 ms LoAF entry (254 ms blocking) and a 328 ms Event Timing entry for the click, which is INP-relevant. web.dev's guide reports about 50% dropped frames for `top/left` animation vs about 1% for `transform` [DOC]. Motion's docs say its individual-transform shorthands (`x`, `scale`) animate CSS variables and are **not** hardware-accelerated [DOC]. That trap is library-specific, and generic advice would miss it.

5. **The platform has caught up for transitions, but not fully for scroll timelines. [DOC, verified 2026-10-10]**
   - Same-document View Transitions: Chrome/Edge 111+, Safari 18.0+, Firefox 144+ (caniuse ≈92.9% global). Firefox shipped without view-transition *types* (Chrome blog, 2025-10-08).
   - Cross-document (`@view-transition`): Chrome/Edge 126+, Safari 18.2+. **Firefox: not supported** per MDN BCD (`version_added: false`). caniuse lists it as "partial" in 144+, and I could not resolve that conflict. Treat it as progressive enhancement.
   - Scroll-driven animations (`animation-timeline`): Chrome/Edge 115+, Safari 26+, **Firefox: "preview" only** (BCD; caniuse shows support only in version 160, which is Nightly). Current Firefox release is 157 (whattrainisitnow, endoflife.date). MDN: "Limited availability", not Baseline. Scroll effects therefore need a static or JS fallback.
   - `linear()` easing (enables spring approximations in CSS): Chrome 113, Firefox 112, Safari 17.2 (≈94%).

6. **Design systems disagree on numbers but agree on structure. [DOC]** Every major system splits motion into a "utilitarian/productive" register for frequent interactions and an "expressive/emphasized" register for rare, significant moments. Durations and curves differ (table in §3.1). The module should therefore teach the *structure* and defer to the project's own tokens. It should not ship a WhipUI house curve (C11).

7. **Springs vs bezier is a question of interruption, not style. [DOC]** Apple's WWDC23 "Animate with springs" says springs are the only animation type that stays continuous both from rest and from an initial velocity, so they matter for gesture hand-off and retargeting mid-flight. Apple parameterizes springs by perceptual *duration + bounce* and cautions against bounce above ~0.4 for UI. CSS `linear()` can approximate a spring's *shape*, but not velocity hand-off on interruption [INFER from mechanism]. Use a JS spring (Motion, or the platform's native spring) only where gestures or interruptions exist.

8. **Reduced motion means "replace", not "disable everything". [DOC]**
   - WCAG 2.3.3 (AAA) covers interaction-triggered *motion*, and the Understanding doc treats opacity and color as not motion (an erratum puts blur back in scope).
   - WCAG 2.2.2 (Level A) requires pause/stop/hide for auto-started motion that lasts >5 s alongside other content.
   - WCAG 2.3.1 (A) limits flashes to ≤3 per second.
   - Val Head [PRAC] lists the vestibular triggers: large movement relative to the viewport, zoom across large virtual distance, multi-speed parallax, motion mismatched with scroll.
   - Apple's HIG also points to visionOS sensitivity to oscillation around 0.2 Hz.
   - A good fallback keeps the information (state change, focus, orientation), swaps spatial motion for a short cross-fade or instant change, and keeps progress and feedback indicators.

9. **Evidence that motion improves outcomes exists but is narrow. [RES]**
   - Animated transitions improved graphical perception in two controlled experiments (Heer & Robertson 2007).
   - Progress-bar *visual behavior* changes perceived duration without changing real duration (Harrison et al. 2007; Harrison, Yeo & Hudson 2010).
   - "Juicy" visual embellishments improved *visual appeal* in games but affected perceived competence only under specific conditions (CHI PLAY 2019, n=40+32).
   - Practitioner duration ranges (NN/g: 100–500 ms, most 100–400 ms; enter slightly longer than exit) are explicitly experience-based.
   - I found no strong evidence that "juice" helps productivity apps. [INFER: treat game feel as a domain-specific choice, not a default.]

10. **Licensing is mostly benign, with sharp edges. [DOC]**
    - Motion (ex-Framer Motion): MIT core, plus paid "Motion+".
    - Anime.js v4: MIT. lottie-web: MIT. Rive web runtime: MIT (editor pricing not verified).
    - GSAP: Webflow made the library and the former Club plugins free, including commercial use (Webflow blog, updated 2026-06-16; gsap.com/pricing: "100% free"). The Standard "No Charge" license (effective 2025-04-30) **prohibits use in tools that let users build visual animations without code where that materially helps a product compete with Webflow**.
    - gsap.com/licensing still contains older-looking text about paid tiers and bonus plugins. The official pages contradict each other.
    - Implication: user projects may choose GSAP, but WhipUI's *own* tooling should not bundle GSAP. Whether an AI design agent counts as a "no-code visual animation tool" is a legal question I cannot settle.

---

## 2. Primary sources (all accessed 2026-10-10)

| # | Source | Type | Date |
|---|---|---|---|
| 1 | caniuse, View Transitions (single-document) https://caniuse.com/view-transitions | DOC | live data |
| 2 | caniuse, cross-document VT https://caniuse.com/cross-document-view-transitions | DOC | live |
| 3 | MDN BCD `@view-transition` https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/at-rules/view-transition.json | DOC | main branch |
| 4 | MDN BCD `animation-timeline` https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/animation-timeline.json ; MDN page https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline | DOC | MDN page modified 2026-09-16 |
| 5 | caniuse `animation-timeline` https://caniuse.com/mdn-css_properties_animation-timeline ; `linear()` https://caniuse.com/mdn-css_types_easing-function_linear-function | DOC | live |
| 6 | Firefox release trains https://whattrainisitnow.com/ ; https://endoflife.date/firefox | DOC | Firefox 157 release, 158 ships 2026-10-13 |
| 7 | Chrome blog, "What's new in view transitions (2025)" https://developer.chrome.com/blog/view-transitions-in-2025 | DOC | 2025-10-08 |
| 8 | Material 3 tokens (material-web) https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-motion.scss | DOC | token v0_192 |
| 9 | Compose `MotionScheme` https://composables.com/docs/androidx.compose.material3/material3/interfaces/MotionScheme (mirror of developer.android.com reference) | DOC | current |
| 10 | IBM Carbon motion https://carbondesignsystem.com/elements/motion/overview/ | DOC | undated |
| 11 | Apple HIG Motion https://developer.apple.com/design/human-interface-guidelines/motion (read via JSON data endpoint) | DOC | undated, current |
| 12 | Apple WWDC23 "Animate with springs" https://developer.apple.com/videos/play/wwdc2023/10158/ | DOC | 2023 |
| 13 | Microsoft Fluent timing & easing https://learn.microsoft.com/en-us/windows/apps/design/motion/timing-and-easing | DOC | updated 2026-02-28 |
| 14 | WCAG 2.2 Understanding 2.3.3 https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html ; 2.2.2 https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html ; Technique C39 https://www.w3.org/WAI/WCAG22/Techniques/css/C39 | DOC | WCAG 2.2 |
| 15 | web.dev animations guide https://web.dev/articles/animations-guide | DOC | updated 2020-10-06 |
| 16 | web.dev Optimize INP https://web.dev/articles/optimize-inp | DOC | 2023-05-19, upd. 2025-09-02 |
| 17 | web.dev CLS https://web.dev/articles/cls | DOC | upd. 2023-04-12 |
| 18 | web.dev prefers-reduced-motion https://web.dev/articles/prefers-reduced-motion | DOC/PRAC | upd. 2019-03-11 |
| 19 | Chrome `linear()` https://developer.chrome.com/docs/css-ui/css-linear-easing-function | DOC | 2023-05-25 |
| 20 | Motion performance https://motion.dev/docs/performance ; repo https://github.com/motiondivision/motion | DOC | © 2026 |
| 21 | GSAP Standard License https://gsap.com/community/standard-license/ ; https://gsap.com/pricing/ ; https://gsap.com/licensing/ ; Webflow https://webflow.com/blog/gsap-becomes-free | DOC | license eff. 2025-04-30; Webflow upd. 2026-06-16 |
| 22 | Anime.js https://github.com/juliangarnier/anime ; lottie-web https://github.com/airbnb/lottie-web ; Rive https://github.com/rive-app/rive-wasm | DOC | repos, current |
| 23 | Playwright videos https://playwright.dev/docs/videos ; clock https://playwright.dev/docs/clock ; Screencast class (v1.59+) https://playwright.dev/docs/api/class-screencast | DOC | current |
| 24 | CDP Animation domain https://chromedevtools.github.io/devtools-protocol/tot/Animation/ | DOC | tip-of-tree |
| 25 | Heer & Robertson, "Animated Transitions in Statistical Data Graphics", IEEE TVCG/InfoVis 2007 https://idl.uw.edu/papers/animated-transitions | RES | 2007 |
| 26 | Harrison, Amento, Kuznetsov, Bell, "Rethinking the Progress Bar", UIST 2007 https://www.chrisharrison.net/index.php/Research/ProgressBars ; Harrison, Yeo, Hudson, "Faster Progress Bars", CHI 2010 https://www.figlab.com/research/2010/faster-progress-bars | RES | 2007, 2010 |
| 27 | "Juicy Game Design: Understanding the Impact of Visual Embellishments on Player Experience", CHI PLAY 2019, doi 10.1145/3311350.3347171 https://unpaywall.org/10.1145%2F3311350.3347171 | RES | 2019-10-17 |
| 28 | Hicks, Dickinson, Holopainen, Gerling, "Good Game Feel: An Empirically Grounded Framework for Juicy Design", DiGRA 2018 https://dl.digra.org/index.php/dl/article/view/936 | RES (survey of 17 devs) | 2018 |
| 29 | NN/g, Laubheimer, "Executing UX Animations: Duration and Motion Characteristics" https://www.nngroup.com/articles/animation-duration/ | PRAC | 2020-02-09 |
| 30 | Val Head, "Designing Safer Web Animation for Motion Sensitivity", A List Apart https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/ | PRAC | 2015, mod. 2020 |

Not verified (fetch blocked or JS-only): m3.material.io spring and physics token values for M3 Expressive, and Rive editor pricing. I list them only as uncertain.

---

## 3. Implications for WhipUI

### 3.1 Motion knowledge module: outline and loading trigger

**Load trigger [INFER].** Load the module when any of these is true:
- task family is `MOTION_ONLY`;
- the brief or feedback mentions animation, transition, motion, scroll effect, hover/press feel, "juice", "feels laggy/janky", page transition or loading state;
- the diff touches `transition|animation|@keyframes|view-transition|animation-timeline|requestAnimationFrame|motion/gsap/anime/lottie/rive` imports;
- the rendered review finds animations via `getAnimations().length > 0` after a key interaction.

Do **not** load it for static layout or polish work. Load the verification script (below) on the last two triggers even when the prose module isn't needed.

**Sections (target ≤ ~1,500 tokens core, with deeper sub-files loaded on demand):**
1. **Purpose test** (always). Name the job of each motion: feedback (acknowledge input), orientation/continuity (where did it come from or go), hierarchy/attention (what changed), status (progress, loading), or character/delight. Motion that has no job is a removal candidate. Apple's "avoid motion on frequent interactions" and "let people cancel motion" are the guards.
2. **Register and tokens.** Productive vs expressive (Carbon), standard vs expressive scheme (M3), effects vs spatial (M3 Compose). Rule: adopt the project's tokens. If none exist, propose a small token set and record it as `proposed`, not approved (C8). Reference values for calibration, not as house style:

   | System | Durations | Main curves |
   |---|---|---|
   | Material 3 | short1–4: 50/100/150/200; medium1–4: 250–400; long1–4: 450–600; extra-long1–4: 700–1000 ms | standard `cubic-bezier(0.2,0,0,1)`; emphasized-decelerate `(0.05,0.7,0.1,1)`; emphasized-accelerate `(0.3,0,0.8,0.15)` |
   | Carbon | fast-01 70, fast-02 110, moderate-01 150, moderate-02 240, slow-01 400, slow-02 700 ms | productive standard `(0.2,0,0.38,0.9)`; expressive standard `(0.4,0.14,0.3,1)` |
   | Fluent (WinUI) | 83 / 167 / 250 ms | enter `(0,0,0,1)`; exit `(1,0,1,1)` |
   | Apple | springs by perceptual duration + bounce (start at bounce 0; caution >0.4) | — |
   | NN/g [PRAC] | ~100 ms simple feedback; 200–300 ms modal-scale changes; ≤400 ms large moves; exit shorter than enter | — |

3. **Choreography.** Stagger only to convey order or grouping. Keep the total sequence short: stagger × N grows linearly, so cap or batch. One focal motion at a time. Shared-element continuity uses View Transitions (same-document: Baseline; cross-document: Chromium + Safari only).
4. **Physics.** Use springs where gestures, drag release or retargeting occur. Use bezier or `linear()` elsewhere. Completion callbacks follow perceptual duration, not settle time.
5. **Scroll-linked motion.** Prefer native `animation-timeline` with `@supports` fallback (Firefox release lacks it). Avoid scrolljacking, motion against scroll direction and multi-speed parallax (vestibular triggers).
6. **Performance.** Animate `transform`/`opacity` (and `filter`/`clip-path` with care). Don't animate layout properties on large subtrees. Avoid read-after-write layout thrash. Library traps: Motion `x/scale` shorthands aren't accelerated. JS rAF animation freezes under main-thread load. Keep interaction → next paint under the INP budget (≤200 ms "good").
7. **Accessibility.** WCAG 2.3.3 / 2.2.2 / 2.3.1 summary. Reduced-motion recipe:
   - replace spatial transforms, zoom and parallax with ≤150–200 ms opacity cross-fades or instant changes;
   - keep focus and state indicators and progress;
   - stop autoplay loops or give them pause controls;
   - JS animations must read `matchMedia` and listen for `change`;
   - don't set `animation: none` where code waits on `animationend`; use a near-zero duration instead (web.dev's caution).
8. **Game feel / juice (domain sub-file, loaded only for game UI, playful brands or explicit request).** The Hicks et al. framework. Evidence is limited to games. In apps, prefer "juice" on rare, high-value moments (completion, reward), never on high-frequency controls. Always provide a reduced-motion variant.
9. **Library choice (sub-file).** CSS/WAAPI first. Motion (MIT) for React and springs/gestures/layout animation. GSAP for complex timelines, with the license caveat. Anime.js (MIT) for lightweight timelines. Lottie (MIT player) and Rive (MIT runtime) for designer-authored vector animation. Never add a dependency the project doesn't need (handoff §5).
10. **Diagnoses** (§4) and the **verification protocol** (§3.2).

### 3.2 Motion verification protocol (executable, tested)

Protocol, run per key interaction (`trigger`) × `reducedMotion ∈ {no-preference, reduce}` × relevant viewport:

1. **Inventory** right after the trigger: `getAnimations()` → kind, target, duration, delay, endTime, timeline type, animated properties, and **keyframe-level easing**. CSS animations report effect easing as `linear`; the authored curve lives on the keyframes [TESTED].
2. **Static checks** on the inventory:
   - layout-triggering properties (`top|left|width|height|margin|padding`) → flag;
   - durations outside the project tokens → flag;
   - total choreography `max(endTime)` against budget → flag;
   - under `reduce`: any remaining spatial property (`transform`, `translate`, `scale`, `left`, `height`…) → flag for human or essential-ness review.
3. **Deterministic filmstrip.** Run the tested seek sampler (below) at ~12 evenly spaced timestamps plus the end state, then build a contact sheet with timestamps. AI checks each frame for overlap, clipping, wrong z-order, content jumps and broken intermediate states.
4. **Real-time playback.**
   - `recordVideo` webm: 25 fps, scaled to fit 800×800 by default [TESTED: 640×400, 25/1 fps].
   - For higher temporal resolution, CDP `Page.startScreencast` delivered ≈60 frames/s in headless [TESTED].
   - Playwright ≥1.59 has a public `page.screencast` with `onFrame` [DOC, not tested; installed 1.56 lacks it].
   - Convert to MP4 or GIF for the human.
5. **Runtime health during playback:**
   - rAF gap distribution (gaps >25 ms);
   - `long-animation-frame` entries;
   - Event Timing durations for the interaction;
   - `layout-shift` entries. Shifts within 500 ms after discrete input carry `hadRecentInput` and don't count toward CLS, but are still visible jumps, so report them anyway.
   - Optional: `browser.start_tracing` (Chromium) and count `DroppedFrame` events [TESTED: 18 in the jank case].
6. **Human packet.** A side-by-side MP4/GIF (normal vs reduced), a contact sheet, the inventory table and flagged issues. Ask the owner only about feel and taste ("too slow? too bouncy? distracting?"). Report technical defects as verified facts.

Rules: never claim motion quality from code or a single still (handoff §12). Headless timing differs from real devices, so treat absolute frame rates as indicative. Use CPU throttling (`Emulation.setCPUThrottlingRate` via CDP) to stress-test.

**Node sketch: inventory, CDP, layout shift, LoAF, video, correct seek sampler.** This is the exact file `/tmp/claude-0/r4/sketch.mjs`. I ran it as published in both motion modes: 6 vs 4 animations, frames pixel-correct at t=0/50/150. Usage: `node sketch.mjs <url> <triggerSelector> [reduce]`.

```js
import { chromium } from 'playwright';
const [url, trigger, reducedMotion = 'no-preference'] = process.argv.slice(2);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 640, height: 400 }, reducedMotion,
  recordVideo: { dir: 'out/video', size: { width: 640, height: 400 } } });
const page = await context.newPage();
await page.addInitScript(() => {            // install before load
  window.__raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shifts = []; window.__loaf = [];
  new PerformanceObserver(l => l.getEntries().forEach(e => __shifts.push({ v: e.value, input: e.hadRecentInput, t: e.startTime })))
    .observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver(l => l.getEntries().forEach(e => __loaf.push({ d: e.duration, block: e.blockingDuration })))
    .observe({ type: 'long-animation-frame', buffered: true });
});
const cdp = await context.newCDPSession(page);            // Chromium only
const started = [];
cdp.on('Animation.animationStarted', ({ animation: a }) =>
  started.push({ type: a.type, name: a.name, dur: a.source?.duration, delay: a.source?.delay }));
await cdp.send('Animation.enable');
await page.goto(url); await page.click(trigger);
const inventory = await page.evaluate(() => document.getAnimations().map(a => {
  const t = a.effect.getComputedTiming(), el = a.effect.target;
  return { kind: a.constructor.name, name: a.animationName || a.transitionProperty || a.id,
    target: el?.id || el?.className, pseudo: a.effect.pseudoElement, duration: t.duration, delay: t.delay,
    endTime: t.endTime, timeline: a.timeline?.constructor.name,
    easing: [a.effect.getTiming().easing, ...a.effect.getKeyframes().map(k => k.easing)],
    props: [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k)))]
      .filter(p => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)) };
}));
// Deterministic frames. ORDER MATTERS: ready -> pause -> 2 rAF -> seek -> 2 rAF -> screenshot
const timeAnims = 'document.getAnimations().filter(a => a.timeline instanceof DocumentTimeline)';
await page.evaluate(`(async () => { const A = ${timeAnims};
  await Promise.all(A.map(a => a.ready)); A.forEach(a => a.pause()); await __raf2(); })()`);
for (const ms of [0, 50, 100, 150, 200, 300, 450]) {
  await page.evaluate(`(async () => { ${timeAnims}.forEach(a => { a.currentTime = ${ms}; }); await __raf2(); })()`);
  await page.screenshot({ path: `out/sketch-${reducedMotion}-t${String(ms).padStart(4, '0')}.png` });
}
const health = await page.evaluate(() => ({ shifts: __shifts, loaf: __loaf }));   // read BEFORE close
const video = page.video();
await context.close();                       // video is flushed only on close
console.log(JSON.stringify({ n: inventory.length, props: [...new Set(inventory.flatMap(i => i.props))], started: started.length,
  shifts: health.shifts.length, loaf: health.loaf.length, video: await video.path() }));
await browser.close();
```

**Python sketch: same sampler, for agents on Python** (ran successfully: 13 frames + inventory in both motion modes):

```python
from playwright.sync_api import sync_playwright
RAF2 = "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 640, "height": 400}, reduced_motion=rm)  # "reduce" | "no-preference"
    page.goto(url); page.click(trigger)
    inv = page.evaluate(INVENTORY_JS)         # same mapping as the Node version
    end = max([a["endTime"] for a in inv if a["endTime"] not in (None, float("inf"))] or [0])
    page.evaluate(f"async () => {{ const A = document.getAnimations(); await Promise.all(A.map(a => a.ready));"
                  f" A.forEach(a => a.pause()); await {RAF2}; }}")
    step = max(16, round(end / 12)) if end else 16
    for t in range(0, int(end) + step, step):
        page.evaluate(f"async t => {{ document.getAnimations().forEach(a => a.currentTime = t); await {RAF2}; }}", t)
        page.screenshot(path=f"{outdir}/t{t:05d}.png")
    b.close()
```

**Jank and INP probe (Python, ran):** inject via `add_init_script` a rAF loop that records frame gaps, plus observers for `long-animation-frame` and `event` (`durationThreshold: 16`). Click the trigger, wait, read the results. Optionally `browser.start_tracing(page=page, screenshots=True)` and count `DroppedFrame`. To check the reduced-motion switch live: `page.emulate_media(reduced_motion="reduce")` → `matchMedia(...).matches` returned `true` [TESTED].

**Human-reviewable evidence (ffmpeg, ran):**
```bash
ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4                                    # shareable MP4
ffmpeg -i in.webm -vf "fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" out.gif
ffmpeg -i in.webm -vf "fps=10,scale=320:-1,tile=6x3" -frames:v 1 filmstrip.png             # contact sheet
ffmpeg -i in.webm -vsync 0 frames/f%03d.png    # per-frame analysis (e.g., track an element's x per frame)
```
Per-frame tracking of element position across video frames found the 9-frame freeze in finding 4 automatically. A naive pixel-search script is enough for synthetic fixtures. Real pages need element-bounded crops.

**Do not use** `page.screenshot({animations: "disabled"})` for motion review. Its own docs say it fast-forwards finite animations to completion and cancels infinite ones, which is right for static visual diffs and wrong for motion. **Playwright Clock** controls timers and rAF but its docs don't claim control of CSS or WAAPI animations, so seek via WAAPI instead.

---

## 4. Motion failure diagnoses (symptom → cause → check → fix → counterexample)

1. **"Animation stutters when the page is busy."** → Animation runs on the main thread: JS/rAF driven, a layout property, or a library shorthand that animates CSS variables. → Inventory props; video frame-tracking during a forced main-thread block; LoAF entries. → Move to `transform`/`opacity` via CSS/WAAPI; in Motion animate the `transform` string; defer heavy work after the next frame. → *Counter:* physics or gesture-follow animations sometimes have to be JS-driven. Then cut main-thread work rather than the spring.

2. **"Content below jumps when a panel opens."** → `height`/`max-height` transition reflows siblings every frame. → `layout-shift` entries during the transition (the fixture produced several with `hadRecentInput: true`, so CLS hides them); filmstrip shows siblings moving. → Animate `grid-template-rows: 0fr→1fr` or a transform-based reveal, reserve space, or use a View Transition. → *Counter:* an accordion legitimately pushes content. The test is whether the push is smooth and expected, not whether it exists.

3. **"It feels sluggish."** → Durations too long for frequency (e.g., 500 ms on a toggle) or an ease-in curve on entrance. → Inventory durations and keyframe easings compared with tokens and interaction frequency. → Shorten frequent interactions toward the ~100–200 ms range; use decelerate on enter and accelerate on exit. → *Counter:* rare expressive moments (onboarding, hero) can legitimately run 400–700 ms (Carbon slow-01/02, M3 long). Ask the owner, don't auto-shorten.

4. **"The list entrance takes forever."** → Linear stagger across many items (e.g., 60 ms × 30 = 1.8 s). → `max(endTime)` against the budget; count of delayed animations. → Cap the stagger to the first N visible items, compress delay as N grows, animate groups. → *Counter:* a short, deliberate sequence in a portfolio hero can be the concept. Record it as an approved direction.

5. **"Reduced motion is on but things still slide."** → Only CSS was gated; JS/WAAPI or library animations ignore the media query, or one transition was missed. → Re-run the inventory with `reducedMotion: 'reduce'` and list residual spatial props (the fixture's `height` transition survived). → Gate JS with `matchMedia` and a `change` listener, use library reduced-motion hooks, swap spatial motion for a fade. → *Counter:* an essential motion (e.g., a drag following the pointer, scrolling itself) may remain under WCAG 2.3.3's "essential" exception.

6. **"Reduced-motion mode broke the UI / something never appears."** → Blanket `animation: none` while code waits on `animationend`, or elements start at `opacity: 0` and only the animation reveals them. → Under `reduce`, check end-state screenshot visibility and whether there are zero animations with hidden elements. → Use near-zero durations or a short fade, and make the final state the default style. → *Counter:* none is acceptable here. Content missing under reduced motion is always a defect.

7. **"The screenshot says the element is visible at t=0, but it shouldn't be."** → Verification artifact: stale compositor frame after a naive pause and seek (finding 2), not a product bug. → Compare computed style with the pixel colour, then re-run with the validated order. → Use ready → pause → 2 rAF → seek → 2 rAF. → *Counter:* if computed style also disagrees with intent, it is a real bug.

8. **"The easing looks linear in the report."** → Reading `effect.getTiming().easing` for a CSS animation, which is per-keyframe by spec. → Also read `getKeyframes()[i].easing` [TESTED: effect `linear`, keyframes `cubic-bezier(0.05,0.7,0.1,1)`]. → Report both. → *Counter:* WAAPI animations created with an `easing` option do set the effect easing.

9. **"The drag release snaps or jerks."** → A bezier or fixed-duration tween can't inherit release velocity. → Record video of drag-and-release (via `page.mouse` moves) and track position per frame for a velocity discontinuity. → Use a spring that receives the initial velocity (native or Motion). → *Counter:* for non-gestural state changes a well-chosen bezier is simpler and fully adequate (Apple: bounce 0 for most UI).

10. **"Parallax/scroll effect makes the page feel unstable, or does nothing in Firefox."** → Multi-speed motion is a vestibular trigger; `animation-timeline` isn't in Firefox release. → `@supports (animation-timeline: scroll())`; inventory shows `ScrollTimeline` animations with `currentTime` as a percentage [TESTED]; test with reduce. → Make scroll effects progressive enhancement with a static default, keep motion in the scroll direction and small, disable under reduce. → *Counter:* a scroll-progress indicator is low-risk and informative, so keep it.

11. **"Page transition flashes or double-animates."** → A View Transition overlapping legacy enter animations, or root cross-fade defaults (250 ms) clashing with element timing. → Inventory during the transition lists `::view-transition-*` pseudo animations and durations [TESTED]. → Name only the elements that need continuity and suppress duplicate enter animations during the VT. → *Counter:* on browsers without cross-document VT the default instant navigation is acceptable; don't polyfill with heavy JS.

12. **"Celebratory animation is fun the first time, annoying later."** → Juice on a high-frequency action. → Count how often the trigger occurs in the core flow; ask the owner after repeated playback (a human judgment). → Show it on first or rare occurrences, shorten it, make it skippable. → *Counter:* in games, repeated feedback on core actions is the point (CHI PLAY 2019: appeal improved).

---

## 5. Recommendation: dedicated Motion skill or module?

**Recommendation [INFER]: a lazily loaded Motion *knowledge module* plus a shared executable `motion-probe` script, routed by the single WhipUI entry skill. Not a separate auto-invoked skill for now.**

Criteria for promoting Motion to a separately invocable skill. Promote only if **at least two** hold, measured rather than assumed:
1. **Independent entry demand.** Users start motion-only tasks often enough that an explicit `/motion` entry saves time (track the `MOTION_ONLY` share in pilot logs; e.g., >15% of tasks).
2. **Routing failure.** In route-selection tests the entry skill misses motion intent (e.g., >10% of motion tasks never load the module or probe). HY3 says auto-invocation of many skills is the bigger risk, so test this first.
3. **Context divergence.** Motion work needs substantially different context from general UI work (e.g., >2k tokens of motion-only guidance routinely loaded together), so bundling would bloat other routes.
4. **Distinct tool lifecycle.** The probe grows into a toolchain (device-lab capture, tuning UI, spring editor) whose setup and permissions differ from the general render-check tools.

Today only (1) is plausible (MOTION_ONLY is a required task family), and (4) is not true: the probe is ~150 lines and shares Playwright with R5's render tooling. The motion knowledge outlined in §3.1 fits a ≤1.5k-token core. The **probe script is the most valuable part**: it addresses H7 directly and works without any prose being loaded.

---

## 6. Counterevidence, keep/reject/test later, evaluation, uncertainty

**Counterevidence and competing explanations**
- Frontier models already know "transform/opacity, prefers-reduced-motion, 200–300 ms" well. The prose module may add little. Its value is likely concentrated in the *probe* and the diagnoses, especially the non-obvious ones (stale-frame seeking, keyframe easing, library acceleration traps, Firefox scroll-timeline gap). *Falsified if* arm A with a plain screenshot loop produces equally correct motion with no more motion defects found by the probe.
- Headless Chromium is not a real device. 25 fps video can hide sub-40 ms stutters, and GPU differences change compositing. A clean probe is *not* proof of smoothness on low-end phones. Throttled CPU runs and an owner-device recording reduce, but don't remove, this gap.
- AI judgment of frames may still mislabel intentional overlap (e.g., cross-fades) as defects. Keep the AI to factual flags with frame references, and let the human decide.
- The research base for UI-motion *benefit* is thin and old (2007–2010 for perception; game-only for juice). Most duration guidance is practitioner consensus.

**Keep / reject / test later**

| Item | Decision | Rationale / cost |
|---|---|---|
| WAAPI inventory + validated seek sampler + video | **Keep** | Tested; cheap; directly fixes H7. Chromium-centric (WAAPI is cross-browser, CDP isn't) |
| Reduced-motion A/B run as a default part of the motion check | **Keep** | Catches residual spatial motion and missing content; ~doubles capture time |
| Contact sheet + MP4/GIF human packet | **Keep** | Low cost; supports owner taste judgment (C7) |
| Fixed house durations/curves | **Reject** | Violates C11; systems disagree; defer to project tokens |
| AI "motion quality score" | **Reject** | Same failure class as H6; report facts, ask humans about feel |
| GSAP bundled in WhipUI tooling | **Reject** | License prohibited-use clause; unnecessary dependency |
| Separate auto-invoked Motion skill | **Test later** | Promote only on the §5 criteria |
| Playwright ≥1.59 `page.screencast` replacing CDP screencast | **Test later** | Documented, not available in the installed 1.56 |
| CPU-throttled runs, mobile emulation for jank | **Test later** | Adds realism; thresholds need calibration |
| Automated velocity-discontinuity detection for drag/spring | **Test later** | Feasible from frame tracking; untested on real UIs |

**Suggested evaluation**
- *Seeded-defect benchmark.* ~10 small fixtures, each with one known motion defect from §4 (layout-property animation, missing reduce gate, excessive stagger, `animation:none` + `animationend`, jerky drag release, etc.) plus clean controls. Arms: baseline model with screenshot-only review vs the same model + probe script vs + probe + module. Metrics: defects detected and correctly fixed, false positives, tokens and time. This isolates *tool* from *prose*.
- *Human feel pilot.* For 3–4 motion-rich briefs, the owner rates blinded side-by-side videos (normal and reduced) from the arms. Record number of revision rounds to approval. Watch for unequal iteration counts as a confounder.
- *Reliability.* Run the sampler 20× per fixture and require identical frames, as I did with 12 naive vs 12 validated runs.

**Uncertainty and unsupported claims**
- Firefox cross-document VT: MDN BCD says unsupported, caniuse says "partial (144+)". Not resolved.
- M3 Expressive spring parameters, and whether `MotionScheme` is spring-backed: not verified from a primary source (m3.material.io needs JS and fetching was blocked). Only the standard/expressive and spatial/effects structure is verified.
- GSAP: official pages conflict on bonus plugins and paid tiers. Whether an AI design agent is a "no-code visual animation tool" under the license is a legal question.
- Stale-frame finding: reproduced on Chromium 141 headless (Linux, software compositing). Behaviour on GPU or headed builds is untested, and the mechanism (compositor-side animation not yet synced at seek time) is my inference.
- The video frame rate (25 fps) and screencast rate (~60 fps) are from this environment and will vary with load.
- Rive editor pricing and lottie-web maintenance status: not verified.

**Scratch artifacts** (not deliverables): `/tmp/claude-0/r4/` contains `fixture.html`, `jank.html`, `vt.html`, `verify.mjs`, `seekfinal.mjs`, `stale3.mjs`/`stale4.mjs` (race reproduction), `sample_frames.py`, `jank_check.py`, `contact.py`, plus outputs under `out/`.
