#!/usr/bin/env node
// WhipUI pilot runner — matched arms on the same briefs, same model, same tools,
// same turn/time caps. Each run gets a fresh workspace. Outputs are captured
// (screenshots / motion recordings) and logged to eval/results/<pilot>/runs.csv.
//
//   node eval/run-pilot.mjs --pilot P1 --briefs B1,B2 --arms A,C --model sonnet [--seeds 1] [--max-turns 60]
//                           [--timeout-min 25] [--dry-run]
//
// Arms (see eval/PREREGISTRATION.md):
//   A   host default: Claude Code with whatever user skills are installed (frontend-design here) + the
//       same "you may verify in a browser" sentence every arm gets. The realistic strong baseline.
//   B   A + the brief's reference list (same refs C/D get)
//   C   B + WhipUI skill (--plugin-dir), invoked explicitly (/whipui:whipui)
//   Cp  B + WhipUI AGENTS snippet as always-on system text (no skill invocation)
//   D   C + the owner's pre-registered answer sheet (eval/answers/<brief>.md) for elicitation
//   Aa  A + the same answer sheet (separates "asking" from the rest of WhipUI)
//   T   A + WhipUI scripts described in a short tools card (adapters/TOOLS.snippet.md), no skill text: tools-only ablation
//   Cv2 same as C; used to re-run C after a skill edit without overwriting earlier C runs
// Claude Code only. Codex: replicate with `codex exec` and $whipui (not automated here).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const EVAL = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EVAL, '..');
const SKILL = path.join(ROOT, 'skills', 'whipui');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);

const pilot = opt('--pilot', 'P1');
const briefIds = opt('--briefs', 'B1').split(',');
const arms = opt('--arms', 'A,C').split(',');
const model = opt('--model', 'sonnet');
const seeds = Number(opt('--seeds', '1'));
const maxTurns = opt('--max-turns', '60');
const timeoutMin = Number(opt('--timeout-min', '25'));
const dry = flag('--dry-run');
const OUT = path.join(EVAL, 'results', pilot);
fs.mkdirSync(OUT, { recursive: true });

const VERIFY = 'You can run shell commands, and Playwright with Chromium is available (node + "playwright" package) if you want to screenshot and check your work in a browser.';
const AWAY = 'The client is not available during this run: where you would normally ask, take the most reasonable reading and state your assumptions.';
const DELIVER = 'Work in the current directory. Put the main page at index.html (or the files the brief names). When finished, reply with a short summary of what you built and what you verified.';

