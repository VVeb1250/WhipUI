## UI verification tools (WhipUI scripts: tools only, no workflow)
Node scripts in `<scripts>/`. Run with `node <scripts>/<name>.mjs --help` for options.
- `render-check.mjs <url|file>`: screenshots at 375/768/1440 + axe + overflow/clipping/covered controls/tap targets/focus/console/fonts. `--tier standard` adds dark mode + long Thai text. Prints the PNG paths; findings are `measured`, `heuristic` (look before acting) or `environment` (not a page bug).
- `motion-probe.mjs <url> --trigger <selector> [--video]`: plays the interaction in normal and reduced motion; reports animated properties, timings, jank, and content missing under reduced motion; writes filmstrips.
- `interact.mjs <url> steps.mjs`: run keyboard/click checks; the steps module gets a ready `page` plus `check(label, cond)` and `shot(name)`.
- `ref-capture.mjs capture <url>` / `compare <a> <b>`: measured type/colour/spacing of a page; structural fidelity between two captures.
Serve pages that fetch data over http (`python3 -m http.server`).
