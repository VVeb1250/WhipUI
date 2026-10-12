# Optional AGENTS.md snippet for explicit routing

<!-- Copy this section into the host project's AGENTS.md ONLY if auto-discovery is unreliable. -->

## Whip design tools

- `whip-design`: use when the request needs goal framing, user flows, co-design, personal taste exploration using references, significant UX/brand decisions, critique, or intent validation. It can stop after delivering an approved design packet; do not force implementation.
- `whip-ui`: use when the user requests actual frontend construction, styling, reproduction, responsive implementation, interaction/motion, visual repair, or rendered QA. One-shot build requests should execute autonomously where decisions are reversible and sufficient context exists.
- If a request spans both, `whip-design` resolves *only material open choices* and provides a compact Design Intent Packet, then `whip-ui` implements. Do not require two skills or a workshop when intent is already sufficient.
- Owner-approved decisions must not be silently altered. Agent proposals are not approvals. Real rendered evidence outranks confident self-critique about visual quality.
- Load reference documents only as their trigger arises; never activate every design skill or specialist at once.
