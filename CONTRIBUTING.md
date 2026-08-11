# Contributing to WhipUI

## Development

    npm ci
    npm test
    npm run syntax-check
    npm pack --dry-run

WhipUI is intentionally dependency-free at runtime. Prefer routing to an
existing host skill, MCP server, or browser tool over adding a new runtime.

## Pull requests

- Explain the user workflow and input route affected.
- Keep Project DNA and Design Fingerprint contracts backwards compatible when
  possible.
- Add or update tests for CLI and routing behavior.
- Keep CI green on Node 18, 20, and 22.

## Releases

Use Conventional Commit prefixes in pull requests and squash-merge them into
`main` (`fix:` for patch, `feat:` for minor, and `!` for breaking changes).
Release Please opens or updates a release PR automatically. Merge that release
PR to update the version and changelog, create the GitHub release, and publish
to npm after the verification checks pass.

Dependabot patch and minor updates are auto-merged after CI passes. Major
updates are intentionally left for manual review.
