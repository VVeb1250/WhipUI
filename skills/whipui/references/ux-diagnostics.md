# UX diagnostics

Load for navigation, forms, tables/lists, onboarding, loading/empty/error states, or when
you are about to justify a decision with a "UX law". Read only the rows that match.
Every pattern fires only when its **symptom and check** both hold, and each has a
**not when**: these are diagnoses, not house rules to apply everywhere.

## Patterns: symptom → check → intervention → not when

| # | Symptom | Check | Intervention | Not when |
|---|---|---|---|---|
| 1 | Desktop nav ignored; users go to search | Is nav visible ≥1024 px? How many top items? Trigger labelled? | Show top 4–5 items; rest in a labelled "More"/combined nav (hidden nav hurt discoverability most on desktop) | Immersive/game UI, single-task tools |
| 2 | Key specs/reviews missed on detail pages | Is decision content behind a non-default horizontal tab? | Expanded sections on desktop; collapsible sections on long mobile pages | Tabs switch *parallel alternatives* (code language, chart vs table) |
| 3 | Form errors frustrate | When does validation fire? Does the error clear once fixed? Placeholder used as label? | Never validate while typing. Either on blur with live clearing (e-commerce testing) or on submit with a focused error summary linking to fields (GOV.UK). Persistent visible labels | Fixed-length fields (card, postcode) can validate at expected length; character counters can be live |
| 4 | "Form feels long" | Justify each field (framing §3) | Delete/defer fields; eligibility first; one thing per page for infrequent or diverse users | Expert, repeated-use internal tools: group instead |
| 5 | Pressure to "cut clicks/steps" | Per-step work and label scent | Improve labels; reduce work per step; remove pure confirmation steps | — |
| 6 | "No results" flashes before data | Throttle network; watch the state sequence | Separate loading / empty-first-use / empty-for-filter / error / no-permission, each with status + next action | Never acceptable |
| 7 | Wrong loading feedback | Expected wait | <1 s: nothing; 2–10 s: skeleton (page) or spinner (module); >10 s: progress with estimate | Skeleton used to hide a performance problem; shimmer must respect reduced motion |
| 8 | Onboarding carousel proposed | Does the app need data to start? Is a feature genuinely novel? | Contextual tips + empty-state cues (swipe-through tutorials didn't improve task performance) | Required setup data; truly unfamiliar core interaction |
| 9 | Content not found in IA | Overlapping or generic categories? Deep paths? | Distinct labels; group flat lists; shortcuts, breadcrumbs, "most used" | Don't add hierarchy levels just to shorten lists |
| 10 | Key content ignored below the fold | What's in the first viewport at 390×844 and 1440×900? | Put the main point in the first screen; leave content visibly cut at the fold | Long-form reading or comparison: don't cram |
| 11 | Text walls not scanned | Headings informative? Lists? Front-loaded sentences? | Layer-cake structure; descriptive links (the F-pattern is a failure mode, not a layout goal) | Committed long-form readers |
| 12 | Icon-only controls misread | Accessible name? Non-standard glyph? | Visible text label for non-standard icons | Universal icons (search, close, play): AI reviewers over-flag these |
| 13 | "Why can't I submit?" | Disabled primary button with no reason? | Keep enabled, validate on submit; prevent double-submit (client + server) | Research for this product shows disabling helps |
| 14 | Data table hard to use | Which jobs matter: find, compare, view/edit row, bulk act? | Sticky header/first column, human-readable ID first, visible active filters, select-all + batch actions | Small read-only tables: avoid control clutter |
| 15 | Paging problems | Footer reachable? Scroll restored on back? | "Load more" + restore position (`history.pushState`) | Feeds with no footer tasks; numbered pages users must cite |
| 16 | Taps missed / risky actions at edges | Targets ≥24×24 CSS px or spaced (WCAG 2.5.8)? Destructive actions in corners? | Enlarge; move risky actions away; don't assume a right-thumb grip | Inline text links are exempt |
| 17 | Sticky header hides the focused element | Tab through; does focus land under a fixed bar (WCAG 2.4.11)? | `scroll-padding-top`, shorter sticky bar | — |
| 18 | ARIA-heavy custom widgets | Native element available? | Native first; ARIA only for gaps; follow APG patterns and test with AT for combobox/tree | No native equivalent |
| 19 | Beautiful screenshot, users struggle | Was a task tested, or only looked at? | Separate taste review from task testing; aesthetics can mask usability problems | — |
| 20 | Destructive action without recovery | Undo or confirmation proportional to cost? | Undo for reversible bulk actions; typed confirmation only for irreversible, high-cost ones | Low-cost, easily recreated items |

## "Laws" models misapply: use these to stop bad justifications

- **Three-click rule:** click count didn't predict success or satisfaction in large observational data. Scent and per-step effort matter.
- **Miller's 7±2 for menus:** a recall limit; menus are recognition. Working memory is closer to ~4 chunks and still isn't a menu rule. Group and order instead of truncating.
- **Choice overload:** meta-analytic mean effect ≈ 0, but it does appear with complex sets, hard decisions, **uncertain preferences** and effort-minimizing goals. Keep *taste* options to 2–3. Don't cut product catalogues on this basis.
- **Hick's law:** describes choice reaction time for practiced, equally likely options. Reading an unfamiliar menu is closer to visual search (lead inference; no primary source).
- **F-pattern:** what users fall into on unformatted text. Design to avoid it.
- **Fitts on touch:** screen edges and corners are *harder* to hit on touch, the opposite of the desktop "infinite edge". Grips vary and shift.
- **Validation timing:** authoritative sources disagree (blur vs submit). State the trade-off for this audience.

## Writing a UX finding

`[measured|advisory] <symptom> at <where> — evidence: <screenshot/selector/metric> — likely cause — proposed fix — confidence`.
Rank findings by user impact, not by count. Don't repeat one issue once per element.
