# Design state (`.whipui/state.json`)

Load for the schema and examples. The state exists to keep decisions continuous across turns
and sessions: what the user asked for, what you proposed, what they approved or rejected,
and what replaced what. Commit `state.json`; `runs/` and `evidence/` are git-ignored.

## Schema (whipui-state/1)

```jsonc
{
  "brief": { "goal": "", "audience": "", "platform": "", "task_family": "", "mode": "",
             "constraints": [], "criteria": [{ "text": "", "tier": "machine|advisory|human" }] },
  "decisions": [{ "id": "D1", "what": "", "why": "", "scope": "global|page:X|component:Y",
                  "source": "user|agent|reference", "status": "proposed|approved|rejected|superseded",
                  "by": "user|agent", "evidence": "user's words / turn", "history": [...],
                  "superseded_by": "D4" }],
  "references": [{ "id": "R1", "url": "", "source": "", "role": "visual|flow|motion|impl|pattern",
                   "why": "", "rights": "", "borrow": [], "avoid": [], "transform": [],
                   "liked": [], "disliked": [], "status": "candidate|shown|liked|rejected|adopted" }],
  "preferences": [{ "id": "P1", "axis": "density", "polarity": "sparse", "evidence": "",
                    "confidence": "low|med|high", "scope": "project|page:X" }],
  "assumptions": [{ "id": "S1", "text": "", "status": "open|confirmed|rejected" }],
  "questions": [{ "id": "Q1", "text": "", "status": "open|resolved", "answer": "" }],
  "artifacts": [{ "id": "A1", "path": "", "kind": "render|motion|design|baseline|review|code", "note": "" }],
  "next": [], "log": []
}
```

Invariants checked by `state.mjs validate` (and refused at write time):
- `approved` requires `by: user` and evidence. The script can't verify who typed it, so quote the user.
- `rejected` requires evidence.
- Superseding an approved decision requires the user's evidence.
- A user-stated requirement (`--source user`) is recorded as approved, with their words.

What does **not** belong here: pixel-level "fingerprints" you invented, generic style rules,
personal facts about the user. Visual values appear only as decisions with a status.

## Worked example

```bash
S="node <skill>/scripts/state.mjs"
$S init --goal "Landing page for indie rhythm game 'Pulse Ward'"
$S brief --set task_family=CREATE_TO_SHIP mode=co-design audience="rhythm-game players on mobile"
$S brief --criterion "Trailer + wishlist CTA in first viewport at 390x844" --tier machine
$S decide --source user --what "Must link to Steam wishlist" --evidence "user: 'main goal is wishlists'"
$S decide --what "Direction A 'Night set': dark, one magenta accent, beat-grid motif" --why "game art + refs R1,R3"
$S decide --what "Direction B 'Flyer': light, risograph texture, loud type"
# user picks A from the review page:
$S approve D2 --evidence "feedback.json: chose Option 2 (=A), 'less neon on body text'"
$S reject D3 --evidence "user: flyer feels like a music festival, not a game"
$S pref add --axis tone --polarity "dark but readable body text" --evidence "mark m3" --confidence med
$S artifact add --path .whipui/runs/render-20261010-1530 --kind baseline --note "approved hero v2"
$S next "Build features section" "Probe hero entrance motion in both modes"
$S show          # agent summary
$S show --md     # Markdown for the user
```

Later sessions start with `show`; `check "<idea>"` before proposing anything that might overlap
an approved or rejected decision.
