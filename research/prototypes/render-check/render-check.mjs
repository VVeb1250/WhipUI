#!/usr/bin/env node
// render-check (prototype) — render a page at several viewports and collect
// cheap, high-signal technical evidence for an AI agent:
//   screenshots, axe-core, horizontal overflow, clipped/spilled text,
//   overlapping / obscured interactive elements, small tap targets,
//   focus visibility, console errors, failed requests, broken images/fonts, CLS.
// Optional: dark scheme pass, text-expansion stress pass, baseline pixel diff.
//
// It reports EVIDENCE, not a verdict on design quality. Heuristic findings are
// labelled with `kind: "heuristic"` and can be false positives.

import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// ---------- CLI ----------
function parseArgs(argv) {
  const o = {
    target: null,
    out: 'render-check-out',
    viewports: '375x812,768x1024,1440x900',
    schemes: 'light',
    fullPage: true,
    axe: true,
    stress: false,
    focusTabs: 25,
    settleMs: 800,
    baseline: null,
    failOn: 'error',
    timeout: 30000,
  };
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    const next = () => a[++i];
    if (k === '--out') o.out = next();
    else if (k === '--viewports') o.viewports = next();
    else if (k === '--schemes') o.schemes = next();
    else if (k === '--no-full-page') o.fullPage = false;
    else if (k === '--no-axe') o.axe = false;
    else if (k === '--stress-text') o.stress = true;
    else if (k === '--focus-tabs') o.focusTabs = Number(next());
    else if (k === '--settle-ms') o.settleMs = Number(next());
    else if (k === '--baseline') o.baseline = next();
    else if (k === '--fail-on') o.failOn = next();
    else if (k === '--timeout') o.timeout = Number(next());
    else if (k === '-h' || k === '--help') o.help = true;
    else if (!o.target) o.target = k;
    else throw new Error(`Unknown argument: ${k}`);
  }
  return o;
}

const HELP = `usage: render-check <url|file.html> [options]
  --out DIR              output dir (default render-check-out)
  --viewports LIST       e.g. 375x812,768x1024,1440x900
  --schemes LIST         light | dark | light,dark  (prefers-color-scheme)
  --stress-text          extra pass: expand every text node ~40% with Thai text
  --baseline DIR         previous output dir; pixel-diff viewport screenshots
  --focus-tabs N         Tab presses for focus-visibility check (default 25, 0=off)
  --settle-ms N          wait after load before checks (default 800)
  --no-axe  --no-full-page
  --fail-on error|warn|never   exit code policy (default error)`;

function toUrl(t) {
  if (/^(https?|file|data):/i.test(t)) return t;
  return pathToFileURL(path.resolve(t)).href;
}

