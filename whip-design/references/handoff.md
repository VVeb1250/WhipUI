# Design Intent Packet: boundary from WhipDesign to WhipUI

Use when moving from design dialogue to implementation. Prefer the existing known context; do not force a filled template for every minor task.

## Minimum viable packet

- Goal, audience, primary user job and required product content.
- UX structure: task flow, priorities, important states, responsive/platform constraints.
- **Authored direction:** what the owner actually approved, as separate statements with approval evidence; what is proposed/uncertain/rejected.
- **Reference translation:** source URLs and trait-specific observations, what to borrow, what not to copy.
- **Creative latitude:** identity invariants, implementation choices WhipUI may decide, high-impact unresolved decisions to escalate.
- Verification: specific user/task outcome and technical checks, and which claims remain untested.

See `../../shared/design-intent.example.json` for optional machine-readable representation. Do not require JSON for one-off conversation.

## Approval semantics

`proposed` is a suggestion. `assumed` means the agent proceeded without approval for a reversible choice. `approved` requires an explicit owner's authorization, an identity and evidence. `rejected` and `superseded` are retained so the same rejected solution doesn't keep returning. A quote or message ID is good evidence; "inferred from context" is not.

A constraint from a project file may be a project requirement, but it does not imply **owner explicitly approved this new proposal**. Distinguish repository constraints from preference decisions.

When maintaining machine-readable state, run the pack's `tests/check_state.py` with `--strict --previous <prior-state.json>` before replacing the prior state. Changed approved statements or scopes need an approved decision with `supersedes: ["prior-id"]` and a new non-empty source locator. Removing pinned constraints needs `amends_pinned: ["constraint text"]` with new owner approval. Reusing an earlier approval locator cannot authorize these transitions. Keep the prior state for comparison; validation without `--previous` cannot detect lost intent.

The guard checks provenance structure and changes, not whether a quoted message exists or actually authorizes the decision. Inspect the source itself. Example locators are rejected in strict mode.

## WhipUI return path

WhipUI should return code/rendered evidence, adopted creative choices, deviations, and unclear intent. WhipDesign decides whether design direction must change; WhipUI can repair within approved boundaries. A build passing tests is not owner's taste approval.

## Example

```
Goal: show engineering projects credibly to recruiters
Audience: hiring managers scanning on desktop and phone
Approved intent: emphasis on real technical outcomes; blue visual identity; expressive hover reactions in work gallery
Rejected: decorative game HUD surrounding every paragraph
Freedom: type pairing, grid, illustration style, asset composition, component implementation
UX invariants: clear resume/contact, keyboard-reachable project links
References: A for state language, B for editorial hierarchy; do not copy their layouts
Unknown: motion intensity on mobile; implement reduced-motion and let owner preview
Evidence: design direction approved in user message [link or quoted response]
```
