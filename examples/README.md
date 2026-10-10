# WhipUI onboarding examples

Seven short walkthroughs of what an agent with WhipUI does. They show the **behaviour**
the skill asks for. They are not transcripts of measured runs. `<skill>` = the installed skill folder.

---

## 1. Sparse `/goal`: "landing page for my indie rhythm game"

```
/whipui landing page for Pulse Ward, my indie rhythm game. goal: steam wishlists
```
1. **Orient:** no `.whipui/`, empty folder → CREATE_TO_SHIP, design latitude.
2. **Frame (inferred, stated in 3 lines):** players arriving from a trailer, mostly mobile; primary task = wishlist; success = trailer + wishlist CTA in the first viewport at 390×844 and 1440×900.
3. **Ask or act:** taste unknown (U high) × page-wide direction (C high) → **show options**, but first build what doesn't depend on taste (content, structure, wishlist flow, responsive skeleton).
4. **References (free ladder):** subject world (rhythm-game flyers, cabinet art) + 3 Awwwards/recent.design picks; `ref-capture` two of them; record borrow/avoid/transform.
5. Build two directions (hero + one section) that differ on tone and imagery, run `render-check --tier min` on both, then `review-page build --mode options`.
6. User picks Option 2 and writes "less neon on body text" → `state approve D2 --evidence …`, `pref add tone …`.
7. Build out → `render-check --tier standard` → `motion-probe` on the hero entrance → report verified / assumed / not tested.

Under built-in `/goal`, the agent stops at step 5 with options ready: the user's choice can't be self-satisfied.

## 2. Detailed brief: expense dashboard with states

The brief names users, data, states and keyboard access → U low on structure; the direction is
utilitarian and constrained. **Proceed** without a direction round. Load `framing.md` (criteria
from the brief, tagged machine/advisory/human) and `ux-diagnostics.md` (tables #14, states #6–7,
forms #3). A `--setup states.mjs` mocks empty, error and long-name states for render-check.
One checkpoint at the end with screenshots of each state.

## 3. Reproduce a screenshot

```
/whipui rebuild this page from target.png as static HTML, exactly
```
REPRODUCE_TARGET, **fidelity**. The agent asks once whether the user owns or may reproduce it (records
the answer), measures the screenshot (or `ref-capture capture` if a URL exists), builds structure →
type → colour, then `ref-capture compare target/ mine/` until block recall is high and offsets are small.
A poor-contrast detail in the target is reproduced and *noted* with an optional fix, not "improved" unasked.

## 4. Implement an approved Figma design

IMPLEMENT_EXISTING_DESIGN. `detect-project` → reuse the shadcn tokens found. The spec lacks an error
state → **scope down**: build it neutrally from existing tokens, flag it, ask at the checkpoint.
The spec's 12 px caption fails contrast → implement as specified, show the issue and a compliant
option. No deviation without the user's word. Approved design = baseline for later regressions.

## 5. Component repair

```
/whipui the pricing toggle overlaps the cards on mobile
```
POLISH_OR_REPAIR, minimal latitude. `render-check --viewports 375x812` reproduces the
`interactive-overlap`; the fix touches one rule; `render-check --baseline <before>` shows 0 px change
outside the toggle region; before/after screenshots in the reply. No state file, no references, no options.

## 6. Motion-rich UI

```
/whipui add motion to the cart drawer and add-to-cart, keep it quick
```
MOTION_ONLY. Load `motion.md`. Purpose per motion (drawer = continuity, add = feedback, toast = status).
Use the project's tokens or propose a small productive set (*proposed*). Implement with CSS/WAAPI;
reduced motion = opacity cross-fade. `motion-probe --trigger "#cartBtn" --video` and
`--trigger "#add"`: no layout-property animation, sequence ≤ budget, no content missing under
reduce. Then the user watches the filmstrip/video and is asked only about feel.

## 7. Annotated-feedback refinement

```
node <skill>/scripts/review-page.mjs build --mode annotate --image .whipui/runs/render-…/1440x900-light-full.png --url http://localhost:3000 --viewport 1440x900
```
The user draws a box around the header ("make this lighter everywhere") and a pin on a card
("bug: price wraps"), picks "approve with changes", and exports `feedback.json`.
`review-page tickets feedback.json --url …` maps the box to `header.topbar` with global scope
flagged **CONFIRM**, and the pin to `.card .price`, element scope. The agent confirms the global
change in one line, applies both, re-renders, and regenerates the page with before/after.
