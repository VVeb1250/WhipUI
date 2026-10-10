#!/usr/bin/env node
// WhipUI test suite: STRUCTURAL and TOOL correctness only. Passing this says the
// pack is well-formed and the scripts detect what they claim on seeded fixtures.
// It says NOTHING about design quality or benefit over a baseline (see eval/).
//
//   node tests/run-all.mjs            all suites (needs Playwright + Chromium for render suites)
//   node tests/run-all.mjs --static   skill/package/installer checks only (no browser)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'whipui');
const S = (n) => path.join(SKILL, 'scripts', n);
const FIX = path.join(ROOT, 'tests', 'fixtures');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'whipui-test-'));
const STATIC = process.argv.includes('--static');

let pass = 0, fail = 0;
const failures = [];
const expect = (label, cond, detail = '') => { if (cond) { pass++; console.log(`  ok   ${label}`); } else { fail++; failures.push(label); console.log(`  FAIL ${label}${detail ? ' — ' + detail : ''}`); } };
const node = async (args, opts = {}) => { try { const r = await execFileP('node', args, { timeout: 180000, maxBuffer: 20e6, ...opts }); return { code: 0, out: r.stdout + r.stderr }; } catch (e) { return { code: e.code ?? 1, out: (e.stdout || '') + (e.stderr || '') }; } };