// ---------- in-page heuristics (serialised into the browser) ----------
// Everything inside this function runs in the page context.
function pageChecks() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const sx = window.scrollX, sy = window.scrollY;

  const cssPath = (el) => {
    if (!el || el.nodeType !== 1) return String(el);
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 4; depth++) {
      let s = cur.tagName.toLowerCase();
      if (cur.id) { s += '#' + cur.id; parts.unshift(s); break; }
      const cls = [...cur.classList].slice(0, 2).join('.');
      if (cls) s += '.' + cls;
      const p = cur.parentElement;
      if (p) {
        const sib = [...p.children].filter((c) => c.tagName === cur.tagName);
        if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(cur) + 1})`;
      }
      parts.unshift(s);
      cur = p;
    }
    return parts.join(' > ');
  };
  const r2 = (r) => ({ x: Math.round(r.left + sx), y: Math.round(r.top + sy), w: Math.round(r.width), h: Math.round(r.height) });
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    if (el.checkVisibility) return el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  // "Visually hidden" (sr-only) patterns: tiny box or clip/clip-path.
  const isSrOnly = (el) => {
    for (let cur = el; cur && cur !== document.body; cur = cur.parentElement) {
      const cs = getComputedStyle(cur);
      const r = cur.getBoundingClientRect();
      if (r.width <= 2 || r.height <= 2) return true;
      if (cs.clip && cs.clip !== 'auto') return true;
      if (cs.clipPath && cs.clipPath !== 'none' && /inset\(50%|inset\(100%/.test(cs.clipPath)) return true;
    }
    return false;
  };
  const clips = (v) => v === 'hidden' || v === 'clip';
  const scrolls = (v) => v === 'auto' || v === 'scroll';
  const text = (el) => (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);

  const findings = [];
  const add = (f) => findings.push(f);

  // ---- 1. horizontal overflow ----
  const docW = document.documentElement.scrollWidth;
  const bodyCs = getComputedStyle(document.body);
  const htmlCs = getComputedStyle(document.documentElement);
  const rootClipsX = clips(bodyCs.overflowX) || clips(htmlCs.overflowX);
  const all = [...document.body.querySelectorAll('*')].filter((el) => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName));
  const offenders = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (!(r.right > vw + 1 || r.left < -1)) continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') continue; // fixed boxes don't extend the scroll area
    // contained by a clipping/scrolling ancestor that itself is inside the viewport?
    let contained = false;
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (clips(pcs.overflowX) || scrolls(pcs.overflowX)) {
        const pr = p.getBoundingClientRect();
        if (pr.right <= vw + 1 && pr.left >= -1) { contained = true; break; }
      }
      if (pcs.position === 'fixed') { contained = true; break; }
    }
    if (!contained) offenders.push(el);
  }
  const offSet = new Set(offenders);
  const outermost = offenders.filter((el) => { for (let p = el.parentElement; p; p = p.parentElement) if (offSet.has(p)) return false; return true; });
  if (docW > vw + 1) {
    add({ check: 'horizontal-overflow', severity: 'error', kind: 'measured',
      message: `Page scrolls horizontally: scrollWidth ${docW}px > viewport ${vw}px`,
      culprits: outermost.slice(0, 8).map((el) => ({ selector: cssPath(el), rect: r2(el.getBoundingClientRect()), text: text(el) })) });
  } else if (rootClipsX && outermost.length) {
    // body/html overflow-x:hidden masks the scroll, but content may be cut off.
    const meaningful = outermost.filter((el) => text(el).length > 0 || el.matches('a,button,input,select,textarea,img,svg,video'));
    if (meaningful.length) add({ check: 'offscreen-content-masked', severity: 'warn', kind: 'heuristic',
      message: 'Root has overflow-x hidden/clip; these elements extend past the viewport edge and may be cut off',
      culprits: meaningful.slice(0, 8).map((el) => ({ selector: cssPath(el), rect: r2(el.getBoundingClientRect()), text: text(el) })) });
  }

  // ---- 2. clipped / spilled text ----
  const textEls = all.filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0));
  let clipCount = 0;
  for (const el of textEls) {
    if (clipCount > 40) break;
    if (!visible(el) || isSrOnly(el)) continue;
    const range = document.createRange();
    let tr = null;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      range.selectNodeContents(n);
      for (const rr of range.getClientRects()) {
        if (rr.width === 0) continue;
        tr = tr ? { left: Math.min(tr.left, rr.left), top: Math.min(tr.top, rr.top), right: Math.max(tr.right, rr.right), bottom: Math.max(tr.bottom, rr.bottom) }
                : { left: rr.left, top: rr.top, right: rr.right, bottom: rr.bottom };
      }
    }
    if (!tr) continue;
    const cs = getComputedStyle(el);
    const er = el.getBoundingClientRect();
    const tol = 2;
    // a) clipped by itself or by an ancestor with overflow hidden/clip
    // Per-axis walk: note `overflow-x:hidden` forces overflow-y to compute to `auto`,
    // so a scroll container on one axis must not end the search on the other axis.
    let clipped = null;
    let xOpen = true, yOpen = true;
    for (let cur = el; cur && cur !== document.documentElement && (xOpen || yOpen); cur = cur.parentElement) {
      const ccs = cur === el ? cs : getComputedStyle(cur);
      const cr = cur.getBoundingClientRect();
      const bx = xOpen && clips(ccs.overflowX) && (tr.right > cr.right + tol || tr.left < cr.left - tol);
      const by = yOpen && clips(ccs.overflowY) && (tr.bottom > cr.bottom + tol || tr.top < cr.top - tol);
      if (bx || by) { clipped = { by: cur, axis: bx && by ? 'xy' : bx ? 'x' : 'y', cs: ccs }; break; }
      if (scrolls(ccs.overflowX)) xOpen = false; // reachable by scrolling
      if (scrolls(ccs.overflowY)) yOpen = false;
    }
    if (clipped) {
      const intentional = (clipped.by === el && cs.textOverflow === 'ellipsis') || cs.webkitLineClamp !== 'none' && cs.webkitLineClamp !== undefined && cs.webkitLineClamp !== '';
      add({ check: 'text-clipped', severity: intentional ? 'info' : 'warn', kind: 'heuristic',
        message: intentional ? 'Text truncated by ellipsis/line-clamp (likely intentional; confirm full text is reachable)'
                             : `Text cut off on ${clipped.axis}-axis by overflow:hidden on ${clipped.by === el ? 'itself' : cssPath(clipped.by)}`,
        selector: cssPath(el), text: text(el), rect: r2(er) });
      clipCount++;
      continue;
    }
    // b) text spills outside its own box (overflow visible) — overlaps neighbours
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.display !== 'inline' && cs.display !== 'contents') {
      const spill = Math.max(tr.right - er.right, er.left - tr.left, tr.bottom - er.bottom, er.top - tr.top);
      if (spill > 4) {
        add({ check: 'text-spill', severity: 'warn', kind: 'heuristic',
          message: `Text extends ${Math.round(spill)}px outside its box (fixed size + overflow visible?)`,
          selector: cssPath(el), text: text(el), rect: r2(er) });
        clipCount++;
      }
    }
  }

  // ---- 3/4. interactive elements: overlap, occlusion, tap-target size ----
  const INTERACTIVE = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=tab],[role=menuitem],[tabindex]:not([tabindex="-1"])';
  const inter = [...document.querySelectorAll(INTERACTIVE)].filter((el) => visible(el) && !isSrOnly(el) && !el.disabled);
  const boxes = inter.map((el) => ({ el, r: el.getBoundingClientRect() }));
  const pinned = (el) => { for (let c = el; c && c !== document.body; c = c.parentElement) { const p = getComputedStyle(c).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  // overlap (geometric, document space; ignores DOM ancestor/descendant pairs and
  // fixed/sticky elements, whose overlap depends on scroll position — those are
  // covered by the scroll-aware occlusion pass instead)
  let overlapCount = 0;
  for (let i = 0; i < boxes.length && overlapCount < 20; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
      if (pinned(A.el) !== pinned(B.el)) continue;
      const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (w <= 1 || h <= 1) continue;
      const ratio = (w * h) / Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
      add({ check: 'interactive-overlap', severity: ratio > 0.25 ? 'error' : 'warn', kind: 'measured',
        message: `Interactive elements overlap (${Math.round(ratio * 100)}% of the smaller one)`,
        a: { selector: cssPath(A.el), text: text(A.el), rect: r2(A.r) }, b: { selector: cssPath(B.el), text: text(B.el), rect: r2(B.r) } });
      overlapCount++;
    }
  }
  // occlusion: scroll each interactive element to the viewport centre, then
  // hit-test its centre. Catches transparent overlays, ::after "stretched links"
  // and z-index mistakes. Also checks the page bottom, where fixed bars most often
  // cover the last content. Scroll position is restored afterwards.
  const ox = window.scrollX, oy = window.scrollY;
  const hitTest = (el, why) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx >= vw || cy >= vh) return;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || hit === el || el.contains(hit)) return;
    if (el.labels && [...el.labels].some((l) => l === hit || l.contains(hit))) return;
    add({ check: 'interactive-obscured', severity: 'warn', kind: 'measured',
      message: `Centre of interactive element is covered by another element${why} (click would land elsewhere)`,
      selector: cssPath(el), text: text(el), coveredBy: cssPath(hit), rect: r2(r) });
  };
  const flagged = new Set();
  for (const { el } of boxes.slice(0, 200)) {
    if (pinned(el)) { hitTest(el, ''); continue; }
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    const before = findings.length; hitTest(el, ''); if (findings.length > before) flagged.add(el);
  }
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  // At max scroll, only the bottom band can no longer be scrolled out from under a bar.
  for (const { el } of boxes) {
    if (flagged.has(el) || pinned(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.top + r.height / 2 > vh * 0.6) hitTest(el, ' at page bottom (fixed bar?)');
  }
  window.scrollTo({ left: ox, top: oy, behavior: 'instant' });
  // tap target: WCAG 2.2 SC 2.5.8 (24x24 CSS px, with spacing + inline exceptions, approximated)
  const MIN = 24;
  const isInlineInText = (el) => {
    if (getComputedStyle(el).display !== 'inline') return false;
    const p = el.parentElement; if (!p) return false;
    const own = (el.textContent || '').trim().length;
    return (p.textContent || '').trim().length > own + 10;
  };
  for (const { el, r } of boxes) {
    if (r.width >= MIN && r.height >= MIN) continue;
    if (isInlineInText(el)) continue;
    if ((el.type === 'checkbox' || el.type === 'radio') && el.labels && el.labels.length) {
      add({ check: 'tap-target-small', severity: 'info', kind: 'heuristic', message: `Native ${el.type} ${Math.round(r.width)}x${Math.round(r.height)} has a label (label click area not measured; review)`, selector: cssPath(el), rect: r2(r) });
      continue;
    }
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let conflict = null;
    for (const o of boxes) {
      if (o.el === el || o.el.contains(el) || el.contains(o.el)) continue;
      // circle (r=12) vs other target's rect
      const nx = Math.max(o.r.left, Math.min(cx, o.r.right)), ny = Math.max(o.r.top, Math.min(cy, o.r.bottom));
      if (Math.hypot(cx - nx, cy - ny) < MIN / 2) { conflict = o.el; break; }
      // circle vs other undersized target's circle
      if (o.r.width < MIN || o.r.height < MIN) {
        const ox = o.r.left + o.r.width / 2, oy = o.r.top + o.r.height / 2;
        if (Math.hypot(cx - ox, cy - oy) < MIN) { conflict = o.el; break; }
      }
    }
    add({ check: 'tap-target-small', severity: conflict ? 'error' : 'info', kind: 'measured',
      message: conflict ? `Target ${Math.round(r.width)}x${Math.round(r.height)} < 24x24 and too close to ${cssPath(conflict)} (fails 2.5.8 spacing exception)`
                        : `Target ${Math.round(r.width)}x${Math.round(r.height)} < 24x24 but spaced (passes 2.5.8 via spacing; < 44 is still uncomfortable on touch)`,
      selector: cssPath(el), text: text(el), rect: r2(r) });
  }

  // ---- 4b. placeholder used as the only label (axe accepts placeholder as an
  // accessible name, so it does not report this; it is still a usability defect:
  // the label disappears on input) ----
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea')) {
    if (!visible(el)) continue;
    const labelled = (el.labels && el.labels.length) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.title;
    if (!labelled && el.placeholder) add({ check: 'placeholder-only-label', severity: 'warn', kind: 'heuristic', message: 'Field has a placeholder but no visible <label>/aria-label (label disappears while typing)', selector: cssPath(el), placeholder: el.placeholder });
  }

  // ---- 5. broken images / fonts ----
  for (const img of document.images) {
    if (!img.getAttribute('src') && !img.srcset) continue;
    if (img.complete && img.naturalWidth === 0) add({ check: 'broken-image', severity: 'error', kind: 'measured', message: 'Image failed to load/decode', selector: cssPath(img), src: img.currentSrc || img.src });
    else if (!img.complete) add({ check: 'image-not-loaded', severity: 'info', kind: 'measured', message: 'Image not loaded yet (lazy or slow)', selector: cssPath(img), src: img.currentSrc || img.src });
  }
  const fontErrors = [];
  document.fonts.forEach((f) => { if (f.status === 'error') fontErrors.push(`${f.family} ${f.weight} ${f.style}`); });
  if (fontErrors.length) add({ check: 'font-load-error', severity: 'warn', kind: 'measured', message: 'Web font(s) failed to load; fallback font is rendering', fonts: fontErrors });

  return {
    viewport: { w: vw, h: vh },
    document: { scrollWidth: docW, scrollHeight: document.documentElement.scrollHeight },
    interactiveCount: inter.length,
    cls: Math.round((window.__rcCLS || 0) * 1000) / 1000,
    findings,
  };
}

// Snapshot of styles that typically change for a focus indicator.
function focusStyleSnapshot(el) {
  const cs = getComputedStyle(el);
  // Only include outline sub-properties when an outline actually renders:
  // Chromium's UA sheet changes outline-offset on :focus-visible links even when
  // the author set outline:none, which would otherwise look like a "change".
  const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  const outline = hasOutline ? [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.outlineOffset].join(' ') : 'none';
  return [outline, cs.boxShadow, cs.borderColor, cs.borderWidth, cs.backgroundColor, cs.color, cs.textDecorationLine].join('|');
}

async function focusCheck(page, tabs) {
  if (!tabs) return [];
  await page.evaluate((snapSrc) => {
    const snap = new Function('return ' + snapSrc)();
    window.__rcRest = new Map();
    for (const el of document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]')) window.__rcRest.set(el, snap(el));
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }, focusStyleSnapshot.toString());
  await page.mouse.move(-1, -1);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < tabs; i++) {
    await page.keyboard.press('Tab');
    const res = await page.evaluate((snapSrc) => {
      const snap = new Function('return ' + snapSrc)();
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const rest = window.__rcRest.get(el);
      const now = snap(el);
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.outlineColor);
      const changed = rest !== undefined && rest !== now;
      const id = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '|' + (el.textContent || el.getAttribute('aria-label') || el.name || '').trim().slice(0, 40);
      const r = el.getBoundingClientRect();
      return { id, outline, changed, rect: { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } };
    }, focusStyleSnapshot.toString());
    if (!res) continue;
    if (seen.has(res.id)) break; // wrapped around
    seen.add(res.id);
    if (!res.outline && !res.changed) {
      out.push({ check: 'focus-not-visible', severity: 'warn', kind: 'heuristic',
        message: 'No outline and no style change on keyboard focus (indicator may still exist via ::before/::after or a parent)',
        element: res.id, rect: res.rect });
    }
  }
  return out;
}

const THAI = 'การทดสอบข้อความภาษาไทยที่ยาวกว่าปกติเพื่อดูว่าเลย์เอาต์รองรับได้หรือไม่';
async function applyTextStress(page) {
  await page.evaluate((thai) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(n.parentElement.tagName) && n.textContent.trim().length > 1) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const len = n.textContent.trim().length;
      const extra = Math.max(3, Math.ceil(len * 0.4));
      let s = ''; while (s.length < extra) s += thai; n.textContent = n.textContent + s.slice(0, extra);
    }
  }, THAI);
}

function summariseAxe(r) {
  return {
    violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => t.startsWith('wcag')), nodes: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) })),
    incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    passes: r.passes.length,
  };
}

function diffPng(aPath, bPath, outPath) {
  const A = PNG.sync.read(fs.readFileSync(aPath));
  const B = PNG.sync.read(fs.readFileSync(bPath));
  const w = Math.max(A.width, B.width), h = Math.max(A.height, B.height);
  const pad = (img) => {
    if (img.width === w && img.height === h) return img.data;
    const p = new PNG({ width: w, height: h }); p.data.fill(255);
    PNG.bitblt(img, p, 0, 0, img.width, img.height, 0, 0); return p.data;
  };
  const out = new PNG({ width: w, height: h });
  const n = pixelmatch(pad(A), pad(B), out.data, w, h, { threshold: 0.1 });
  fs.writeFileSync(outPath, PNG.sync.write(out));
  return { diffPixels: n, ratio: Math.round((n / (w * h)) * 1e5) / 1e5, sizeChanged: A.width !== B.width || A.height !== B.height, size: [A.width, A.height, B.width, B.height] };
}

// ---------- main ----------
async function main() {
  const o = parseArgs(process.argv);
  if (o.help || !o.target) { console.log(HELP); process.exit(o.help ? 0 : 2); }
  const url = toUrl(o.target);
  fs.mkdirSync(o.out, { recursive: true });
  const viewports = o.viewports.split(',').map((s) => { const [w, h] = s.split('x').map(Number); return { w, h }; });
  const schemes = o.schemes.split(',');
  const started = Date.now();
  const browser = await chromium.launch();
  const report = { tool: 'render-check-prototype@0.1.0', target: url, startedAt: new Date().toISOString(), browser: `chromium ${browser.version()}`, runs: [], baselineDiff: [] };

  for (const scheme of schemes) {
    for (const vp of viewports) {
      const tag = `${vp.w}x${vp.h}-${scheme}`;
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: 'reduce', isMobile: false, hasTouch: vp.w < 600 });
      const page = await ctx.newPage();
      page.setDefaultTimeout(o.timeout);
      await page.addInitScript(() => {
        window.__rcCLS = 0;
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__rcCLS += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}
      });
      const consoleMsgs = [], pageErrors = [], failed = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 300), location: m.location().url }); });
      page.on('pageerror', (e) => pageErrors.push(String(e.message || e).slice(0, 300)));
      page.on('requestfailed', (r) => failed.push({ url: r.url(), type: r.resourceType(), error: r.failure()?.errorText }));
      page.on('response', (r) => { if (r.status() >= 400) failed.push({ url: r.url(), type: r.request().resourceType(), status: r.status() }); });

      const run = { tag, viewport: vp, scheme, findings: [], screenshots: {} };
      try {
        await page.goto(url, { waitUntil: 'load' });
        try { await page.waitForLoadState('networkidle', { timeout: 5000 }); } catch { run.notes = ['networkidle not reached in 5s']; }
        await page.evaluate(() => document.fonts.ready.then(() => true));
        await page.waitForTimeout(o.settleMs);
        await page.mouse.move(-1, -1);

        const vpShot = path.join(o.out, `${tag}-viewport.png`);
        await page.screenshot({ path: vpShot, animations: 'disabled', caret: 'hide' });
        run.screenshots.viewport = path.basename(vpShot);
        if (o.fullPage) {
          const fp = path.join(o.out, `${tag}-full.png`);
          await page.screenshot({ path: fp, fullPage: true, animations: 'disabled', caret: 'hide' });
          run.screenshots.full = path.basename(fp);
        }

        const pc = await page.evaluate(pageChecks);
        Object.assign(run, { document: pc.document, interactiveCount: pc.interactiveCount, cls: pc.cls });
        run.findings.push(...pc.findings);
        if (pc.cls > 0.1) run.findings.push({ check: 'layout-shift', severity: 'warn', kind: 'measured', message: `Cumulative layout shift ${pc.cls} during load (> 0.1 "needs improvement")` });

        if (o.axe) {
          const ax = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
          run.axe = summariseAxe(ax);
        }
        run.findings.push(...await focusCheck(page, o.focusTabs));

        if (o.stress) {
          await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.(); });
          await applyTextStress(page);
          await page.waitForTimeout(150);
          const st = path.join(o.out, `${tag}-stress-full.png`);
          await page.screenshot({ path: st, fullPage: true, animations: 'disabled', caret: 'hide' });
          run.screenshots.stress = path.basename(st);
          const spc = await page.evaluate(pageChecks);
          run.stress = { findings: spc.findings.filter((f) => ['horizontal-overflow', 'offscreen-content-masked', 'text-clipped', 'text-spill', 'interactive-overlap'].includes(f.check)), document: spc.document };
        }
      } catch (e) {
        run.findings.push({ check: 'run-error', severity: 'error', kind: 'measured', message: String(e.message || e).slice(0, 500) });
      }
      for (const m of consoleMsgs) run.findings.push({ check: m.type === 'error' ? 'console-error' : 'console-warning', severity: m.type === 'error' ? 'error' : 'info', kind: 'measured', message: m.text, location: m.location });
      for (const e of pageErrors) run.findings.push({ check: 'uncaught-exception', severity: 'error', kind: 'measured', message: e });
      for (const f of failed) run.findings.push({ check: 'request-failed', severity: ['image', 'font', 'stylesheet', 'script', 'document'].includes(f.type) ? 'error' : 'warn', kind: 'measured', message: `${f.type} ${f.status || f.error}`, url: f.url });

      if (o.baseline) {
        const base = path.join(o.baseline, run.screenshots.viewport || '');
        if (run.screenshots.viewport && fs.existsSync(base)) {
          const d = diffPng(base, path.join(o.out, run.screenshots.viewport), path.join(o.out, `${tag}-viewport-diff.png`));
          report.baselineDiff.push({ tag, ...d });
        } else report.baselineDiff.push({ tag, missingBaseline: true });
      }
      report.runs.push(run);
      await ctx.close();
    }
  }
  await browser.close();

  // summary
  const count = { error: 0, warn: 0, info: 0 };
  const byCheck = {};
  for (const r of report.runs) {
    for (const f of r.findings) { count[f.severity]++; byCheck[f.check] = (byCheck[f.check] || 0) + 1; }
    for (const v of r.axe?.violations || []) { const sev = ['critical', 'serious'].includes(v.impact) ? 'error' : 'warn'; count[sev]++; byCheck['axe:' + v.id] = (byCheck['axe:' + v.id] || 0) + 1; }
  }
  report.summary = { ...count, byCheck, durationMs: Date.now() - started };
  fs.writeFileSync(path.join(o.out, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`render-check: ${url}`);
  console.log(`  ${report.runs.length} runs, errors=${count.error} warns=${count.warn} info=${count.info}  (${report.summary.durationMs} ms)`);
  for (const [k, v] of Object.entries(byCheck).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
  for (const d of report.baselineDiff) console.log(`  diff ${d.tag}: ${d.missingBaseline ? 'no baseline' : `${d.diffPixels}px (${d.ratio})${d.sizeChanged ? ' size changed' : ''}`}`);
  console.log(`  report: ${path.join(o.out, 'report.json')}`);
  const fail = o.failOn === 'never' ? false : o.failOn === 'warn' ? count.error + count.warn > 0 : count.error > 0;
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(3); });
