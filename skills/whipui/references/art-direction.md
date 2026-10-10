# Art direction

Load for a new visual direction, a "looks generic / looks AI-made" complaint, an expressive
brief, or when no host design skill is installed. WhipUI has **no house style** and no
banned-look list. Lists of banned looks just move the default: after Inter-and-purple was
named, models drifted to the next cluster (cream + serif + terracotta, black + acid accent,
SaaS card kit…). The working rule is **chosen vs defaulted**.

If a host design skill (e.g. `frontend-design`) is installed, follow its craft guidance.
This module adds the parts it doesn't cover: grounding in references, producing genuinely
different directions, keeping direction as intent rather than fixtures, and checking the
render against what you claimed.

## 1. Derive a direction (not a template)

1. **Subject vernacular.** What do the subject's own world, materials, artifacts and audience look like?
   (A rhythm game: beat grids, LED strips, flyers, cabinet art. A clinic portal: forms people
   trust, calm wayfinding.) Distinctive choices come from here, not from "modern website".
2. **References** (see `references.md`): 3–4 diverse ones, deconstructed into mechanisms.
3. **Constraints**: brand assets, existing tokens, platform, accessibility, content length, Thai text.
4. Write the direction as **intent + principles + a few named decisions**, for example:
   ```
   Direction "Night set": confident, kinetic, never cluttered.
   Principles: one loud element per screen (the beat grid); everything else quiet and aligned.
   Type: condensed display for numbers/titles only; humanist sans body ≥16px.
   Colour roles: near-black ground, one saturated accent for state + CTA, no gradient washes.
   Motion: one orchestrated entrance; user-triggered feedback ≤200ms.
   ```
   Record it as `proposed` (`state.mjs decide`). Don't freeze pixel values into a "fingerprint".
   Concrete values become decisions only when built and approved.

## 2. Chosen-or-defaulted check (before building, and again on the render)

For type, palette, layout skeleton, imagery, motion and copy voice ask:
- Would a similar prompt from someone else land here? Would I produce this for an unrelated brief?
- Can I name the brief fact or reference mechanism this choice comes from?
- Is anything in `state.mjs check` (rejected decisions, disliked reference traits) reappearing?
If a choice is defaulted and the brief leaves that axis free, re-derive it. If the brief or
brand pins it down (even to a "default" look), follow the brief.

## 3. Generating 2–3 directions that are actually different

Vary the axes people actually disagree on (DesignPref: designers split on these): **density** (airy ↔ dense),
**tone** (light/neutral ↔ dark/saturated), **imagery** (decorative/illustrative ↔ utility/product-first),
**action scope** (one primary action ↔ many), **type voice** (quiet/system ↔ expressive), **motion intensity**.
Use the same real content in every direction. Three tints of one layout aren't three
directions. Render each at desktop and mobile; build only the hero + one representative
section for a direction round, not whole pages.

## 4. Vocabulary for expressive briefs (optional; only when the brief wants personality)

- **Creative tension:** pair two qualities that pull against each other ("clinical + warm", "loud + precise") and let each section resolve it differently.
- **Visual grammar:** 3–5 rules that make the system recognizable (e.g. "all emphasis is by scale, never colour", "content hangs from a single left axis").
- **Page choreography:** plan the scroll as a sequence of moments with rising and falling intensity, not a stack of equal sections.
- **Controlled break:** one deliberate rule violation per page, placed where attention should go.
- **Bespoke asset:** one element made for this project (an illustration style, a data-driven graphic, a custom type treatment) beats stock decoration.
Spend boldness in one place. Utilitarian products may correctly look conventional. Convention helps usability.

## 5. Craft floor (when no host design skill provides it)

- Type: 1–2 families with clear roles; a scale with real contrast at the top (display vs body), body 16 px+ on web, measure ~45–80 characters, line-height ~1.4–1.6 for body (Thai needs room for stacked vowels/tone marks: don't clip with tight line-height or `overflow:hidden` on text).
- Hierarchy: ≤3 size tiers in a view, ≤2 elements at the top tier, emphasis by one means at a time.
- Colour: define **roles** (ground, surface, ink, muted ink, accent, state colours) and tonal ramps (e.g. HCT/OKLCH) so dark mode and contrast work. Not a pile of hex values.
- Shape: radius and shadow by **hierarchy role**, not one value everywhere; group with spacing before boxes.
- Layout: a real grid and alignment axis; whitespace as grouping, not padding filler.
- Copy: the user's vocabulary, active verbs on buttons, errors that say how to fix.

## 6. Aesthetic diagnoses

| Symptom | Likely cause | Intervention | When the "symptom" is right |
|---|---|---|---|
| Generic sans, white ground, purple/indigo gradient | distributional default | derive type/colour from subject + refs; record why | brand guide specifies it |
| Cream + high-contrast serif + terracotta; or near-black + acid accent | second-generation default | re-run the chosen-or-defaulted check | heritage food brand; terminal-culture dev tool |
| Everything in identical rounded cards with the same soft shadow | component-library defaults acting as layout | assign shape by role; group with spacing | widget dashboards: cards are right |
| ALL-CAPS eyebrow over every heading; 01/02/03 markers; "A · B · C" meta strings | template chrome as decoration | keep structure only where it encodes information | a real sequence or category |
| Hero = big number + small label + gradient | default hero | open with the subject's most characteristic artifact | metrics *are* the thesis |
| Fade-up on every section, hover-lift on every card | scattered default motion | one orchestrated moment + responsive feedback | motion-led portfolio (still needs reduced-motion) |
| Many sizes/weights, nothing dominates | no hierarchy plan | ≤3 tiers, one dominant element | dense editorial/data UIs: measure readability instead |
| Looks like the reference with the logo swapped | single-exemplar fixation | ≥3 diverse refs; mechanisms; silhouette test | authorized REPRODUCE |
| Unrelated projects share one look | fixture contamination / house style | compare with your earlier outputs; remove recipes from context | one company's product family |
| Rationale ("editorial grid") not visible in the render | design theater (rationale never implemented) | verify each claimed mechanism in the screenshot; drop unverified claims | — (always a defect) |
| Airy minimal layout for an audience used to dense pages | Western-minimal default | look at references from the target market; ask about density | intentional differentiation |
| Palette fine in light, muddy/low-contrast in dark | hex-picked palette without tonal structure | tonal ramps + contrast check in both themes | single-theme product |

## 7. After rendering

Compare the screenshot with the direction you wrote: is each principle visible? If a reviewer
couldn't name your one bold element, it isn't there yet. Then show the user. They judge
whether it feels right; you report what was implemented and verified.
