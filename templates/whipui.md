# WhipUI + WhipDesign

One thin package with two separately discoverable skills:
- WhipUI: implement specified UI, from a small component to a whole page.
- WhipDesign: UX-led design from rough requests, then visual direction and code.

The maintained entrypoint is [.whipui/router.md](.whipui/router.md).
It selects a workflow without requiring users to know skill or MCP names.
For migration from 0.3, run init --refresh to back up and replace package
templates while retaining Project DNA, the Design Fingerprint and configuration.

The host performs generation, browsing and iteration. This package supplies
workflows, small credited UX references, provider adapters and capture contracts,
not a browser, editor, model runtime or guarantee of good design.
