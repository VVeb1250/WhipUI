# Changelog

## 2.0.0 — 2026-10-11

Clean-room rewrite. Nothing from 1.x (router, WhipDesign, provider routing, creative-direction gate) is carried over; see `SYNTHESIS.md` for why.

- One entry skill `whipui` (`/whipui`, `/whipui:whipui` as a plugin, `$whipui` in Codex) + 10 on-demand modules.
- Ask / scope-down / proceed rule by uncertainty × cost of a wrong guess.
- `.whipui/state.json`: proposed / approved / rejected / superseded decisions; only the user approves.
- Scripts: render-check (viewports, light/dark, Thai text stress, axe + checks axe misses), motion-probe (real-time health + deterministic filmstrip + reduced motion), interact, ref-capture, review-page (offline options/annotation → tickets), detect-project, state, doctor. Every script prints a `WHIPUI-EVIDENCE` line for the built-in `/goal` evaluator.
- First real-site run fixed six false-positive classes (see `examples/real-site-portfolio/`).
- Evidence so far: owner blind judgments on a small pilot (Sonnet, 3 briefs) favour the full skill over baseline 3–0; not a superiority claim. Cost ≈1.4–1.7× baseline tokens.

Not yet: tested on Codex/Cursor/Gemini hosts, replication on Opus 5.5 / GPT-6, npm package.
