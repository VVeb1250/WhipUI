#!/usr/bin/env node
// WhipUI review-page — low-friction human feedback.
//
//   build    → one self-contained, offline HTML page (no dependencies) that shows
//              2–3 options (neutral labels, shuffled order, visuals BEFORE the
//              agent's rationale) or a set of screenshots to annotate. The user
//              draws boxes / arrows / pins with a tag (keep, change, remove, bug,
//              question) and a comment, picks a verdict, and exports feedback.json.
//   tickets  → turn feedback.json into scoped change tickets. With --url it replays
//              the page at the same viewport and maps each mark to DOM selectors.
//
// The page records what the user said. Turning a mark into an APPROVED decision
// is still an explicit step (state.mjs approve) — a choice of option approves the
// direction at the level shown, not every pixel.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, escapeHtml, loadPlaywright, toUrl, ensureWhipui, ensureDir, stamp, rel, VERSION } from './lib/common.mjs';

const HELP = `usage:
  node review-page.mjs build --mode options|annotate --image FILE [--label TEXT] [--note TEXT] [--image FILE ...]
                             [--title TEXT] [--question TEXT] [--viewport WxH] [--url URL] [--out FILE.html]
      --label/--note pair with the preceding --image (note = agent rationale, hidden until the user reveals it)
      options mode: order is shuffled per page load; labels shown as Option 1/2/3
  node review-page.mjs tickets FEEDBACK.json [--url URL] [--viewport WxH] [--json]
      prints change tickets; with --url maps each mark to DOM selectors (screenshots must be full-page at that viewport)`;

function parseBuild(argv) {
  const o = { images: [], mode: 'annotate', title: 'Design review', question: '', viewport: '', url: '', out: '' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = () => { if (argv[i + 1] === undefined) throw new Error(`missing value for ${k}`); return argv[++i]; };
    if (k === '--image') o.images.push({ file: v(), label: '', note: '' });
    else if (k === '--label') { if (!o.images.length) throw new Error('--label must follow --image'); o.images.at(-1).label = v(); }
    else if (k === '--note') { if (!o.images.length) throw new Error('--note must follow --image'); o.images.at(-1).note = v(); }
    else if (k === '--mode') o.mode = v();
    else if (k === '--title') o.title = v();
    else if (k === '--question') o.question = v();
    else if (k === '--viewport') o.viewport = v();
    else if (k === '--url') o.url = v();
    else if (k === '--out') o.out = v();
    else if (k === '-h' || k === '--help') o.help = true;
    else throw new Error(`unknown option ${k}`);
  }
  return o;
}

function mime(f) { const e = path.extname(f).toLowerCase(); return e === '.jpg' || e === '.jpeg' ? 'image/jpeg' : e === '.webp' ? 'image/webp' : e === '.gif' ? 'image/gif' : e === '.svg' ? 'image/svg+xml' : 'image/png'; }

function build(o) {
  if (!['options', 'annotate'].includes(o.mode)) throw new Error('--mode must be options|annotate');
  if (!o.images.length) throw new Error('at least one --image is required');
  if (o.mode === 'options' && (o.images.length < 2 || o.images.length > 4)) console.warn('note: 2–3 options is the evidence-backed range (R6); you passed ' + o.images.length);
  const items = o.images.map((im, i) => {
    if (!fs.existsSync(im.file)) throw new Error(`image not found: ${im.file}`);
    return { id: 'opt' + (i + 1), source: path.basename(im.file), label: im.label || path.basename(im.file), note: im.note, src: `data:${mime(im.file)};base64,${fs.readFileSync(im.file).toString('base64')}` };
  });
  const meta = { tool: `whipui-review-page@${VERSION}`, mode: o.mode, title: o.title, question: o.question, viewport: o.viewport, url: o.url, created: new Date().toISOString() };
  const html = PAGE.replace('__TITLE__', escapeHtml(o.title)).replace('__DATA__', JSON.stringify({ meta, items }).replace(/</g, '\\u003c'));
  const out = path.resolve(o.out || path.join(ensureDir(path.join(ensureWhipui(), 'reviews')), `review-${o.mode}-${stamp()}-${Math.random().toString(36).slice(2, 6)}.html`));
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, html);
  console.log(`review page: ${rel(out)} (${items.length} ${o.mode === 'options' ? 'options, shuffled' : 'screens'}, ${(html.length / 1024).toFixed(0)} KB, offline)`);
  console.log('Send this file to the user. They export feedback.json; then run: node review-page.mjs tickets feedback.json' + (o.url ? ` --url ${o.url}` : ''));
}

