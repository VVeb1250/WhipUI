# Flows and navigation

Adapted and condensed from Sumi screen-flow-patterns/SKILL.md and
navigation-pattern-encyclopedia/SKILL.md. Copyright 2026 Phazur Labs LLC.
Apache-2.0; see ../licenses/sumi-apache-2.0.txt and ../sources.md.
Changes: replaced fixed destination/density thresholds with task-based tradeoffs;
removed catalogs, statistics, code and external skill dependencies.

Read when choosing screens, connecting a journey or fixing discoverability.

List the meaningful entry points, user decisions, required data, completion
condition and escape/recovery paths. Choose screens and transitions to support
that sequence, rather than starting from a sidebar or card-grid template.

For each relevant screen, account for populated, empty, pending and failed
states. Add partial, offline, permissions or stale-data states only when the
product actually needs them. Preserve work when moving back or recovering.

Navigation should communicate current location, available destinations and how
to return. Use labels that predict content. Keep important frequent destinations
discoverable; group the rest by meaningful product concepts.

Compare candidate structures using the real content and task:
- few peer destinations: a visible top-level navigation may suffice;
- deep working tools: a sidebar may preserve orientation;
- search-dominant tasks: foreground search while keeping browse/recovery paths;
- multi-step actions: show progress when useful and preserve back navigation;
- views of one object: local tabs may fit better than new global destinations.

These are candidates, not destination-count rules. Test the chosen structure
with realistic labels, direct links, narrow screens and keyboard navigation.
Choose density from task frequency, expertise and information needs. Do not
hide decision-critical information merely to make a screen look minimal.
