// Shared helpers for WhipUI scripts. No third-party imports at module load:
// optional dependencies are resolved lazily so every script can degrade
// gracefully ("NOT RENDERED") instead of crashing with a stack trace.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const SCRIPTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VERSION = '2.0.0';

/**
 * Resolve an optional package: first from WhipUI's own scripts/node_modules,
 * then from the user's project (cwd), so a project that already has
 * Playwright does not need a second install.
 */
export async function loadOptional(name) {
  const bases = [path.join(SCRIPTS_DIR, 'package.json'), path.join(process.cwd(), 'package.json')];
  for (const base of bases) {
    try {
      const req = createRequire(base);
      const resolved = req.resolve(name);
      return await import(pathToFileURL(resolved).href);
    } catch { /* try next */ }
  }
  return null;
}

export async function loadPlaywright() {
  const pw = await loadOptional('playwright');
  if (!pw) {
    return { error: 'playwright package not found (run: node scripts/doctor.mjs for install steps)' };
  }
  const chromium = pw.chromium || pw.default?.chromium;
  try {
    const browser = await chromium.launch();
    return { chromium, browser };
  } catch (e) {
    return { error: `Chromium could not launch: ${String(e.message || e).split('\n')[0]} (try: npx playwright install chromium)` };
  }
}

/** Print the standard "could not render" message and exit non-zero (exit 4). */
export function notRendered(tool, reason) {
  console.log(`WHIPUI-EVIDENCE ${tool}: NOT RENDERED — ${reason}`);
  console.log('Report this as "not rendered / unverified". Do not claim visual results.');
  process.exit(4);
}

export function toUrl(t) {
  if (/^(https?|file|data):/i.test(t)) return t;
  return pathToFileURL(path.resolve(t)).href;
}

export function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); return d; }

/**
 * Locate the project's .whipui directory. Walks up from cwd looking for a
 * .whipui/state.json (a project that opted into design state), stopping at the
 * first project-root marker (.git or package.json) or the home directory, so it
 * never adopts an unrelated ancestor's folder. Falls back to <cwd>/.whipui.
 * (Field bug, pilot P1: a bare ancestor .whipui/ captured a run's outputs.)
 */
export function whipuiDir(start = process.cwd()) {
  const home = path.resolve(process.env.HOME || process.env.USERPROFILE || '/');
  let cur = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(cur, '.whipui', 'state.json'))) return path.join(cur, '.whipui');
    if (fs.existsSync(path.join(cur, '.git')) || fs.existsSync(path.join(cur, 'package.json'))) break;
    const parent = path.dirname(cur);
    if (parent === cur || cur === home) break;
    cur = parent;
  }
  return path.join(path.resolve(start), '.whipui');
}

/** Make sure .whipui/ exists with a .gitignore, so generated runs never pollute git status. */
export function ensureWhipui() {
  const d = ensureDir(whipuiDir());
  const gi = path.join(d, '.gitignore');
  if (!fs.existsSync(gi)) { try { fs.writeFileSync(gi, 'runs/\nevidence/\nreviews/\n'); } catch {} }
  return d;
}

export function defaultOut(kind) {
  // timestamp + random suffix: two runs in the same second must not overwrite each other
  return path.join(ensureWhipui(), 'runs', `${kind}-${stamp()}-${Math.random().toString(36).slice(2, 6)}`);
}

/**
 * Record the latest evidence for this tool so the user (and optional hooks)
 * can see when the UI was last actually rendered. Never throws.
 */
export function writeEvidence(tool, payload) {
  try {
    const dir = ensureDir(path.join(ensureWhipui(), 'evidence'));
    const rec = { tool, version: VERSION, at: new Date().toISOString(), ...payload };
    fs.writeFileSync(path.join(dir, `${tool}-latest.json`), JSON.stringify(rec, null, 2));
    return rec;
  } catch { return null; }
}

/** Tiny argv parser: --flag value, --bool, positionals. `spec` maps flag -> 'string'|'bool'|'list'. */
export function parseArgs(argv, spec) {
  const o = { _: [] };
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '-h' || k === '--help') { o.help = true; continue; }
    if (k.startsWith('--')) {
      const name = k.slice(2);
      const t = spec[name];
      if (!t) throw new Error(`Unknown option ${k}`);
      if (t === 'bool') o[name] = true;
      else if (t === 'list') { o[name] = o[name] || []; while (a[i + 1] && !a[i + 1].startsWith('--')) o[name].push(a[++i]); }
      else { if (a[i + 1] === undefined) throw new Error(`Missing value for ${k}`); o[name] = a[++i]; }
    } else o._.push(k);
  }
  return o;
}

export function parseViewports(s) {
  return s.split(',').map((v) => { const [w, h] = v.trim().split('x').map(Number); if (!w || !h) throw new Error(`Bad viewport "${v}" (use WxH)`); return { w, h }; });
}

/**
 * Build a contact sheet PNG from image files using the browser itself (no
 * ffmpeg/sharp dependency). `items` = [{ file, label }].
 */
export async function contactSheet(browser, items, outPath, { cols = 4, cellWidth = 320, title = '', crop = null } = {}) {
  const imgs = items.map((it) => ({ label: it.label, src: 'data:image/png;base64,' + fs.readFileSync(it.file).toString('base64') }));
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:12px;background:#111;color:#eee;font:12px/1.3 ui-monospace,Menlo,monospace}
    h1{font-size:13px;margin:0 0 8px}
    .g{display:grid;grid-template-columns:repeat(${cols},${cellWidth}px);gap:8px}
    figure{margin:0;background:#222;padding:4px}
    img{width:100%;display:block;background:#fff}
    .crop{position:relative;overflow:hidden;background:#fff}
    .crop img{position:absolute;max-width:none}
    figcaption{padding-top:3px}
  </style><h1>${escapeHtml(title)}</h1><div class="g">${imgs.map((i) => `<figure>${crop ? cropped(i.src) : `<img src="${i.src}">`}<figcaption>${escapeHtml(i.label)}</figcaption></figure>`).join('')}</div>`;
  function cropped(src) {
    const scale = cellWidth / crop.width;
    return `<div class="crop" style="width:${cellWidth}px;height:${Math.round(crop.height * scale)}px"><img src="${src}" style="left:${-crop.x * scale}px;top:${-crop.y * scale}px;transform-origin:0 0;width:auto;zoom:${scale}"></div>`;
  }
  const ctx = await browser.newContext({ viewport: { width: cols * (cellWidth + 8) + 24, height: 400 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, fullPage: true });
  await ctx.close();
  return outPath;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Paths shown to the agent are ABSOLUTE: relative ../../ chains caused missed screenshots in pilot P1. */
export function rel(p) { return path.resolve(p); }
