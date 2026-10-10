#!/usr/bin/env node
// Build a BLINDED pairwise judging page for the owner from a pilot's captures.
// Left/right randomised, random output IDs, forced choice + tie / both-bad, optional reason,
// goal-fit ticks, decision timer, and N retest pairs (sides swapped) for intra-rater consistency.
// Exports judgments.csv in the R6 schema. Arms stay hidden; analyze.mjs joins the key afterwards.
//
//   node eval/make-judging.mjs --pilot P1 --contrasts B-A,C-B,C-A,D-A [--retests 6] [--viewport 1440x900]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const EVAL = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const pilot = opt('--pilot', 'P1');
const contrasts = opt('--contrasts', 'C-A').split(',');
const retests = Number(opt('--retests', '6'));
const OUT = path.join(EVAL, 'results', pilot);
const key = JSON.parse(fs.readFileSync(path.join(OUT, 'KEY-do-not-open-before-judging.json'), 'utf8'));
const prereg = fs.existsSync(path.join(EVAL, 'PREREGISTRATION.md')) ? crypto.createHash('sha256').update(fs.readFileSync(path.join(EVAL, 'PREREGISTRATION.md'))).digest('hex').slice(0, 12) : 'none';

const byBriefArm = {};
for (const [oid, k] of Object.entries(key)) if (k.seed === 1) byBriefArm[`${k.brief}|${k.arm}`] = { oid, ...k };

function shots(runId) {
  const cap = JSON.parse(fs.readFileSync(path.join(OUT, 'runs', runId, 'capture.json'), 'utf8'));
  const media = [];
  for (const r of cap.renders) {
    const d = path.join(OUT, r.dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).sort()) {
      if (/-light-full\.png$/.test(f) && !/stress/.test(f)) media.push({ kind: 'img', label: `${r.page} ${f.split('-')[0]}`, file: path.join(d, f) });
      if (/^filmstrip-.*\.png$/.test(f)) media.push({ kind: 'img', label: `${r.page} ${f.replace('.png', '')}`, file: path.join(d, f) });
    }
    for (const sub of ['video-no-preference', 'video-reduce']) { const vd = path.join(d, sub); if (fs.existsSync(vd)) for (const v of fs.readdirSync(vd).filter((x) => x.endsWith('.mp4') || x.endsWith('.webm')).slice(0, 1)) media.push({ kind: 'video', label: `${r.page} ${sub}`, file: path.join(vd, v) }); }
  }
  // Motion is judged on recordings: videos first, then filmstrips, then stills.
  const rank = (m) => (m.kind === 'video' ? 0 : /filmstrip/.test(m.label) ? 1 : 2);
  return media.sort((a, b) => rank(a) - rank(b));
}
const enc = ({ file, ...m }) => ({ ...m, src: `data:${m.kind === 'video' ? (file.endsWith('.mp4') ? 'video/mp4' : 'video/webm') : 'image/png'};base64,${fs.readFileSync(file).toString('base64')}` });

const briefs = [...new Set(Object.values(key).map((k) => k.brief))].sort();
const pairs = [];
for (const b of briefs) for (const c of contrasts) {
  const [x, y] = c.split('-');
  const X = byBriefArm[`${b}|${x}`], Y = byBriefArm[`${b}|${y}`];
  if (!X || !Y) continue;
  const swap = Math.random() < 0.5;
  pairs.push({ pair_id: `p${pairs.length + 1}`, brief: b, contrast: c, left: swap ? Y : X, right: swap ? X : Y, is_retest: 0 });
}
for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
const base = pairs.slice();
for (let i = 0; i < Math.min(retests, base.length); i++) { const p = base[i]; pairs.push({ ...p, pair_id: `r${i + 1}`, left: p.right, right: p.left, is_retest: 1, retest_of: p.pair_id }); }

const briefText = {};
for (const b of briefs) { const f = fs.readdirSync(path.join(EVAL, 'briefs')).find((x) => x.startsWith(b + '-')); briefText[b] = fs.readFileSync(path.join(EVAL, 'briefs', f), 'utf8').split('---').slice(2).join('---').trim(); }
// Show only media kinds BOTH sides have (an extra filmstrip on one side reveals which arm it is).
function sameMedia(p) {
  const L = shots(p.left.runId), R = shots(p.right.runId);
  const common = new Set(L.map((m) => m.label).filter((l) => R.some((r) => r.label === l)));
  return { left: { id: p.left.oid, media: L.filter((m) => common.has(m.label)).map(enc) }, right: { id: p.right.oid, media: R.filter((m) => common.has(m.label)).map(enc) } };
}
fs.writeFileSync(path.join(OUT, opt('--name', 'judging') + '-key.json'), JSON.stringify(Object.fromEntries(pairs.map((p) => [p.pair_id, { contrast: p.contrast, left: p.left.oid, right: p.right.oid }])), null, 2));
const data = pairs.map((p) => ({ pair_id: p.pair_id, brief: p.brief, brief_text: briefText[p.brief], contrast_hidden: '', is_retest: p.is_retest, retest_of: p.retest_of || '', ...sameMedia(p) }));

