import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(source, 'install', 'install.mjs');
const names = ['whip-design', 'whip-ui', 'shared'];

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'whip-installer-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function run(root, ...args) {
  return spawnSync(process.execPath, [cli, '--scope', 'project', '--project', root, ...args], { encoding: 'utf8' });
}
function read(root, ...parts) { return fs.readFileSync(path.join(root, ...parts), 'utf8'); }
function assertInstalled(root, host) {
  for (const name of names) {
    const target = path.join(root, host, 'skills', name);
    assert.equal(read(target, name === 'shared' ? 'SOURCE-MAP.md' : 'SKILL.md'), read(source, name, name === 'shared' ? 'SOURCE-MAP.md' : 'SKILL.md'));
  }
  assert.ok(fs.existsSync(path.join(root, host, 'skills', 'whip-ui', '..', 'shared', 'SOURCE-MAP.md')));
}

test('installs both standalone skills and shared files into both selected hosts', t => {
  const root = fixture(t);
  const installed = run(root);
  assert.equal(installed.status, 0, installed.stderr);
  assertInstalled(root, '.agents');
  assertInstalled(root, '.claude');
  assert.ok(!fs.existsSync(path.join(root, '.agents', 'skills', 'whipui')));
});

test('init command and agents alias install only the requested host', t => {
  const root = fixture(t);
  const result = spawnSync(process.execPath, [cli, 'init', '--scope', 'project', '--project', root, '--host', 'agents'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assertInstalled(root, '.agents');
  assert.ok(!fs.existsSync(path.join(root, '.claude')));
});

test('dry run does not create host directories or backups', t => {
  const root = fixture(t);
  const result = run(root, '--dry-run');
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readdirSync(root), []);
});

test('preflights all hosts and preserves an unrelated shared directory', t => {
  const root = fixture(t);
  const shared = path.join(root, '.agents', 'skills', 'shared');
  fs.mkdirSync(shared, { recursive: true });
  fs.writeFileSync(path.join(shared, 'user.txt'), 'unrelated material');
  const result = run(root, '--replace');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unrelated shared/);
  assert.equal(read(shared, 'user.txt'), 'unrelated material');
  assert.ok(!fs.existsSync(path.join(root, '.claude')));
});

test('existing installs require replace and are left unchanged on refusal', t => {
  const root = fixture(t);
  assert.equal(run(root).status, 0);
  const custom = path.join(root, '.claude', 'skills', 'whip-design', 'user.txt');
  fs.writeFileSync(custom, 'owner-authored');
  assert.notEqual(run(root).status, 0);
  assert.equal(fs.readFileSync(custom, 'utf8'), 'owner-authored');
});

test('replace archives custom files and recognized 2.0.0 skill outside discovery', t => {
  const root = fixture(t);
  assert.equal(run(root).status, 0);
  const skills = path.join(root, '.agents', 'skills');
  fs.writeFileSync(path.join(skills, 'whip-ui', 'custom.json'), '{"keep":true}');
  fs.mkdirSync(path.join(skills, 'whipui'));
  fs.writeFileSync(path.join(skills, 'whipui', 'SKILL.md'), '---\nname: whipui\nmetadata:\n  homepage: https://github.com/VVeb1250/WhipUI\n---\n');
  fs.writeFileSync(path.join(skills, 'whipui', 'owner.txt'), 'unique old configuration');
  const result = run(root, '--replace');
  assert.equal(result.status, 0, result.stderr);
  assertInstalled(root, '.agents');
  assert.ok(!fs.existsSync(path.join(skills, 'whipui')));
  const backups = path.join(root, '.agents', 'whip-backups');
  const backup = path.join(backups, fs.readdirSync(backups)[0]);
  assert.equal(read(backup, 'whipui', 'owner.txt'), 'unique old configuration');
  assert.equal(read(backup, 'whip-ui', 'custom.json'), '{"keep":true}');
  assert.ok(!fs.existsSync(path.join(skills, 'whip-ui', 'custom.json')));
});

test('unrecognized whipui directory is preserved', t => {
  const root = fixture(t);
  const old = path.join(root, '.agents', 'skills', 'whipui');
  fs.mkdirSync(old, { recursive: true });
  fs.writeFileSync(path.join(old, 'owner.txt'), 'not this package');
  const result = run(root, '--host', 'codex');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(old, 'owner.txt'), 'not this package');
});

test('rejects invalid scopes, missing values and legacy dependency flags', t => {
  const root = fixture(t);
  for (const args of [['--scope', 'global'], ['--host', 'typo'], ['--project'], ['--with-deps']]) {
    assert.notEqual(run(root, ...args).status, 0);
    assert.deepEqual(fs.readdirSync(root), []);
  }
});

test('linked parent is refused without writing to its external target', t => {
  const root = fixture(t);
  const external = fixture(t);
  fs.mkdirSync(path.join(root, '.agents'));
  fs.symlinkSync(external, path.join(root, '.agents', 'skills'), 'junction');
  const result = run(root, '--host', 'codex', '--replace');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe installation parent/);
  assert.deepEqual(fs.readdirSync(external), []);
});

test('replacing a linked skill archives the link and never changes its target', t => {
  const root = fixture(t);
  const external = fixture(t);
  fs.mkdirSync(path.join(root, '.agents', 'skills'), { recursive: true });
  fs.writeFileSync(path.join(external, 'owner.txt'), 'external user data');
  fs.symlinkSync(external, path.join(root, '.agents', 'skills', 'whip-ui'), 'junction');
  const result = run(root, '--host', 'codex', '--replace');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(read(external, 'owner.txt'), 'external user data');
  assertInstalled(root, '.agents');
});

test('an occupied second-host lock stops before any skill is installed', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, '.agents', '.whip-install.lock'), 'another installation');
  const result = run(root);
  assert.notEqual(result.status, 0);
  assert.ok(!fs.existsSync(path.join(root, '.claude', 'skills')));
  assert.ok(!fs.existsSync(path.join(root, '.claude', '.whip-install.lock')));
  assert.equal(read(root, '.agents', '.whip-install.lock'), 'another installation');
});

test('second-host failure rolls back already replaced first-host files', t => {
  const root = fixture(t);
  assert.equal(run(root).status, 0);
  const custom = path.join(root, '.claude', 'skills', 'whip-ui', 'owner.txt');
  fs.writeFileSync(custom, 'must survive rollback');
  fs.writeFileSync(path.join(root, '.agents', 'whip-backups'), 'occupied backup path');
  const result = run(root, '--replace');
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(custom, 'utf8'), 'must survive rollback');
  assertInstalled(root, '.agents');
  assertInstalled(root, '.claude');
  for (const host of ['.agents', '.claude']) {
    assert.ok(!fs.existsSync(path.join(root, host, '.whip-install.lock')));
    assert.ok(!fs.readdirSync(path.join(root, host)).some(name => name.startsWith('.whip-stage-')));
  }
});

test('source tampering fails integrity check before writing host directories', t => {
  const root = fixture(t);
  const altered = fixture(t);
  for (const name of [...names, 'install']) fs.cpSync(path.join(source, name), path.join(altered, name), { recursive: true });
  fs.copyFileSync(path.join(source, 'MANIFEST.json'), path.join(altered, 'MANIFEST.json'));
  fs.appendFileSync(path.join(altered, 'whip-ui', 'SKILL.md'), '\nchanged');
  const result = spawnSync(process.execPath, [path.join(altered, 'install', 'install.mjs'), '--scope', 'project', '--project', root], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Source integrity mismatch/);
  assert.deepEqual(fs.readdirSync(root), []);
});
