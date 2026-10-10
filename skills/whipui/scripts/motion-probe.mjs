#!/usr/bin/env node
// WhipUI motion-probe — verify motion from PLAYBACK, not from code or a still.
//
// Per motion mode (no-preference and reduce):
//   pass 1 (real time): trigger the interaction, record video, log rAF gaps,
//          long animation frames, event timing and layout shifts;
//   pass 2 (deterministic): re-trigger, inventory document.getAnimations(),
//          pause and seek every animation to N timestamps and screenshot each
//          frame. Seek order matters (validated in research R4):
//          await ready -> pause -> 2x rAF -> set currentTime -> 2x rAF -> screenshot.
// Outputs: report.json, filmstrip contact sheets, optional webm/mp4, and flags.
//
// The probe reports FACTS (timings, animated properties, residual motion under
// reduced-motion, jank, shifts). Whether motion *feels* right is for a human.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadOptional, loadPlaywright, notRendered, toUrl, parseArgs, defaultOut, ensureDir, writeEvidence, contactSheet, rel, VERSION } from './lib/common.mjs';

const HELP = `usage: node motion-probe.mjs <url|file.html> [options]
  --trigger SELECTOR   element to interact with (omit for load/entrance animations)
  --action click|hover|focus|scroll|none   (default click if --trigger, else none)
  --modes both|normal|reduce               (default both)
  --viewport WxH       (default 1280x800)
  --frames N           filmstrip frames per mode (default 12)
  --budget MS          choreography budget for the whole sequence (default 1000)
  --setup FILE.mjs     module: default async ({page, context}) => {} run before the trigger
  --video              record real-time video (webm; mp4 too if ffmpeg exists)
  --full-frame         filmstrip of the whole viewport (default: crop to the animated region)
  --out DIR            (default .whipui/runs/motion-<timestamp>)`;

const SPEC = { trigger: 'string', action: 'string', modes: 'string', viewport: 'string', frames: 'string', budget: 'string', setup: 'string', video: 'bool', out: 'string', 'full-frame': 'bool' };
const LAYOUT_PROPS = ['top', 'left', 'right', 'bottom', 'width', 'height', 'margin', 'marginTop', 'marginLeft', 'marginRight', 'marginBottom', 'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'maxHeight', 'maxWidth', 'minHeight', 'fontSize', 'lineHeight', 'gridTemplateRows', 'gridTemplateColumns', 'borderWidth'];
const SPATIAL_PROPS = ['transform', 'translate', 'scale', 'rotate', 'top', 'left', 'right', 'bottom', 'width', 'height', 'maxHeight', 'marginTop', 'marginLeft', 'offsetDistance', 'backgroundPosition'];

const INIT = () => {
  window.__mp = { gaps: [], loaf: [], events: [], shifts: [], t0: 0 };
  window.__raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  let last = 0;
  // Gaps are not counted while the probe itself is taking a screenshot (screenshots stall rAF).
  const loop = (t) => { if (window.__mp.hold) { last = 0; } else { if (last) { const g = t - last; if (g > 25) window.__mp.gaps.push(Math.round(g)); } last = t; } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  const obs = (type, fn, extra = {}) => { try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra }); } catch {} };
  obs('long-animation-frame', (e) => window.__mp.loaf.push({ d: Math.round(e.duration), block: Math.round(e.blockingDuration || 0), t: Math.round(e.startTime) }));
  obs('event', (e) => window.__mp.events.push({ name: e.name, d: Math.round(e.duration), t: Math.round(e.startTime) }), { durationThreshold: 16 });
  obs('layout-shift', (e) => window.__mp.shifts.push({ v: Math.round(e.value * 1000) / 1000, input: e.hadRecentInput, t: Math.round(e.startTime) }));
};

