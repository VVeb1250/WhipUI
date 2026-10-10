#!/usr/bin/env node
// House-style / fixture-contamination audit: do one arm's outputs for UNRELATED briefs keep
// landing on the same fonts, accents, radii or section skeleton? (Historical WhipUI failure H5.)
// Uses ref-capture measurements of each run's main page. Repetition is a flag for a human
// to look at a contact sheet, not proof of a problem (one brand family *should* repeat).
//
//   node eval/fixture-audit.mjs --pilot P1 [--arms A,C]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EVAL = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.resolve(EVAL, '..', 'skills', 'whipui', 'scripts');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pilot = opt('--pilot', 'P1');
const OUT = path.join(EVAL, 'results', pilot);
const key = JSON.parse(fs.readFileSync(path.join(OUT, 'KEY-do-not-open-before-judging.json'), 'utf8'));
const arms = opt('--arms', [...new Set(Object.values(key).map((k) => k.arm))].join(',')).split(',');

const lines = ['# Fixture audit ' + pilot, ''];
for (const arm of arms) {
  const caps = [];
  for (const k of Object.values(key).filter((x) => x.arm === arm)) {
    const work = path.join(OUT, 'runs', k.runId, 'work');
    const page = ['index.html', ...fs.readdirSync(work).filter((f) => f.endsWith('.html'))].find((f) => fs.existsSync(path.join(work, f)));
    if (!page) continue;
    const o = path.join(OUT, 'runs', k.runId, 'audit');
    spawnSync('node', [path.join(SCRIPTS, 'ref-capture.mjs'), 'capture', path.join(work, page), '--out', o, '--no-full-page'], { encoding: 'utf8', timeout: 120000 });
    try { caps.push({ brief: k.brief, c: JSON.parse(fs.readFileSync(path.join(o, 'capture.json'), 'utf8')) }); } catch {}
  }
  if (caps.length < 3) { lines.push(`## ${arm}: ${caps.length} outputs (need ≥3 unrelated briefs)`); continue; }
  const count = (fn) => { const m = new Map(); for (const { brief, c } of caps) for (const v of new Set(fn(c))) m.set(v, (m.get(v) || new Set()).add(brief)); return [...m.entries()].filter(([, s]) => s.size >= Math.max(3, Math.ceil(caps.length * 0.6))).map(([v, s]) => `${v} (${s.size}/${caps.length})`); };
  const fam = count((c) => c.type.families.slice(0, 2).map(([f]) => f).filter((f) => !/^(system-ui|-apple-system|sans-serif|serif|monospace|Arial|Times New Roman)$/i.test(f)));
  const acc = count((c) => c.color.accents.slice(0, 2));
  const bg = count((c) => [c.color.pageBackground]);
  const rad = count((c) => c.shape.radii.slice(0, 2).map((r) => r.split('×')[0]));
  const sec = count((c) => [`${c.structure.sectionCount} sections`]);
  lines.push(`## ${arm} (${caps.length} outputs)`, `- display/body families repeated: ${fam.join(', ') || 'none'}`, `- accent colours repeated: ${acc.join(', ') || 'none'}`, `- page background repeated: ${bg.join(', ') || 'none'}`, `- radii repeated: ${rad.join(', ') || 'none'}`, `- section counts repeated: ${sec.join(', ') || 'none'}`, '');
}
lines.push('Repetition across unrelated briefs = look at the contact sheet; if it is a house look, find what in context causes it.');
fs.writeFileSync(path.join(OUT, 'fixture-audit.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
