#!/usr/bin/env node
// WhipUI design state — a small, durable, human-readable record of what the
// user ASKED for, what was PROPOSED, what the user APPROVED / REJECTED, and what
// was SUPERSEDED. The point is decision continuity across turns and sessions:
// a suggestion, a fetched reference or an inferred preference never silently
// becomes an approved specification.
//
// Source of truth: .whipui/state.json (commit it). `show` renders Markdown.
// The script validates transitions; it cannot know who typed what, so the
// agent must pass the user's own words as --evidence. That is a soft rule made
// visible, not a hard gate.

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, whipuiDir, ensureDir } from './lib/common.mjs';

const SCHEMA = 'whipui-state/1';
const STATUSES = ['proposed', 'approved', 'rejected', 'superseded'];
const REF_ROLES = ['visual', 'flow', 'motion', 'impl', 'pattern', 'other'];
const REF_STATUSES = ['candidate', 'shown', 'liked', 'rejected', 'adopted'];
const TIERS = ['machine', 'advisory', 'human'];

const HELP = `usage: node state.mjs <command> [args]   (state file: .whipui/state.json, found by walking up from cwd)

  init [--goal TEXT]                         create .whipui/ (state.json + .gitignore for runs/evidence)
  show [--md] [--all]                        summary for the agent (default) or Markdown for the user
  brief --set key=value ...                  goal | audience | platform | task_family | mode
  brief --constraint TEXT | --criterion TEXT --tier machine|advisory|human
  decide --what TEXT [--why TEXT] [--scope global|page:NAME|component:NAME] [--source user|agent|reference]
                                             new decision, status=proposed. A requirement the user stated
                                             themselves: --source user --evidence "their words" (=> approved)
  approve ID --evidence "user's words / turn" approve a decision (by=user). Evidence is required
  reject ID  --evidence "user's words"       reject a decision (kept so it is not re-proposed)
  supersede ID --with NEWID [--evidence ...] replace a decision; superseding an APPROVED one needs user evidence
  ref add --url URL --role visual|flow|motion|impl|pattern [--source NAME] [--rights TEXT] [--why TEXT]
  ref note ID [--borrow T] [--avoid T] [--transform T] [--liked T] [--disliked T]
  ref status ID candidate|shown|liked|rejected|adopted [--evidence T]
  pref add --axis T --polarity T --evidence T [--confidence low|med|high] [--scope project|page:NAME]
  assume TEXT | assume-resolve ID confirmed|rejected [--evidence T]
  question add TEXT | question resolve ID --answer TEXT
  artifact add --path P --kind render|motion|design|baseline|review|code [--note T]
  next TEXT [TEXT ...]                       replace the next-actions list
  check TEXT                                 before proposing: list approved/rejected items that overlap TEXT
  validate                                   check invariants; exit 1 on violations`;

const SPEC = { goal: 'string', md: 'bool', all: 'bool', set: 'list', constraint: 'string', criterion: 'string', tier: 'string', what: 'string', why: 'string', scope: 'string', source: 'string', evidence: 'string', with: 'string', url: 'string', role: 'string', rights: 'string', borrow: 'string', avoid: 'string', transform: 'string', liked: 'string', disliked: 'string', axis: 'string', polarity: 'string', confidence: 'string', answer: 'string', path: 'string', kind: 'string', note: 'string', by: 'string' };

