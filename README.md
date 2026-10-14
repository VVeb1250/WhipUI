# WhipDesign + WhipUI Combo

An AI guide through product, UX and visual decisions, followed by real UI work.
Tell the agent what you want in ordinary language. It chooses the relevant methods
and tools, shows choices when they matter, and continues from your feedback.
You do not need to learn the source skills' command menus.

This is the **3.1.0-rc.1** release candidate. The published stable version is 3.0.0.
The candidate has not established superiority in final design outcomes.

| Entry | Use it for |
| --- | --- |
| `whip-design` | Product framing, research plans/synthesis, user journeys, IA, content, taste exploration, critique, prototypes and implementable decisions. |
| `whip-ui` | Build, reproduce, extend, redesign, polish or repair actual UI and verify relevant rendered behavior. |

Either entry works directly. A build can resolve a design gap and continue without
another invocation. Design-only stays design-only; a small fix skips a workshop.
Delegated one-shot work is supported with labeled assumptions and actual checks.

## What is combined

Eight source libraries keep concrete methods/tools at pinned commits. Intent
owns product/task reasoning; Impeccable leads unresolved visual direction and
prototype feedback; Garden preserves approved identity; Taste/frontend-design
challenge named creative weaknesses; Pro Max retrieves targeted knowledge.
Game UI Design adds player decisions and game-state/input reasoning, while OpenAI
Game UI Frontend adapts browser HUD/menu/scene boundaries. See
[ownership and adapters](shared/SOURCE-MAP.md) and [game workflow](shared/workflows/game.md).
Only two Whip entrypoints participate in skill discovery. Sources load on demand;
their defaults cannot rewrite approved identity or force competing pipelines.

The integration adapts conflicting checkpoints, document stores, stack defaults,
imagery/dark-mode rules and verification boundaries. Existing product/design truth
stays authoritative. [CORE.md](shared/CORE.md) owns the guided workflow; source
bytes and licenses remain retained rather than paraphrased away.

## Install the release candidate from its source archive

```sh
node install/install.mjs --host all --replace
```

Node.js 18+ runs the installer. Pro Max retrieval additionally needs Python 3;
its local search has no external Python dependencies. Impeccable's selected tools
use its retained launcher, which may fetch a SHA-256-verified upstream engine on
first invocation. This package does not bundle the binary or configure hooks,
MCP services, accounts or agents. Optional native/browser/image/reference tools
are used only when actually available. See [host integration](shared/host-integration.md).

Codex/Agent Skills hosts install under `~/.agents/skills`; Claude Code under
`~/.claude/skills`. Invoke `$whip-design` or `$whip-ui` (Claude's equivalent slash
commands work). `--scope project --project DIR` installs into one project;
`--host codex|claude|agents` selects the host, and `--dry-run` previews changes.
The default is both hosts/user scope. `--replace` archives recognized old skill
directories outside active discovery and preserves unrelated shared directories.
Existing project files, old `.whip` records and user data are not migrated or deleted.

## Compatibility with 3.0.0

The package name, two skill names, host locations and installer options remain
the same. `--replace` backs up old skill/configuration files outside discovery;
inspect those backups before restoring unique customization. Project data stays
in place. No 2.0 hooks, state engine or browser dependency setup returns.

Existing `.whip/design-intent.json` and `design-state.json` remain supported
inputs. Their goals, approved/rejected decisions, pinned constraints, source
evidence and verification requirements keep their meaning. The
[compatibility rules](shared/CORE.md#continue-from-one-authority-per-fact) govern
reading them without an automatic rewrite or a duplicate decision store.
The two v3 example files remain unchanged as optional compatibility resources.
New projects can use their existing product/design records instead.

For users maintaining the JSON format, the repository/source archive still
supports the original command:

```sh
python tests/check_state.py new-state.json --previous prior-state.json --strict
```

The guard is not part of the npm runtime, as in v3. It verifies provenance
structure and authorized transitions; inspect the actual cited user message.
Example approval locators deliberately fail strict mode. No JSON state is
required for ordinary new work.

## Provenance and verification

[SOURCES.json](shared/SOURCES.json) records the eight exact pins and all retained
Git-blob hashes. `SKILL.md` is renamed `REFERENCE.md`; bodies remain unchanged.
[NOTICE.md](NOTICE.md) maps the licenses. `tools/vendor_sources.py` reproduces
the selection from local checkouts without executing upstream installers.

`npm test`, `npm run test:skills` and `npm run validate` check installer preservation,
source integrity, references/discovery and actual local retrieval. They do not
prove preference alignment, human task success or visual superiority. Behavioral
evaluations must inspect artifacts and relevant user decisions separately.
The game additions are candidates for game-task validation; source checks do not
establish gameplay usability or superiority over a baseline.

## Rollback

The prior release remains tagged `v3.0.0`. A replacement installation keeps backups
under the host config's `whip-backups` directory. Preserve any newer unique config
before restoring. This candidate replaces the default generic playbooks with
bounded source routing while retaining the optional v3 JSON inputs and guard;
it does not revive 2.0.0 hooks or its legacy architecture.
