# .whipui

Start at router.md. It routes specified UI to WhipUI and UX-led design to
WhipDesign, respecting review/planning-only requests.

- project-dna.json: product facts, user tasks, constraints and assumptions.
- design-fingerprint.json: selected visual decisions and evidence.
- workflows/: implementation, design, UX review, visual exploration, capture and QA.
- specialists/: selectively loaded provider adapters and credited UX references.
- sources.md and licenses/: provenance and redistribution notices.
- capabilities.json and providers.md: setup discovery, not live health checks.
- examples/evaluation.md: behavioral and owner-feedback evaluation protocol.

init --refresh updates package templates with backups under backups/, preserving
DNA, fingerprint, config and unmanaged instruction text. init --force is the old
destructive overwrite option; it is not the recommended upgrade path.
