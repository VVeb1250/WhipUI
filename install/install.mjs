#!/usr/bin/env node
// WhipUI installer — copies (or symlinks) the single `whipui` skill folder into the
// skill directories each host reads, and optionally installs the script dependencies.
//
//   node install/install.mjs [--host claude|codex|agents|all] [--scope user|project]
//                            [--project DIR] [--link] [--with-deps] [--dry-run] [--uninstall]
//
// Paths (verified against host docs 2026-10-10):
//   Claude Code : ~/.claude/skills/whipui        | <project>/.claude/skills/whipui   → /whipui
//   Codex       : ~/.agents/skills/whipui        | <project>/.agents/skills/whipui   → $whipui
//   Cursor / VS Code / Gemini CLI also read .agents/skills (project) — use --host agents.
// Claude Code plugin users can instead: /plugin marketplace add VVeb1250/WhipUI ; /plugin install whipui@whipui

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'whipui');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
if (flag('-h') || flag('--help')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 13).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }

const host = opt('--host', 'all');
const scope = opt('--scope', 'user');
const project = path.resolve(opt('--project', process.cwd()));
const link = flag('--link'), dry = flag('--dry-run'), uninstall = flag('--uninstall'), withDeps = flag('--with-deps');
const base = scope === 'user' ? os.homedir() : project;
const targets = [];
if (host === 'claude' || host === 'all') targets.push(path.join(base, '.claude', 'skills', 'whipui'));
if (host === 'codex' || host === 'agents' || host === 'all') targets.push(path.join(base, '.agents', 'skills', 'whipui'));
if (!targets.length) { console.error('--host must be claude|codex|agents|all'); process.exit(2); }

const SKIP = new Set(['node_modules', '.whipui', 'package-lock.json']);
function copyDir(a, b) {
  fs.mkdirSync(b, { recursive: true });
  for (const e of fs.readdirSync(a, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const s = path.join(a, e.name), d = path.join(b, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

for (const t of targets) {
  const exists = fs.existsSync(t) || (() => { try { fs.lstatSync(t); return true; } catch { return false; } })();
  if (uninstall) {
    console.log(`${dry ? '[dry] ' : ''}remove ${t}`);
    if (!dry && exists) fs.rmSync(t, { recursive: true, force: true });
    continue;
  }
  if (exists) {
    const bak = `${t}.bak-${Date.now()}`;
    console.log(`${dry ? '[dry] ' : ''}backup existing → ${bak}`);
    if (!dry) fs.renameSync(t, bak);
  }
  console.log(`${dry ? '[dry] ' : ''}${link ? 'link' : 'copy'} ${SRC} → ${t}`);
  if (!dry) { fs.mkdirSync(path.dirname(t), { recursive: true }); link ? fs.symlinkSync(SRC, t, 'dir') : copyDir(SRC, t); }
}

if (withDeps && !uninstall) {
  const dirs = link ? [path.join(SRC, 'scripts')] : targets.map((t) => path.join(t, 'scripts'));
  for (const d of [...new Set(dirs)]) {
    console.log(`${dry ? '[dry] ' : ''}npm install in ${d}`);
    if (!dry) { const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: d, stdio: 'inherit', shell: process.platform === 'win32' }); if (r.status !== 0) console.log('npm install failed: scripts will report "not rendered" until Playwright is available.'); }
  }
  console.log('Browser: run `npx playwright install chromium` once if `node scripts/doctor.mjs` says Chromium cannot launch.');
}
if (!uninstall) console.log(`Done. Invoke with /whipui (Claude Code) or $whipui (Codex). Check tools: node ${path.join(targets[0], 'scripts', 'doctor.mjs')}`);