const INVENTORY = () => document.getAnimations().map((a) => {
  const eff = a.effect; const t = eff?.getComputedTiming?.() || {}; const el = eff?.target;
  const kfs = eff?.getKeyframes?.() || [];
  const desc = (n) => !n ? '' : (n.id ? '#' + n.id : n.tagName?.toLowerCase() + (n.classList?.length ? '.' + [...n.classList].slice(0, 2).join('.') : ''));
  return {
    kind: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '',
    target: desc(el), pseudo: eff?.pseudoElement || null,
    duration: t.duration === Infinity ? 'Infinity' : Math.round(t.duration || 0), delay: Math.round(t.delay || 0),
    iterations: t.iterations === Infinity ? 'Infinity' : t.iterations,
    endTime: t.endTime === Infinity ? 'Infinity' : Math.round(t.endTime || 0),
    timeline: a.timeline?.constructor?.name || null,
    easing: [eff?.getTiming?.().easing, ...kfs.map((k) => k.easing)].filter((e, i, arr) => e && arr.indexOf(e) === i),
    props: [...new Set(kfs.flatMap((k) => Object.keys(k)))].filter((p) => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)),
  };
});

// Text-bearing elements a sighted user can currently see (for "content missing under reduced motion").
const VISIBLE_TEXT = () => {
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight) continue;
    let op = 1, hidden = false;
    for (let c = el; c && c !== document.documentElement; c = c.parentElement) {
      const cs = getComputedStyle(c); op *= parseFloat(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') hidden = true;
    }
    if (!hidden && op > 0.1) out.push(el.textContent.trim().slice(0, 40));
  }
  return out;
};

// Union of animated targets' boxes (viewport coords), padded, for cropped filmstrips.
const ANIM_REGION = () => {
  const rs = document.getAnimations().map((a) => a.effect?.target).filter(Boolean).map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
  if (!rs.length) return null;
  const pad = 32; const x = Math.max(0, Math.min(...rs.map((r) => r.left)) - pad), y = Math.max(0, Math.min(...rs.map((r) => r.top)) - pad);
  const x2 = Math.min(innerWidth, Math.max(...rs.map((r) => r.right)) + pad), y2 = Math.min(innerHeight, Math.max(...rs.map((r) => r.bottom)) + pad);
  return x2 - x > 8 && y2 - y > 8 ? { x, y, width: x2 - x, height: y2 - y } : null;
};

async function trigger(page, o) {
  if (!o.trigger || o.action === 'none') return;
  const loc = page.locator(o.trigger).first();
  if (o.action === 'hover') await loc.hover();
  else if (o.action === 'focus') await loc.focus();
  else if (o.action === 'scroll') await loc.scrollIntoViewIfNeeded();
  else await loc.click();
}

async function prepare(browser, url, mode, vp, o, setupFn, videoDir) {
  const ctxOpts = { viewport: vp, deviceScaleFactor: 1, reducedMotion: mode };
  if (videoDir) ctxOpts.recordVideo = { dir: videoDir, size: vp };
  const context = await browser.newContext(ctxOpts);
  const page = await context.newPage();
  await page.addInitScript(INIT);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  if (setupFn) await setupFn({ page, context });
  return { context, page };
}

