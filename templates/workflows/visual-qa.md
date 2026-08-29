# Visual QA

Use the browser tools already available in the host. Playwright MCP is
preferred; Chrome DevTools is optional.

## Loop

1. Open the target route and wait for the rendered page to settle.
2. Inspect desktop, tablet, and mobile at the viewports in config.json.
3. Compare the result against Project DNA, the Design Fingerprint, and the
   supplied prompt, screenshot, Figma context, or web capture.
4. Evaluate all axes:
   - identity;
   - product specificity;
   - concept coherence;
   - generic-pattern debt;
   - composition and hierarchy;
   - typography;
   - color and contrast;
   - spacing and density;
   - responsive behavior;
   - interaction states;
   - accessibility.
5. Record the three highest-impact findings.
6. Fix one high-impact mismatch, reload, and inspect again.
7. Stop after the configured iteration limit or when the result is coherent.

## Distinctiveness audit

- Hide the logo and product name. The interface should still reflect this
  product's objects, workflow, hierarchy, or content behavior.
- Identify at least three visible decisions that support the selected thesis.
- Account for generic cards, pills, gradients, glass panels, oversized
  headings, and decorative motion. Each needs a recorded job.
- Confirm that one product-linked signature move is clear without being
  repeated everywhere.
- Keep familiar controls understandable and accessible.

Failure on product specificity or concept coherence is a direction problem.
Return to the Creative Direction Gate instead of adding decorative polish.

Do not infer visual quality from source code alone. Finish with no horizontal
overflow, intentional text wrapping, usable focus and hit targets, coherent
loading/empty/error states, and reduced-motion behavior.
