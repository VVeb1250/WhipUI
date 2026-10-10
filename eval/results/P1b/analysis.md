# Pilot P1b analysis (2026-10-10T16:37:06.883Z)

## Cost ledger (median per run)

| arm | runs | wall s | input+cache tokens | output tokens | $ | turns | render errors |
|---|---|---|---|---|---|---|---|
| A | 3 | 177 | 306392 | 4864 | 0.15405030000000003 | 7 | 0 |
| C | 3 | 213 | 590865 | 7349 | 0.23847620000000003 | 11 | 0 |
| T | 3 | 66 | 232541 | 4816 | 0.2703434 | 7 | 0 |
| Cv2 | 3 | 198 | 534010 | 6138 | 0.2400576 | 11 | 0 |
C/A cost per brief: B7 1.55×, B8 1.66×, B1 0.86× · median 1.55× · total 1.26×
C/A tokens per brief: B7 1.95×, B8 2.19×, B1 0.67× · median 1.95× · total 1.58×
T/A cost per brief: B7 1.70×, B8 1.76×, B1 1.13× · median 1.70× · total 1.45×
T/A tokens per brief: B7 0.73×, B8 1.18×, B1 0.64× · median 0.73× · total 0.83×
Cv2/A cost per brief: B7 1.44×, B8 1.56×, B1 1.32× · median 1.44× · total 1.41×
Cv2/A tokens per brief: B7 1.28×, B8 2.00×, B1 1.72× · median 1.72× · total 1.65×

## Preference (owner, blinded) — 9 judgments, 3 retests

| contrast | first wins | second wins | ties/both-bad | win rate (first) | 95% Wilson | exact p | brief-clustered 95% |
|---|---|---|---|---|---|---|---|
| Cv2-A | 3 (Cv2) | 0 (A) | 0 | 100% | 44–100% | 0.250 | 100–100% |
| Cv2-T | 2 (Cv2) | 0 (T) | 1 | 100% | 34–100% | 0.500 | 100–100% |
| T-A | 1 (T) | 2 (A) | 0 | 33% | 6–79% | 1.000 | 0–100% |

Bradley–Terry log-strength (descriptive): Cv2 1.72 · A -0.61 · T -1.11

Retest consistency: 2/3 — LOW: treat close contrasts as indistinguishable from noise

## Pre-registered decisions
- PROMISING (≥75%): replicate with new briefs/raters before claiming superiority

Power note: with ~8 decisive judgments per contrast only near-unanimous preferences are detectable; ~20–30 pooled judgments detect a true 80% preference with ≈0.8 power and 70% with only ≈0.4–0.6. A null result is not equivalence.