const now = () => new Date().toISOString();
function statePath() { return path.join(whipuiDir(), 'state.json'); }
function empty(goal = '') {
  return { schema: SCHEMA, created: now(), updated: now(),
    brief: { goal, audience: '', platform: '', task_family: '', mode: '', constraints: [], criteria: [] },
    decisions: [], references: [], preferences: [], assumptions: [], questions: [], artifacts: [], next: [], log: [] };
}
function load() {
  const p = statePath();
  if (!fs.existsSync(p)) die(`No state at ${p}. Run: node state.mjs init`);
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (s.schema !== SCHEMA) die(`Unknown schema ${s.schema}`);
  return s;
}
function save(s, msg) {
  s.updated = now();
  if (msg) { s.log.push({ at: s.updated, msg }); if (s.log.length > 200) s.log = s.log.slice(-200); }
  const p = statePath(); const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2) + '\n'); fs.renameSync(tmp, p);
  if (msg) console.log(msg);
}
function die(m, code = 2) { console.error('state: ' + m); process.exit(code); }
function nextId(list, prefix) { const n = list.reduce((m, x) => Math.max(m, Number(String(x.id).slice(prefix.length)) || 0), 0); return prefix + (n + 1); }
function find(list, id, what) { const x = list.find((d) => d.id === id); if (!x) die(`${what} ${id} not found`); return x; }
function need(v, flag) { if (!v || !String(v).trim()) die(`${flag} is required`); return String(v).trim(); }
function words(t) { return new Set(String(t).toLowerCase().split(/[^\p{L}\p{N}#]+/u).filter((w) => w.length > 2)); }

function cmdInit(o) {
  const dir = whipuiDir();
  ensureDir(dir);
  const p = path.join(dir, 'state.json');
  if (fs.existsSync(p)) { console.log(`state exists: ${p}`); return; }
  if (!fs.existsSync(path.join(dir, '.gitignore'))) fs.writeFileSync(path.join(dir, '.gitignore'), 'runs/\nevidence/\nreviews/\n');
  const s = empty(o.goal || '');
  save(s, `initialised ${p}`);
}

function cmdBrief(s, o) {
  for (const kv of o.set || []) {
    const i = kv.indexOf('='); if (i < 1) die(`--set expects key=value, got ${kv}`);
    const k = kv.slice(0, i), v = kv.slice(i + 1);
    if (!['goal', 'audience', 'platform', 'task_family', 'mode'].includes(k)) die(`unknown brief key ${k}`);
    s.brief[k] = v;
  }
  if (o.constraint) s.brief.constraints.push(o.constraint);
  if (o.criterion) { const tier = o.tier || 'advisory'; if (!TIERS.includes(tier)) die(`--tier must be ${TIERS.join('|')}`); s.brief.criteria.push({ text: o.criterion, tier }); }
  save(s, 'brief updated');
}

function cmdDecide(s, o) {
  const id = nextId(s.decisions, 'D');
  const source = o.source || 'agent';
  if (!['user', 'agent', 'reference'].includes(source)) die('--source must be user|agent|reference');
  // A requirement the user stated themselves is approved by definition, but only with their words as evidence.
  if (source === 'user') need(o.evidence, '--evidence (the user\'s words) for --source user');
  const status = source === 'user' ? 'approved' : 'proposed';
  const d = { id, what: need(o.what, '--what'), why: o.why || '', scope: o.scope || 'global', source, status, by: source === 'user' ? 'user' : 'agent', evidence: o.evidence || '', created: now(), history: [] };
  const conflicts = overlaps(s, d.what).filter((x) => x.status === 'approved' || x.status === 'rejected');
  s.decisions.push(d);
  save(s, `${id} ${status}: ${d.what} [${d.scope}]${source === 'user' ? ' (user-stated requirement)' : ''}`);
  if (conflicts.length) {
    console.log('  ! overlaps existing decisions — surface this to the user instead of silently overriding:');
    for (const c of conflicts) console.log(`    ${c.id} [${c.status}] ${c.what}`);
  }
}

function transition(s, id, status, o) {
  const d = find(s.decisions, id, 'decision');
  if (d.status === 'superseded') die(`${id} is superseded; decide a new one instead`);
  const evidence = need(o.evidence, '--evidence (the user\'s words or turn reference)');
  const by = o.by || 'user';
  if (status === 'approved' && by !== 'user') die('only the user can approve; record the agent\'s view with decide/--why instead');
  d.history.push({ from: d.status, to: status, by, evidence, at: now() });
  d.status = status; d.by = by; d.evidence = evidence;
  save(s, `${id} ${status} by ${by}: ${d.what}`);
}

function cmdSupersede(s, id, o) {
  const old = find(s.decisions, id, 'decision');
  const neu = find(s.decisions, need(o.with, '--with'), 'decision');
  if (old.status === 'approved' && !o.evidence) die(`${id} is APPROVED. Changing an approved decision needs the user's explicit OK (--evidence). Ask first.`);
  old.history.push({ from: old.status, to: 'superseded', by: o.evidence ? 'user' : 'agent', evidence: o.evidence || `replaced by ${neu.id}`, at: now() });
  old.status = 'superseded'; old.superseded_by = neu.id; neu.supersedes = old.id;
  save(s, `${id} superseded by ${neu.id}`);
}

function cmdRef(s, sub, rest, o) {
  if (sub === 'add') {
    const role = o.role || 'visual'; if (!REF_ROLES.includes(role)) die(`--role must be ${REF_ROLES.join('|')}`);
    const id = nextId(s.references, 'R');
    s.references.push({ id, url: need(o.url, '--url'), source: o.source || '', role, why: o.why || '', rights: o.rights || 'unverified', borrow: [], avoid: [], transform: [], liked: [], disliked: [], status: 'candidate', added: now() });
    return save(s, `${id} reference added (${role}): ${o.url}`);
  }
  const r = find(s.references, rest[0], 'reference');
  if (sub === 'note') {
    for (const k of ['borrow', 'avoid', 'transform', 'liked', 'disliked']) if (o[k]) r[k].push(o[k]);
    return save(s, `${r.id} notes updated`);
  }
  if (sub === 'status') {
    const st = rest[1]; if (!REF_STATUSES.includes(st)) die(`status must be ${REF_STATUSES.join('|')}`);
    if (['liked', 'rejected'].includes(st)) need(o.evidence, '--evidence (user reaction)');
    r.status = st; if (o.evidence) r.evidence = o.evidence;
    return save(s, `${r.id} -> ${st}${st === 'liked' ? ' (liking a reference is NOT approving every detail of it)' : ''}`);
  }
  die(`unknown ref subcommand ${sub}`);
}

function overlaps(s, text) {
  const w = words(text); if (!w.size) return [];
  const score = (t) => { const x = words(t); let n = 0; for (const k of x) if (w.has(k)) n++; return n; };
  const items = [
    ...s.decisions.map((d) => ({ kind: 'decision', id: d.id, status: d.status, what: d.what, n: score(d.what + ' ' + d.scope) })),
    ...s.references.filter((r) => r.status === 'rejected' || r.disliked.length).map((r) => ({ kind: 'reference', id: r.id, status: r.status, what: `${r.url} disliked: ${r.disliked.join('; ')}`, n: score(r.url + ' ' + r.disliked.join(' ')) })),
    ...s.preferences.map((p) => ({ kind: 'preference', id: p.id, status: `observed/${p.confidence}`, what: `${p.axis}: ${p.polarity}`, n: score(p.axis + ' ' + p.polarity) })),
  ];
  return items.filter((i) => i.n >= 1).sort((a, b) => b.n - a.n);
}

function summary(s, all) {
  const L = [];
  const b = s.brief;
  L.push(`WhipUI state (${statePath()}) updated ${s.updated}`);
  L.push(`goal: ${b.goal || '(unset)'}${b.task_family ? ` · task: ${b.task_family}` : ''}${b.mode ? ` · mode: ${b.mode}` : ''}${b.audience ? ` · audience: ${b.audience}` : ''}${b.platform ? ` · platform: ${b.platform}` : ''}`);
  if (b.constraints.length) L.push(`constraints: ${b.constraints.join(' | ')}`);
  if (b.criteria.length) L.push(`criteria: ${b.criteria.map((c) => `[${c.tier}] ${c.text}`).join(' | ')}`);
  const group = (st) => s.decisions.filter((d) => d.status === st);
  const fmt = (d) => `  ${d.id} ${d.what} [${d.scope}]${d.evidence ? ` — "${d.evidence.slice(0, 80)}"` : ''}`;
  for (const st of ['approved', 'proposed', 'rejected']) { const g = group(st); if (g.length) { L.push(`${st.toUpperCase()} (${g.length}):`); L.push(...g.map(fmt)); } }
  if (all) { const g = group('superseded'); if (g.length) { L.push(`SUPERSEDED (${g.length}):`); L.push(...g.map((d) => fmt(d) + ` -> ${d.superseded_by}`)); } }
  if (s.references.length) { L.push('REFERENCES:'); for (const r of s.references) L.push(`  ${r.id} [${r.role}/${r.status}] ${r.url}${r.borrow.length ? ' · borrow: ' + r.borrow.join('; ') : ''}${r.avoid.length ? ' · avoid: ' + r.avoid.join('; ') : ''}${r.disliked.length ? ' · user disliked: ' + r.disliked.join('; ') : ''}`); }
  if (s.preferences.length) { L.push('OBSERVED PREFERENCES (signals, not approvals):'); for (const p of s.preferences) L.push(`  ${p.id} ${p.axis}: ${p.polarity} (${p.confidence}, ${p.scope}) — ${p.evidence.slice(0, 60)}`); }
  const oa = s.assumptions.filter((a) => a.status === 'open'); if (oa.length) { L.push('OPEN ASSUMPTIONS:'); L.push(...oa.map((a) => `  ${a.id} ${a.text}`)); }
  const oq = s.questions.filter((q) => q.status === 'open'); if (oq.length) { L.push('OPEN QUESTIONS:'); L.push(...oq.map((q) => `  ${q.id} ${q.text}`)); }
  if (s.artifacts.length) { L.push('LATEST ARTIFACTS:'); L.push(...s.artifacts.slice(-5).map((a) => `  ${a.id} [${a.kind}] ${a.path}${a.note ? ' — ' + a.note : ''}`)); }
  if (s.next.length) L.push(`NEXT: ${s.next.join(' | ')}`);
  return L.join('\n');
}

function markdown(s) {
  const b = s.brief; const L = [`# Design state`, '', `_Updated ${s.updated}. Source: .whipui/state.json._`, '', '## Brief', '', `- **Goal:** ${b.goal || '—'}`, `- **Audience:** ${b.audience || '—'}`, `- **Platform:** ${b.platform || '—'}`, `- **Task:** ${b.task_family || '—'}${b.mode ? ` (${b.mode})` : ''}`];
  if (b.constraints.length) L.push(`- **Constraints:** ${b.constraints.join('; ')}`);
  if (b.criteria.length) { L.push('', '### Success criteria', '', '| Criterion | Checked by |', '|---|---|', ...b.criteria.map((c) => `| ${c.text} | ${c.tier} |`)); }
  L.push('', '## Decisions', '', '| ID | Decision | Scope | Status | Authority / evidence |', '|---|---|---|---|---|');
  for (const d of s.decisions) L.push(`| ${d.id} | ${d.what}${d.why ? `<br><small>${d.why}</small>` : ''} | ${d.scope} | **${d.status}**${d.superseded_by ? ` → ${d.superseded_by}` : ''} | ${d.by}${d.evidence ? `: “${d.evidence}”` : ''} |`);
  if (s.references.length) { L.push('', '## References', '', '| ID | Reference | Role | Status | Borrow | Avoid | User liked / disliked | Rights |', '|---|---|---|---|---|---|---|---|'); for (const r of s.references) L.push(`| ${r.id} | ${r.url} | ${r.role} | ${r.status} | ${r.borrow.join('; ')} | ${r.avoid.join('; ')} | ${r.liked.join('; ')} / ${r.disliked.join('; ')} | ${r.rights} |`); }
  if (s.preferences.length) { L.push('', '## Observed preferences (signals, not approvals)', ''); for (const p of s.preferences) L.push(`- ${p.axis}: ${p.polarity} — ${p.confidence}, ${p.scope} (“${p.evidence}”)`); }
  const oq = s.questions.filter((q) => q.status === 'open'); if (oq.length) { L.push('', '## Open questions', '', ...oq.map((q) => `- ${q.id}: ${q.text}`)); }
  if (s.next.length) { L.push('', '## Next', '', ...s.next.map((n) => `- ${n}`)); }
  return L.join('\n') + '\n';
}

function validate(s) {
  const errs = [];
  const ids = new Set(s.decisions.map((d) => d.id));
  for (const d of s.decisions) {
    if (!STATUSES.includes(d.status)) errs.push(`${d.id}: bad status ${d.status}`);
    if (d.status === 'approved' && (d.by !== 'user' || !d.evidence)) errs.push(`${d.id}: approved without user evidence`);
    if (d.status === 'rejected' && !d.evidence) errs.push(`${d.id}: rejected without evidence`);
    if (d.status === 'superseded' && !ids.has(d.superseded_by)) errs.push(`${d.id}: superseded_by missing/unknown`);
    const ap = d.history.filter((h) => h.to === 'approved');
    if (d.status === 'approved' && !ap.length && d.source !== 'user') errs.push(`${d.id}: approved with no approval history`);
  }
  for (const r of s.references) if (!REF_ROLES.includes(r.role)) errs.push(`${r.id}: bad role`);
  return errs;
}

function main() {
  const cmd = process.argv[2];
  let o;
  try { o = parseArgs([process.argv[0], ...process.argv.slice(2)], SPEC); } catch (e) { die(e.message); }
  const rest = o._;
  if (!cmd || o.help && !cmd) { console.log(HELP); process.exit(cmd ? 0 : 2); }
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') { console.log(HELP); return; }
  if (cmd === 'init') return cmdInit(o);
  const s = load();
  switch (cmd) {
    case 'show': return console.log(o.md ? markdown(s) : summary(s, o.all));
    case 'brief': return cmdBrief(s, o);
    case 'decide': return cmdDecide(s, o);
    case 'approve': return transition(s, need(rest[0], 'ID'), 'approved', o);
    case 'reject': return transition(s, need(rest[0], 'ID'), 'rejected', o);
    case 'supersede': return cmdSupersede(s, need(rest[0], 'ID'), o);
    case 'ref': return cmdRef(s, rest[0], rest.slice(1), o);
    case 'pref': {
      if (rest[0] !== 'add') die('usage: pref add ...');
      const id = nextId(s.preferences, 'P');
      const conf = o.confidence || 'low'; if (!['low', 'med', 'high'].includes(conf)) die('--confidence low|med|high');
      s.preferences.push({ id, axis: need(o.axis, '--axis'), polarity: need(o.polarity, '--polarity'), evidence: need(o.evidence, '--evidence'), confidence: conf, scope: o.scope || 'project', at: now() });
      return save(s, `${id} preference signal recorded (not an approval)`);
    }
    case 'assume': {
      const id = nextId(s.assumptions, 'S');
      s.assumptions.push({ id, text: need(rest.join(' '), 'TEXT'), status: 'open', at: now() });
      return save(s, `${id} assumption logged — state it to the user in one line`);
    }
    case 'assume-resolve': {
      const a = find(s.assumptions, need(rest[0], 'ID'), 'assumption');
      if (!['confirmed', 'rejected'].includes(rest[1])) die('assume-resolve ID confirmed|rejected');
      a.status = rest[1]; a.evidence = o.evidence || ''; return save(s, `${a.id} ${a.status}`);
    }
    case 'question': {
      if (rest[0] === 'add') { const id = nextId(s.questions, 'Q'); s.questions.push({ id, text: need(rest.slice(1).join(' '), 'TEXT'), status: 'open', at: now() }); return save(s, `${id} question added`); }
      if (rest[0] === 'resolve') { const q = find(s.questions, need(rest[1], 'ID'), 'question'); q.status = 'resolved'; q.answer = need(o.answer, '--answer'); return save(s, `${q.id} resolved`); }
      return die('question add|resolve');
    }
    case 'artifact': {
      if (rest[0] !== 'add') die('artifact add ...');
      const id = nextId(s.artifacts, 'A');
      s.artifacts.push({ id, path: need(o.path, '--path'), kind: o.kind || 'render', note: o.note || '', at: now() });
      if (s.artifacts.length > 60) s.artifacts = s.artifacts.slice(-60);
      return save(s, `${id} artifact recorded`);
    }
    case 'next': s.next = rest; return save(s, 'next actions set');
    case 'check': {
      const text = need(rest.join(' '), 'TEXT');
      const hits = overlaps(s, text).filter((h) => h.status !== 'proposed' && h.status !== 'superseded');
      if (hits.length) { console.log('word overlap with (respect approved; do not re-propose rejected without saying so):'); for (const h of hits.slice(0, 10)) console.log(`  ${h.id} [${h.kind}/${h.status}] ${h.what}`); }
      else console.log('no word overlap. Word matching misses synonyms, so compare by MEANING with the full list below:');
      const ap = s.decisions.filter((d) => d.status === 'approved'), rj = s.decisions.filter((d) => d.status === 'rejected');
      const rr = s.references.filter((r) => r.status === 'rejected' || r.disliked.length);
      if (ap.length) { console.log('APPROVED:'); for (const d of ap) console.log(`  ${d.id} ${d.what} [${d.scope}]`); }
      if (rj.length) { console.log('REJECTED:'); for (const d of rj) console.log(`  ${d.id} ${d.what} — ${d.evidence.slice(0, 70)}`); }
      if (rr.length) { console.log('DISLIKED REFERENCE TRAITS:'); for (const r of rr) console.log(`  ${r.id} ${r.disliked.join('; ') || '(reference rejected)'}`); }
      if (!ap.length && !rj.length && !rr.length) console.log('(no approved or rejected decisions yet)');
      return;
    }
    case 'validate': {
      const errs = validate(s);
      if (errs.length) { console.log('state INVALID:\n  ' + errs.join('\n  ')); process.exit(1); }
      return console.log(`state OK: ${s.decisions.length} decisions, ${s.references.length} references`);
    }
    default: die(`unknown command ${cmd}\n${HELP}`);
  }
}
main();
