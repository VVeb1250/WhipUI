# Creative Direction Gate

Use this workflow before UI implementation when the request is prompt-led and
has no usable screenshot, Figma, or URL direction. Also use it when the user
explicitly asks for distinctive, unique, or alternative design directions.

The goal is product-specific design, not novelty for its own sake. Keep common
controls familiar and put the distinctive idea into composition, identity,
content treatment, or one high-signal interaction.

## 1. Establish product truth

Read Project DNA, the current Design Fingerprint, and the existing repository.
Write a compact product truth that identifies:

- the primary job and repeated workflow;
- the audience and what they must scan first;
- the product's characteristic objects, data, language, or behavior;
- the practical constraints: design system, framework, accessibility,
  performance, and responsive use.

Do not ask the user for colors or style labels when the repository and product
context support a reasonable assumption. Record assumptions and continue.

## 2. Generate three structurally distinct directions

Use UI/UX Pro Max or another installed design-intelligence skill for suitable
type, palette, pattern, and UX knowledge. Treat that output as ingredients, not
the final concept.

Generate at least three compact candidates. Each candidate must include:

- a one-sentence thesis tied to the product truth;
- a tension pair, such as `clinical × humane` or `archival × immediate`;
- a layout grammar;
- a typographic voice and color logic;
- exactly one product-linked signature move;
- an anti-direction stating what it deliberately avoids.

The candidates must differ in structure, not only color, font, radius, or
decoration. Do not reuse the same layout grammar or signature move across all
three. Useful lenses include the product's central object, repeated workflow,
domain material, data shape, editorial hierarchy, spatial model, or time.

## 3. Select and lock

Unless the user asks to compare directions, choose the strongest candidate and
continue autonomously. Select for product fit, distinctiveness, usability,
accessibility, feasibility, and compatibility with the existing repository.

Update `.whipui/design-fingerprint.json` with:

- all candidate summaries and why the alternatives were rejected;
- product truth, tension, thesis, and selected direction;
- signature move, its product reason, location, and repetition limit;
- layout grammar, type voice, color, imagery, motion, and responsive logic;
- at least three visible product-specific proofs;
- anti-direction and the result of the logo-and-copy swap test.

Set `creativeDirection.gate.status` to `passed` only when the thesis, signature
move, product reason, responsive promise, and three product-specific proofs are
concrete. If hiding the logo and product name would leave an interchangeable
SaaS template, revise the direction before writing UI code.

## 4. Protect the direction during implementation

- Build the real product workflow in the first viewport, not generic marketing
  filler unless a marketing page was requested.
- Reuse repository components and tokens where they fit the selected thesis.
- Use the signature move deliberately and no more than its repetition limit.
- Do not compensate for a weak concept with more gradients, glass, cards,
  pills, shadows, texture, or motion.
- If implementation constraints invalidate the thesis, return to this gate and
  select or form a coherent replacement before polishing.