async function tickets(file, o) {
  const fb = JSON.parse(fs.readFileSync(file, 'utf8'));
  const marks = fb.marks || [];
  let mapped = new Map();
  const url = o.url || fb.meta?.url;
  if (url && marks.length) {
    const pw = await loadPlaywright();
    if (pw.error) console.log(`(selector mapping skipped: ${pw.error})`);
    else {
      const [w, h] = (o.viewport || fb.meta?.viewport || '1440x900').split('x').map(Number);
      const ctx = await pw.browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(toUrl(url), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready.then(() => true));
      for (const m of marks) {
        // marks are in screenshot pixel space = document CSS px for a full-page shot at DPR 1
        const pts = m.shape === 'arrow' ? [[m.x2, m.y2]] : [[m.x + m.w / 2, m.y + m.h / 2], [m.x + m.w * 0.25, m.y + m.h * 0.25], [m.x + m.w * 0.75, m.y + m.h * 0.75]];
        const hits = await page.evaluate((pts) => {
          const css = (el) => { const p = []; for (let c = el, d = 0; c && c.nodeType === 1 && d < 4; c = c.parentElement, d++) { let s = c.tagName.toLowerCase(); if (c.id) { p.unshift(s + '#' + c.id); break; } const cl = [...c.classList].slice(0, 2).join('.'); if (cl) s += '.' + cl; p.unshift(s); } return p.join(' > '); };
          const res = [];
          for (const [x, y] of pts) {
            window.scrollTo(0, Math.max(0, y - innerHeight / 2));
            const el = document.elementFromPoint(x - scrollX, y - scrollY);
            if (el && el !== document.documentElement && el !== document.body) res.push({ selector: css(el), text: (el.innerText || '').trim().slice(0, 50) });
          }
          return res;
        }, pts.map(([x, y]) => [Math.round(x), Math.round(y)]));
        const uniq = [...new Map(hits.map((x) => [x.selector, x])).values()];
        mapped.set(m.id, { targets: uniq, confidence: uniq.length === 1 ? 'high' : uniq.length ? 'medium' : 'none' });
      }
      await ctx.close(); await pw.browser.close();
    }
  }
  const scopeOf = (c) => /\b(everywhere|all|every|global|site-wide|ทั้งหมด|ทุก)\b/i.test(c || '') ? 'global (user said so — confirm)' : 'element (narrowest; widen only if the user says so)';
  const out = marks.map((m, i) => ({ id: `T${i + 1}`, mark: m.id, screen: m.item, tag: m.tag, user_words: m.comment || '', scope: scopeOf(m.comment), ...(mapped.get(m.id) || {}), needs_confirmation: m.tag === 'question' || !m.comment || /global/.test(scopeOf(m.comment)) }));
  const summary = { verdict: fb.verdict || null, chosen: fb.choice || null, chosenLabel: fb.choiceLabel || null, merge: fb.merge || '', overall: fb.overall || '', order_shown: fb.order || null, tickets: out };
  if (o.json) { console.log(JSON.stringify(summary, null, 2)); return; }
  console.log(`feedback: ${file}  mode=${fb.meta?.mode} verdict=${fb.verdict || '—'}${fb.choice ? ` chosen=${fb.choice} (${fb.choiceLabel})` : ''}`);
  if (fb.merge) console.log(`  merge request: ${fb.merge}`);
  if (fb.overall) console.log(`  overall: ${fb.overall}`);
  for (const t of out) console.log(`  ${t.id} [${t.tag}] on ${t.screen}: "${t.user_words}" → scope ${t.scope}${t.targets?.length ? ' · targets ' + t.targets.map((x) => x.selector).join(' | ') + ` (${t.confidence})` : ''}${t.needs_confirmation ? ' · CONFIRM' : ''}`);
  console.log('Record: chosen direction → state.mjs approve (direction level only); keep/remove marks → decide/approve per item; dislikes → ref note / pref add.');
}

async function main() {
  const cmd = process.argv[2];
  try {
    if (cmd === 'build') { const o = parseBuild(process.argv.slice(3)); if (o.help) return console.log(HELP); return build(o); }
    if (cmd === 'tickets') { const o = parseArgs([process.argv[0], ...process.argv.slice(2)], { url: 'string', viewport: 'string', json: 'bool' }); if (!o._[0]) throw new Error('feedback.json path required'); return await tickets(o._[0], o); }
    console.log(HELP); process.exit(cmd ? 2 : 0);
  } catch (e) { console.error('review-page: ' + e.message); process.exit(2); }
}

