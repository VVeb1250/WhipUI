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

Use npm version patch, minor, or major. Push the commit and tag. GitHub Actions
publishes the tag to npm and creates release notes.