const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blind judging ${pilot}</title>
<style>:root{--bg:#f4f4f2;--fg:#191919;--line:#d6d6d0;--card:#fff;--acc:#2456d6}@media(prefers-color-scheme:dark){:root{--bg:#121212;--fg:#eee;--line:#333;--card:#1c1c1c;--acc:#7aa2ff}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,"Noto Sans Thai",sans-serif}header{padding:10px 16px;border-bottom:1px solid var(--line);display:flex;gap:16px;align-items:center;position:sticky;top:0;background:var(--bg);z-index:2}
.brief{padding:10px 16px;white-space:pre-wrap;color:#777;font-size:13px;max-height:90px;overflow:auto}.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px}.col{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px;max-height:70vh;overflow:auto}
.col img,.col video{width:100%;display:block;margin-bottom:8px;border:1px solid var(--line)}.lab{font-size:12px;color:#888}
footer{position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer;min-height:36px}button.pick{border-color:var(--acc)}input[type=text]{flex:1 1 240px;font:inherit;padding:6px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--fg)}</style>
<header><strong>Blind comparison</strong><span id="prog"></span><span style="margin-left:auto;font-size:13px">Pick what you'd rather ship for this brief. First impression; ~30–60 s each. Progress is saved. At the end you'll get text to copy into the chat.</span></header>
<div class="brief" id="brief"></div><div class="cols"><div class="col" id="L"></div><div class="col" id="R"></div></div>
<footer><button class="pick" data-c="left">◀ Left (strong)</button><button data-c="left" data-s="1">Left (slight)</button><button data-c="tie">Can't choose</button><button data-c="both_bad">Both bad</button><button data-c="right" data-s="1">Right (slight)</button><button class="pick" data-c="right">Right (strong) ▶</button>
<label><input type="checkbox" id="gl"> left fits goal</label><label><input type="checkbox" id="gr"> right fits goal</label><input type="text" id="why" placeholder="one-line reason (optional)"><button id="dl" title="Optional; Copy on the last screen works everywhere">Download .csv</button><button id="undo">Undo last</button></footer>
<script>const P=${JSON.stringify(data).replace(/</g, '\\u003c')};const PREREG=${JSON.stringify(prereg)};let i=0,t0=Date.now();const rows=[];
const esc=s=>String(s).replace(/"/g,'""');
function csvText(){return HDR+'\\n'+rows.map(r=>r.join(',')).join('\\n')+'\\n'}
function save(){try{localStorage.setItem(KEY,JSON.stringify(rows))}catch{}}
function show(){if(i>=P.length){document.getElementById('prog').textContent=P.length+'/'+P.length;document.getElementById('brief').textContent='';document.querySelector('.cols').innerHTML='<div style="padding:24px;grid-column:1/-1"><h2 style="margin:0 0 8px">เสร็จแล้ว / Done</h2><p>กด <b>Copy results</b> แล้ววางข้อความในแชทได้เลย (ไม่ต้องดาวน์โหลดไฟล์). Press Copy and paste the text into the chat.</p><textarea id="out" readonly style="width:100%;height:220px;font:12px ui-monospace,monospace"></textarea><p><button id="cp" class="pick">Copy results</button> <span id="cps"></span></p></div>';const o=document.getElementById('out');o.value=csvText();document.getElementById('cp').onclick=async()=>{o.select();let ok=false;try{await navigator.clipboard.writeText(o.value);ok=true}catch{try{ok=document.execCommand('copy')}catch{}}document.getElementById('cps').textContent=ok?'Copied ✓ — paste it into the chat':'Select all text in the box (Ctrl/Cmd+A) and copy it'};return}const p=P[i];document.getElementById('prog').textContent=(i+1)+'/'+P.length;document.getElementById('brief').textContent=p.brief_text;for(const [side,el] of [['left','L'],['right','R']]){const c=document.getElementById(el);c.innerHTML='';for(const m of p[side].media){const lab=document.createElement('div');lab.className='lab';lab.textContent=m.label;c.appendChild(lab);const n=document.createElement(m.kind==='video'?'video':'img');n.src=m.src;if(m.kind==='video'){n.controls=true;n.loop=true;n.muted=true}c.appendChild(n)}}document.getElementById('gl').checked=false;document.getElementById('gr').checked=false;document.getElementById('why').value='';t0=Date.now();scrollTo(0,0)}
const HDR='prereg_hash,session_id,rater_id,timestamp,phase,brief_id,task_family,pair_id,contrast,left_output_id,right_output_id,left_arm_hidden,right_arm_hidden,choice,strength,goal_fit_left,goal_fit_right,reason_text,seconds_to_decide,is_retest,retest_of_pair_id,viewport_or_media';
const KEY='whipui-judging-'+PREREG+'-'+P.map(p=>p.pair_id+p.left.id+p.right.id).join('').slice(0,120);
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(saved.length&&saved.length<=P.length){rows.push(...saved);i=saved.length}}catch{}
document.querySelectorAll('footer button[data-c]').forEach(b=>b.onclick=()=>{if(i>=P.length)return;const p=P[i];rows.push([PREREG,'s1','owner',new Date().toISOString(),'1',p.brief,'',p.pair_id,p.contrast_hidden,p.left.id,p.right.id,'','',b.dataset.c,b.dataset.s?1:2,+document.getElementById('gl').checked,+document.getElementById('gr').checked,'"'+esc(document.getElementById('why').value)+'"',Math.round((Date.now()-t0)/1000),p.is_retest,p.retest_of,'desktop+mobile']);save();i++;show()});
document.getElementById('undo').onclick=()=>{if(i>0){rows.pop();i--;save();show()}};
document.getElementById('dl').onclick=()=>{const b=new Blob([csvText()],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='judgments.csv';a.click()};show();</script></html>`;
const out = path.join(OUT, opt('--name', 'judging') + '.html');
fs.writeFileSync(out, html);
console.log(`blind judging page: ${out} · ${pairs.length} pairs (${retests} retests) · arms/contrasts kept in judging-key.json, not in the page`);
