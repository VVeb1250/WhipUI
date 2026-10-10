#!/usr/bin/env node
// WhipUI interact — run a short interaction script against a real page without
// importing Playwright yourself (pilot P1: an agent's hand-written import path
// crashed and its keyboard test never ran). Your module receives a ready page.
//
//   node interact.mjs <url|file.html> steps.mjs [--viewport 1280x800] [--reduced-motion] [--dark] [--out DIR]
//
//   // steps.mjs
//   export default async ({ page, shot, check }) => {
//     await page.keyboard.press('Tab');
//     check('first tab lands on skip link', await page.evaluate(() => document.activeElement?.textContent?.includes('Skip')));
//     await page.getByRole('button', { name: /menu/i }).click();
//     await shot('menu-open');                      // saves a PNG, returns its absolute path
//     check('menu visible', await page.locator('nav[aria-label=Main]').isVisible());
//     return { focused: await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)) };
//   };
//
// Prints each check (pass/fail), console errors, the returned value, screenshot paths, and a
// WHIPUI-EVIDENCE line. Exit 1 if any check failed or the script threw.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPlaywright, notRendered, toUrl, parseArgs, defaultOut, ensureDir, writeEvidence, rel, VERSION } from './lib/common.mjs';

const HELP = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 20).map((l) => l.replace(/^\/\/ ?/, '')).join('\n');

async function main() {
  let o; try { o = parseArgs(process.argv, { viewport: 'string', 'reduced-motion': 'bool', dark: 'bool', out: 'string', timeout: 'string' }); } catch (e) { console.error(e.message); process.exit(2); }
  const [target, script] = o._;
  if (o.help || !target || !script) { console.log(HELP); process.exit(o.help ? 0 : 2); }
  const steps = (await import(pathToFileURL(path.resolve(script)).href)).default;
  if (typeof steps !== 'function') { console.error('steps module must `export default async ({ page, shot, check }) => {...}`'); process.exit(2); }
  const pw = await loadPlaywright();
  if (pw.error) notRendered('interact', pw.error);
  const [w, h] = (o.viewport || '1280x800').split('x').map(Number);
  const out = ensureDir(path.resolve(o.out || defaultOut('interact')));
  const ctx = await pw.browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: o['reduced-motion'] ? 'reduce' : 'no-preference', colorScheme: o.dark ? 'dark' : 'light', hasTouch: w < 600 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(Number(o.timeout || 10000));
  const errors = [];
  page.on('pageerror', (e) => errors.push('uncaught: ' + String(e.message || e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  const checks = [], shots = [];
  const check = (label, cond) => { checks.push({ label, pass: !!cond }); return !!cond; };
  const shot = async (name = `step${shots.length + 1}`, opts = {}) => { const f = path.join(out, `${String(shots.length + 1).padStart(2, '0')}-${name.replace(/[^\w-]/g, '_')}.png`); await page.screenshot({ path: f, ...opts }); shots.push(f); return f; };
  let ret, threw = null;
  try {
    await page.goto(toUrl(target), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    ret = await steps({ page, context: ctx, shot, check });
  } catch (e) { threw = String(e.message || e).split('\n').slice(0, 3).join(' | '); try { await shot('at-error'); } catch {} }
  await pw.browser.close();
  const failed = checks.filter((c) => !c.pass).length;
  console.log(`interact ${toUrl(target)} · ${w}x${h}${o['reduced-motion'] ? ' · reduced-motion' : ''}${o.dark ? ' · dark' : ''}`);
  for (const c of checks) console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.label}`);
  if (threw) console.log(`  ERROR in steps: ${threw}`);
  for (const e of errors.slice(0, 10)) console.log(`  ${e}`);
  if (ret !== undefined) console.log(`  returned: ${JSON.stringify(ret).slice(0, 800)}`);
  for (const s of shots) console.log(`  screenshot: ${s}`);
  fs.writeFileSync(path.join(out, 'interact.json'), JSON.stringify({ tool: `whipui-interact@${VERSION}`, target, checks, errors, returned: ret ?? null, threw, shots }, null, 2));
  writeEvidence('interact', { target, out, checks: checks.length, failed, threw: !!threw });
  console.log(`WHIPUI-EVIDENCE interact: ${checks.length - failed}/${checks.length} checks passed${threw ? '; script error' : ''}; console errors=${errors.length}; out=${rel(out)}`);
  process.exit(failed || threw ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(3); });
