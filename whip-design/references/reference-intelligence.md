# Reference intelligence: retrieval, selection, translation

Load when the owner needs inspiration, a stronger reference set, category conventions, or a visual comparison. A reference is **evidence for discussion**, not a license to copy and not an approved design.

## 1. Choose a reference question before searching

Define what you want to learn, rather than "find beautiful sites":

- **Purpose / structure:** How do real products let users complete the same job? Look at flows and task order.
- **Visual language:** How do typography, image treatment, scale, rhythm and palette express an identity?
- **Interaction:** What feedback, state transitions, gestures or motion grammar make behavior legible?
- **Platform patterns:** What conventions should we retain on iOS, Android, web or game-like interfaces?
- **Implementation:** What composition/components make a design feasible and maintainable?

Use queries combining `domain + user task + target device + pattern`, not only an adjective. Search vertical sources if available (Mobbin/Appllama for app flows; SiteInspire/Godly/Awwwards for expressive web; official products/Design Systems for operational patterns). Availability and access may change; never invent results or claim access to a paid catalog.

## 2. Search adaptively

No search for a tiny unambiguous tweak or an exact fidelity target with all evidence supplied. For a new expressive product, seek a **small contrasting shortlist**, typically 2–4 distinct directions, then deepen only the branch useful to the owner. For unfamiliar domain/critical UX, spend extra retrieval on actual workflows, not only thumbnails. On access failure, use owner-provided screenshots, existing product, or clearly labeled thought experiments.

A good trio separates dimensions:

A: strong editorial structure, restrained imagery.
B: expressive spatial/art direction, predictable flows.
C: motion-led identity, minimal static complexity.

This is *not* a fixed set of themes. Contrast dimensions must emerge from the brief. Distinguish **category fit** from **aesthetic preference**.

## 3. Inspect and annotate each candidate

For every real reference capture:

```
Reference name + URL + source date (when available)
Type: flow | visual | motion | platform | implementation
Observed mechanism: explicit layout/interaction/content fact
Transferable principle: why it could help THIS audience/job
Non-transferable: distinctive logos/art/assets, inappropriate flow/density
Trade-off: likely UX or implementation downside
Hypothesis: untested claim to try
Provenance: source link and known asset rights/unknown rights
```

Never say "users love this" because a product shipped it, has high revenue, or won an award. That evidence proves at most commercial exposure/real deployment, not universal usability or causal aesthetic superiority.

## 4. Use the reference to elicit taste

Ask for *parts*: "Is it the oversized type, the cropped imagery, or the reduced navigation you like?" Contrast the same structural problem under different aesthetics when possible. Record liked and disliked traits separately. Add `scope` (this project/page), `confidence`, and `origin` (quote/observed response). Let the owner reject every option; find another axis.

If the user sends image annotations (circle/arrow/text), use them as high-signal **local constraints**. Don't generalize a circled button into global branding without confirmation.

## 5. Translate before build

Write a **reference translation card**, not CSS fixtures:

```
Intent: calm, technical trust for expert users
Borrow: small type + rigorous alignment + information density
Avoid: competitor logo, illustrated hero, exact columns, fragile microcopy
Transform: use our real command-line examples; accent only on selected active state
Uncertain: does the user want the low-contrast monochrome treatment?
```

For fidelity tasks (`MATCH`), document which details must be reproduced. Otherwise encourage recombination of mechanisms across references, not an averaged visual clone. Watch design fixation: don't preload a dozen near-identical samples and then reward similarity.

## 6. Rights and source integrity

Use public content to observe patterns where permitted. Don't bypass authentication/paywalls. Source screenshots are reference material; do not take brand marks, photos, UI illustrations, or licensed animation files into a new product without documented permission. Mark unknown licenses. User-provided content may still have limitations.

## Failure tests

- Can the owner say what they like **about** a reference, rather than choosing blindly?
- Did the set cover credible alternatives or only more of the same?
- Can the implementation differ substantially in pixels while preserving the extracted mechanism?
- Is each asserted observation actually visible in source evidence?