function loadBrief(id) {
  const f = fs.readdirSync(path.join(EVAL, 'briefs')).find((x) => x.startsWith(id + '-'));
  if (!f) throw new Error('brief not found: ' + id);
  const raw = fs.readFileSync(path.join(EVAL, 'briefs', f), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  for (const line of m[1].split('\n')) { const mm = line.match(/^(\w+):\s*(.*?)\s*(#.*)?$/); if (mm) meta[mm[1]] = mm[2]; }
  meta.viewports = (meta.viewports || '[1440x900, 390x844]').replace(/[[\]\s]/g, '').split(',').filter(Boolean);
  meta.references = (meta.references || '').replace(/[[\]\s]/g, '').split(',').filter(Boolean);
  return { id, file: f, text: m[2].trim(), meta };
}

function promptFor(brief, arm) {
  const refs = brief.meta.references.length ? `\nReferences to consider: ${brief.meta.references.join(', ')}` : '';
  const target = brief.meta.target ? `\nThe target screenshot is ./target.png.` : '';
  const answersFile = path.join(EVAL, 'answers', `${brief.id}.md`);
  const answers = fs.existsSync(answersFile) ? `\n\nThe client already answered your usual kickoff questions:\n${fs.readFileSync(answersFile, 'utf8').trim()}` : '';
  const body = `${brief.text}${target}`;
  switch (arm) {
    case 'A': return `${body}\n\n${VERIFY}\n${DELIVER}\n${AWAY}`;
    case 'B': case 'Cp': return `${body}${refs}\n\n${VERIFY}\n${DELIVER}\n${AWAY}`;
    case 'T': return `${body}\n\n${VERIFY}\n${DELIVER}\n${AWAY}`;
    case 'C': case 'Cv2': return `/whipui:whipui ${body}${refs}\n\n${VERIFY}\n${DELIVER}\n${AWAY}`;
    case 'D': return `/whipui:whipui ${body}${refs}${answers}\n\n${VERIFY}\n${DELIVER}\n${AWAY}`;
    case 'Aa': return `${body}${answers}\n\n${VERIFY}\n${DELIVER}\n${AWAY}`;
    default: throw new Error('unknown arm ' + arm);
  }
}

function prepWorkspace(brief, dir) {
  fs.mkdirSync(dir, { recursive: true });
  if (brief.meta.seed_repo) fs.cpSync(path.join(ROOT, brief.meta.seed_repo), dir, { recursive: true });
  if (brief.meta.target) fs.copyFileSync(path.join(ROOT, brief.meta.target), path.join(dir, 'target.png'));
  // never leak hidden scoring material
  for (const f of fs.readdirSync(dir)) if (/PLANTED|answers|PREREG/i.test(f)) fs.rmSync(path.join(dir, f), { force: true });
}

// Child runs must not inherit the builder's session (id, memory writes, extra CLAUDE.md dirs, messaging).
const STRIP = ['CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_REMOTE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD', 'CLAUDE_ADDITIONAL_DIRECTORIES', 'CLAUDE_CODE_POST_TURN_MEMORY', 'CLAUDE_CODE_POST_TURN_MEMORY_CONFIG', 'CLAUDE_CODE_MESSAGING_SOCKET', 'CLAUDE_CODE_MESSAGING_TOKEN', 'CLAUDE_CODE_TEE_SDK_STDOUT', 'CLAUDE_AFTER_LAST_COMPACT', 'CLAUDE_CODE_SESSION_ATTENDED', 'CLAUDE_CODE_SESSION_ORIGIN', 'CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES', 'CLAUDECODE', 'CLAUDE_PID', 'CLAUDE_CODE_DIAGNOSTICS_FILE', 'CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2'];
function cleanEnv() { const e = { ...process.env, CLAUDE_CODE_DISABLE_BACKGROUND_TASKS: '1' }; for (const k of STRIP) delete e[k]; return e; }

function transcriptFor(cwd, sessionId) {
  const proj = path.join(os.homedir(), '.claude', 'projects', path.resolve(cwd).replace(/[^A-Za-z0-9]/g, '-'));
  const f = path.join(proj, `${sessionId}.jsonl`);
  return fs.existsSync(f) ? f : null;
}

// A plugin copy containing ONLY the manifest + skill, outside the repo, so arm C can't browse eval/ or research/.
let _plugin = null;
function pluginCopy() {
  if (_plugin) return _plugin;
  _plugin = path.join(os.tmpdir(), 'whipui-pilot', `plugin-${process.pid}`);
  fs.rmSync(_plugin, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, '.claude-plugin'), path.join(_plugin, '.claude-plugin'), { recursive: true });
  fs.cpSync(path.join(ROOT, 'skills'), path.join(_plugin, 'skills'), { recursive: true, filter: (src) => !src.includes(`${path.sep}.whipui`) });
  return _plugin;
}

function runClaude(prompt, arm, cwd) {
  const a = ['-p', prompt, '--output-format', 'json', '--model', model, '--max-turns', maxTurns, '--permission-mode', 'bypassPermissions'];
  if (arm === 'C' || arm === 'Cv2' || arm === 'D') a.push('--plugin-dir', pluginCopy());
  // T = tools only: the same scripts, described in a short card, with none of the skill's workflow/policy text.
  if (arm === 'T') a.push('--append-system-prompt', fs.readFileSync(path.join(ROOT, 'adapters', 'TOOLS.snippet.md'), 'utf8').replaceAll('<scripts>', path.join(pluginCopy(), 'skills', 'whipui', 'scripts')));
  if (arm === 'Cp') a.push('--append-system-prompt', fs.readFileSync(path.join(ROOT, 'adapters', 'AGENTS.snippet.md'), 'utf8').replaceAll('<skill>', SKILL));
  if (dry) return Promise.resolve({ dry: true, cmd: ['claude', ...a.map((x) => (x.length > 80 ? JSON.stringify(x.slice(0, 77) + '…') : x))].join(' ') });
  return new Promise((resolve) => {
    const t0 = Date.now();
    const p = spawn('claude', a, { cwd, env: cleanEnv() });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d));
    const killer = setTimeout(() => p.kill('SIGTERM'), timeoutMin * 60000);
    p.on('close', (code) => {
      clearTimeout(killer);
      let j = null; try { j = JSON.parse(out.trim().split('\n').filter(Boolean).at(-1)); } catch {}
      resolve({ code, wall_s: Math.round((Date.now() - t0) / 1000), json: j, raw: out.slice(-4000), err: err.slice(-2000) });
    });
  });
}

// Serve the workspace over http so file:// limits don't create false errors (pilot P1 lesson).
function serve(dir) {
  const py = spawn('python3', ['-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', dir], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve) => {
    const onData = (d) => { const m = String(d).match(/port (\d+)/); if (m) resolve({ url: `http://127.0.0.1:${m[1]}`, stop: () => py.kill() }); };
    py.stdout.on('data', onData); py.stderr.on('data', onData);
    setTimeout(() => resolve({ url: null, stop: () => py.kill() }), 4000);
  });
}

