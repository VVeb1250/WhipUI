#!/usr/bin/env node
// Analyze a pilot AFTER judging. Joins judgments.csv with the blinding keys, then reports:
//  - per contrast: wins/losses/ties, win rate with 95% Wilson CI, exact two-sided sign test,
//    brief-clustered bootstrap CI (pairs within a brief are correlated)
//  - Bradley–Terry strengths across arms (descriptive, bootstrap over briefs)
//  - intra-rater retest consistency (if ≤ 4/6, treat close contrasts as noise)
//  - cost ledger per arm (tokens, $ , wall time, turns) and ratio vs A
//  - pre-registered decision thresholds, including the non-inferiority rule (D10)
//
//   node eval/analyze.mjs --pilot P1 [--judgments path/to/judgments.csv]
//   node eval/analyze.mjs --selftest      (checks the statistics on known values)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EVAL = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

// ---------- statistics ----------
export function wilson(k, n, z = 1.959964) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - h) / d, (c + h) / d];
}
function logChoose(n, k) { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s; }
export function signTest(k, n) { // exact two-sided binomial p, H0 p=0.5
  if (!n) return 1;
  const pk = (i) => Math.exp(logChoose(n, i) - n * Math.LN2);
  const obs = pk(k); let p = 0;
  for (let i = 0; i <= n; i++) if (pk(i) <= obs * (1 + 1e-9)) p += pk(i);
  return Math.min(1, p);
}
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function clusterBootstrap(rows, B = 4000, seed = 7) { // rows: [{cluster, win(0|1)}]; returns 95% CI of win rate
  const by = {}; for (const r of rows) (by[r.cluster] ||= []).push(r.win);
  const cl = Object.values(by); if (!cl.length) return [0, 1];
  const rnd = mulberry(seed); const stats = [];
  for (let b = 0; b < B; b++) { let w = 0, n = 0; for (let i = 0; i < cl.length; i++) { const c = cl[Math.floor(rnd() * cl.length)]; for (const x of c) { w += x; n++; } } stats.push(n ? w / n : 0.5); }
  stats.sort((a, b) => a - b); return [stats[Math.floor(0.025 * B)], stats[Math.floor(0.975 * B)]];
}
export function bradleyTerry(comps, items, iters = 500) { // comps: [{w, l}] (ties excluded); MM algorithm, mean-normalised log strengths
  const p = Object.fromEntries(items.map((i) => [i, 1]));
  for (let t = 0; t < iters; t++) {
    for (const i of items) {
      const wins = comps.filter((c) => c.w === i).length + 0.5; // tiny prior keeps all-loss items finite
      let den = 0; for (const c of comps) if (c.w === i || c.l === i) { const j = c.w === i ? c.l : c.w; den += 1 / (p[i] + p[j]); }
      den += 1 / (p[i] + 1); p[i] = wins / den;
    }
    const g = Math.exp(items.reduce((s, i) => s + Math.log(p[i]), 0) / items.length); for (const i of items) p[i] /= g;
  }
  return Object.fromEntries(items.map((i) => [i, Math.log(p[i])]));
}

function csv(file) {
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  const parse = (l) => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  return lines.slice(1).map((l) => Object.fromEntries(parse(l).map((v, i) => [head[i], v])));
}

if (args.includes('--selftest')) {
  const near = (a, b, e = 1e-3) => Math.abs(a - b) < e;
  const ok = (l, c) => console.log(`${c ? 'ok  ' : 'FAIL'} ${l}`) || c;
  let all = true;
  const w = wilson(14, 20); all &= ok(`Wilson 14/20 = [${w.map((x) => x.toFixed(3))}] ≈ [0.481,0.855]`, near(w[0], 0.481) && near(w[1], 0.855));
  all &= ok(`sign test 15/20 p=${signTest(15, 20).toFixed(4)} ≈ 0.0414`, near(signTest(15, 20), 0.0414, 5e-4));
  all &= ok(`sign test 14/20 p=${signTest(14, 20).toFixed(4)} ≈ 0.1153`, near(signTest(14, 20), 0.1153, 5e-4));
  all &= ok('sign test 10/20 p=1', near(signTest(10, 20), 1));
  const bt = bradleyTerry([...Array(8)].map(() => ({ w: 'D', l: 'A' })).concat([...Array(2)].map(() => ({ w: 'A', l: 'D' }))), ['A', 'D']);
  all &= ok(`Bradley–Terry 8–2: D>A (Δlog=${(bt.D - bt.A).toFixed(2)})`, bt.D > bt.A);
  const ci = clusterBootstrap([...Array(10)].map((_, i) => ({ cluster: 'b' + (i % 5), win: i < 7 ? 1 : 0 })));
  all &= ok(`cluster bootstrap CI [${ci.map((x) => x.toFixed(2))}] contains 0.7`, ci[0] <= 0.7 && ci[1] >= 0.7);
  process.exit(all ? 0 : 1);
}

