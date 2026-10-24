# Verification budget: script-first, risk-led

This is the single authority for choosing how much *browser* verification to perform. Technical build/test criteria remain in engineering.md. Do not interpret all verification examples in other files as an additive checklist.

## First decide whether browsing changes the outcome
- Small code-only or non-visual change: static checks, plus the smallest relevant assertion; no browser by default.
- Local REPAIR/POLISH: focused screenshot at impacted viewport/selector with targeted regression checks.
- CREATE/REDESIGN: representative desktop and mobile screenshot, one critical user flow, and a human/AI visual critique of the actual screenshot. Do not certify art direction from script checks.
- MATCH: same viewport/content as target; visual comparison with supplied reference.
- MOTION: play/interruption/reduced-motion evidence; still screenshots alone do not prove it.
- AUDIT: gather only evidence relevant to user question; do not mutate code.

## Default execution
From the target project directory, with a locally configured Playwright package and browser:
```sh
node /path/to/whip-ui/scripts/visual-qa.mjs --url http://127.0.0.1:5173 --profile standard
node /path/to/whip-ui/scripts/visual-qa.mjs --url http://127.0.0.1:5173 --profile focused --selector '.hero' --viewport mobile
```
Output: `.whip/qa/report.json`, screenshots and concise console summary. Missing Playwright/browser is a limitation, not an authorization to install it. Script only accepts loopback URLs; do not use it for external reference research.

Use scripted checks first for known flows; open an interactive agent browser only when scripted evidence is inadequate, behavior is unknown, or a critical defect requires diagnosis. Minimize returned DOM/snapshot text and do not repeatedly crawl unchanged pages. Comparison via `--previous` means byte-identical screenshot only: changed pixels are not automatically defects, and unchanged pixels do not prove correctness.

## Stop and escalate
One initial capture and one changed-area confirmation are the normal *planning budget*, not a safety or quality hard cap. Rerun only affected viewports and flows after local edits; expand to whole-page regression if shared tokens/layout/route state changed. Critical broken flows, responsive blockers or missing evidence require escalation or an explicit unverified report. Do not silently suppress failures to meet a token budget.

Separate verdicts: technical pass / visual observations / subjective owner preference / unverified. Track screenshot count, browser calls, tokens, wall-time and missed defects when benchmarking; never claim reduced cost without a paired run.
