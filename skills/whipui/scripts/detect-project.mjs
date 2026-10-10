#!/usr/bin/env node
// WhipUI detect-project — read the repo's existing conventions BEFORE writing UI:
// framework, styling approach, token source, component library, motion library,
// test/visual tooling, and co-installed design skills (whose craft guidance we
// should defer to rather than contradict). Static file inspection only; no network.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from './lib/common.mjs';

const HELP = `usage: node detect-project.mjs [DIR] [--json]
  Prints the conventions found in DIR (default cwd). Read this before inventing tokens or adding dependencies.`;

const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'out', 'coverage', '.whipui', '.turbo', '.vercel', 'vendor']);

function walk(dir, max = 4000, depth = 0, acc = []) {
  if (acc.length >= max || depth > 6) return acc;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    if (acc.length >= max) break;
    if (e.name.startsWith('.') && !['.storybook', '.claude', '.agents', '.codex'].includes(e.name)) continue;
    if (IGNORE.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, max, depth + 1, acc); else acc.push(p);
  }
  return acc;
}

const read = (p, n = 200000) => { try { return fs.readFileSync(p, 'utf8').slice(0, n); } catch { return ''; } };

export function detect(root) {
  root = path.resolve(root);
  const files = walk(root);
  const relf = files.map((f) => path.relative(root, f));
  const has = (re) => relf.filter((f) => re.test(f));
  const pkgPath = path.join(root, 'package.json');
  const pkg = fs.existsSync(pkgPath) ? JSON.parse(read(pkgPath) || '{}') : null;
  const deps = pkg ? { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies } : {};
  const dep = (n) => deps[n];
  const out = { root, packageManager: null, framework: [], styling: [], tokens: [], components: [], motion: [], icons: [], fonts: [], testing: [], designDocs: [], designSkills: [], notes: [] };

  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) out.packageManager = 'pnpm';
  else if (fs.existsSync(path.join(root, 'yarn.lock'))) out.packageManager = 'yarn';
  else if (fs.existsSync(path.join(root, 'bun.lockb')) || fs.existsSync(path.join(root, 'bun.lock'))) out.packageManager = 'bun';
  else if (fs.existsSync(path.join(root, 'package-lock.json'))) out.packageManager = 'npm';

  const fw = [['next', 'Next.js'], ['react', 'React'], ['vue', 'Vue'], ['nuxt', 'Nuxt'], ['svelte', 'Svelte'], ['@sveltejs/kit', 'SvelteKit'], ['astro', 'Astro'], ['solid-js', 'Solid'], ['@angular/core', 'Angular'], ['react-native', 'React Native'], ['expo', 'Expo'], ['vite', 'Vite'], ['@remix-run/react', 'Remix'], ['preact', 'Preact'], ['lit', 'Lit']];
  for (const [n, label] of fw) if (dep(n)) out.framework.push(`${label} ${dep(n)}`);
  if (!pkg) {
    if (has(/\.html$/).length) out.framework.push('static HTML (no package.json)');
    if (has(/pubspec\.yaml$/).length) out.framework.push('Flutter');
    if (has(/\.xcodeproj|Package\.swift$/).length) out.framework.push('Swift/iOS');
    if (has(/ProjectSettings\/ProjectVersion\.txt$/).length) out.framework.push('Unity (UI Toolkit/uGUI — web tools do not apply)');
  }

  // Styling
  const tw = dep('tailwindcss');
  const cssFiles = has(/\.(css|scss|sass|less|pcss)$/).slice(0, 200).concat(has(/\.(html|vue|svelte|astro)$/).slice(0, 40)); // inline <style> blocks too
  const twConfig = has(/^tailwind\.config\.(js|cjs|mjs|ts)$/);
  let themeBlocks = 0, rootVars = 0, rootVarNames = [];
  for (const f of cssFiles) {
    const c = read(path.join(root, f), 300000);
    if (/@import\s+["']tailwindcss["']|@tailwind\s+base/.test(c)) out.styling.includes('Tailwind (CSS entry)') || out.styling.push('Tailwind (CSS entry)');
    const th = c.match(/@theme(\s+inline)?\s*\{/g); if (th) { themeBlocks += th.length; out.tokens.push(`Tailwind v4 @theme in ${f}`); }
    const rv = c.match(/:root[^{]*\{([^}]*)\}/g);
    if (rv) for (const block of rv) { const names = block.match(/--[\w-]+(?=\s*:)/g) || []; rootVars += names.length; rootVarNames.push(...names); if (names.length >= 5) out.tokens.push(`:root custom properties (${names.length}) in ${f}`); }
  }
  if (tw) out.styling.push(`Tailwind ${tw}${twConfig.length ? ` (config: ${twConfig[0]})` : ''}`);
  if (twConfig.length) out.tokens.push(`Tailwind theme in ${twConfig[0]}`);
  for (const [n, label] of [['styled-components', 'styled-components'], ['@emotion/react', 'Emotion'], ['@vanilla-extract/css', 'vanilla-extract'], ['sass', 'Sass'], ['@pandacss/dev', 'Panda CSS'], ['@stitches/react', 'Stitches'], ['unocss', 'UnoCSS']]) if (dep(n)) out.styling.push(`${label} ${dep(n)}`);
  if (has(/\.module\.(css|scss)$/).length) out.styling.push('CSS Modules');
  if (!out.styling.length && cssFiles.length) out.styling.push(`plain CSS (${cssFiles.length} files)`);

  // Tokens / design system files
  for (const f of has(/\.tokens(\.json)?$|tokens\.json$|style-dictionary|sd\.config|\$themes\.json$/)) out.tokens.push(`token file ${f}`);
  if (fs.existsSync(path.join(root, 'components.json'))) {
    try { const cj = JSON.parse(read(path.join(root, 'components.json'))); out.components.push(`shadcn/ui (style ${cj.style || '?'}, baseColor ${cj.tailwind?.baseColor || '?'}, cssVariables ${cj.tailwind?.cssVariables ?? '?'})`); } catch { out.components.push('shadcn/ui (components.json unreadable)'); }
  }
  for (const [n, label] of [['@mui/material', 'MUI'], ['@chakra-ui/react', 'Chakra UI'], ['@mantine/core', 'Mantine'], ['antd', 'Ant Design'], ['@radix-ui/themes', 'Radix Themes'], ['react-aria-components', 'React Aria'], ['@headlessui/react', 'Headless UI'], ['daisyui', 'daisyUI'], ['@ark-ui/react', 'Ark UI'], ['bits-ui', 'Bits UI'], ['vuetify', 'Vuetify'], ['primevue', 'PrimeVue'], ['@nextui-org/react', 'NextUI'], ['@heroui/react', 'HeroUI']]) if (dep(n)) out.components.push(`${label} ${dep(n)}`);
  const radix = Object.keys(deps).filter((d) => d.startsWith('@radix-ui/react-')); if (radix.length) out.components.push(`Radix primitives (${radix.length})`);
  const compDirs = [...new Set(has(/(^|\/)components\/(ui\/)?[^/]+\.(tsx|jsx|vue|svelte)$/).map((f) => path.dirname(f)))].slice(0, 5);
  if (compDirs.length) out.components.push(`component dirs: ${compDirs.join(', ')}`);
  if (has(/\.stories\.(tsx|jsx|ts|js|mdx)$/).length) out.testing.push(`Storybook stories (${has(/\.stories\./).length})`);

  for (const [n, label] of [['motion', 'Motion'], ['framer-motion', 'Framer Motion'], ['gsap', 'GSAP (check license clause for no-code builders)'], ['animejs', 'Anime.js'], ['lottie-web', 'lottie-web'], ['@lottiefiles/dotlottie-web', 'dotLottie'], ['@rive-app/canvas', 'Rive'], ['@react-spring/web', 'react-spring'], ['@formkit/auto-animate', 'AutoAnimate'], ['three', 'three.js'], ['@react-three/fiber', 'R3F']]) if (dep(n)) out.motion.push(`${label} ${dep(n)}`);
  for (const [n, label] of [['lucide-react', 'Lucide'], ['@heroicons/react', 'Heroicons'], ['@phosphor-icons/react', 'Phosphor'], ['@tabler/icons-react', 'Tabler'], ['react-icons', 'react-icons'], ['@iconify/react', 'Iconify']]) if (dep(n)) out.icons.push(`${label} ${dep(n)}`);
  for (const n of Object.keys(deps).filter((d) => d.startsWith('@fontsource'))) out.fonts.push(n);
  const nextFont = [];
  for (const f of has(/(layout|_app|_document|root)\.(tsx|jsx|ts|js)$/).slice(0, 10)) { const m = read(path.join(root, f)).match(/from\s+["']next\/font\/(google|local)["']/); if (m) nextFont.push(`next/font/${m[1]} in ${f}`); }
  out.fonts.push(...nextFont);
  for (const f of cssFiles.slice(0, 50)) { const c = read(path.join(root, f), 100000); const gf = c.match(/fonts\.googleapis\.com\/css2\?family=([^&"')]+)/); if (gf) out.fonts.push(`Google Fonts ${decodeURIComponent(gf[1]).replace(/\+/g, ' ')} (${f})`); }

  for (const [n, label] of [['@playwright/test', 'Playwright Test'], ['playwright', 'Playwright'], ['cypress', 'Cypress'], ['vitest', 'Vitest'], ['jest', 'Jest'], ['@axe-core/playwright', 'axe (Playwright)'], ['@storybook/react', 'Storybook'], ['chromatic', 'Chromatic'], ['lighthouse', 'Lighthouse']]) if (dep(n)) out.testing.push(`${label} ${dep(n)}`);
  if (has(/\.spec\.(ts|js)-snapshots\//).length) out.testing.push('Playwright screenshot baselines present');
  if (pkg?.scripts) { const s = Object.entries(pkg.scripts).filter(([k]) => /^(dev|start|build|preview|storybook|test)$/.test(k)); if (s.length) out.notes.push('scripts: ' + s.map(([k, v]) => `${k}="${v}"`).join(' · ')); }

  for (const f of has(/(^|\/)(DESIGN|PRODUCT|BRAND|STYLEGUIDE|design-system|CLAUDE|AGENTS)\.md$/i)) out.designDocs.push(f);
  if (fs.existsSync(path.join(root, '.whipui', 'state.json'))) out.designDocs.push('.whipui/state.json (WhipUI design state — read with state.mjs show)');

  // Co-installed design skills (project + user level, Claude Code / Codex / generic)
  const skillRoots = [path.join(root, '.claude', 'skills'), path.join(root, '.agents', 'skills'), path.join(root, '.codex', 'skills'), path.join(os.homedir(), '.claude', 'skills'), path.join(os.homedir(), '.agents', 'skills'), path.join(os.homedir(), '.codex', 'skills')];
  const designish = /frontend|design|taste|impeccable|ui-ux|hallmark|aesthetic|ui-pro|interface|style/i;
  for (const sr of skillRoots) {
    let ents = []; try { ents = fs.readdirSync(sr); } catch { continue; }
    for (const e of ents) if (designish.test(e) && !/^whipui$/i.test(e)) out.designSkills.push(`${e} (${sr.replace(os.homedir(), '~')})`);
  }
  if (!pkg && !files.length) out.notes.push('empty directory: greenfield');
  if (rootVarNames.length && !out.tokens.length) out.tokens.push(`:root vars: ${[...new Set(rootVarNames)].slice(0, 12).join(' ')}`);
  return out;
}

function main() {
  let o; try { o = parseArgs(process.argv, { json: 'bool' }); } catch (e) { console.error(e.message); process.exit(2); }
  if (o.help) { console.log(HELP); return; }
  const r = detect(o._[0] || process.cwd());
  if (o.json) { console.log(JSON.stringify(r, null, 2)); return; }
  const line = (k, v) => console.log(`${k.padEnd(13)} ${v.length ? v.join(' · ') : '—'}`);
  console.log(`project      ${r.root}${r.packageManager ? ' (' + r.packageManager + ')' : ''}`);
  line('framework', r.framework); line('styling', r.styling); line('tokens', r.tokens); line('components', r.components);
  line('motion', r.motion); line('icons', r.icons); line('fonts', r.fonts); line('testing', r.testing);
  line('design docs', r.designDocs); line('design skills', r.designSkills); for (const n of r.notes) console.log(`note         ${n}`);
  console.log('→ Extend what exists. Do not add a token system, component library, icon set or motion library the project does not already use unless the user agrees.');
  if (r.designSkills.length) console.log('→ A host design skill is installed: use it for visual craft; WhipUI governs intent, decisions, references and verification.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('detect-project.mjs')) main();
