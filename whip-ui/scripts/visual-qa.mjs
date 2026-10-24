#!/usr/bin/env node
/** WhipUI local-first visual QA. Requires Playwright in the target project; never installs it. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const HELP = `WhipUI visual QA (local web apps)
Usage: node <whip-ui>/scripts/visual-qa.mjs --url http://127.0.0.1:5173 [options]
  --profile focused|standard   focused: one scoped viewport; standard: desktop + mobile
  --viewport desktop|mobile|both  override profile viewport selection
  --selector CSS              required for focused profile; capture only this element
  --out DIR                   output directory (default: .whip/qa)
  --previous REPORT.json      compare screenshot SHA-256 with previous report (exact equality)
  --full-page                 capture full pages (standard profile only)
  --timeout MS                navigation timeout (1000..60000, default: 15000)
  --help                      show help
Run from the frontend project directory. Playwright must already be installed locally.
The CLI visits localhost only, never installs packages, and does not validate aesthetics.
`;

export function parseArgs(args) {
  const options = { url: null, profile: 'standard', viewport: null, selector: null,
    out: '.whip/qa', previous: null, fullPage: false, timeout: 15000, help: false };
  const takesValue = new Set(['--url', '--profile', '--viewport', '--selector', '--out', '--previous', '--timeout']);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }
    if (arg === '--full-page') { options.fullPage = true; continue; }
    if (!takesValue.has(arg)) throw new Error(`Unknown option: ${arg}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    const key = ({ '--out': 'out' })[arg] ?? arg.slice(2);
    options[key] = value;
  }
  if (options.help) return options;
  if (!options.url) throw new Error('--url is required');
  let url;
  try { url = new URL(options.url); } catch { throw new Error('Invalid --url'); }
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Only localhost/loopback URLs are supported (no remote crawling)');
  }
  if (!['standard', 'focused'].includes(options.profile)) throw new Error('Invalid --profile');
  if (options.viewport && !['desktop', 'mobile', 'both'].includes(options.viewport)) throw new Error('Invalid --viewport');
  options.viewport ??= options.profile === 'focused' ? 'desktop' : 'both';
  if (options.profile === 'focused' && (!options.selector || options.viewport === 'both')) {
    throw new Error('Focused profile requires --selector and a single --viewport');
  }
  if (options.profile === 'focused' && options.fullPage) throw new Error('Focused capture cannot be --full-page');
  options.timeout = Number(options.timeout);
  if (!Number.isSafeInteger(options.timeout) || options.timeout < 1000 || options.timeout > 60000) {
    throw new Error('--timeout must be an integer between 1000 and 60000');
  }
  options.url = url.href;
  return options;
}

export const VIEWPORTS = Object.freeze({
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
});

export function viewportNames(options) {
  return options.viewport === 'both' ? ['desktop', 'mobile'] : [options.viewport];
}

export function classifyScreenshot(hash, key, previous) {
  const old = previous?.screenshots?.find(item => item.key === key);
  if (!old) return 'uncompared';
  return old.sha256 === hash ? 'unchanged' : 'changed';
}

export function findingsFromDom(dom, viewport) {
  const issues = [];
  if (dom.documentWidth > dom.viewportWidth + 2) {
    issues.push({ viewport, kind: 'horizontal-overflow', detail: `${dom.documentWidth}px exceeds ${dom.viewportWidth}px` });
  }
  for (const url of dom.brokenImages.slice(0, 5)) {
    issues.push({ viewport, kind: 'broken-image', detail: String(url).slice(0, 180) });
  }
  if (dom.brokenImages.length > 5) {
    issues.push({ viewport, kind: 'broken-image-more', detail: `${dom.brokenImages.length - 5} additional images` });
  }
  return issues;
}

export function conciseSummary(report) {
  const counts = `${report.screenshots.length} screenshot(s), ${report.issues.length} finding(s)`;
  const screenshots = report.screenshots.map(s => `${s.key}: ${s.status} (${s.file})`);
  const findings = report.issues.slice(0, 5).map(i => `- ${i.viewport}: ${i.kind} ${i.detail ?? ''}`.trim());
  return [`Whip visual QA: ${counts}`, `Report: ${report.reportPath}`,
    ...screenshots, ...findings, report.issues.length > 5 ? `...${report.issues.length - 5} more findings in report` : '',
    'NOT verified: aesthetics, usability, full accessibility, untested interactions/motion.'].filter(Boolean).join('\n');
}

function projectPlaywright() {
  const requireFromProject = createRequire(path.resolve(process.cwd(), '__whip_visual_qa__.cjs'));
  for (const name of ['playwright', '@playwright/test', 'playwright-core']) {
    try {
      const lib = requireFromProject(name);
      if (lib.chromium) return lib;
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error('Playwright not found in this project. Install/configure it in the project first; WhipUI does not install dependencies.');
}

function safePrevious(file, options) {
  if (!file) return null;
  const report = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  if (report.url !== options.url || report.profile !== options.profile || report.selector !== options.selector || report.fullPage !== options.fullPage) {
    throw new Error('Previous report has incompatible URL/profile/selector/fullPage; refusing misleading screenshot comparison');
  }
  return report;
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const broken = [...document.images]
      .filter(img => img.complete && img.naturalWidth === 0)
      .map(img => img.currentSrc || img.src || '(unknown)');
    return { documentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth,
      brokenImages: broken, imageCount: document.images.length };
  });
}

export async function runQa(options) {
  const previous = safePrevious(options.previous, options);
  const out = path.resolve(options.out);
  const { chromium } = projectPlaywright();
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = { schema: 1, url: options.url, profile: options.profile, selector: options.selector,
    fullPage: options.fullPage, viewports: viewportNames(options), screenshots: [], issues: [],
    checks: ['navigation', 'visible screenshot', 'horizontal document overflow', 'completed broken images', 'page/console errors'],
    notVerified: ['aesthetics', 'usability', 'full accessibility', 'untested interactions/motion'],
    reportPath: path.join(out, 'report.json') };
  try {
    for (const viewport of report.viewports) {
      const page = await browser.newPage({ viewport: VIEWPORTS[viewport], deviceScaleFactor: 1,
        isMobile: viewport === 'mobile', hasTouch: viewport === 'mobile' });
      const recorded = new Set();
      page.on('pageerror', err => recorded.add(`pageerror: ${String(err.message).slice(0, 160)}`));
      page.on('console', msg => {
        if (msg.type() === 'error') recorded.add(`console: ${msg.text().slice(0, 160)}`);
      });
      try {
        await page.goto(options.url, { waitUntil: 'domcontentloaded', timeout: options.timeout });
        await page.evaluate(async () => {
          await Promise.race([document.fonts?.ready ?? Promise.resolve(),
            new Promise(resolve => setTimeout(resolve, 1200))]);
        });
        const dom = await inspectPage(page);
        report.issues.push(...findingsFromDom(dom, viewport));
        let target = page;
        if (options.selector) {
          const element = page.locator(options.selector).first();
          if ((await element.count()) === 0) {
            report.issues.push({ viewport, kind: 'missing-selector', detail: options.selector });
            continue;
          }
          target = element;
        }
        const key = viewport;
        const name = `${viewport}${options.selector ? '-element' : ''}.png`;
        const file = path.join(out, name);
        const bytes = await target.screenshot({ path: file, animations: 'disabled',
          ...(target === page ? { fullPage: options.fullPage } : {}) });
        const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
        report.screenshots.push({ key, file, sha256, status: classifyScreenshot(sha256, key, previous) });
      } catch (error) {
        report.issues.push({ viewport, kind: 'capture-failed', detail: String(error.message).slice(0, 240) });
      } finally {
        for (const item of [...recorded].slice(0, 5)) {
          report.issues.push({ viewport, kind: 'browser-error', detail: item });
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
    fs.writeFileSync(report.reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  return report;
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) { console.log(HELP); return; }
    const report = await runQa(options);
    console.log(conciseSummary(report));
    if (report.issues.length) process.exitCode = 1;
  } catch (error) {
    console.error(`whip-visual-qa: ${error.message}`);
    process.exitCode = 2;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