function flagsFor(inv, mode, o, health) {
  const flags = [];
  const timeBased = inv.filter((a) => a.timeline === 'DocumentTimeline');
  const finiteEnds = timeBased.map((a) => a.endTime).filter((e) => typeof e === 'number');
  const total = finiteEnds.length ? Math.max(...finiteEnds) : 0;
  for (const a of inv) {
    // A 0 ms (or single-frame) animation is a state change, not motion (pilot P1 false positive).
    if (typeof a.duration === 'number' && a.duration <= 16 && a.iterations !== 'Infinity') continue;
    const layout = a.props.filter((p) => LAYOUT_PROPS.includes(p));
    if (layout.length) flags.push({ severity: 'warn', check: 'layout-property-animated', target: a.target, message: `animates ${layout.join(', ')} (main-thread layout each frame; prefer transform/opacity or grid-template-rows trick)` });
    if (typeof a.duration === 'number' && a.duration > 500 && a.timeline === 'DocumentTimeline') flags.push({ severity: 'info', check: 'long-duration', target: a.target, message: `${a.duration} ms: fine for a rare expressive moment, sluggish for frequent interactions — confirm which this is` });
    if (a.iterations === 'Infinity') flags.push({ severity: 'info', check: 'infinite-animation', target: a.target, message: 'loops forever: WCAG 2.2.2 needs pause/stop/hide if it runs >5 s alongside other content' });
    if (mode === 'reduce') {
      const spatial = a.props.filter((p) => SPATIAL_PROPS.includes(p));
      if (spatial.length) flags.push({ severity: 'warn', check: 'reduced-motion-residual', target: a.target, message: `still animates ${spatial.join(', ')} under prefers-reduced-motion: reduce (fine only if essential, e.g. pointer-follow)` });
    }
  }
  if (total > o.budget) flags.push({ severity: 'warn', check: 'choreography-over-budget', message: `sequence ends at ${total} ms > budget ${o.budget} ms (${timeBased.filter((a) => a.delay > 0).length} delayed animations — stagger too long?)` });
  const bigGaps = health.gaps.filter((g) => g > 50);
  if (bigGaps.length) flags.push({ severity: 'warn', check: 'frame-gaps', message: `${bigGaps.length} frame gaps > 50 ms during playback (max ${Math.max(...bigGaps)} ms) — main-thread work during motion` });
  const longLoaf = health.loaf.filter((l) => l.d > 100);
  if (longLoaf.length) flags.push({ severity: 'warn', check: 'long-animation-frames', message: `${longLoaf.length} long animation frames > 100 ms (max ${Math.max(...longLoaf.map((l) => l.d))} ms)` });
  const slowEvent = health.events.filter((e) => e.d > 200);
  if (slowEvent.length) flags.push({ severity: 'warn', check: 'slow-interaction', message: `interaction to next paint ${Math.max(...slowEvent.map((e) => e.d))} ms (> 200 ms INP "needs improvement")` });
  const shifts = health.shifts.filter((s) => s.v > 0.01);
  if (shifts.length) flags.push({ severity: 'info', check: 'layout-shift-during-motion', message: `${shifts.length} layout shifts during playback (sum ${shifts.reduce((s, x) => s + x.v, 0).toFixed(3)}; ${shifts.filter((s) => s.input).length} after input, so excluded from CLS but still visible jumps)` });
  return { flags, totalMs: total };
}

async function pngDiffRatio(a, b) {
  const pngjs = await loadOptional('pngjs'); const pm = await loadOptional('pixelmatch');
  if (!pngjs || !pm) return null;
  const PNG = pngjs.PNG || pngjs.default.PNG; const pixelmatch = pm.default || pm;
  const A = PNG.sync.read(fs.readFileSync(a)), B = PNG.sync.read(fs.readFileSync(b));
  if (A.width !== B.width || A.height !== B.height) return 1;
  const n = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1 });
  return n / (A.width * A.height);
}

