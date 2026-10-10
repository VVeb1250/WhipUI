#!/usr/bin/env node
// WhipUI render-check — render a page at several viewports and collect cheap,
// high-signal TECHNICAL evidence: screenshots, axe-core, horizontal overflow,
// clipped/spilled text, overlapping/obscured controls, tap targets, focus
// visibility, console errors, failed requests, broken images/fonts, layout shift.
// Optional: dark scheme, Thai text-stress pass, baseline pixel diff, setup hook.
//
// It reports EVIDENCE, not a verdict on design quality or taste. Heuristic
// findings carry kind:"heuristic" and can be false positives: look at the
// screenshot before acting on them.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadOptional, loadPlaywright, notRendered, toUrl, parseArgs, parseViewports, defaultOut, ensureDir, writeEvidence, rel, VERSION } from './lib/common.mjs';

const TIERS = {
  min: { viewports: '375x812,768x1024,1440x900', schemes: 'light', stress: false },
  standard: { viewports: '375x812,768x1024,1440x900', schemes: 'light,dark', stress: true },
  extended: { viewports: '320x720,375x812,768x1024,1440x900,1920x1080', schemes: 'light,dark', stress: true },
};

const HELP = `usage: node render-check.mjs <url|file.html> [options]
  --tier min|standard|extended   preset matrix (default min). standard adds dark + Thai text stress
  --viewports LIST       override, e.g. 375x812,768x1024,1440x900
  --schemes LIST         light | dark | light,dark
  --stress               extra pass: expand every text node ~40% with Thai text
  --setup FILE.mjs       module exporting default async ({page, context, viewport, scheme}) => {}
                         run after load, before checks (open a menu, fill a form, mock a state)
  --ready SELECTOR       wait for this selector instead of best-effort network idle
  --baseline DIR         previous run dir; pixel-diff viewport screenshots (regression of untouched areas)
  --out DIR              output dir (default .whipui/runs/render-<timestamp>)
  --focus-tabs N         Tab presses for focus-visibility check (default 25, 0=off)
  --settle-ms N          wait after load before checks (default 600)
  --top N                finding groups printed to stdout (default 16; full list in report.json)
  --no-axe --no-full-page
  --fail-on error|warn|never     exit code policy (default never: evidence tool, not a gate)`;

