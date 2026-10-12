# Component engineering + states + implementation integrity

Use for React/Vue/Svelte/Next/Astro/native frontend execution, complex component composition, existing systems, or code architecture problems. Stack-specific framework guidance should be consulted from the actual version/docs when needed.

## Before editing

Read package manifests, routes, component structure, style/token conventions, font setup, image locations, existing test commands, and design docs. Run existing app/tests when feasible. Prefer smallest scoped change that satisfies requirements. Avoid replatforming or adding a design dependency for a simple improvement.

## Component boundaries

Aim for modules that express product concepts, not artificial atomization:

```
ProjectShowcase
├── ProjectIndex (filter/sort, selected state)
├── ProjectPreview (media/artifact)
├── ProjectFacts (role, stack, evidence)
└── ProjectActions (case study, repo, demo)
```

Separate stateful interaction from presentation when beneficial. Use shared tokens/components where they capture real repetition, but make bespoke pieces when an important approved visual concept cannot be represented by the current API. Avoid boolean-prop explosions and one-file monoliths. Do not force all sections into a single generic `Card` component.

## Interaction specification

For each primary control:

| Field | Example |
| --- | --- |
| Trigger | User selects project from index |
| Immediate feedback | Selection/focus becomes visible |
| Result | Preview + facts change, URL optional |
| Keyboard/touch | Tab to item, Enter activates, touch tap works |
| Loading | Skeleton/placeholder only if async |
| Failure | Message and retry if data cannot load |
| Reduced motion | Crossfade or direct swap instead of travel |

States to consider contextually: idle/default, hover, focus-visible, active/pressed, selected, loading/pending, success, error, empty, disabled, offline, permission denied. **Do not** implement all indiscriminately: implement every state that this control can actually reach.

## Reuse vs original composition

Default to existing conventions when extending a design system. For a new expressive screen, define semantic layout/composition components without making everything a configurable dashboard widget. Keep consistent tokens for shared behavior (spacing, type, colors, timing) and controlled exceptions with rationale.

## Functional/copy integrity

Real links must navigate to destinations or be explicitly marked unavailable; do not fake functional CTA. Forms should validate inputs and communicate errors. Don't invent customer counts, job titles, affiliations, ratings or badges. Use semantic HTML and appropriate native controls first; ARIA supplements semantics, it doesn't compensate for missing behavior.

## Verification checklist

1. Existing tests and build commands pass or their failure is explained.
2. No unrelated repo modifications, secret exposure, unauthorized packages or asset license concerns.
3. Responsive at the requested devices and smallest realistic sizes; no overflow/clipping.
4. Primary actions work, keyboard focus is visible, no interaction relies on hover alone.
5. Async/empty/error states appropriate to product flow; copy is truthful.
6. Source code stays maintainable enough for a human to extend; not necessarily maximum abstraction.

For React optimization and component scale, consult Vercel's original `react-best-practices` and `composition-patterns` on demand rather than embedding their rules here. See `../../shared/SOURCE-MAP.md`.