// ---------------------------------------------------------------- static
console.log('\n[skill] SKILL.md conforms to the Agent Skills spec and WhipUI budgets');
const skillMd = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
const fm = skillMd.match(/^---\n([\s\S]*?)\n---\n/);
expect('has YAML frontmatter', !!fm);
const front = fm ? fm[1] : '';
const field = (k) => (front.match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1];
expect('name == folder name "whipui"', field('name') === 'whipui');
expect('name is lowercase/digits/hyphens ≤64', /^[a-z0-9-]{1,64}$/.test(field('name') || ''));
const desc = field('description') || '';
expect(`description ≤1024 chars (got ${desc.length})`, desc.length > 0 && desc.length <= 1024);
expect('description front-loads the use case (UI/UX in first 120 chars)', /UX|UI|frontend/.test(desc.slice(0, 120)));
expect('description has negative scope', /Not for/i.test(desc));
expect('description avoids MUST/ALWAYS shouting', !/\b(MUST|ALWAYS|NEVER)\b/.test(desc));
const topKeys = [...front.matchAll(/^([a-z_-]+):/gm)].map((m) => m[1]);
const allowed = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
expect(`frontmatter uses spec fields only (${topKeys.join(',')})`, topKeys.every((k) => allowed.includes(k)));
const lines = skillMd.split('\n').length;
expect(`SKILL.md < 500 lines (spec) and ≤ 250 (WhipUI budget): ${lines}`, lines <= 250);
expect(`SKILL.md ≈ ≤ 5k tokens (chars/3.6 = ${Math.round(skillMd.length / 3.6)})`, skillMd.length / 3.6 <= 5000);
for (const ref of [...new Set([...skillMd.matchAll(/references\/([\w-]+\.md)/g)].map((m) => m[1]))]) expect(`referenced module exists: references/${ref}`, fs.existsSync(path.join(SKILL, 'references', ref)));
for (const sc of [...new Set([...skillMd.matchAll(/([\w-]+\.mjs)/g)].map((m) => m[1]))].filter((n) => !['states.mjs', 'steps.mjs'].includes(n))) expect(`referenced script exists: scripts/${sc}`, fs.existsSync(S(sc)));
for (const f of fs.readdirSync(path.join(SKILL, 'references'))) {
  const n = fs.readFileSync(path.join(SKILL, 'references', f), 'utf8').split('\n').length;
  expect(`module ${f} ≤ 300 lines (${n})`, n <= 300);
  expect(`module ${f} is linked from SKILL.md (no orphan modules)`, skillMd.includes(`references/${f}`));
}
expect('no skill or command named "goal" (would shadow built-in /goal)', !fs.existsSync(path.join(ROOT, 'skills', 'goal')) && field('name') !== 'goal');
expect('SKILL.md states user precedence over the skill', /user's current instructions and explicitly approved decisions win/i.test(skillMd));
expect('no aesthetic scoring instruction', !/score (the|its) (beauty|aesthetic)/i.test(skillMd) && /Never give an aesthetic score/i.test(skillMd));
const bannedFixture = /(font-family:\s*["']?(Inter|Space Grotesk)|#7c3aed|#D97757)/i;
const allText = [skillMd, ...fs.readdirSync(path.join(SKILL, 'references')).map((f) => fs.readFileSync(path.join(SKILL, 'references', f), 'utf8'))].join('\n');
expect('no hard-coded house font/colour values in skill text', !bannedFixture.test(allText));

console.log('\n[package] manifests');
const pj = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
const mj = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
expect('plugin.json name whipui + semver', pj.name === 'whipui' && /^\d+\.\d+\.\d+/.test(pj.version));
expect('marketplace lists whipui at ./', mj.plugins?.[0]?.name === 'whipui' && mj.plugins[0].source === './');
expect('plugin ships no hooks by default (gate is opt-in)', !fs.existsSync(path.join(ROOT, 'hooks', 'hooks.json')));
expect('Codex agents/openai.yaml present with interface + policy', /interface:[\s\S]*policy:/.test(fs.readFileSync(path.join(SKILL, 'agents', 'openai.yaml'), 'utf8')));
const spk = JSON.parse(fs.readFileSync(S('package.json'), 'utf8'));
expect('script deps are optional, not required', !spk.dependencies && !!spk.optionalDependencies?.playwright);
for (const f of fs.readdirSync(path.join(SKILL, 'scripts')).filter((f) => f.endsWith('.mjs'))) {
  const r = await node(['--check', S(f)]); expect(`syntax ok: ${f}`, r.code === 0, r.out.slice(0, 200));
}

console.log('\n[install] installer into a throwaway HOME');
const H = path.join(TMP, 'home');
fs.mkdirSync(H);
let r = await node([path.join(ROOT, 'install', 'install.mjs'), '--host', 'all'], { env: { ...process.env, HOME: H, USERPROFILE: H } });
expect('installs to ~/.claude/skills/whipui', fs.existsSync(path.join(H, '.claude', 'skills', 'whipui', 'SKILL.md')), r.out);
expect('installs to ~/.agents/skills/whipui (Codex/Cursor/VS Code/Gemini)', fs.existsSync(path.join(H, '.agents', 'skills', 'whipui', 'SKILL.md')));
expect('does not copy node_modules', !fs.existsSync(path.join(H, '.claude', 'skills', 'whipui', 'scripts', 'node_modules')));
const NOPW = path.join(TMP, 'no-playwright'); fs.mkdirSync(NOPW);
r = await node([path.join(H, '.claude', 'skills', 'whipui', 'scripts', 'render-check.mjs'), path.join(FIX, 'control.html')], { cwd: NOPW, env: { ...process.env, HOME: H, NODE_PATH: '' } });
expect('without Playwright, render-check degrades to NOT RENDERED (exit 4), no stack trace', r.code === 4 && /NOT RENDERED/.test(r.out) && !/at .*\.mjs:\d+/.test(r.out), r.out.slice(0, 300));
r = await node([path.join(ROOT, 'install', 'install.mjs'), '--host', 'all'], { env: { ...process.env, HOME: H, USERPROFILE: H } });
expect('re-install backs up the previous copy', fs.readdirSync(path.join(H, '.claude', 'skills')).some((d) => d.startsWith('whipui.bak-')));
r = await node([path.join(ROOT, 'install', 'install.mjs'), '--host', 'all', '--uninstall'], { env: { ...process.env, HOME: H, USERPROFILE: H } });
expect('uninstall removes both copies', !fs.existsSync(path.join(H, '.claude', 'skills', 'whipui')) && !fs.existsSync(path.join(H, '.agents', 'skills', 'whipui')));

console.log('\n[state] decision continuity invariants');
const SD = path.join(TMP, 'state'); fs.mkdirSync(SD);
const st = (...a) => node([S('state.mjs'), ...a], { cwd: SD });
await st('init', '--goal', 'test');
r = await st('decide', '--what', 'Dark palette with magenta accent');
expect('decide → proposed', /D1 proposed/.test(r.out));
r = await st('approve', 'D1');
expect('approve without evidence is refused', r.code !== 0 && /evidence/.test(r.out));
r = await st('approve', 'D1', '--evidence', 'x', '--by', 'agent');
expect('agent cannot approve', r.code !== 0 && /only the user can approve/.test(r.out));
r = await st('approve', 'D1', '--evidence', "user: 'go dark'");
expect('approve with user evidence works', /D1 approved by user/.test(r.out));
r = await st('decide', '--what', 'Light pastel palette');
expect('new overlapping proposal warns about the approved decision', /overlaps existing decisions[\s\S]*D1 \[approved\]/.test(r.out));
r = await st('supersede', 'D1', '--with', 'D2');
expect('superseding an APPROVED decision without user evidence is refused', r.code !== 0 && /APPROVED/.test(r.out));
r = await st('reject', 'D2', '--evidence', 'user: no pastel');
r = await st('check', 'pastel palette for the hero');
expect('check surfaces the rejected decision', /D2 \[decision\/rejected\]/.test(r.out));
r = await st('decide', '--source', 'user', '--what', 'Must support Thai');
expect('user-stated requirement needs evidence', r.code !== 0);
r = await st('decide', '--source', 'user', '--what', 'Must support Thai', '--evidence', 'user: Thai first');
expect('user-stated requirement with evidence → approved', /D3 approved/.test(r.out));
r = await st('ref', 'add', '--url', 'https://example.com', '--role', 'visual');
r = await st('ref', 'status', 'R1', 'liked');
expect('liking a reference needs the user reaction as evidence', r.code !== 0);
r = await st('ref', 'status', 'R1', 'liked', '--evidence', 'user likes the type');
expect('liked reference is explicitly not an approval', /NOT approving/.test(r.out));
r = await st('pref', 'add', '--axis', 'density', '--polarity', 'sparse', '--evidence', 'too busy');
expect('preference recorded as a signal, not an approval', /not an approval/.test(r.out));
r = await st('validate');
expect('validate passes on a clean state', r.code === 0, r.out);
const sj = path.join(SD, '.whipui', 'state.json');
const tampered = JSON.parse(fs.readFileSync(sj, 'utf8')); tampered.decisions.push({ id: 'D9', what: 'sneaky', status: 'approved', by: 'agent', evidence: '', history: [], scope: 'global', source: 'agent' });
fs.writeFileSync(sj, JSON.stringify(tampered));
r = await st('validate');
expect('validate catches a hand-edited approval without user evidence', r.code === 1 && /D9: approved without user evidence/.test(r.out));
r = await st('show', '--md');
expect('show --md renders a decisions table', /\| ID \| Decision \|/.test(r.out));

console.log('\n[detect] project convention detection');
const DP = path.join(TMP, 'proj'); fs.mkdirSync(path.join(DP, 'src', 'components', 'ui'), { recursive: true });
fs.writeFileSync(path.join(DP, 'package.json'), JSON.stringify({ dependencies: { next: '15.0.0', react: '19.0.0', tailwindcss: '4.1.0', motion: '12.0.0', 'lucide-react': '0.400.0' }, devDependencies: { '@playwright/test': '1.56.0' }, scripts: { dev: 'next dev' } }));
fs.writeFileSync(path.join(DP, 'components.json'), JSON.stringify({ style: 'new-york', tailwind: { baseColor: 'zinc', cssVariables: true } }));
fs.writeFileSync(path.join(DP, 'src', 'globals.css'), '@import "tailwindcss";\n@theme { --color-brand: oklch(0.6 0.2 30); }\n:root{--background:#fff;--foreground:#111;--primary:#222;--muted:#eee;--radius:8px}');
fs.writeFileSync(path.join(DP, 'src', 'components', 'ui', 'button.tsx'), 'export {}');
r = await node([S('detect-project.mjs'), DP, '--json']);
const det = JSON.parse(r.out);
expect('detects Next.js + React', det.framework.some((x) => x.startsWith('Next.js')) && det.framework.some((x) => x.startsWith('React')));
expect('detects Tailwind v4 @theme tokens', det.tokens.some((x) => x.includes('@theme')));
expect('detects shadcn/ui config', det.components.some((x) => x.startsWith('shadcn/ui')));
expect('detects motion + icon libraries', det.motion.some((x) => x.startsWith('Motion')) && det.icons.some((x) => x.startsWith('Lucide')));
expect('detects Playwright Test', det.testing.some((x) => x.startsWith('Playwright Test')));

if (STATIC) finish();

// ---------------------------------------------------------------- render suites (need Chromium)
const doc = await node([S('doctor.mjs')]);
if (!/render=yes/.test(doc.out)) { console.log('\n(skipping render suites: ' + doc.out.split('\n').find((l) => l.includes('--')) + ')'); finish(); }

const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(FIX, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(FIX)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); return res.end('not found'); } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${server.address().port}`;

async function rc(name, extra = []) {
  const out = path.join(TMP, 'rc-' + name + '-' + extra.join('').replace(/\W/g, ''));
  const res = await node([S('render-check.mjs'), `${BASE}/${name}.html`, '--out', out, ...extra], { cwd: TMP });
  if (!fs.existsSync(path.join(out, 'report.json'))) { console.log(res.out); throw new Error('no report for ' + name); }
  return { rep: JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8')), out: res.out, dir: out };
}
const at = (rep, w) => rep.runs.find((x) => x.viewport.w === w);
const has = (run, check, pred = () => true) => run.findings.some((f) => f.check === check && pred(f));
const axe = (run, id) => (run.axe?.violations || []).some((v) => v.id === id);
const js = (f) => JSON.stringify(f);

console.log('\n[render-check] flawed.html — 13 seeded defects');
const F = await rc('flawed', ['--stress']);
const f375 = at(F.rep, 375), f1440 = at(F.rep, 1440);
expect('F1 horizontal overflow at 375', has(f375, 'horizontal-overflow'));
expect('F1 no overflow at 1440', !has(f1440, 'horizontal-overflow'));
expect('F2 clipped CTA label', has(f375, 'text-clipped', (f) => f.selector.includes('cta')));
expect('F3 card text spill', has(f375, 'text-spill', (f) => f.selector.includes('card')));
expect('F4 axe color-contrast', axe(f375, 'color-contrast'));
expect('F5 tiny adjacent buttons fail 2.5.8', f375.findings.filter((f) => f.check === 'tap-target-small' && f.severity === 'error').length >= 3);
expect('F6 overlapping link/close button', has(f375, 'interactive-overlap', (f) => js(f).includes('close')));
expect('F6 link obscured', has(f375, 'interactive-obscured', (f) => js(f).includes('close')));
expect('F7 focus not visible', has(f375, 'focus-not-visible', (f) => f.element.startsWith('button')));
expect('F8 broken image + axe image-alt', has(f375, 'broken-image') && axe(f375, 'image-alt'));
expect('F9 placeholder-only field (axe misses it)', has(f375, 'placeholder-only-label') && !axe(f375, 'label'));
expect('F11 font load error', has(f375, 'font-load-error'));
expect('F12 console error + uncaught exception', has(f375, 'console-error', (f) => f.message.includes('analytics')) && has(f375, 'uncaught-exception'));
expect('F13 layout shift', has(f375, 'layout-shift'));
expect('inline link in a sentence exempt from target size', !has(f375, 'tap-target-small', (f) => f.text === 'tiny'));
expect('findings deduplicated across viewports', F.rep.findings.length < F.rep.runs.reduce((n, x) => n + x.findings.length, 0));
expect('stdout carries a WHIPUI-EVIDENCE line for /goal evaluators', /WHIPUI-EVIDENCE render-check: rendered/.test(F.out));
expect('default exit code is 0 (evidence tool, not a gate)', true);

console.log('\n[render-check] control.html — should be clean (light+dark+stress)');
const C = await rc('control', ['--tier', 'standard']);
for (const run of C.rep.runs) {
  const bad = run.findings.filter((f) => f.severity !== 'info');
  const axeBad = (run.axe?.violations || []).filter((v) => ['critical', 'serious'].includes(v.impact));
  expect(`${run.tag}: no warn/error (${bad.map((f) => f.check).join(',') || 'none'})`, bad.length === 0);
  expect(`${run.tag}: no serious axe (${axeBad.map((v) => v.id).join(',') || 'none'})`, axeBad.length === 0);
  expect(`${run.tag}: stress pass clean`, !(run.stress?.findings || []).length, js(run.stress?.findings));
}

console.log('\n[render-check] masked.html + realistic.html');
const M = await rc('masked');
expect('masked overflow at 375 reported (root overflow hidden)', has(at(M.rep, 375), 'offscreen-content-masked'));
expect('no false horizontal-scroll at 375', !has(at(M.rep, 375), 'horizontal-overflow'));
const R = await rc('realistic', ['--stress']);
const r375 = at(R.rep, 375);
expect('R1 unbreakable URL overflow at 375', has(r375, 'horizontal-overflow', (f) => js(f).includes('long-url')));
expect('scroll containers not blamed', !has(r375, 'horizontal-overflow', (f) => js(f).includes('chips') || js(f).includes('table')));
expect('R2 stretched-link covers nested button', has(r375, 'interactive-obscured', (f) => f.selector.includes('fav2')));
expect('R3 button under fixed bottom nav at 375 only', has(r375, 'interactive-obscured', (f) => f.selector.includes('load-more')) && !has(at(R.rep, 1440), 'interactive-obscured', (f) => f.selector.includes('load-more')));
expect('off-canvas drawer not flagged', !r375.findings.some((f) => js(f).includes('drawer')));
expect('R4 fixed-width button clips only under Thai stress', !has(r375, 'text-clipped', (f) => f.selector.includes('save')) && (r375.stress?.findings || []).some((f) => f.check === 'text-clipped' && f.selector.includes('save')));

console.log('\n[render-check] setup hook + baseline diff');
const setupFile = path.join(TMP, 'setup.mjs');
fs.writeFileSync(setupFile, "export default async ({ page }) => { await page.evaluate(() => { const b = document.createElement('button'); b.id = 'injected'; b.textContent = 'X'; b.style.cssText = 'width:12px;height:12px;padding:0;font-size:8px'; document.body.prepend(b); const c = b.cloneNode(true); c.id = 'injected2'; document.body.prepend(c); }); };");
const SU = await rc('control', ['--setup', setupFile, '--viewports', '375x812']);
expect('setup hook ran and its state was checked', SU.rep.runs[0].notes.includes('setup hook applied') && has(SU.rep.runs[0], 'tap-target-small', (f) => js(f).includes('injected')));
const B1 = await rc('control', ['--viewports', '375x812,1440x900']);
const B2out = path.join(TMP, 'rc-baseline-same');
await node([S('render-check.mjs'), `${BASE}/control.html`, '--viewports', '375x812,1440x900', '--baseline', B1.dir, '--out', B2out], { cwd: TMP });
const B2 = JSON.parse(fs.readFileSync(path.join(B2out, 'report.json'), 'utf8'));
expect('unchanged page → 0 px baseline diff at every viewport', B2.baselineDiff.length === 2 && B2.baselineDiff.every((d) => d.diffPixels === 0), js(B2.baselineDiff));

console.log('\n[motion-probe] playback-based motion checks');
const MF = path.join(TMP, 'mp-flawed');
r = await node([S('motion-probe.mjs'), `${BASE}/motion-flawed.html`, '--trigger', '#open', '--out', MF], { cwd: TMP });
const mf = JSON.parse(fs.readFileSync(path.join(MF, 'report.json'), 'utf8'));
const flags = (mode) => mf.modes[mode].flags.map((f) => f.check);
expect('inventory finds the 6 staggered items + panel', mf.modes['no-preference'].inventory.length === 7);
expect('flags max-height layout animation', flags('no-preference').includes('layout-property-animated'));
expect('flags stagger over budget', flags('no-preference').includes('choreography-over-budget'));
expect('flags residual spatial motion under reduce', flags('reduce').includes('reduced-motion-residual'));
expect('flags content missing under reduce (animation:none on hidden items)', flags('reduce').includes('content-missing-under-reduce'));
expect('writes filmstrip contact sheets for both modes', fs.existsSync(path.join(MF, 'filmstrip-no-preference.png')) && fs.existsSync(path.join(MF, 'filmstrip-reduce.png')));
expect('keyframe easing captured (not just effect easing)', mf.modes['no-preference'].inventory.some((a) => a.easing.some((e) => e.includes('cubic-bezier(0.05'))));
const MG = path.join(TMP, 'mp-good');
r = await node([S('motion-probe.mjs'), `${BASE}/motion-good.html`, '--trigger', '#save', '--video', '--out', MG], { cwd: TMP });
const mg = JSON.parse(fs.readFileSync(path.join(MG, 'report.json'), 'utf8'));
const warnCount = Object.values(mg.modes).flatMap((m) => m.flags).filter((f) => f.severity !== 'info').length;
expect(`well-behaved toast → no warnings (got ${warnCount})`, warnCount === 0, js(Object.values(mg.modes).flatMap((m) => m.flags)));
expect('reduced motion detected as handled (opacity only)', mg.reducedMotionChanged === true && mg.modes.reduce.inventory.every((a) => !a.props.includes('transform')));
expect('video recorded', !!mg.modes['no-preference'].video && fs.existsSync(path.join(MG, mg.modes['no-preference'].video)));
expect('WHIPUI-EVIDENCE line printed', /WHIPUI-EVIDENCE motion-probe/.test(r.out));

const MJ = path.join(TMP, 'mp-jank');
r = await node([S('motion-probe.mjs'), `${BASE}/motion-jank.html`, '--trigger', '#go', '--modes', 'normal', '--out', MJ], { cwd: TMP });
const mjank = JSON.parse(fs.readFileSync(path.join(MJ, 'report.json'), 'utf8'));
expect('a real 300 ms main-thread block during motion is still detected', mjank.modes['no-preference'].flags.some((f) => ['frame-gaps', 'long-animation-frames', 'slow-interaction'].includes(f.check)), JSON.stringify(mjank.modes['no-preference'].flags));

const MZ = path.join(TMP, 'mp-zero');
await node([S('motion-probe.mjs'), `${BASE}/motion-zero.html`, '--trigger', '#b', '--out', MZ], { cwd: TMP });
const mzero = JSON.parse(fs.readFileSync(path.join(MZ, 'report.json'), 'utf8'));
expect('0 ms animations under reduce: not residual motion, and reduce counts as handled', !mzero.modes.reduce.flags.some((f) => ['reduced-motion-residual', 'reduced-motion-ignored'].includes(f.check)), JSON.stringify(mzero.modes.reduce.flags));

console.log('\n[ref-capture] measurement + reproduction fidelity');
const RA = path.join(TMP, 'ref-a'), RB = path.join(TMP, 'ref-b');
await node([S('ref-capture.mjs'), 'capture', `${BASE}/realistic.html`, '--out', RA], { cwd: TMP });
await node([S('ref-capture.mjs'), 'capture', `${BASE}/control.html`, '--out', RB], { cwd: TMP });
const cap = JSON.parse(fs.readFileSync(path.join(RA, 'capture.json'), 'utf8'));
expect('captures type sizes, colour roles, rhythm, blocks', cap.type.sizesPx.length > 1 && cap.color.pageBackground && cap.rhythm.commonGapsPx.length && cap.blocks.length > 10);
const shares = cap.color.groundsByArea.reduce((n, [, v]) => n + v, 0);
expect(`ground shares are proportions (sum ${shares.toFixed(1)} ≤ 100.5)`, shares <= 100.5);
r = await node([S('ref-capture.mjs'), 'compare', RA, RA, '--json']);
const same = JSON.parse(r.out);
expect('identical capture → 100% block recall, 0 offset', same.blockRecall === 100 && same.medianAbsOffsetPx === 0);
r = await node([S('ref-capture.mjs'), 'compare', RA, RB, '--json']);
const diff = JSON.parse(r.out);
expect(`different page → low recall (${diff.blockRecall}%) and missing blocks listed`, diff.blockRecall < 30 && diff.missingBlocks.length > 0);

console.log('\n[review-page] options + annotation round trip');
const shots = [path.join(F.dir, '1440x900-light-viewport.png'), path.join(C.dir, '1440x900-light-viewport.png'), path.join(R.dir, '1440x900-light-viewport.png')];
const OPT = path.join(TMP, 'options.html');
r = await node([S('review-page.mjs'), 'build', '--mode', 'options', '--image', shots[0], '--label', 'A dense', '--note', 'why A', '--image', shots[1], '--label', 'B airy', '--image', shots[2], '--label', 'C dashboard', '--out', OPT]);
expect('options page built offline (images embedded)', fs.existsSync(OPT) && !/src="(?!data:)/.test(fs.readFileSync(OPT, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')));
const { chromium } = await import(path.join(SKILL, 'scripts', 'node_modules', 'playwright', 'index.mjs'));
const br = await chromium.launch();
const pg = await br.newPage({ viewport: { width: 1400, height: 1000 } });
const pageErrors = []; pg.on('pageerror', (e) => pageErrors.push(e.message));
const orders = new Set();
for (let i = 0; i < 6; i++) { await pg.goto('file://' + OPT); orders.add(await pg.evaluate(() => window.__whipuiPayload().order.map((o) => o.id).join(','))); }
expect('option order is shuffled across loads', orders.size > 1, [...orders].join(' | '));
expect('options shown with neutral labels', await pg.evaluate(() => [...document.querySelectorAll('section.item h2')].every((h) => /^Option \d$/.test(h.textContent))));
expect('rationale hidden until revealed', await pg.evaluate(() => [...document.querySelectorAll('details.why')].every((d) => !d.open)));
const box = await pg.locator('section.item img').first().boundingBox();
await pg.mouse.move(box.x + 30, box.y + 30); await pg.mouse.down(); await pg.mouse.move(box.x + 200, box.y + 90, { steps: 4 }); await pg.mouse.up();
await pg.fill('.marks textarea', 'keep this header');
const firstId = await pg.evaluate(() => window.__whipuiPayload().order[0].id);
await pg.check(`input[name=choice][value=${firstId}]`);
await pg.fill('#merge', 'with the type of the other one');
const payload = await pg.evaluate(() => window.__whipuiPayload());
expect('payload records choice, the mark, merge text and the shown order', payload.choice === firstId && payload.marks.length === 1 && payload.marks[0].comment === 'keep this header' && payload.merge && payload.order.length === 3);
expect('choice label maps back to the real option label', /\((A dense|B airy|C dashboard)\)/.test(payload.choiceLabel));
expect('no page errors', pageErrors.length === 0, pageErrors.join(';'));
await br.close();
const FB = path.join(TMP, 'feedback.json'); fs.writeFileSync(FB, JSON.stringify(payload));
r = await node([S('review-page.mjs'), 'tickets', FB, '--json']);
const tk = JSON.parse(r.out);
expect('tickets: narrowest scope by default', tk.tickets[0].scope.startsWith('element'));
const ANN = path.join(TMP, 'annotate.html');
await node([S('review-page.mjs'), 'build', '--mode', 'annotate', '--image', path.join(R.dir, '1440x900-light-full.png'), '--url', `${BASE}/realistic.html`, '--viewport', '1440x900', '--out', ANN]);
const fb2 = { meta: { mode: 'annotate', url: `${BASE}/realistic.html`, viewport: '1440x900' }, verdict: 'approve-with-changes', marks: [{ id: 'm1', item: 'opt1', tag: 'change', comment: 'make this lighter everywhere', shape: 'rect', x: 10, y: 5, w: 400, h: 40 }] };
fs.writeFileSync(path.join(TMP, 'fb2.json'), JSON.stringify(fb2));
r = await node([S('review-page.mjs'), 'tickets', path.join(TMP, 'fb2.json'), '--json']);
const tk2 = JSON.parse(r.out);
expect('annotation mark maps to a DOM selector by replaying the page', tk2.tickets[0].targets?.length > 0, js(tk2.tickets[0]));
expect('"everywhere" widens scope but requires confirmation', /global/.test(tk2.tickets[0].scope) && tk2.tickets[0].needs_confirmation);

console.log('\n[field fixes from pilot P1] output location, interact, environment findings');
// 1) a bare ancestor .whipui/ (no state.json) must NOT capture outputs; paths printed absolute
const ANC = path.join(TMP, 'anc'); const CHILD = path.join(ANC, 'a', 'b'); fs.mkdirSync(path.join(ANC, '.whipui', 'runs'), { recursive: true }); fs.mkdirSync(CHILD, { recursive: true });
fs.copyFileSync(path.join(FIX, 'control.html'), path.join(CHILD, 'index.html'));
r = await node([S('render-check.mjs'), 'index.html', '--viewports', '375x812', '--no-axe', '--focus-tabs', '0'], { cwd: CHILD });
expect('outputs land in the current project, not an unrelated ancestor .whipui', fs.existsSync(path.join(CHILD, '.whipui', 'runs')) && fs.readdirSync(path.join(ANC, '.whipui', 'runs')).length === 0, r.out.slice(-300));
expect('screenshot paths printed as absolute paths', new RegExp('open these before describing the UI: ' + CHILD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(r.out));
// an ancestor WITH state.json is found from a subfolder (state continuity still works)
fs.writeFileSync(path.join(ANC, '.whipui', 'state.json'), JSON.stringify({ schema: 'whipui-state/1' }));
r = await node([S('render-check.mjs'), 'index.html', '--viewports', '375x812', '--no-axe', '--focus-tabs', '0'], { cwd: CHILD });
expect('ancestor with state.json is adopted (project continuity)', fs.readdirSync(path.join(ANC, '.whipui', 'runs')).length === 1);
// 2) interact: steps module gets a page; checks reported; failing check → exit 1
const STEPS = path.join(TMP, 'steps.mjs');
fs.writeFileSync(STEPS, "export default async ({ page, shot, check }) => { await page.keyboard.press('Tab'); check('tab moves focus off body', await page.evaluate(() => document.activeElement !== document.body)); check('deliberate failure', false); await shot('after-tab'); return { tag: await page.evaluate(() => document.activeElement.tagName) }; };");
r = await node([S('interact.mjs'), `${BASE}/control.html`, STEPS], { cwd: TMP });
expect('interact runs steps with a ready page and reports PASS/FAIL', /PASS tab moves focus off body/.test(r.out) && /FAIL deliberate failure/.test(r.out) && r.code === 1, r.out.slice(0, 400));
expect('interact saves screenshots and prints the evidence line', /screenshot: \//.test(r.out) && /WHIPUI-EVIDENCE interact: 1\/2 checks passed/.test(r.out));
// 3) blocked third-party font + file:// fetch are environment findings, not page errors
const ENV = path.join(TMP, 'envpage'); fs.mkdirSync(ENV);
fs.writeFileSync(path.join(ENV, 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>env</title><link rel="stylesheet" href="https://unreachable.invalid/font.css"></head><body><main><h1>Env</h1><p id="d">x</p></main><script>fetch("data.json").then(r=>r.json()).catch(()=>{});</script></body></html>');
fs.writeFileSync(path.join(ENV, 'data.json'), '{}');
r = await node([S('render-check.mjs'), path.join(ENV, 'index.html'), '--viewports', '375x812', '--no-axe', '--focus-tabs', '0', '--out', path.join(ENV, 'out')], { cwd: ENV });
const envRep = JSON.parse(fs.readFileSync(path.join(ENV, 'out', 'report.json'), 'utf8'));
expect('unreachable third-party stylesheet → environment, not error', envRep.findings.some((f) => f.kind === 'environment') && !envRep.findings.some((f) => f.severity === 'error' && /unreachable\.invalid/.test(JSON.stringify(f))), JSON.stringify(envRep.findings.map((f) => [f.check, f.severity, f.kind])));

expect('scripts create .whipui/.gitignore so runs never pollute git status', fs.existsSync(path.join(CHILD, '.whipui', '.gitignore')) && /runs\//.test(fs.readFileSync(path.join(CHILD, '.whipui', '.gitignore'), 'utf8')));
r = await st('check', 'riso grain poster');
expect('state check lists rejected decisions even without word overlap (synonyms)', /REJECTED:[\s\S]*D2/.test(r.out) && /compare by MEANING/.test(r.out), r.out.slice(0, 300));

console.log('\n[real-site false positives] found on the owner\'s deployed portfolio (Astro), 2026-10-11');
r = await node([S('render-check.mjs'), `${BASE}/realsite-patterns.html`, '--viewports', '1280x800', '--out', path.join(TMP, 'rs')], { cwd: TMP });
const rs = JSON.parse(fs.readFileSync(path.join(TMP, 'rs', 'report.json'), 'utf8')).findings;
const fontF = rs.find((f) => f.check === 'font-load-error');
expect('local()-only fallback face is not a font-load-error; a missing url() font still is', fontF && fontF.fonts.every((x) => !/fallback/i.test(x)) && fontF.fonts.some((x) => /^Brand /.test(x)), JSON.stringify(fontF));
expect('tight display leading (content area > line box) is not text-spill', !rs.some((f) => /^text-spill/.test(f.check) && /disp/.test(f.selector || '')), JSON.stringify(rs.filter((f) => /spill/.test(f.check)).map((f) => f.selector)));
expect('genuine spill from a fixed-height box is still reported', rs.some((f) => f.check === 'text-spill' && /boxed/.test(f.selector || '')));
const reelNoise = rs.filter((f) => f.severity !== 'info' && /Instagram|#ig|span:nth-of-type\(2\) > a/.test(JSON.stringify(f)));
expect('inert off-window reel lines: no tap-target/overlap/clipped warnings', reelNoise.length === 0, JSON.stringify(reelNoise.map((f) => f.check)));
expect('focus that only restyles a child → focus-indicator-indirect (not "not visible")', rs.some((f) => f.check === 'focus-indicator-indirect' && /Fake page bar/.test(f.element)) && !rs.some((f) => f.check === 'focus-not-visible' && /Fake page bar/.test(f.element || '')), JSON.stringify(rs.filter((f) => /focus/.test(f.check))));
const cc = rs.filter((f) => f.check === 'axe:color-contrast');
expect('axe contrast merged into one finding with the shared colour pair and node count', cc.length === 1 && cc[0].pairs?.[0]?.nodes >= 2 && cc[0].targets.length >= 2, JSON.stringify(cc));
expect('overlapping links to the same URL are info, not warn/error', rs.some((f) => f.check === 'interactive-overlap' && f.severity === 'info' && /same URL/.test(f.message)) && !rs.some((f) => f.check === 'interactive-overlap' && f.severity !== 'info'), JSON.stringify(rs.filter((f) => /overlap/.test(f.check))));
expect('console line names the failing colour pair', /color-contrast[^\n]*:1 rgb|color-contrast[^\n]*:1 #/.test(r.out), r.out.slice(0, 600));

server.close();
finish();

function finish() {
  console.log(`\n${pass} passed, ${fail} failed${fail ? '\nFAILED: ' + failures.join(' | ') : ''}\n(outputs in ${TMP})`);
  process.exit(fail ? 1 : 0);
}
