#!/usr/bin/env node
// OPT-IN Claude Code Stop hook: a one-time REMINDER (experimental; not enabled by the plugin).
// Blocks the agent from finishing ONCE if UI source files changed after the last
// render-check evidence in this project's .whipui/evidence/. It blocks once per stop (it
// respects stop_hook_active), so it is a nudge, not an enforced gate. Install it yourself.
//
// Install (project): add to .claude/settings.json
//   { "hooks": { "Stop": [ { "hooks": [ { "type": "command",
//       "command": "node \"/ABS/PATH/whipui/adapters/claude-code/render-evidence-stop-hook.mjs\"" } ] } ] } }
// Codex has a Stop hook too, but its contract differs and needs /hooks trust review: not provided.
//
// Rules: only acts in projects that have a .whipui/ directory (opted in); never blocks twice in a
// row (respects stop_hook_active); ignores node_modules/dist/build; fails open on any error.

import fs from 'node:fs';
import path from 'node:path';

const UI_EXT = /\.(css|scss|sass|less|html|htm|js|mjs|ts|jsx|tsx|vue|svelte|astro|mdx)$/i;
const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', '.whipui', 'coverage']);

function newestUiChange(dir, depth = 0, best = 0) {
  if (depth > 6) return best;
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return best; }
  for (const e of ents) {
    if (IGNORE.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) best = newestUiChange(p, depth + 1, best);
    else if (UI_EXT.test(e.name)) { try { best = Math.max(best, fs.statSync(p).mtimeMs); } catch {} }
  }
  return best;
}

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  if (input.stop_hook_active) process.exit(0);
  const cwd = input.cwd || process.cwd();
  const wdir = path.join(cwd, '.whipui');
  if (!fs.existsSync(wdir)) process.exit(0);
  const ev = path.join(wdir, 'evidence', 'render-check-latest.json');
  const lastEvidence = fs.existsSync(ev) ? fs.statSync(ev).mtimeMs : 0;
  const lastUi = newestUiChange(cwd);
  if (lastUi > lastEvidence + 1000) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: 'WhipUI: UI files changed after the last render-check. Run render-check on the affected page and look at the screenshots, or state explicitly that the change is not rendered/unverified and why.',
    }));
  }
  process.exit(0);
} catch { process.exit(0); }
