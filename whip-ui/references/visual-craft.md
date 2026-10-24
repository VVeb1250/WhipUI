# Visual craft: concrete design decisions and failure diagnostics

Use when designing, polishing or reviewing visible composition. Don't apply this as a rigid style template: adapt to domain, brand, density, device, and explicit preferences.

## Hierarchy first

Start with real content. Write a priority order for user attention: e.g. **current issue → impact → next action → context**. Put hierarchy in position, scale, contrast, grouping and whitespace, not just larger headings. For each screen, ask which single element the user should notice first. Several equal-weight CTAs are competing, not helping.

**Failure:** user has to read all cards to find a primary job. **Fix:** make task and state legible in structure, reduce secondary weight; only then adjust color.

## Typography as an information system

Choose type based on voice **and** language script coverage. Test real strings including Thai/Japanese when applicable, long labels, numbers, technical code, and different line breaks. Display face may be distinctive; body face must remain readable in actual density. Verify font loading and fallbacks; avoid invisible text if web font fails. Give numerical data stable alignment and units. Establish a small intentional hierarchy (display, headings, body, metadata, captions), adjusting line-height and measure by context, not blindly by a scale.

**Failure:** typographic treatment is stylish in English placeholder copy but clips real localized product names. **Fix:** preview real content, wider/narrower variations and responsive typography.

## Composition

Use grouping, edge alignment, stable rhythm, negative space, controlled asymmetry and proportional contrast. Treat content amount as a constraint. Mobile composition is a separate editorial problem, not desktop scaled down. Dense operational screens need scan paths and reliable repeated actions; expressive marketing can afford larger deliberate pacing. If the brief calls for complex storytelling, don't flatten everything into the same card container. If repeating a card is genuinely best for comparisons, use it.

**Failure:** every section gets an identical rounded dark card, card-in-card and arbitrary gradient. **Fix:** ask which group genuinely needs a surface boundary; use spacing, type or divider when surfaces don't communicate a new state.

## Intentional irregularity, not random imperfection

Controlled asymmetry, uneven editorial rhythm, a handmade texture or an unexpected focal crop are **optional expressive tools**, never quality requirements. Use one only if its cause is legible in product context (material, content, interaction, brand, or hierarchy). Preserve reading order, accessibility, operational scan paths and approved structure. If an irregularity can be removed without losing meaning, it is not needed. Do not trade function for novelty or turn anti-slop advice into another fixed visual style.

## Color and tone

Decide semantic roles before hexes: canvas, raised surfaces, body text, muted text, action, accent, success, warning, error, selection, focus. Accent hierarchy should not imply all items are equally actionable. Test contrast for body/text and visible focus; color alone must not convey state. Dark mode requires independent contrast work, not brightness inversion. Preserve pinned palettes even if they are unusual; solve legibility locally.

## Imagery and iconography

Ask what each asset proves or helps recognize. Use authentic product screenshots, explanatory diagrams, or purpose-made art where possible. Ensure resolution, crop and focal point at viewport sizes; do not distort screenshots or crop off critical action. Icon style must be coherent but icon-only controls still need discernible labels. Avoid fake awards, customer logos, product metrics, user testimonials or fabricated case studies.

## Details that change perceived craft

- Precise alignment of text baselines, controls, images and section edges.
- State-specific visual feedback that supports real actions: hover/focus/active/pressed/selected/loading/error/success/empty/disabled.
- Controlled border, shadow and radii roles, not random values every component.
- Real responsive composition and navigation, avoiding collisions and strange negative space.
- Motion that communicates transition, not repeated self-congratulatory fades.
- Coherent copy with concrete CTA verbs and empty/error recovery.

## A two-minute red-team

When doing exploratory `CREATE`/`REDESIGN`, complete the concept-level critique in `art-direction.md` *before* this local craft check. Do not run an extra full-browser cycle just to satisfy prose; reuse the first render. `MATCH`, `REPAIR`, `EXTEND` and approved design work require fidelity, not a new creative fork.

Compare against: (1) the brief; (2) one credible strong product/reference in the same category; (3) the before screenshot if polishing. Identify **the biggest 1–3 defects**, each linked to the rendered evidence, before touching minor details. A model preference for a font is not a defect unless it compromises identity, legibility or an approved choice.
