# Security policy

## Scope

Please report security issues in the package, its workflows, or generated
agent instructions privately rather than opening a public issue.

## Design boundaries

WhipUI does not manage credentials, attach to a real browser profile, or make
Figma/Playwright calls itself. Generated Pick from Web instructions must use an
isolated browser context and must not collect unrelated cookies or secrets.