const PAGE = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<style>
:root{--bg:#f6f6f4;--fg:#1b1b1b;--mut:#666;--line:#d9d9d4;--card:#fff;--acc:#2456d6;--keep:#1f8a4c;--change:#c27a00;--remove:#c62828;--bug:#8e24aa;--question:#00838f}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#eee;--mut:#9a9a9a;--line:#333;--card:#1d1d1d;--acc:#7aa2ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,-apple-system,"Segoe UI","Noto Sans Thai",sans-serif}
header{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
h1{font-size:16px;margin:0 auto 0 0}
.tools{display:flex;gap:6px;flex-wrap:wrap}.tools button,.tags button,footer button{border:1px solid var(--line);background:var(--card);color:var(--fg);padding:6px 10px;border-radius:6px;font:inherit;cursor:pointer;min-height:32px}
.tools button[aria-pressed=true],.tags button[aria-pressed=true]{outline:2px solid var(--acc);outline-offset:1px}
button:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
main{padding:16px;display:grid;gap:24px}
.q{margin:0;color:var(--mut)}
section.item{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}
section.item h2{font-size:15px;margin:0 0 8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.stage{position:relative;display:inline-block;max-width:100%;cursor:crosshair;touch-action:none}
.stage img{display:block;max-width:100%;height:auto;user-select:none;-webkit-user-drag:none}
.stage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.why{margin-top:8px}.why summary{cursor:pointer;color:var(--mut)}
.marks{margin:8px 0 0;padding:0;list-style:none;display:grid;gap:6px}
.marks li{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:start;border-left:4px solid var(--c);padding:4px 8px;background:color-mix(in srgb,var(--c) 8%,transparent)}
.marks textarea{width:100%;min-height:34px;font:inherit;background:transparent;color:inherit;border:1px solid var(--line);border-radius:4px;padding:4px}
.choice{display:flex;gap:8px;align-items:center}
footer{position:sticky;bottom:0;background:var(--bg);border-top:1px solid var(--line);padding:10px 16px;display:grid;gap:8px}
footer .row{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
footer textarea{flex:1 1 280px;min-height:38px;font:inherit;background:var(--card);color:inherit;border:1px solid var(--line);border-radius:6px;padding:6px}
.primary{background:var(--acc)!important;color:#fff!important;border-color:var(--acc)!important}
.hint{color:var(--mut);font-size:13px}
</style></head><body>
<header><h1 id="title"></h1>
 <div class="tools" role="group" aria-label="Drawing tool">
  <button data-tool="rect" aria-pressed="true">▭ Box</button><button data-tool="arrow" aria-pressed="false">↗ Arrow</button><button data-tool="pin" aria-pressed="false">● Pin</button>
 </div>
 <div class="tags tools" role="group" aria-label="Mark type">
  <button data-tag="keep" aria-pressed="false">Keep</button><button data-tag="change" aria-pressed="true">Change</button><button data-tag="remove" aria-pressed="false">Remove</button><button data-tag="bug" aria-pressed="false">Bug</button><button data-tag="question" aria-pressed="false">Question</button>
 </div>
</header>
<main id="main"><p class="q" id="question"></p></main>
<footer>
 <div class="row" id="verdictRow"></div>
 <div class="row"><textarea id="merge" placeholder="Mix & match? e.g. “Option 2 with the type of Option 1” (optional)"></textarea><textarea id="overall" placeholder="Anything else, in your own words (optional)"></textarea></div>
 <div class="row"><button class="primary" id="export">Download feedback.json</button><button id="copy">Copy JSON</button><span class="hint" id="status">Draw on any image. Marks are scoped to the element you mark unless you write “everywhere”.</span></div>
</footer>
<script id="data" type="application/json">__DATA__</script>
<script>
(() => {
  const D = JSON.parse(document.getElementById('data').textContent);
  const $ = (s, r = document) => r.querySelector(s);
  const COLORS = { keep: 'var(--keep)', change: 'var(--change)', remove: 'var(--remove)', bug: 'var(--bug)', question: 'var(--question)' };
  let tool = 'rect', tag = 'change', seq = 0;
  const marks = [];
  $('#title').textContent = D.meta.title;
  $('#question').textContent = D.meta.question || (D.meta.mode === 'options' ? 'Which direction should we develop? Mark what to keep or lose on any option.' : 'Mark what to keep, change or remove. Then choose a verdict.');
  const items = D.items.slice();
  if (D.meta.mode === 'options') for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
  const order = items.map((it) => it.id);
  const shown = {}; items.forEach((it, i) => { shown[it.id] = D.meta.mode === 'options' ? 'Option ' + (i + 1) : it.label; });

  const pressGroup = (sel, attr, val) => document.querySelectorAll(sel).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === val)));
  document.querySelectorAll('[data-tool]').forEach((b) => b.onclick = () => { tool = b.dataset.tool; pressGroup('[data-tool]', 'tool', tool); });
  document.querySelectorAll('[data-tag]').forEach((b) => b.onclick = () => { tag = b.dataset.tag; pressGroup('[data-tag]', 'tag', tag); });

  const main = $('#main');
  for (const it of items) {
    const sec = document.createElement('section'); sec.className = 'item'; sec.dataset.id = it.id;
    sec.innerHTML = '<h2></h2><div class="stage"><img alt=""><svg aria-hidden="true"></svg></div><ul class="marks"></ul>';
    sec.querySelector('h2').textContent = shown[it.id];
    const img = sec.querySelector('img'); img.src = it.src; img.alt = shown[it.id];
    if (it.note) { const d = document.createElement('details'); d.className = 'why'; d.innerHTML = '<summary>Show the designer’s rationale (after you have looked)</summary><p></p>'; d.querySelector('p').textContent = it.note; sec.appendChild(d); }
    main.appendChild(sec);
    attachDrawing(sec, it);
  }

  // verdict controls
  const vr = $('#verdictRow');
  if (D.meta.mode === 'options') {
    vr.innerHTML = '<strong>Develop:</strong>';
    for (const it of items) vr.insertAdjacentHTML('beforeend', '<label class="choice"><input type="radio" name="choice" value="' + it.id + '"> ' + shown[it.id] + '</label>');
    vr.insertAdjacentHTML('beforeend', '<label class="choice"><input type="radio" name="choice" value="none"> None of these</label>');
  } else {
    $('#merge').hidden = true;
    vr.innerHTML = '<strong>Verdict:</strong>';
    for (const [v, l] of [['approve', 'Approve'], ['approve-with-changes', 'Approve with the marked changes'], ['not-yet', 'Not yet']]) vr.insertAdjacentHTML('beforeend', '<label class="choice"><input type="radio" name="verdict" value="' + v + '"> ' + l + '</label>');
  }

  function attachDrawing(sec, it) {
    const stage = sec.querySelector('.stage'), img = stage.querySelector('img'), svg = stage.querySelector('svg'), list = sec.querySelector('.marks');
    const toImg = (e) => { const r = img.getBoundingClientRect(); const sx = img.naturalWidth / r.width, sy = img.naturalHeight / r.height; return { x: Math.round((e.clientX - r.left) * sx), y: Math.round((e.clientY - r.top) * sy) }; };
    const sync = () => svg.setAttribute('viewBox', '0 0 ' + img.naturalWidth + ' ' + img.naturalHeight);
    img.complete ? sync() : img.addEventListener('load', sync);
    let start = null, temp = null;
    stage.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.preventDefault(); stage.setPointerCapture(e.pointerId); start = toImg(e); if (tool === 'pin') { add({ shape: 'pin', x: start.x - 12, y: start.y - 12, w: 24, h: 24 }); start = null; } });
    stage.addEventListener('pointermove', (e) => { if (!start) return; const p = toImg(e); if (temp) temp.remove(); temp = draw(svg, tool === 'arrow' ? { shape: 'arrow', x1: start.x, y1: start.y, x2: p.x, y2: p.y } : rectOf(start, p), tag, true); });
    stage.addEventListener('pointerup', (e) => { if (!start) return; const p = toImg(e); if (temp) { temp.remove(); temp = null; } const m = tool === 'arrow' ? { shape: 'arrow', x1: start.x, y1: start.y, x2: p.x, y2: p.y } : rectOf(start, p); start = null; if ((m.w ?? Math.hypot(m.x2 - m.x1, m.y2 - m.y1)) < 6) return; add(m); });
    function rectOf(a, b) { return { shape: 'rect', x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }
    function add(geom) {
      const m = Object.assign({ id: 'm' + (++seq), item: it.id, itemLabel: shown[it.id], tag, comment: '' }, geom);
      if (m.shape === 'arrow') Object.assign(m, { x: Math.min(m.x1, m.x2), y: Math.min(m.y1, m.y2), w: Math.abs(m.x1 - m.x2), h: Math.abs(m.y1 - m.y2) });
      marks.push(m);
      const g = draw(svg, m, m.tag, false, seq);
      const li = document.createElement('li'); li.style.setProperty('--c', COLORS[m.tag]);
      li.innerHTML = '<strong></strong><textarea placeholder="What should happen here? (your words)"></textarea><button aria-label="Delete mark">✕</button>';
      li.querySelector('strong').textContent = seq + ' · ' + m.tag;
      const ta = li.querySelector('textarea'); ta.oninput = () => { m.comment = ta.value; };
      li.querySelector('button').onclick = () => { marks.splice(marks.indexOf(m), 1); g.remove(); li.remove(); };
      list.appendChild(li); ta.focus();
    }
  }
  function draw(svg, m, t, ghost, n) {
    const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'), c = COLORS[t];
    const sw = Math.max(3, (svg.viewBox.baseVal?.width || 1200) / 400);
    g.setAttribute('style', 'color:' + c + ';opacity:' + (ghost ? .6 : 1));
    if (m.shape === 'arrow') {
      const l = document.createElementNS(NS, 'line'); Object.entries({ x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2, stroke: 'currentColor', 'stroke-width': sw }).forEach(([k, v]) => l.setAttribute(k, v)); g.appendChild(l);
      const a = Math.atan2(m.y2 - m.y1, m.x2 - m.x1), L = sw * 5; const p = [[m.x2, m.y2], [m.x2 - L * Math.cos(a - .4), m.y2 - L * Math.sin(a - .4)], [m.x2 - L * Math.cos(a + .4), m.y2 - L * Math.sin(a + .4)]];
      const h = document.createElementNS(NS, 'polygon'); h.setAttribute('points', p.map((q) => q.join(',')).join(' ')); h.setAttribute('fill', 'currentColor'); g.appendChild(h);
    } else if (m.shape === 'pin') {
      const ci = document.createElementNS(NS, 'circle'); Object.entries({ cx: m.x + 12, cy: m.y + 12, r: sw * 4, fill: 'currentColor' }).forEach(([k, v]) => ci.setAttribute(k, v)); g.appendChild(ci);
    } else {
      const r = document.createElementNS(NS, 'rect'); Object.entries({ x: m.x, y: m.y, width: m.w, height: m.h, fill: 'none', stroke: 'currentColor', 'stroke-width': sw, rx: sw }).forEach(([k, v]) => r.setAttribute(k, v)); g.appendChild(r);
    }
    if (n) { const tx = document.createElementNS(NS, 'text'); tx.textContent = n; Object.entries({ x: (m.x ?? m.x1) + 4, y: (m.y ?? m.y1) - 6, fill: 'currentColor', 'font-size': sw * 6, 'font-weight': 700, 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': sw }).forEach(([k, v]) => tx.setAttribute(k, v)); g.appendChild(tx); }
    svg.appendChild(g); return g;
  }
  function payload() {
    const choice = document.querySelector('input[name=choice]:checked')?.value || null;
    return { meta: D.meta, exported: new Date().toISOString(), order: order.map((id) => ({ id, shownAs: shown[id], source: D.items.find((x) => x.id === id).source })),
      choice, choiceLabel: choice && choice !== 'none' ? shown[choice] + ' (' + D.items.find((x) => x.id === choice).label + ')' : choice,
      verdict: D.meta.mode === 'options' ? (choice ? (choice === 'none' ? 'none' : 'choose') : null) : (document.querySelector('input[name=verdict]:checked')?.value || null),
      merge: $('#merge').value.trim(), overall: $('#overall').value.trim(),
      marks: marks.map(({ id, item, itemLabel, tag, comment, shape, x, y, w, h, x1, y1, x2, y2 }) => ({ id, item, itemLabel, tag, comment, shape, x, y, w, h, x1, y1, x2, y2 })) };
  }
  $('#export').onclick = () => { const b = new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'feedback.json'; a.click(); $('#status').textContent = 'Saved feedback.json — send it back (or paste the JSON into the chat).'; };
  $('#copy').onclick = async () => { const t = JSON.stringify(payload(), null, 2); try { await navigator.clipboard.writeText(t); $('#status').textContent = 'Copied. Paste it into the chat.'; } catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); $('#status').textContent = 'Copied.'; } };
  window.__whipuiPayload = payload; // for automated tests
})();
</script></body></html>`;

main();
