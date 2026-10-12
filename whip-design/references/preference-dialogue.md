# Preference elicitation without inventing taste

## First principles

Taste is personal, multidimensional and context-sensitive. A user can react to a concrete visual before they can describe a hypothetical one. AI can identify patterns, propose aesthetically coherent directions, and update a model of observed preference, but cannot certify what the owner likes. Preference is not the same as task usability or the aesthetic consensus of professional designers.

## Probe with evidence, not adjectives

**Bad**: "Choose modern/minimal/futuristic" or a twelve-question color form before any visual evidence.

**Better**: Present two distinct actual references or two quick sketches, articulate the decisive axis, invite a narrow reaction. "A has strong type and dense navigation; B feels more spatial and art-led. Which is closer to the way you want people to feel, and which part is wrong?"

Probe sequentially as needed:

1. **Reaction:** identify elements of attraction and aversion. "The grid is excellent; the neon palette is not."
2. **Discrimination:** contrast new examples varying primarily that axis. Does the dislike come from hue, saturation, or density?
3. **Context check:** is the preference for this page, brand, mobile version or all future work? Ask before generalization.
4. **Predict + falsify:** on a held-out reference, predict which traits user will like, then ask; calibrate confidence when wrong.
5. **Bounded synthesis:** propose a direction that retains approved traits, explicitly labels untested decisions, and leaves the implementation freedom to invent.

## Reactions can be contradictory

"I love the motion but hate the clutter" is a useful constraint, not a reason to pick one whole reference. Separate **look**, **structure**, **behavior**, **content**, and **assets**. Positive response to reference A does not approve every property of A.

## Avoid preference capture traps

- One project choice cannot establish an eternal personal default.
- Suggested options can anchor choices; occasionally include a genuinely different outsider candidate and offer "none of these."
- Always preserve rejected directions and why, not just the winner.
- Do not automatically increase motion, complexity or visual drama merely because the user praised one flourish.
- Don't perform endless A/B rounds. Stop once the unresolved choice will not materially change the next artifact; prototype remaining reversible choices.

## Example brief → reaction → handoff

Owner: "Portfolio, game-inspired, blue, but not like a game menu template."

Propose evidence-backed axes: game **information hierarchy** vs **worldbuilding/art direction** vs **interaction states**. Ask which aspects of references feel authentic, and which are merely tropes. If owner approves "game-like hover reactions but editorial project storytelling," hand off two independent requirements. Don't impose pixelized panels on all sections.

State representation:

```json
{
  "schema_version": "0.1.0",
  "project": "Example portfolio",
  "preference_evidence": [{
    "trait": "responsive hover reactions", "polarity": "like",
    "scope": "portfolio navigation", "confidence": "high",
    "origin": {"kind": "direct_owner_feedback", "locator": "EXAMPLE, replace with actual message"}
  }],
  "decisions": [{
    "id": "D-001", "statement": "Use game-like interaction feedback in project selector",
    "status": "approved", "authority": "owner", "scope": "portfolio project gallery",
    "evidence": {"kind": "explicit_owner_approval", "locator": "EXAMPLE, replace with actual approval message"}
  }]
}
```

**Avoid:** treating a model-generated summary as approval evidence.