async function capture(brief, work, capDir) {
  const srv = await serve(work);
  const at = (pg) => (srv.url ? `${srv.url}/${pg}` : path.join(work, pg));
  fs.mkdirSync(capDir, { recursive: true });
  const htmls = fs.readdirSync(work).filter((f) => f.endsWith('.html')).sort();
  const main = htmls.includes('index.html') ? ['index.html'] : htmls.slice(0, 3);
  const pages = brief.meta.family === 'DESIGN_ONLY' ? htmls.slice(0, 4) : brief.meta.family === 'EXTEND_EXISTING_SYSTEM' ? htmls.filter((f) => /settings/i.test(f)).concat(['index.html']) : main;
  const res = { pages, renders: [] };
  for (const pg of pages) {
    if (!fs.existsSync(path.join(work, pg))) continue;
    const o = path.join(capDir, pg.replace(/\W/g, '_'));
    const r = spawnSync('node', [path.join(SKILL, 'scripts', 'render-check.mjs'), at(pg), '--viewports', brief.meta.viewports.join(','), '--out', o, '--focus-tabs', '15'], { encoding: 'utf8', timeout: 240000 });
    let summary = null; try { summary = JSON.parse(fs.readFileSync(path.join(o, 'report.json'), 'utf8')).summary; } catch {}
    res.renders.push({ page: pg, dir: path.relative(OUT, o), summary, ok: r.status === 0 });
  }
  if (brief.meta.family === 'MOTION_ONLY' && fs.existsSync(path.join(work, 'index.html'))) {
    for (const [trig, name] of [['#cartBtn', 'drawer'], ['#add', 'add']]) {
      const o = path.join(capDir, 'motion-' + name);
      spawnSync('node', [path.join(SKILL, 'scripts', 'motion-probe.mjs'), at('index.html'), '--trigger', trig, '--video', '--out', o], { encoding: 'utf8', timeout: 240000 });
      res.renders.push({ page: 'motion-' + name, dir: path.relative(OUT, o) });
    }
  }
  srv.stop();
  return res;
}

const runsCsv = path.join(OUT, 'runs.csv');
const header = 'prereg_hash,run_id,output_id,brief_id,arm,seed,model,start_ts,wall_clock_s,input_tokens,cache_read_tokens,cache_write_tokens,output_tokens,cost_usd,num_turns,exit_code,render_errors,render_warns,whipui_invoked,notes';
if (!fs.existsSync(runsCsv)) fs.writeFileSync(runsCsv, header + '\n');
const prereg = fs.existsSync(path.join(EVAL, 'PREREGISTRATION.md')) ? crypto.createHash('sha256').update(fs.readFileSync(path.join(EVAL, 'PREREGISTRATION.md'))).digest('hex').slice(0, 12) : 'none';
const keyFile = path.join(OUT, 'KEY-do-not-open-before-judging.json');

