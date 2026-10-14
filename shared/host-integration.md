# Resolve retained tools in the installed layout

Whip installs three sibling folders: `whip-design`, `whip-ui`, and `shared`.
The retained Impeccable base is **`../shared/library/impeccable` relative to either skill**.
Resolve it to an absolute path before running commands, and keep the working
directory at the target project. In upstream references, `${CLAUDE_SKILL_DIR}`,
`<skill-base-dir>` and `{{scripts_path}}` mean this retained base (or its `scripts`
child), never the Whip entry folder, current project or plugin root.

Windows PowerShell example, replacing the base with the resolved installed path:

```powershell
$whipEngine = 'C:\path\to\skills\shared\library\impeccable\scripts\impeccable.cmd'
& $whipEngine context
```

POSIX: invoke the absolute `scripts/impeccable` with `sh`. References that
show `scripts/impeccable` resolve to this shipped launcher for the current OS.
The launchers and command data remain upstream bytes. Follow their printed command
protocols; hidden engine verbs do not necessarily support `--help`.

The installer copies the retained source and does not install hooks, configure MCP,
register agents or start background services. The first engine invocation may fetch
the upstream engine release with SHA-256 sidecar validation; it also probes existing
engines. `scripts/VERSION` pins the expected engine. Use `engine-probe` to inspect
the engine handshake; `--version` alone can report a different package version.
Do not automatically run update/install/link/hook repair when context mentions them.
Respect host/network permission boundaries and report unavailable facilities.
Before invoking the launcher, inspect the available cached/bundled runtime when
downloads are outside scope. Use `IMPECCABLE_BIN` for an already available engine;
do not let an analysis-looking command implicitly install one. `concept-seed`
can report `source: api`; check authorized network/data scope before calling it.
When tools/boards/seed are unavailable, read existing context and make the local
direction/prototype with an explicit capability limit, not a fabricated seed or
helper approval. Do not send private project material to a service by default.

The retained helper definitions in `library/impeccable/agents/` are protocols, not evidence
that this host registered those names. If authorized helpers are available, use the
host's actual agent interface, provide the appropriate protocol and minimal inputs,
and start independent finish review without inherited build history. Otherwise use
the corresponding `reference/degraded/` protocol and disclose the substitution.
Host tool names, wait limits, image handling and safety rules override upstream
harness examples. Long upstream live waits use yielded sessions with short bounded
polls so the agent can service events and keep communicating; never leave a live
session orphaned. Use actual available image tools and truthful provenance.

Do not load every reference, font database or helper definition at startup. Read
the selected source through SOURCE-MAP, then its required dependencies.
Resolve relative reference links against the retained file's directory.

## Pro Max local retrieval

Its base is `../shared/library/promax` relative to either skill. Upstream examples
using `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max` mean this retained base.
Resolve its `scripts/search.py` to an absolute path; Python 3 is required and the
search uses the adjacent retained data with no external Python packages.

```powershell
$whipSearch = 'C:\path\to\skills\shared\library\promax\scripts\search.py'
python $whipSearch 'keyboard focus navigation' --domain ux --max-results 3 --json
python $whipSearch 'form error recovery' --stack react --max-results 3 --json
```

Use `python3` or `py -3` when appropriate for the host. Query JSON rather than
loading whole CSVs/databases. Search domains/stacks separately; `--stack` is ignored
with `--design-system`. System recommendations may be explored without persistence,
with the shared selected variance/motion/density when useful. Verify result fit;
never call `--persist`/`--force` as routine setup. Missing Python permits source
references and native checks, disclosed as a retrieval limitation.