async function main() {
  let o;
  try { o = parseArgs(process.argv, SPEC); } catch (e) { console.error(e.message); console.log(HELP); process.exit(2); }
  const target = o._[0];
  if (o.help || !target) { console.log(HELP); process.exit(o.help ? 0 : 2); }
  o.action = o.action || (o.trigger ? 'click' : 'none');
  o.frames = Number(o.frames || 12); o.budget = Number(o.budget || 1000);
  const [vw, vh] = (o.viewport || '1280x800').split('x').map(Number);
  const vp = { width: vw, height: vh };
  const modes = (o.modes || 'both') === 'both' ? ['no-preference', 'reduce'] : [o.modes === 'normal' ? 'no-preference' : 'reduce'];
  const url = toUrl(target);
  const out = ensureDir(path.resolve(o.out || defaultOut('motion')));
  const pw = await loadPlaywright();
  if (pw.error) notRendered('motion-probe', pw.error);
  const { browser } = pw;
  const setupFn = o.setup ? (await import(pathToFileURL(path.resolve(o.setup)).href)).default : null;
  const report = { tool: `whipui-motion-probe@${VERSION}`, target: url, trigger: o.trigger || null, action: o.action, viewport: `${vw}x${vh}`, modes: {}, notes: [] };

  for (const mode of modes) {
    const m = { inventory: [], health: null, flags: [], frames: [], video: null };
    // ---- pass 1: real-time playback, measured WITHOUT video (recording perturbs frame timing) ----
    let { context, page } = await prepare(browser, url, mode, vp, o, setupFn, null);
    await page.evaluate(() => { window.__mp.gaps = []; window.__mp.loaf = []; window.__mp.events = []; window.__mp.shifts = []; });
    const before = path.join(out, `${mode}-rt-0000.png`);
    await page.screenshot({ path: before });
    await trigger(page, o);
    const invRT = await page.evaluate(INVENTORY);
    const ends = invRT.map((a) => a.endTime).filter((e) => typeof e === 'number');
    const waitMs = Math.min(Math.max(ends.length ? Math.max(...ends) : 0, 300) + 400, 8000);
    const mid = path.join(out, `${mode}-rt-0250.png`);
    const held = async (fn) => { await page.evaluate(() => { window.__mp.hold = true; }); await fn(); await page.evaluate(() => { window.__mp.hold = false; }); };
    await page.waitForTimeout(250); await held(() => page.screenshot({ path: mid }));
    await page.waitForTimeout(Math.max(0, waitMs - 250));
    m.health = await page.evaluate(() => window.__mp);
    const endShot = path.join(out, `${mode}-end.png`);
    await page.screenshot({ path: endShot });
    m.visibleAtEnd = await page.evaluate(VISIBLE_TEXT);
    m.endScreenshot = path.basename(endShot);
    await context.close();
    // ---- pass 1b: video only (no measurements taken from it) ----
    if (o.video) {
      const videoDir = ensureDir(path.join(out, `video-${mode}`));
      const v = await prepare(browser, url, mode, vp, o, setupFn, videoDir);
      await v.page.waitForTimeout(300); await trigger(v.page, o); await v.page.waitForTimeout(waitMs + 300);
      const video = v.page.video(); await v.context.close();
      const webm = await video.path(); m.video = path.relative(out, webm);
      const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', webm.replace(/\.webm$/, '.mp4')]);
      if (ff.status === 0) m.videoMp4 = path.relative(out, webm.replace(/\.webm$/, '.mp4'));
    }
    if (!invRT.length) {
      const r = await pngDiffRatio(before, mid);
      if (r !== null && r > 0.001) m.flags.push({ severity: 'info', check: 'motion-outside-waapi', message: `pixels changed ${(r * 100).toFixed(2)}% within 250 ms but no CSS/WAAPI animations found: JS-driven (rAF/canvas) motion — review the video; seek-filmstrip cannot cover it` });
    }

    // ---- pass 2: deterministic filmstrip ----
    ({ context, page } = await prepare(browser, url, mode, vp, o, setupFn, null));
    await trigger(page, o);
    m.inventory = await page.evaluate(INVENTORY);
    const tb = m.inventory.filter((a) => a.timeline === 'DocumentTimeline');
    const finite = tb.map((a) => a.endTime).filter((e) => typeof e === 'number');
    const infiniteDur = tb.filter((a) => a.endTime === 'Infinity').map((a) => (a.delay || 0) + (typeof a.duration === 'number' ? a.duration : 1000));
    const span = Math.max(finite.length ? Math.max(...finite) : 0, infiniteDur.length ? Math.max(...infiniteDur) : 0);
    if (tb.length && span > 0) {
      await page.evaluate(async () => { const A = document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline); await Promise.all(A.map((a) => a.ready)); A.forEach((a) => a.pause()); await window.__raf2(); });
      const n = Math.max(2, o.frames);
      let region = null; // union of animated targets' boxes across all sampled frames
      const times = [...new Set(Array.from({ length: n }, (_, i) => Math.round((span * i) / (n - 1))))];
      for (const t of times) {
        await page.evaluate(async (ms) => { document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline).forEach((a) => { a.currentTime = ms; }); await window.__raf2(); }, t);
        const f = path.join(out, `${mode}-t${String(t).padStart(5, '0')}.png`);
        await page.screenshot({ path: f });
        m.frames.push({ t, file: path.basename(f) });
        if (!o['full-frame']) { const r = await page.evaluate(ANIM_REGION); if (r) region = region ? { x: Math.min(region.x, r.x), y: Math.min(region.y, r.y), x2: Math.max(region.x2, r.x + r.width), y2: Math.max(region.y2, r.y + r.height) } : { x: r.x, y: r.y, x2: r.x + r.width, y2: r.y + r.height }; }
      }
      // Crop = union of animated regions over the sampled frames. Frames are only ever
      // seeked FORWARD before a screenshot: seeking backwards produced stale compositor frames.
      const clip = region ? { x: region.x, y: region.y, width: region.x2 - region.x, height: region.y2 - region.y } : null;
      m.crop = clip;
      m.contactSheet = path.basename(await contactSheet(browser, m.frames.map((f) => ({ file: path.join(out, f.file), label: `${mode} t=${f.t}ms` })), path.join(out, `filmstrip-${mode}.png`), { cols: clip && clip.width / clip.height > 2.5 ? 2 : Math.min(4, m.frames.length), cellWidth: clip && clip.width / clip.height > 2.5 ? 620 : 320, title: `${url} · ${o.action} ${o.trigger || ''} · ${mode}${clip ? ' · cropped to animated region' : ''}`, crop: clip }));
    } else if (!tb.length) m.notes = ['no time-based CSS/WAAPI animations after trigger'];
    await context.close();

    const f = flagsFor(m.inventory, mode, o, m.health);
    m.flags.push(...f.flags); m.totalMs = f.totalMs;
    report.modes[mode] = m;
  }

  if (report.modes['no-preference'] && report.modes.reduce) {
    const r = await pngDiffRatio(path.join(out, report.modes['no-preference'].endScreenshot), path.join(out, report.modes.reduce.endScreenshot));
    if (r !== null && r > 0.01) report.modes.reduce.flags.push({ severity: 'warn', check: 'end-state-differs', message: `final frame differs ${(r * 100).toFixed(1)}% between normal and reduced motion — content may be missing or stuck mid-state under reduce (compare *-end.png)` });
    const seen = new Set(report.modes.reduce.visibleAtEnd);
    const missing = report.modes['no-preference'].visibleAtEnd.filter((t) => !seen.has(t));
    if (missing.length) report.modes.reduce.flags.push({ severity: 'error', check: 'content-missing-under-reduce', message: `${missing.length} text element(s) visible after the interaction normally but NOT under reduced motion: ${missing.slice(0, 5).map((t) => JSON.stringify(t)).join(', ')} (animation:none on an element that starts hidden?)` });
    const nNormal = report.modes['no-preference'].inventory.length, nReduce = report.modes.reduce.inventory.length;
    const sig = (inv) => JSON.stringify(inv.map((a) => [a.props, a.duration]));
    report.reducedMotionChanged = nNormal !== nReduce || sig(report.modes['no-preference'].inventory) !== sig(report.modes.reduce.inventory);
    if (nNormal > 0 && !report.reducedMotionChanged) report.modes.reduce.flags.push({ severity: 'warn', check: 'reduced-motion-ignored', message: 'identical animations with prefers-reduced-motion: reduce — no reduced-motion handling detected' });
  }
  if (report.modes.reduce && report.modes['no-preference'] === undefined) report.notes.push('only reduce mode run');
  await browser.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`motion-probe ${url} · ${o.action} ${o.trigger || '(load)'} · ${vw}x${vh}`);
  let warns = 0;
  for (const [mode, m] of Object.entries(report.modes)) {
    const props = [...new Set(m.inventory.flatMap((a) => a.props))].join(',') || '-';
    console.log(`  [${mode}] ${m.inventory.length} animations · ends ${m.totalMs} ms · props ${props} · frames ${m.frames.length}${m.video ? ' · video ' + (m.videoMp4 || m.video) : ''}`);
    for (const fl of m.flags) { if (fl.severity === 'warn' || fl.severity === 'error') warns++; console.log(`    [${fl.severity}] ${fl.check}${fl.target ? ' @ ' + fl.target : ''} — ${fl.message}`); }
  }
  console.log(`  filmstrips/frames/report: ${rel(out)}/  — show the human the filmstrip/video; ask only about feel`);
  writeEvidence('motion-probe', { target: url, out, trigger: o.trigger || null, modes: Object.keys(report.modes), warns, video: !!o.video });
  console.log(`WHIPUI-EVIDENCE motion-probe: played ${Object.keys(report.modes).join('+')} for ${o.trigger || 'load'}; warns=${warns}; ${o.video ? 'video recorded' : 'no video'}; out=${rel(out)}`);
}

main().catch((e) => { console.error(e); process.exit(3); });
