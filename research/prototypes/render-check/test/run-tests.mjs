// Seeded-defect tests for render-check. Serves fixtures over HTTP (so failed
// requests look like a real dev server), runs the CLI, and checks that every
// seeded defect is found and the control page stays clean.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, 'fixtures');
const cli = path.join(here, '..', 'render-check.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rc-test-'));

const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(fixtures, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(fixtures)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// NOTE: must be async — a sync child process would block this event loop and
// the in-process fixture server could never answer the browser (deadlock).
async function run(name, extra = []) {
  const out = path.join(tmp, name);
  try { await execFileP('node', [cli, `${base}/${name}.html`, '--out', out, '--fail-on', 'never', ...extra], { timeout: 120000 }); }
  catch (e) { console.error(String(e.stderr || e)); throw e; }
  return JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
}
const at = (rep, w) => rep.runs.find((r) => r.viewport.w === w);
const has = (run, check, pred = () => true) => run.findings.some((f) => f.check === check && pred(f));
const axe = (run, id) => (run.axe?.violations || []).some((v) => v.id === id);
const sel = (f) => JSON.stringify(f);

let pass = 0, fail = 0;
const expect = (label, cond) => { if (cond) { pass++; console.log(`  ok   ${label}`); } else { fail++; console.log(`  FAIL ${label}`); } };

console.log('flawed.html (seeded defects)');
const F = await run('flawed', ['--stress-text']);
const f375 = at(F, 375), f1440 = at(F, 1440);
expect('F1/F10 horizontal overflow at 375', has(f375, 'horizontal-overflow'));
expect('F1/F10 no horizontal overflow at 1440', !has(f1440, 'horizontal-overflow'));
expect('F2 clipped CTA label', has(f375, 'text-clipped', (f) => f.selector.includes('cta')));
expect('F3 card text spill', has(f375, 'text-spill', (f) => f.selector.includes('card')));
expect('F4 axe color-contrast', axe(f375, 'color-contrast'));
expect('F5 tiny adjacent buttons fail 2.5.8 spacing', f375.findings.filter((f) => f.check === 'tap-target-small' && f.severity === 'error').length >= 3);
expect('F5 axe target-size agrees', axe(f375, 'target-size'));
expect('F6 overlap link/close button', has(f375, 'interactive-overlap', (f) => sel(f).includes('close')));
expect('F6 link obscured by close button', has(f375, 'interactive-obscured', (f) => sel(f).includes('close')));
expect('F7 focus not visible on buttons', has(f375, 'focus-not-visible', (f) => f.element.startsWith('button')));
expect('F8 broken image', has(f375, 'broken-image'));
expect('F8 axe image-alt', axe(f375, 'image-alt'));
expect('F9 placeholder-only field flagged (axe itself does not flag it)', has(f375, 'placeholder-only-label'));
expect('F9 known axe gap still present (no axe label violation)', !axe(f375, 'label'));
expect('F11 font load error', has(f375, 'font-load-error'));
expect('F12 console error', has(f375, 'console-error', (f) => f.message.includes('analytics')));
expect('F12 uncaught exception', has(f375, 'uncaught-exception'));
expect('F13 layout shift', has(f375, 'layout-shift'));
expect('inline link in sentence not flagged as small target', !has(f375, 'tap-target-small', (f) => f.text === 'tiny'));

console.log('control.html (should be clean)');
const C = await run('control', ['--schemes', 'light,dark', '--stress-text']);
for (const r of C.runs) {
  const bad = r.findings.filter((f) => f.severity !== 'info');
  const axeBad = (r.axe?.violations || []).filter((v) => ['critical', 'serious'].includes(v.impact));
  expect(`${r.tag}: no warn/error findings (got ${bad.map((f) => f.check).join(',') || 'none'})`, bad.length === 0);
  expect(`${r.tag}: no serious axe violations (got ${axeBad.map((v) => v.id).join(',') || 'none'})`, axeBad.length === 0);
  expect(`${r.tag}: ellipsis truncation reported as info only`, has(r, 'text-clipped', (f) => f.severity === 'info'));
}

console.log('masked.html (overflow hidden on root)');
const M = await run('masked');
expect('masked overflow reported at 375', has(at(M, 375), 'offscreen-content-masked'));
expect('no real horizontal scroll at 375', !has(at(M, 375), 'horizontal-overflow'));
expect('masked links reported as clipped text', has(at(M, 375), 'text-clipped', (f) => f.severity === 'warn'));
expect('nothing masked at 1440', !has(at(M, 1440), 'offscreen-content-masked'));

console.log('realistic.html (Thai dashboard, common patterns)');
const R = await run('realistic', ['--stress-text']);
const r375 = at(R, 375);
expect('R1 unbreakable URL causes overflow at 375', has(r375, 'horizontal-overflow', (f) => sel(f).includes('long-url')));
expect('scrollable chip row / table not blamed for overflow', !has(r375, 'horizontal-overflow', (f) => sel(f).includes('chips') || sel(f).includes('table')));
expect('R2 stretched-link ::after covers nested button', has(r375, 'interactive-obscured', (f) => f.selector.includes('fav2')));
expect('properly z-indexed nested button NOT flagged', !has(r375, 'interactive-obscured', (f) => /button\.fav(?!2)/.test(f.selector)));
expect('R3 last button hidden under fixed bottom nav (375)', has(r375, 'interactive-obscured', (f) => f.selector.includes('load-more')));
expect('R3 not flagged at 1440 (bottom nav hidden)', !has(at(R, 1440), 'interactive-obscured', (f) => f.selector.includes('load-more')));
expect('hidden off-canvas drawer links not flagged', !r375.findings.some((f) => sel(f).includes('drawer')));
expect('R4 fixed-width button OK at normal text length', !has(r375, 'text-clipped', (f) => f.selector.includes('save')));
expect('R4 fixed-width button clips under +40% Thai text stress', (r375.stress?.findings || []).some((f) => f.check === 'text-clipped' && f.selector.includes('save')));
expect('sticky topbar vs content: no geometric-overlap error', !has(r375, 'interactive-overlap'));

server.close();
console.log(`\n${pass} passed, ${fail} failed   (outputs in ${tmp})`);
process.exit(fail ? 1 : 0);