for (const bid of briefIds) {
  const brief = loadBrief(bid);
  for (let seed = 1; seed <= seeds; seed++) {
    for (const arm of arms) {
      const runId = `${pilot}-${bid}-${arm}-s${seed}`;
      if ((arm === 'D' || arm === 'Aa') && !fs.existsSync(path.join(EVAL, 'answers', `${bid}.md`))) { console.log(`skip ${runId}: needs the owner's answer sheet eval/answers/${bid}.md`); continue; }
      const outputId = crypto.randomBytes(3).toString('hex');
      const dir = path.join(OUT, 'runs', runId);
      if (flag('--recapture') && fs.existsSync(path.join(dir, 'result.json'))) {
        fs.rmSync(path.join(dir, 'capture'), { recursive: true, force: true });
        const cap = await capture(brief, path.join(dir, 'work'), path.join(dir, 'capture'));
        fs.writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(cap, null, 2));
        console.log(`recaptured ${runId}: ${cap.renders.map((r) => `${r.page} e=${r.summary?.error ?? '-'} w=${r.summary?.warn ?? '-'}`).join(', ')}`);
        continue;
      }
      if (fs.existsSync(path.join(dir, 'result.json')) && !flag('--force')) { console.log(`skip ${runId} (done)`); continue; }
      const work = path.join(dir, 'work');
      // Agents run in a temp dir OUTSIDE the repo (no access to answer keys, blinding keys or other arms).
      const sandbox = path.join(os.tmpdir(), 'whipui-pilot', `${runId}-${crypto.randomBytes(3).toString('hex')}`);
      fs.rmSync(sandbox, { recursive: true, force: true });
      prepWorkspace(brief, sandbox);
      const prompt = promptFor(brief, arm);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'prompt.txt'), prompt);
      console.log(`▶ ${runId} (${model})`);
      const res = await runClaude(prompt, arm, sandbox);
      if (res.dry) { console.log('  ' + res.cmd); fs.rmSync(sandbox, { recursive: true, force: true }); continue; }
      fs.rmSync(work, { recursive: true, force: true });
      fs.cpSync(sandbox, work, { recursive: true });
      const tx = res.json?.session_id ? transcriptFor(sandbox, res.json.session_id) : null;
      if (tx) fs.copyFileSync(tx, path.join(dir, 'transcript.jsonl'));
      fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(res, null, 2));
      const cap = await capture(brief, work, path.join(dir, 'capture'));
      fs.writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(cap, null, 2));
      // Parallel-safe: each run owns its key fragment; the KEY file is rebuilt from all fragments.
      fs.writeFileSync(path.join(dir, 'key.json'), JSON.stringify({ [outputId]: { runId, arm, brief: bid, seed } }));
      const merged = {};
      for (const r of fs.readdirSync(path.join(OUT, 'runs'))) { try { Object.assign(merged, JSON.parse(fs.readFileSync(path.join(OUT, 'runs', r, 'key.json'), 'utf8'))); } catch {} }
      fs.writeFileSync(keyFile, JSON.stringify(merged, null, 2));
      const u = res.json?.usage || {};
      const errs = cap.renders.reduce((n, r) => n + (r.summary?.error || 0), 0), warns = cap.renders.reduce((n, r) => n + (r.summary?.warn || 0), 0);
      const invoked = /whipui/i.test(JSON.stringify(res.json?.result || '')) || fs.existsSync(path.join(work, '.whipui')) ? 1 : 0;
      const row = [prereg, runId, outputId, bid, arm, seed, model, new Date().toISOString(), res.wall_s, u.input_tokens ?? '', u.cache_read_input_tokens ?? '', u.cache_creation_input_tokens ?? '', u.output_tokens ?? '', res.json?.total_cost_usd ?? '', res.json?.num_turns ?? '', res.code, errs, warns, invoked, JSON.stringify((res.json?.terminal_reason || '') + (res.code ? ' exit' + res.code : ''))];
      fs.appendFileSync(runsCsv, row.join(',') + '\n');
      console.log(`  done ${res.wall_s}s · $${res.json?.total_cost_usd ?? '?'} · turns ${res.json?.num_turns ?? '?'} · render errors ${errs} warns ${warns}`);
    }
  }
}
console.log(`runs log: ${path.relative(process.cwd(), runsCsv)}  ·  blinding key: ${path.relative(process.cwd(), keyFile)} (don't open before judging)`);
