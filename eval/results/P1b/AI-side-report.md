# P1b: AI-side results (SEALED until the owner has judged P1b)

Harness after review fixes: matched prompts, sandboxes outside the repo, clean child env (fresh session ids
confirmed), plugin copy without eval/, comment-free B7 seed with 6 real planted defects, transcripts saved.
Model sonnet, one seed, Claude Code 2.1.295.

## Cost (paired per brief; analyze.mjs)
C/A cost: B7 1.55×, B8 1.66×, B1 0.86× · **median 1.55×** · total 1.26×.
C/A tokens: B7 1.95×, B8 2.19×, B1 0.67× · **median 1.95×** · total 1.58×.
**This exceeds the pre-registered 1.5× cost/token threshold.** Unless the owner's blind judgments show a large
preference gain (≥75%), the pre-registered decision is shrink/redirect overhead.

## Objective (score-objective.mjs; evidence in runs/*/objective/)
| Run | measured errors / warns | B7 planted remaining | B8 motion flags | WhipUI scripts run | screenshots opened |
|---|---|---|---|---|---|
| B1 A | 0 / 2 | | | none (own Playwright) | 1 |
| B1 C | 0 / 2 | | | render-check | 2 |
| B7 A | 0 / 3 | #6 KPI value spills | | none (own Playwright) | 0 |
| B7 C | 0 / 0 | none | | render-check, interact | **0** |
| B8 A | 0 / 0 | | none | none (own Playwright) | 0 |
| B8 C | 0 / 0 | | none | render-check, interact, motion-probe | **0** |

## Findings
1. Both arms fixed planted defects 1–5. Only C found the KPI spill (#6), the same as in P1. The baseline is strong on repair.
2. WhipUI's verification tools were used in every C run, but **C did not open its screenshots in B7/B8**, despite SKILL.md §5
   ("Open the screenshots"). It relied on 0-error reports. That is a compliance gap in the skill text, not in the tools.
3. The extra cost is concentrated where C runs extra verification (B7, B8). In B1 C was cheaper than A.
4. Measured technical quality is equal on B1 and B8. Any difference there is taste: the owner decides.

---
# Addendum: tools-only ablation (2026-10-11, SEALED until judging-ablation.html is judged)

New arms on the same briefs and harness: **T** = baseline + a 10-line tools card (adapters/TOOLS.snippet.md), no skill
text; **Cv2** = the current skill (after the "open screenshots" edit). Baseline A reused from above.

## Tokens (fairer than $ here) and cost
| Arm vs A | tokens median (per brief) | tokens total | $ median | note |
|---|---|---|---|---|
| T | **0.73×** (B7 0.73, B8 1.18, B1 0.64) | **0.83×** | 1.70× | $ inflated by cache writes: appended system text breaks the shared cached prefix (T writes ~50k cache tokens/run vs A ~20k). A harness artifact; a stable snippet would be cached across sessions in real use |
| Cv2 | 1.72× | 1.65× | 1.44× | |
| C (old) | 1.95× | 1.58× | 1.55× | |

## Objective
| Brief | A | T (tools only) | Cv2 (full skill) |
|---|---|---|---|
| B1 | 0 err / 2 warn | 0 / **0** | 0 / 10 (all heuristic text-spill on large display headings, likely intentional tight leading) |
| B7 planted 6 | 5/6 (missed KPI spill) | **6/6**, 2 heuristic focus warns | **6/6**, 0 warns |
| B8 motion probe | clean | clean | clean |
| Opened screenshots (B1/B7/B8) | 1/0/0 | 2/0/0 | 2/1/1 |

## Reading (builder's inference, to be tested against the owner's judgments)
- The measurable objective gain over baseline (catching what the model can't see) came with the **tools alone**, at **lower** token use than baseline.
- The full skill text costs ~1.7× tokens and added no further objective gain on these briefs. Its only possible justification is a taste or collaboration gain, which only the owner's blind judgments (Cv2-T) and multi-round tests can show.
- The "open screenshots" edit raised compliance (0/0 → 1/1 on B7/B8) but not fully.
- Pre-registered rule (shrink/redirect if cost ≥1.5× without ≥75% preference) now has a concrete alternative: T.
