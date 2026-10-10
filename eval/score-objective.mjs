#!/usr/bin/env node
// Objective (non-taste) scoring of a pilot's outputs, with the evidence archived per run:
//   - render-check standard tier over http → measured errors/warnings (environment findings excluded)
//   - B7: which planted defects remain (see seeds/B7.PLANTED.md)
//   - B8: motion-probe flags for the drawer and add-to-cart in both motion modes
//   - whether the agent rendered its work itself (screenshot/Playwright/render-check calls in transcript)
// Writes results/<pilot>/objective.json and results/<pilot>/runs/<id>/objective/… . Run AFTER judging if the
// judge might read it: this file describes differences between outputs.
//
//   node eval/score-objective.mjs --pilot P1b

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const EVAL = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.resolve(EVAL, '..', 'skills', 'whipui', 'scripts');
const args = process.argv.slice(2);
const pilot = args[args.indexOf('--pilot') + 1] || 'P1';
const OUT = path.join(EVAL, 'results', pilot);
const key = JSON.parse(fs.readFileSync(path.join(OUT, 'KEY-do-not-open-before-judging.json'), 'utf8'));

function serve(dir) {
  const py = spawn('python3', ['-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', dir], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((ok) => { const on = (d) => { const m = String(d).match(/port (\d+)/); if (m) ok({ url: `http://127.0.0.1:${m[1]}`, stop: () => py.kill() }); }; py.stdout.on('data', on); py.stderr.on('data', on); });
}
const PLANTED = {
  '1 URL overflow': (F) => F.some((f) => f.check.startsWith('horizontal-overflow') && f.severity !== 'info'),
  '2 favourite button covered': (F) => F.some((f) => f.check === 'interactive-obscured' && /fav/.test(JSON.stringify(f))),
  '3 load-more under bottom nav': (F) => F.some((f) => f.check === 'interactive-obscured' && /load-more/.test(JSON.stringify(f))),
  '4 save label clips (Thai stress)': (F) => F.some((f) => f.check === 'text-clipped(stress)' && /save/.test(JSON.stringify(f))),
  '5 scroll region not focusable': (F) => F.some((f) => f.check === 'axe:scrollable-region-focusable'),
  '6 KPI value spills': (F) => F.some((f) => f.check === 'text-spill' && /kpi/.test(JSON.stringify(f))),
};

// Count only what the agent actually ran or opened (tool calls), not mentions in the loaded skill text.
function selfRendered(tx) {
  if (!fs.existsSync(tx)) return null;
  const scripts = new Set(); let pngReads = 0, playwrightCalls = 0;
  for (const line of fs.readFileSync(tx, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    const c = e.message?.content; if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (b.type !== 'tool_use') continue;
      if (b.name === 'Bash') { const cmd = b.input?.command || ''; for (const m of cmd.matchAll(/(render-check|motion-probe|interact|ref-capture|state|detect-project|review-page|doctor)\.mjs/g)) scripts.add(m[1]); if (/playwright|chromium/i.test(cmd)) playwrightCalls++; }
      if (b.name === 'Read' && /\.(png|jpe?g|webp)$/i.test(b.input?.file_path || '')) pngReads++;
    }
  }
  return { whipuiScripts: [...scripts], pngReads, playwrightCalls };
}

const results = {};
for (const [oid, k] of Object.entries(key)) {
  const dir = path.join(OUT, 'runs', k.runId), work = path.join(dir, 'work'), od = path.join(dir, 'objective');
  fs.rmSync(od, { recursive: true, force: true }); fs.mkdirSync(od, { recursive: true });
  const srv = await serve(work);
  const page = fs.existsSync(path.join(work, 'index.html')) ? 'index.html' : fs.readdirSync(work).find((f) => f.endsWith('.html'));
  const r = { runId: k.runId, arm: k.arm, brief: k.brief, page };
  if (page) {
    spawnSync('node', [path.join(SCRIPTS, 'render-check.mjs'), `${srv.url}/${page}`, '--tier', 'standard', '--out', path.join(od, 'render'), '--focus-tabs', '20'], { encoding: 'utf8', timeout: 300000 });
    const rep = JSON.parse(fs.readFileSync(path.join(od, 'render', 'report.json'), 'utf8'));
    const F = rep.findings.filter((f) => f.kind !== 'environment');
    r.errors = F.filter((f) => f.severity === 'error').length;
    r.warns = F.filter((f) => f.severity === 'warn').length;
    r.checks = [...new Set(F.filter((f) => f.severity !== 'info').map((f) => f.check))];
    if (k.brief === 'B7') r.plantedRemaining = Object.entries(PLANTED).filter(([, fn]) => fn(F)).map(([n]) => n);
    if (k.brief === 'B8') {
      r.motion = {};
      for (const [trig, name] of [['#cartBtn', 'drawer'], ['#add', 'add']]) {
        spawnSync('node', [path.join(SCRIPTS, 'motion-probe.mjs'), `${srv.url}/${page}`, '--trigger', trig, '--out', path.join(od, 'motion-' + name)], { encoding: 'utf8', timeout: 300000 });
        try { const m = JSON.parse(fs.readFileSync(path.join(od, 'motion-' + name, 'report.json'), 'utf8')); r.motion[name] = Object.fromEntries(Object.entries(m.modes).map(([mode, x]) => [mode, { anims: x.inventory.length, endsMs: x.totalMs, props: [...new Set(x.inventory.flatMap((a) => a.props))], flags: x.flags.filter((f) => f.severity !== 'info').map((f) => f.check) }])); } catch { r.motion[name] = 'probe failed'; }
      }
    }
  }
  r.selfRendered = selfRendered(path.join(dir, 'transcript.jsonl'));
  srv.stop();
  results[k.runId] = r;
  console.log(`${k.runId}: errors=${r.errors} warns=${r.warns}${r.plantedRemaining ? ' plantedRemaining=' + JSON.stringify(r.plantedRemaining) : ''}${r.motion ? ' motionFlags=' + JSON.stringify(Object.fromEntries(Object.entries(r.motion).map(([n, v]) => [n, typeof v === 'string' ? v : Object.values(v).flatMap((m) => m.flags)]))) : ''} selfRendered=${JSON.stringify(r.selfRendered)}`);
}
fs.writeFileSync(path.join(OUT, 'objective.json'), JSON.stringify(results, null, 2));
console.log(`→ ${path.join(OUT, 'objective.json')} (evidence in runs/*/objective/)`);
