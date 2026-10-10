<!-- WhipUI compact index: an always-on alternative/complement to the skill.
     Paste into AGENTS.md / CLAUDE.md of a frontend project. ~400 tokens every turn.
     Exists because an always-on index beat on-demand skills in one vendor eval (Vercel, 2026);
     WhipUI's pilot tests it as its own arm. Replace <skill> with the installed skill path. -->
## UI work (WhipUI)
- For UI design/implementation, follow `<skill>/SKILL.md` (invoke /whipui or $whipui). User instructions and approved decisions win.
- Before UI work: `node <skill>/scripts/state.mjs show` (if `.whipui/` exists) and `node <skill>/scripts/detect-project.mjs`. Extend existing tokens/components; no new libraries without asking.
- Ask only when a wrong guess is costly *and* preference is uncertain; then show 2–3 rendered options (`review-page.mjs build --mode options`). Otherwise proceed and log the assumption.
- Never treat a proposal, reference or inferred preference as approved. Record approvals with the user's words (`state.mjs approve D# --evidence "…"`). Don't change approved design without asking.
- After render-affecting edits: `node <skill>/scripts/render-check.mjs <url>`; open the screenshots; fix measured errors. Motion: `motion-probe.mjs <url> --trigger <sel>`. Report verified / assumed / not tested. No aesthetic scores.
