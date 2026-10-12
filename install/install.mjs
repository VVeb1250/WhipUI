#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = ['whip-design', 'whip-ui', 'shared'];
const usage = `whipui 3.0.0: install WhipDesign and WhipUI
  npx whipui [init] [--host all|codex|claude|agents] [--scope user|project]
             [--project DIR] [--replace] [--dry-run]

Default: both hosts, user scope. --replace archives existing Whip installations
outside the active skills directories. Unrelated shared directories are refused.
No hooks, browser packages, MCP setup, project state edits, or network downloads.
Invoke $whip-design / $whip-ui in Codex, or /whip-design / /whip-ui in Claude.`;

function exists(target) {
  try { fs.lstatSync(target); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

function assertRealParents(target) {
  for (let current = target; ; current = path.dirname(current)) {
    if (exists(current)) {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error(`Unsafe installation parent: ${current}`);
      }
    }
    if (current === path.dirname(current)) break;
  }
}

function isOwnedShared(target) {
  try {
    return JSON.parse(fs.readFileSync(path.join(target, '.whip-owner.json'), 'utf8')).package === 'whipui';
  } catch { return false; }
}

function isLegacy(target) {
  try {
    const skill = fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8');
    return /^name:\s*whipui\s*$/m.test(skill) && skill.includes('https://github.com/VVeb1250/WhipUI');
  } catch { return false; }
}

function verifySource() {
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'MANIFEST.json'), 'utf8'));
  for (const name of names) {
    const files = manifest.files.filter(file => file.path.startsWith(`${name}/`));
    if (!files.length) throw new Error(`Missing source manifest entries: ${name}`);
    for (const file of files) {
      const target = path.resolve(source, file.path);
      if (!target.startsWith(source + path.sep) || !fs.lstatSync(target).isFile()) {
        throw new Error(`Invalid source entry: ${file.path}`);
      }
      const actual = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
      if (actual !== file.sha256) throw new Error(`Source integrity mismatch: ${file.path}`);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === 'init') args.shift();
  const options = { host: 'all', scope: 'user', project: process.cwd(), replace: false, dry: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') { console.log(usage); return; }
    if (arg === '--version') { console.log('3.0.0'); return; }
    if (arg === '--replace') options.replace = true;
    else if (arg === '--dry-run') options.dry = true;
    else if (['--host', '--scope', '--project'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value: ${arg}`);
      options[arg.slice(2)] = value;
    } else throw new Error(`Unsupported argument: ${arg}. Run --help.`);
  }
  if (!['all', 'codex', 'claude', 'agents'].includes(options.host)) throw new Error('Invalid --host');
  if (!['user', 'project'].includes(options.scope)) throw new Error('Invalid --scope');
  const base = options.scope === 'user' ? os.homedir() : path.resolve(options.project);
  if (!exists(base) || !fs.statSync(base).isDirectory()) throw new Error(`Project/home does not exist: ${base}`);
  const hosts = options.host === 'all' ? ['.claude', '.agents'] : [options.host === 'claude' ? '.claude' : '.agents'];
  const plans = hosts.map(host => {
    const config = path.join(base, host);
    const skills = path.join(config, 'skills');
    assertRealParents(skills);
    const targets = names.map(name => ({ name, target: path.join(skills, name) }));
    const shared = path.join(skills, 'shared');
    if (exists(shared) && !isOwnedShared(shared)) {
      throw new Error(`Unrelated shared directory left untouched: ${shared}. Install in project scope instead.`);
    }
    const legacy = path.join(skills, 'whipui');
    if (exists(legacy)) {
      if (isLegacy(legacy)) targets.push({ name: 'whipui', target: legacy, legacy: true });
      else console.log(`Unrecognized whipui directory left untouched: ${legacy}`);
    }
    if (!options.replace && targets.some(item => exists(item.target))) {
      throw new Error(`Existing installation in ${skills}. Use --replace to archive it first.`);
    }
    return { config, skills, targets };
  });
  verifySource();
  for (const plan of plans) {
    for (const item of plan.targets) console.log(`${options.dry ? '[dry] ' : ''}${item.legacy ? 'archive legacy' : 'install'} ${item.target}`);
  }
  if (options.dry) return;

  const locks = [], stages = [], moved = [], installed = [];
  const stamp = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}`;
  try {
    // Lock all selected hosts before the first mutation of an installed skill.
    for (const plan of plans) {
      fs.mkdirSync(plan.config, { recursive: true });
      const lock = path.join(plan.config, '.whip-install.lock');
      locks.push({ path: lock, fd: fs.openSync(lock, 'wx') });
    }
    for (const plan of plans) {
      plan.stage = fs.mkdtempSync(path.join(plan.config, '.whip-stage-'));
      stages.push(plan.stage);
      for (const name of names) fs.cpSync(path.join(source, name), path.join(plan.stage, name), { recursive: true });
    }
    for (const plan of plans) {
      fs.mkdirSync(plan.skills, { recursive: true });
      const backup = path.join(plan.config, 'whip-backups', stamp);
      assertRealParents(path.dirname(backup));
      for (const item of plan.targets) {
        if (exists(item.target)) {
          if (!options.replace) throw new Error(`Installation appeared during staging: ${item.target}`);
          fs.mkdirSync(backup, { recursive: true });
          const saved = path.join(backup, item.name);
          fs.renameSync(item.target, saved);
          moved.push({ target: item.target, saved });
          console.log(`Backup: ${saved}`);
        }
        if (!item.legacy) {
          if (exists(item.target)) throw new Error(`Target occupied: ${item.target}`);
          fs.renameSync(path.join(plan.stage, item.name), item.target);
          installed.push(item.target);
        }
      }
    }
  } catch (error) {
    for (const target of installed.reverse()) fs.rmSync(target, { recursive: true, force: true });
    for (const item of moved.reverse()) fs.renameSync(item.saved, item.target);
    throw error;
  } finally {
    for (const stage of stages) fs.rmSync(stage, { recursive: true, force: true });
    for (const lock of locks.reverse()) { fs.closeSync(lock.fd); fs.unlinkSync(lock.path); }
  }
  console.log('Installed WhipDesign and WhipUI. Start a new host session to refresh discovery.');
}

try { main(); }
catch (error) { console.error(`whipui: ${error.message}`); process.exitCode = 1; }