const SPEC = { tier: 'string', viewports: 'string', schemes: 'string', stress: 'bool', setup: 'string', ready: 'string', baseline: 'string', out: 'string', 'focus-tabs': 'string', 'settle-ms': 'string', top: 'string', 'no-axe': 'bool', 'no-full-page': 'bool', 'fail-on': 'string', timeout: 'string' };

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
  // Removed from interaction / the a11y tree on purpose (reels, carousels, off-screen slides).
  const inInert = (el) => !!el.closest('[inert]');
  const deliberatelyHidden = (el) => !!el.closest('[inert],[aria-hidden="true"]');
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
        tr = tr ? { left: Math.min(tr.left, rr.left), top: Math.min(tr.top, rr.top), right: Math.max(tr.right, rr.right), bottom: Math.max(tr.bottom, rr.bottom), lineMax: Math.max(tr.lineMax, rr.height) }
                : { left: rr.left, top: rr.top, right: rr.right, bottom: rr.bottom, lineMax: rr.height };
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
      const masked = deliberatelyHidden(el);
      add({ check: 'text-clipped', severity: intentional || masked ? 'info' : 'warn', kind: 'heuristic',
        message: masked ? 'Text hidden by overflow inside an inert/aria-hidden subtree (reel/carousel pattern; likely intentional)'
               : intentional ? 'Text truncated by ellipsis/line-clamp (likely intentional; confirm full text is reachable)'
                             : `Text cut off on ${clipped.axis}-axis by overflow:hidden on ${clipped.by === el ? 'itself' : cssPath(clipped.by)}`,
        selector: cssPath(el), text: text(el), rect: r2(er) });
      clipCount++;
      continue;
    }
    // b) text spills outside its own box (overflow visible) — overlaps neighbours
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible' && cs.display !== 'inline' && cs.display !== 'contents') {
      // A line's text box is the font's content area (ascent+descent), which is taller
      // than the line box whenever line-height is tight (display type at 0.85-1.0).
      // That overhang is how CSS works, not visible spill, so discount it on the y-axis.
      const lh = parseFloat(cs.lineHeight);
      const overhang = Number.isFinite(lh) ? Math.max(0, (tr.lineMax - lh) / 2) : 0;
      const spillX = Math.max(tr.right - er.right, er.left - tr.left);
      const spillY = Math.max(tr.bottom - er.bottom, er.top - tr.top) - overhang;
      const spill = Math.max(spillX, spillY);
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
  const inter = [...document.querySelectorAll(INTERACTIVE)].filter((el) => visible(el) && !isSrOnly(el) && !el.disabled && !inInert(el));
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
      // Two links to the same place (title link + "open" link): a mis-tap lands in the same spot.
      const sameDest = A.el.tagName === 'A' && B.el.tagName === 'A' && A.el.href && A.el.href === B.el.href;
      add({ check: 'interactive-overlap', severity: sameDest ? 'info' : ratio > 0.25 ? 'error' : 'warn', kind: 'measured',
        message: `Interactive elements overlap (${Math.round(ratio * 100)}% of the smaller one)${sameDest ? ' — both go to the same URL, so low risk' : ''}`,
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
  // Faces whose src is local() only (metric-matched fallbacks generated by Astro,
  // Next.js, fontaine, Capsize…) "fail" whenever that system font isn't installed.
  // That is expected and harmless, so they are not reported as load errors.
  const localOnly = new Set(), urlFam = new Set(), declared = new Set();
  const unq = (v) => String(v || '').replace(/^["']|["']$/g, '').trim();
  const walkRules = (rules) => { for (const r of rules) {
    if (r.type === 5 /* FONT_FACE */) { const src = r.style.getPropertyValue('src'); declared.add(unq(r.style.getPropertyValue('font-family'))); (src && /url\(/i.test(src) ? urlFam : localOnly).add(unq(r.style.getPropertyValue('font-family'))); }
    else if (r.cssRules) { try { walkRules(r.cssRules); } catch {} }
  } };
  for (const sh of document.styleSheets) { try { walkRules(sh.cssRules); } catch { /* cross-origin sheet */ } }
  const fontErrors = [];
  document.fonts.forEach((f) => { if (f.status === 'error' && !(localOnly.has(unq(f.family)) && !urlFam.has(unq(f.family))) && !(!declared.has(unq(f.family)) && /\bfallback\b/i.test(f.family))) fontErrors.push(`${unq(f.family)} ${f.weight} ${f.style}`); });
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
  const own = [outline, cs.boxShadow, cs.borderColor, cs.borderWidth, cs.backgroundColor, cs.color, cs.textDecorationLine];
  // ::before/::after belong to the element itself (a common custom focus ring).
  for (const ps of ['::before', '::after']) { const p = getComputedStyle(el, ps); if (p.content && p.content !== 'none') own.push(p.opacity, p.transform, p.backgroundColor, p.borderColor, p.boxShadow, p.outlineStyle); }
  // Descendants: a focus style that only restyles a child (e.g. a track that thickens).
  const kids = [...el.querySelectorAll('*')].slice(0, 8).map((k) => { const c = getComputedStyle(k); return [c.transform, c.opacity, c.backgroundColor, c.color, c.boxShadow, c.borderColor, c.outlineStyle].join(','); });
  return own.join('|') + '##' + kids.join(';');
}

async function focusCheck(page, tabs) {
  if (!tabs) return [];
  await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
  await page.mouse.move(-1, -1);
  const out = [];
  const seen = new Set();
  for (let i = 0; i < tabs; i++) {
    await page.keyboard.press('Tab');
    const res = await page.evaluate(async (snapSrc) => {
      const snap = new Function('return ' + snapSrc)();
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      // Compare focused vs. blurred at the SAME scroll position (scroll-linked children
      // such as progress bars change while tabbing), with CSS transitions jumped to the end.
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const fin = () => { try { for (const a of el.getAnimations({ subtree: true })) if (a instanceof CSSTransition) a.finish(); } catch {} };
      fin();
      const now = snap(el);
      el.blur(); await frames(); fin();
      const rest = snap(el);
      el.focus({ preventScroll: true }); await frames(); fin();
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !/rgba\(.*,\s*0\)$/.test(cs.outlineColor);
      const [restOwn, restKids] = String(rest).split('##'); const [nowOwn, nowKids] = now.split('##');
      const changed = restOwn !== nowOwn;
      const kidChanged = restKids !== nowKids;
      const id = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '|' + ([el.getAttribute('aria-label'), el.textContent, el.name].map((v) => (v || '').trim()).find(Boolean) || '').slice(0, 40);
      const r = el.getBoundingClientRect();
      return { id, outline, changed, kidChanged, rect: { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } };
    }, focusStyleSnapshot.toString());
    if (!res) continue;
    if (seen.has(res.id)) break; // wrapped around
    seen.add(res.id);
    if (!res.outline && !res.changed) {
      out.push(res.kidChanged
        ? { check: 'focus-indicator-indirect', severity: 'warn', kind: 'heuristic',
            message: 'Keyboard focus only restyles a child element (no outline/ring on the control) — look at it focused: is the change clearly visible (WCAG 2.4.7)?',
            element: res.id, rect: res.rect }
        : { check: 'focus-not-visible', severity: 'warn', kind: 'heuristic',
            message: 'No outline and no style change on keyboard focus (indicator may still come from a parent)',
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
    violations: r.violations.map((v) => {
      const out = { id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => t.startsWith('wcag')), nodes: v.nodes.length, targets: v.nodes.slice(0, 8).map((n) => n.target.join(' ')) };
      // Contrast failures usually share one or two colour pairs (= one token to fix).
      if (v.id === 'color-contrast') {
        const pairs = new Map();
        for (const n of v.nodes) { const d = n.any?.[0]?.data; if (!d?.fgColor) continue;
          const k = `${d.fgColor} on ${d.bgColor}`; const e = pairs.get(k) || { fg: d.fgColor, bg: d.bgColor, ratio: d.contrastRatio, need: String(d.expectedContrastRatio || '').replace(':1', ''), nodes: 0 }; e.nodes++; pairs.set(k, e); }
        out.pairs = [...pairs.values()].sort((x, y) => y.nodes - x.nodes);
      }
      return out;
    }),
    incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    passes: r.passes.length,
  };
}


function diffPng(lib, aPath, bPath, outPath) {
  const { PNG, pixelmatch } = lib;
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

const SEV_RANK = { error: 0, warn: 1, info: 2 };
function findingKey(f) {
  return [f.check, f.selector || f.a?.selector || f.culprits?.[0]?.selector || f.element || f.url || f.message].join('|');
}

/** Merge identical findings across viewports/schemes so counts are not inflated. */
function dedupe(runs) {
  const map = new Map();
  for (const r of runs) {
    const all = [...r.findings.map((f) => ({ ...f })), ...(r.axe?.violations || []).map((v) => ({ check: 'axe:' + v.id, severity: ['critical', 'serious'].includes(v.impact) ? 'error' : 'warn', kind: 'measured', message: v.help, selector: v.targets[0], targets: v.targets, nodes: v.nodes, pairs: v.pairs })),
      ...(r.stress?.findings || []).map((f) => ({ ...f, check: f.check + '(stress)' }))];
    for (const f of all) {
      // One axe rule = one finding per page; merge its targets/pairs across runs
      // (keying by the first target split one root cause into several findings).
      const k = f.check.startsWith('axe:') ? f.check : findingKey(f);
      if (!map.has(k)) map.set(k, { ...f, where: [] });
      const m = map.get(k);
      if (m !== f && f.check.startsWith('axe:')) {
        m.targets = [...new Set([...(m.targets || []), ...(f.targets || [])])].slice(0, 12);
        m.nodes = Math.max(m.nodes || 0, f.nodes || 0);
        if (f.pairs) { const pm = new Map((m.pairs || []).map((p) => [p.fg + p.bg, p])); for (const p of f.pairs) { const e = pm.get(p.fg + p.bg); if (e) e.nodes = Math.max(e.nodes, p.nodes); else pm.set(p.fg + p.bg, { ...p }); } m.pairs = [...pm.values()].sort((x, y) => y.nodes - x.nodes); }
      }
      if (!m.where.includes(r.tag)) m.where.push(r.tag);
      if (SEV_RANK[f.severity] < SEV_RANK[m.severity]) m.severity = f.severity;
    }
  }
  return [...map.values()].sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.where.length - a.where.length);
}

async function main() {
  let o;
  try { o = parseArgs(process.argv, SPEC); } catch (e) { console.error(e.message); console.log(HELP); process.exit(2); }
  const target = o._[0];
  if (o.help || !target) { console.log(HELP); process.exit(o.help ? 0 : 2); }
  const tier = TIERS[o.tier || 'min'];
  if (!tier) { console.error(`Unknown tier ${o.tier}`); process.exit(2); }
  const opts = {
    viewports: parseViewports(o.viewports || tier.viewports),
    schemes: (o.schemes || tier.schemes).split(','),
    stress: o.stress || tier.stress,
    fullPage: !o['no-full-page'],
    axe: !o['no-axe'],
    focusTabs: o['focus-tabs'] !== undefined ? Number(o['focus-tabs']) : 25,
    settleMs: o['settle-ms'] !== undefined ? Number(o['settle-ms']) : 600,
    top: o.top !== undefined ? Number(o.top) : 16,
    timeout: o.timeout ? Number(o.timeout) : 30000,
    failOn: o['fail-on'] || 'never',
  };
  const url = toUrl(target);
  const out = ensureDir(path.resolve(o.out || defaultOut('render')));

  const pw = await loadPlaywright();
  if (pw.error) notRendered('render-check', pw.error);
  const { browser } = pw;
  const axeMod = opts.axe ? await loadOptional('@axe-core/playwright') : null;
  const AxeBuilder = axeMod?.AxeBuilder || axeMod?.default?.AxeBuilder || axeMod?.default;
  let diffLib = null;
  if (o.baseline) {
    const pngjs = await loadOptional('pngjs'); const pm = await loadOptional('pixelmatch');
    if (pngjs && pm) diffLib = { PNG: pngjs.PNG || pngjs.default.PNG, pixelmatch: pm.default || pm };
  }
  let setupFn = null;
  if (o.setup) setupFn = (await import(pathToFileURL(path.resolve(o.setup)).href)).default;

  const started = Date.now();
  const report = { tool: `whipui-render-check@${VERSION}`, target: url, startedAt: new Date().toISOString(), browser: `chromium ${browser.version()}`, options: { ...opts, viewports: opts.viewports.map((v) => `${v.w}x${v.h}`), setup: o.setup || null, ready: o.ready || null }, notes: [], runs: [], baselineDiff: [] };
  if (opts.axe && !AxeBuilder) report.notes.push('axe-core not installed: accessibility rules NOT run');
  if (o.baseline && !diffLib) report.notes.push('pngjs/pixelmatch not installed: baseline diff NOT run');

  for (const scheme of opts.schemes) {
    for (const vp of opts.viewports) {
      const tag = `${vp.w}x${vp.h}-${scheme}`;
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: vp.w < 600 });
      const page = await ctx.newPage();
      page.setDefaultTimeout(opts.timeout);
      await page.addInitScript(() => {
        window.__rcCLS = 0;
        try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__rcCLS += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}
      });
      const consoleMsgs = [], pageErrors = [], failed = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 300), location: m.location().url }); });
      page.on('pageerror', (e) => pageErrors.push(String(e.message || e).slice(0, 300)));
      page.on('requestfailed', (r) => failed.push({ url: r.url(), type: r.resourceType(), error: r.failure()?.errorText }));
      page.on('response', (r) => { if (r.status() >= 400) failed.push({ url: r.url(), type: r.request().resourceType(), status: r.status() }); });

      const run = { tag, viewport: vp, scheme, findings: [], screenshots: {}, notes: [] };
      try {
        await page.goto(url, { waitUntil: 'load' });
        if (o.ready) await page.waitForSelector(o.ready, { state: 'visible' });
        else { try { await page.waitForLoadState('networkidle', { timeout: 4000 }); } catch { run.notes.push('network not idle after 4s (use --ready SELECTOR for SPAs)'); } }
        await page.evaluate(() => document.fonts.ready.then(() => true));
        if (setupFn) { await setupFn({ page, context: ctx, viewport: vp, scheme }); run.notes.push('setup hook applied'); }
        await page.waitForTimeout(opts.settleMs);
        await page.mouse.move(-1, -1);

        const vpShot = path.join(out, `${tag}-viewport.png`);
        await page.screenshot({ path: vpShot, animations: 'disabled', caret: 'hide' });
        run.screenshots.viewport = path.basename(vpShot);
        if (opts.fullPage) {
          const fp = path.join(out, `${tag}-full.png`);
          await page.screenshot({ path: fp, fullPage: true, animations: 'disabled', caret: 'hide' });
          run.screenshots.full = path.basename(fp);
        }
        const pc = await page.evaluate(pageChecks);
        Object.assign(run, { document: pc.document, interactiveCount: pc.interactiveCount, cls: pc.cls });
        run.findings.push(...pc.findings);
        if (pc.cls > 0.1) run.findings.push({ check: 'layout-shift', severity: 'warn', kind: 'measured', message: `Approx. cumulative layout shift ${pc.cls} during load (> 0.1 "needs improvement")` });
        if (AxeBuilder) {
          const ax = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
          run.axe = summariseAxe(ax);
        }
        run.findings.push(...await focusCheck(page, opts.focusTabs));
        if (opts.stress) {
          await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.(); });
          await applyTextStress(page);
          await page.waitForTimeout(150);
          const st = path.join(out, `${tag}-stress-full.png`);
          await page.screenshot({ path: st, fullPage: true, animations: 'disabled', caret: 'hide' });
          run.screenshots.stress = path.basename(st);
          const spc = await page.evaluate(pageChecks);
          run.stress = { findings: spc.findings.filter((f) => ['horizontal-overflow', 'offscreen-content-masked', 'text-clipped', 'text-spill', 'interactive-overlap'].includes(f.check) && f.severity !== 'info'), document: spc.document };
        }
      } catch (e) {
        run.findings.push({ check: 'run-error', severity: 'error', kind: 'measured', message: String(e.message || e).split('\n')[0].slice(0, 400) });
      }
      // Blocked/unreachable third-party hosts (offline sandbox, proxy) are an ENVIRONMENT limit, not a page bug.
      const NET = /ERR_(TUNNEL_CONNECTION_FAILED|INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|PROXY_CONNECTION_FAILED|CONNECTION_REFUSED|CONNECTION_TIMED_OUT|ADDRESS_UNREACHABLE)/;
      const pageHost = (() => { try { return new URL(url).host; } catch { return ''; } })();
      const external = (u) => { try { const h = new URL(u).host; return !!h && h !== pageHost; } catch { return false; } };
      const netSeen = new Set(failed.filter((f) => NET.test(f.error || '') && external(f.url)).map((f) => f.url));
      for (const m of consoleMsgs) {
        if (m.type === 'error' && NET.test(m.text) && (netSeen.size || external(m.location))) continue; // reported once below as network-blocked
        if (m.type === 'error' && url.startsWith('file:') && (/from origin 'null'|CORS|file:\/\/.*(blocked|not allowed)|Cross origin requests/i.test(m.text) || (/ERR_FAILED/.test(m.text) && failed.some((f) => f.url.startsWith('file:') && ['xhr', 'fetch', 'script'].includes(f.type))))) {
          run.findings.push({ check: 'file-protocol-limit', severity: 'warn', kind: 'environment', message: 'Page loaded via file:// and a fetch/XHR/module request was blocked. Serve it over http (e.g. `npx serve` or `python3 -m http.server`) and re-run before treating this as a bug', location: m.location });
          continue;
        }
        run.findings.push({ check: m.type === 'error' ? 'console-error' : 'console-warning', severity: m.type === 'error' ? 'error' : 'info', kind: 'measured', message: m.text, location: m.location });
      }
      for (const e of pageErrors) run.findings.push({ check: 'uncaught-exception', severity: 'error', kind: 'measured', message: e });
      for (const f of failed) {
        if (url.startsWith('file:') && f.url.startsWith('file:') && ['xhr', 'fetch'].includes(f.type) && !f.status) continue; // covered by file-protocol-limit
        if (netSeen.has(f.url)) { run.findings.push({ check: 'network-blocked', severity: 'warn', kind: 'environment', message: `${f.type} from another host unreachable here (${f.error}). Offline/proxied environment? Verify on a connected machine; fallback ${f.type === 'font' ? 'font' : 'content'} is what rendered`, url: f.url }); continue; }
        run.findings.push({ check: 'request-failed', severity: ['image', 'font', 'stylesheet', 'script', 'document'].includes(f.type) ? 'error' : 'warn', kind: 'measured', message: `${f.type} ${f.status || f.error}`, url: f.url });
      }

      if (o.baseline && diffLib && run.screenshots.viewport) {
        const base = path.join(path.resolve(o.baseline), run.screenshots.viewport);
        if (fs.existsSync(base)) report.baselineDiff.push({ tag, ...diffPng(diffLib, base, path.join(out, run.screenshots.viewport), path.join(out, `${tag}-viewport-diff.png`)) });
        else report.baselineDiff.push({ tag, missingBaseline: true });
      }
      report.runs.push(run);
      await ctx.close();
    }
  }
  await browser.close();

  const merged = dedupe(report.runs);
  const count = { error: 0, warn: 0, info: 0 };
  for (const f of merged) count[f.severity]++;
  report.findings = merged;
  report.summary = { ...count, unique: merged.length, durationMs: Date.now() - started };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));

  const matrix = `${opts.viewports.map((v) => v.w).join('/')} ${opts.schemes.join('+')}${opts.stress ? ' +stress' : ''}`;
  const axeState = AxeBuilder ? 'axe ran' : 'axe NOT run';
  console.log(`render-check ${url}`);
  console.log(`  matrix ${matrix} · ${axeState} · ${report.runs.length} runs · ${report.summary.durationMs} ms`);
  console.log(`  unique findings: error=${count.error} warn=${count.warn} info=${count.info}`);
  // Group same check+message (e.g. 9x focus-not-visible) into one line to keep agent context small.
  const groups = new Map();
  for (const f of merged.filter((x) => x.severity !== 'info')) {
    const k = f.check + '|' + f.severity + '|' + (f.check.startsWith('focus') || f.check.startsWith('tap-target') ? '' : String(f.message).slice(0, 60));
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(f);
  }
  let printed = 0;
  for (const fs_ of groups.values()) {
    if (printed++ >= opts.top) { console.log(`  … ${groups.size - opts.top} more groups in report.json`); break; }
    const f = fs_[0];
    const sels = fs_.flatMap((x) => x.targets || [x.selector || x.a?.selector || x.culprits?.map((c) => c.selector).slice(0, 2).join(', ') || x.element || x.url || '']).filter(Boolean);
    const where = [...new Set(fs_.flatMap((x) => x.where))].join(', ');
    const selTxt = sels.length ? ' @ ' + sels.slice(0, 3).join(' ; ') + (sels.length > 3 ? ` (+${sels.length - 3})` : '') : '';
    const pairTxt = f.pairs?.length ? ' · ' + f.pairs.slice(0, 3).map((p) => `${p.ratio}:1 ${p.fg} on ${p.bg} (need ${p.need}) ×${p.nodes}`).join('; ') : '';
    console.log(`  [${f.severity}/${f.kind}] ${f.check}${fs_.length > 1 ? ' x' + fs_.length : ''}${selTxt} — ${String(f.message).slice(0, 120)}${pairTxt} (${where})`);
  }
  for (const d of report.baselineDiff) console.log(`  diff ${d.tag}: ${d.missingBaseline ? 'no baseline' : `${d.diffPixels}px (${d.ratio})${d.sizeChanged ? ' size changed' : ''}`}`);
  for (const n of report.notes) console.log(`  note: ${n}`);
  const opens = report.runs.filter((x) => x.screenshots.full && x.scheme === opts.schemes[0]).map((x) => path.join(out, x.screenshots.full));
  console.log(`  open these before describing the UI: ${opens.join('  ')}`);
  console.log(`  all screenshots + report.json: ${rel(out)}/`);
  writeEvidence('render-check', { target: url, out, matrix, summary: report.summary, axe: !!AxeBuilder });
  console.log(`WHIPUI-EVIDENCE render-check: rendered ${matrix}; errors=${count.error} warns=${count.warn}; ${axeState}; out=${rel(out)}`);
  const fail = opts.failOn === 'never' ? false : opts.failOn === 'warn' ? count.error + count.warn > 0 : count.error > 0;
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(3); });