// ---------- analysis ----------
const pilot = opt('--pilot', 'P1');
const OUT = path.join(EVAL, 'results', pilot);
const jfile = opt('--judgments', path.join(OUT, 'judgments.csv'));
const key = JSON.parse(fs.readFileSync(path.join(OUT, 'KEY-do-not-open-before-judging.json'), 'utf8'));
const runs = fs.existsSync(path.join(OUT, 'runs.csv')) ? csv(path.join(OUT, 'runs.csv')) : [];
const L = [];
const say = (s = '') => { L.push(s); console.log(s); };
say(`# Pilot ${pilot} analysis (${new Date().toISOString()})`);

// cost ledger (available even before judging)
const arms = [...new Set(runs.map((r) => r.arm))];
const med = (a) => { const s = a.filter((x) => !Number.isNaN(x)).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const costOf = (arm, f) => med(runs.filter((r) => r.arm === arm).map((r) => Number(r[f])));
say('\n## Cost ledger (median per run)\n\n| arm | runs | wall s | input+cache tokens | output tokens | $ | turns | render errors |\n|---|---|---|---|---|---|---|---|');
for (const a of arms) {
  const rs = runs.filter((r) => r.arm === a);
  const tok = med(rs.map((r) => Number(r.input_tokens || 0) + Number(r.cache_read_tokens || 0) + Number(r.cache_write_tokens || 0)));
  say(`| ${a} | ${rs.length} | ${costOf(a, 'wall_clock_s')} | ${tok} | ${costOf(a, 'output_tokens')} | ${costOf(a, 'cost_usd')} | ${costOf(a, 'num_turns')} | ${costOf(a, 'render_errors')} |`);
}
// Ratios are computed PER BRIEF (paired), then summarised as median and as totals. A ratio of medians is
// not a paired ratio (reviewer caught P1 being misreported this way).
const tokOf = (r) => Number(r.input_tokens || 0) + Number(r.cache_read_tokens || 0) + Number(r.cache_write_tokens || 0) + Number(r.output_tokens || 0);
const pairRatios = (a, f) => { const out = []; for (const b of [...new Set(runs.map((r) => r.brief_id))]) { const x = runs.find((r) => r.brief_id === b && r.arm === a && r.seed === '1'), y = runs.find((r) => r.brief_id === b && r.arm === 'A' && r.seed === '1'); if (x && y) out.push({ brief: b, r: f(x) / f(y) }); } return out; };
const total = (a, f) => runs.filter((r) => r.arm === a).reduce((s, r) => s + f(r), 0);
const costRatio = {}, tokenRatio = {};
for (const a of arms.filter((x) => x !== 'A')) if (arms.includes('A')) {
  const pc = pairRatios(a, (r) => Number(r.cost_usd)), pt = pairRatios(a, tokOf);
  costRatio[a] = med(pc.map((x) => x.r)); tokenRatio[a] = med(pt.map((x) => x.r));
  say(`${a}/A cost per brief: ${pc.map((x) => `${x.brief} ${x.r.toFixed(2)}×`).join(', ')} · median ${costRatio[a].toFixed(2)}× · total ${(total(a, (r) => Number(r.cost_usd)) / total('A', (r) => Number(r.cost_usd))).toFixed(2)}×`);
  say(`${a}/A tokens per brief: ${pt.map((x) => `${x.brief} ${x.r.toFixed(2)}×`).join(', ')} · median ${tokenRatio[a].toFixed(2)}× · total ${(total(a, tokOf) / total('A', tokOf)).toFixed(2)}×`);
}
const ratio = (a) => Math.max(costRatio[a] ?? NaN, tokenRatio[a] ?? NaN);

if (!fs.existsSync(jfile)) { say('\n(no judgments.csv yet: preference analysis pending human judging)'); fs.writeFileSync(path.join(OUT, 'analysis.md'), L.join('\n') + '\n'); process.exit(0); }

const pairKey = Object.assign({}, ...fs.readdirSync(OUT).filter((f) => /judging.*-key\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'))));
// Contrast is derived from the arms behind the two output IDs (robust even if a judging page was rebuilt and
// its pair→contrast map overwritten). Order = which arm's win rate is reported.
const ORDER = ['Cv2', 'C', 'D', 'Cp', 'T', 'B', 'Aa', 'A'];
const contrastOf = (a, b) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? `${a}-${b}` : `${b}-${a}`);
const J = csv(jfile).map((j) => { const leftArm = key[j.left_output_id]?.arm, rightArm = key[j.right_output_id]?.arm; return { ...j, leftArm, rightArm, contrast: contrastOf(leftArm, rightArm) }; });
const main = J.filter((j) => j.is_retest !== '1');
say(`\n## Preference (owner, blinded) — ${main.length} judgments, ${J.length - main.length} retests`);
say('\n| contrast | first wins | second wins | ties/both-bad | win rate (first) | 95% Wilson | exact p | brief-clustered 95% |\n|---|---|---|---|---|---|---|---|');
const results = {};
for (const c of [...new Set(main.map((j) => j.contrast))]) {
  const [x, y] = c.split('-');
  const rows = main.filter((j) => j.contrast === c);
  let w = 0, l = 0, t = 0; const cl = [];
  for (const j of rows) {
    const winner = j.choice === 'left' ? j.leftArm : j.choice === 'right' ? j.rightArm : null;
    if (!winner) { t++; continue; }
    const win = winner === x ? 1 : 0; w += win; l += 1 - win; cl.push({ cluster: j.brief_id, win });
  }
  const n = w + l, ci = wilson(w, n), bci = clusterBootstrap(cl);
  results[c] = { w, l, t, n, rate: n ? w / n : NaN };
  say(`| ${c} | ${w} (${x}) | ${l} (${y}) | ${t} | ${n ? (w / n * 100).toFixed(0) + '%' : '—'} | ${(ci[0] * 100).toFixed(0)}–${(ci[1] * 100).toFixed(0)}% | ${signTest(w, n).toFixed(3)} | ${(bci[0] * 100).toFixed(0)}–${(bci[1] * 100).toFixed(0)}% |`);
}
const comps = main.flatMap((j) => j.choice === 'left' ? [{ w: j.leftArm, l: j.rightArm }] : j.choice === 'right' ? [{ w: j.rightArm, l: j.leftArm }] : []);
const items = [...new Set(main.flatMap((j) => [j.leftArm, j.rightArm]))].filter(Boolean);
if (items.length > 1) { const bt = bradleyTerry(comps, items); say('\nBradley–Terry log-strength (descriptive): ' + items.sort((a, b) => bt[b] - bt[a]).map((i) => `${i} ${bt[i].toFixed(2)}`).join(' · ')); }
const re = J.filter((j) => j.is_retest === '1');
let same = 0;
for (const r of re) { const o = main.find((m) => m.pair_id === r.retest_of_pair_id); if (!o) continue; const ow = o.choice === 'left' ? o.leftArm : o.choice === 'right' ? o.rightArm : o.choice; const rw = r.choice === 'left' ? r.leftArm : r.choice === 'right' ? r.rightArm : r.choice; if (ow === rw) same++; }
if (re.length) say(`\nRetest consistency: ${same}/${re.length}${same / re.length <= 4 / 6 ? ' — LOW: treat close contrasts as indistinguishable from noise' : ''}`);

say('\n## Pre-registered decisions');
const label = ['D-A', 'Cv2-A', 'C-A'].find((c) => results[c]);
const D_A = label ? results[label] : null;
const top = label ? label.split('-')[0] : null;
if (D_A && arms.includes('A') && arms.includes(top)) {
  const r = ratio(top);
  if (D_A.n && D_A.rate < 0.40) say(`- NON-INFERIORITY FAIL: ${label} owner win rate ${(D_A.rate * 100).toFixed(0)}% < 40% → defect: fix WhipUI before any other claim (D10)`);
  if (r >= 1.5 && !(D_A.rate >= 0.75)) say(`- COST: ${top}/A median paired cost/token ratio ${r.toFixed(2)}× ≥ 1.5× without a large preference gain → shrink/redirect`);
  if (D_A.rate <= 0.60 && r >= 1.5) say('- SHRINK/REDIRECT threshold met (win ≤ 60% and cost ≥ 1.5×)');
  if (results['B-A'] && results['C-B'] && results['B-A'].rate >= 0.6 && results['C-B'].rate <= 0.55) say('- References explain most of the gain (B-A strong, C-B weak) → invest in references, not skill text');
  if (D_A.rate >= 0.75) say(`- PROMISING (≥75%): replicate with new briefs/raters before claiming superiority`);
  if (D_A.rate > 0.40 && D_A.rate < 0.75) say('- Between thresholds: pre-registered next step is 6–8 NEW briefs, not re-judging');
} else say('- (needs A and C or D arms)');
say('\nPower note: with ~8 decisive judgments per contrast only near-unanimous preferences are detectable; ~20–30 pooled judgments detect a true 80% preference with ≈0.8 power and 70% with only ≈0.4–0.6. A null result is not equivalence.');
fs.writeFileSync(path.join(OUT, 'analysis.md'), L.join('\n') + '\n');
