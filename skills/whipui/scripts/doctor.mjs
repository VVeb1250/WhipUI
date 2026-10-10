#!/usr/bin/env node
// WhipUI doctor — what can this environment actually verify? Run once per
// machine/session. "Installed" is not "callable": this launches the browser.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadOptional, loadPlaywright, SCRIPTS_DIR, VERSION, whipuiDir } from './lib/common.mjs';

const ok = (b) => (b ? 'OK ' : '-- ');
async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log('usage: node doctor.mjs\n  Reports what this machine can verify (node, Playwright/Chromium, axe, pixel diff, ffmpeg, design state) and how to install what is missing.'); return; }
  const lines = [];
  const major = Number(process.versions.node.split('.')[0]);
  lines.push(`${ok(major >= 18)} node ${process.versions.node}${major < 18 ? ' (need >= 18)' : ''}`);
  const pw = await loadOptional('playwright');
  let canRender = false, chromiumVersion = '';
  if (!pw) lines.push('-- playwright package not found (scripts dir or project)');
  else {
    const r = await loadPlaywright();
    if (r.error) lines.push(`-- ${r.error}`);
    else { canRender = true; chromiumVersion = r.browser.version(); await r.browser.close(); lines.push(`OK  chromium ${chromiumVersion} launches`); }
  }
  const axe = await loadOptional('@axe-core/playwright');
  lines.push(`${ok(!!axe)} @axe-core/playwright${axe ? '' : ' (render-check runs without accessibility rules)'}`);
  const pm = (await loadOptional('pixelmatch')) && (await loadOptional('pngjs'));
  lines.push(`${ok(!!pm)} pixelmatch + pngjs${pm ? '' : ' (no baseline diff / reduced-motion end-state diff)'}`);
  const ff = spawnSync('ffmpeg', ['-version']).status === 0;
  lines.push(`${ok(ff)} ffmpeg${ff ? '' : ' (motion video stays .webm; filmstrips still work)'}`);
  const st = path.join(whipuiDir(), 'state.json');
  lines.push(`${fs.existsSync(st) ? 'OK ' : '.. '} design state ${fs.existsSync(st) ? st : '(none yet: node state.mjs init when a project needs continuity)'}`);

  console.log(`WhipUI doctor v${VERSION} (scripts: ${SCRIPTS_DIR})`);
  for (const l of lines) console.log('  ' + l);
  if (!canRender) {
    console.log(`
To enable rendered verification (one time, ~150 MB browser):
  cd "${SCRIPTS_DIR}" && npm install --no-audit --no-fund && npx playwright install chromium
Or reuse a project that already has Playwright: run the scripts from that project's root.
Until then: report UI work as "not rendered / unverified" and say why.`);
  }
  console.log(`WHIPUI-EVIDENCE doctor: render=${canRender ? 'yes' : 'no'} axe=${axe ? 'yes' : 'no'} diff=${pm ? 'yes' : 'no'} ffmpeg=${ff ? 'yes' : 'no'}`);
}
main().catch((e) => { console.error(e); process.exit(3); });
