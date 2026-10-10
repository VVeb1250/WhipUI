# P1b + tools-only ablation: owner blind judgments (2026-10-11)

Judged on the first build of `judging-ablation.html` (12 pairs: 9 main + 3 side-swapped retests). Contrasts were derived from
output IDs via the blinding key (the page was rebuilt afterwards, which overwrote its pair map; IDs are unaffected).
Raw data: `judgments-ablation.csv`. Analysis: `node eval/analyze.mjs --pilot P1b --judgments results/P1b/judgments-ablation.csv`.

| Contrast | Result (main judgments) | Briefs |
|---|---|---|
| **Cv2 (full skill) vs A (baseline)** | **3–0** | B1 strong, B7 strong, B8 slight |
| **Cv2 vs T (tools only)** | **2–0, 1 tie** | B1 strong win, B8 slight win, B7 tie |
| T vs A | 1–2 | T won B7 (strong); A won B1 (slight), B8 (strong) |

Bradley–Terry (descriptive): Cv2 1.72 · A −0.61 · T −1.11. Full skill decisive record over the other arms: 5–0 (exact sign test p = 0.063).
Retest consistency 2/3 (one slight win became a tie) = LOW by the pre-registered rule, so close contrasts count as noise.

## Interpretation (facts vs inference)
- **Fact:** the full skill was never judged worse than baseline or tools-only in 6 decisive-or-tied comparisons. Pre-registered status: **PROMISING (≥75%) → replicate before claiming superiority.** Non-inferiority (D10): passed.
- **Fact:** the tools card alone lost to baseline on the creative and motion briefs and won only the repair brief.
- **Inference (builder):** tools explain the repair gains (all KPI-fixing arms beat A on B7). The skill text matters for creative and taste-level work (B1: Cv2 beat both A and T strongly). This **reverses** the builder's earlier sealed reading that "prose adds nothing beyond tools". That reading was based on objective metrics only, which can't see taste.
- **Consistent signal across pilots:** on B1 (the cleanest blind brief) the full skill beat baseline in both P1 and P1b, with different runs.

## Bias and limits
- B7/B8 aren't fully blind: earlier the owner was told P1's C fixed the KPI (B7) and used fades under reduced motion (B8). In B7 the KPI fix is visible and both fixing arms won, so that brief partly measures a known objective fix.
- n = 3 briefs, one seed, one rater, Sonnet only, builder-written briefs. Effect sizes are unreliable; only "very large or none" is detectable.
- Cost of the full skill vs baseline: tokens median 1.72× (total 1.65×), dollars median 1.44×. Above the 1.5× token line, but the pre-registered cost rule applies only without a ≥75% preference gain, which was met here.
