# Worked execution examples (hypothetical, not completed runs)

## 1. Portfolio: taste uncertain, owner wants co-design

**Request:** "เว็บ portfolio ของฉันอยากให้ฟีลเกมญี่ปุ่น แต่ยังเป็น portfolio ของวิศวกรที่ HR ใช้งานได้ ช่วยหาเรฟและคุยก่อน"

**WhipDesign** finds the actual problem: balance recognizable technical work with expressive, personal presentation. Curate different references for story hierarchy, game selection feedback, typography/art treatment (do not treat a game screenshot as a whole-site target). Show 2–4 contrastive visuals if tools allow and ask one comparative question. Record liked *interactions* separately from liked *illustration style*, label owner-approval sources, reject unrelated motifs. Produce packet with: credible project descriptions first; clear contact/download; game-like hover/focus reactions in selected gallery; creative latitude for layout and type; a11y/mobile constraints. **No code until requested.**

**WhipUI**, once implementation requested, inspects existing Astro/React repo, uses actual project content, crafts components for gallery/story/contact, renders wide and narrow viewports, checks keyboard/hover/touch equivalents and motion playback. If the real screenshots reveal clutter, correct local composition rather than rewriting the owner's intent to "minimal SaaS." Return screenshots and unresolved aesthetic question to WhipDesign only if significant.

**Failure to catch:** User liked a game's selection animation, AI turned the whole website into a generic futuristic game HUD. Preference evidence was generalized beyond scope.

## 2. One-shot data product: known intent, no interview

**Request:** "/goal Build a dense incident triage UI for operators, target iPad and desktop. Reuse current brand. Show latest incident, severity, owner and response action."

**WhipUI** directly takes `CREATE` with product/dashboard mode. Inspect repo and tokens; synthesize scan hierarchy. Use real or clearly labelled sample incidents, functional incident selection/filters, loading/empty/error. Do not route to taste discovery unless core brand truly missing and material. Run build; inspect 1024 and 1440 screens and narrow layout where supported, keyboard/selection, real overflow. Return code and evidence, not a sketch-only answer.

**Failure to catch:** Long bright marketing hero makes high-severity incident harder to find despite being visually impressive.

## 3. Pixel match: supplied target, no style injection

**Request:** "นี่คือ screenshot และหน้าของฉัน; เขียนให้ตรง pixel/flow ที่สุด ห้ามเปลี่ยน brand"

**WhipUI** picks `MATCH`. Measure reference at viewport, use source/assets legally available, compare exact content and image crop, inspect fonts/spacing. Does not apply a new dark-mode editorial treatment or replace CTA copy. Surface missing fonts/assets as gap, not fabricated substitutes. Render comparison. Do not use WhipDesign unless constraints conflict and owner choice is necessary.

**Failure to catch:** AI decided reference looked "AI slop" and restyled it to an "improved" house style.

## 4. User feedback as red circles

**Request:** "วงแดงตรง title นี้อ่านยาก อีกจุดระยะขอบมันแน่นไป ที่อื่นโอเคแล้ว"

**WhipUI** performs `POLISH` local repair. Records exact annotated regions, predicts likely cause (contrast/line break, row layout), compares screenshot baseline and after at same viewport. It leaves approved palette and other components unchanged. It doesn't ask a full design questionnaire or open a new reference research campaign.

**Failure to catch:** AI rewritten global CSS tokens made unrelated pages look different.

## 5. Revision conflict and real owner authority

**State before:** D-004 approved "blue accent applies to navigation". Agent sees a trend report recommending orange.

**WhipUI** cannot silently change to orange. It either implements blue or seeks direction change via WhipDesign. If owner explicitly chooses orange, the new approval records provenance, supersedes D-004 or amends the pinned constraint. `tests/check_state.py --previous ...` detects old approvals disappearing without a replacement.

**Failure to catch:** Internal design suggestion becomes an approved specification because AI wrote it into a template file without an owner decision.

## 6. Deliberate loss case for Whip

For a simple `border-radius` bug, the strong model fixes the one CSS value in fewer tokens and with no quality loss. If WhipDesign launches reference interviews or WhipUI loads 6 overlay files, **Whip loses**. This is expected; routing must learn to stay out of the way.
