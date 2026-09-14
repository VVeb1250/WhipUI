import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rename, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { buildAgentBrief, buildFingerprint, mergeFingerprint, parseFigmaUrl } from '../src/fingerprint.mjs'
import { routeRequest } from '../src/router.mjs'
import { scaffoldProject } from '../src/scaffold.mjs'
import { selectWorkflow } from '../src/workflow.mjs'
import { buildCapabilityManifest } from '../src/capabilities.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cli = join(root, 'bin/whipui.mjs')
const cases = [
  ['I want an app to track the books I read', {}, 'design', 'ux-and-ui', 'build'],
  ['อยากได้เว็บจองเวิร์กชอป ใช้ง่ายและดูดี ช่วยคิดออกแบบให้เลย', {}, 'design', 'ux-and-ui', 'build'],
  ['Change the button radius to 8px', {}, 'ui', 'ui', 'build'],
  ['Build a blue button with 40px height and 8px radius', {}, 'ui', 'ui', 'build'],
  ['เพิ่ม field unique ID ในฟอร์ม', {}, 'ui', 'ui', 'build'],
  ['Build this exact card', { screenshot: 'reference.png' }, 'ui', 'ui', 'build'],
  ['Review checkout UX; keep the appearance and do not edit code', { screenshot: 'checkout.png' }, 'design', 'ux', 'review'],
  ['Review the UX, do not fix anything', {}, 'design', 'ux-and-ui', 'review'],
  ['เสนอมาก่อน อย่าเพิ่งเขียนโค้ด', {}, 'design', 'ux-and-ui', 'plan'],
  ['Redesign the onboarding flow', {}, 'design', 'ux-and-ui', 'build'],
  ['Make it distinctive, preserve the existing flow', {}, 'ui', 'ui', 'build'],
  ['Fix checkout UX without changing the appearance', {}, 'design', 'ux', 'build'],
  ['แก้ให้ใช้งานง่าย ไม่ต้องเปลี่ยนหน้าตา', {}, 'design', 'ux', 'build']
]

for (const [prompt, options, lane, focus, action] of cases) {
  test('workflow boundary: ' + prompt, () => {
    const plan = routeRequest({ prompt, ...options })
    assert.equal(plan.selection.lane, lane)
    assert.equal(plan.selection.focus, focus)
    assert.equal(plan.selection.action, action)
    assert.equal(plan.creativeDirection.required, lane === 'design' && focus !== 'ux' && action === 'build')
    assert.equal(plan.skills.some((skill) => skill.includes('Hallmark')), plan.creativeDirection.required)
    assert.equal(plan.ownsRuntime, false)
  })
}

test('Hallmark reference is bundled, requires its license and is restored by refresh', async () => {
  const project = await mkdtemp(join(tmpdir(), 'whipui-hallmark-'))
  await scaffoldProject(project, { ai: 'all' })
  const capability = () => buildCapabilityManifest(project).capabilities.find(({ id }) => id === 'hallmark-composition')
  assert.equal(capability().status, 'bundled')
  assert.equal(capability().ready, true)
  assert.equal(capability().installable, false)
  const license = join(project, '.whipui/licenses/hallmark-MIT.txt')
  assert.equal(await readFile(license, 'utf8'), await readFile(join(root, 'templates/licenses/hallmark-MIT.txt'), 'utf8'))
  assert.match(await readFile(license, 'utf8'), /Copyright \(c\) 2026 Hallmark contributors/)
  await rename(license, license + '.saved')
  assert.equal(capability().ready, false)
  await rename(license + '.saved', license)
  assert.equal(capability().ready, true)
  const reference = join(project, '.whipui/specialists/visual-composition.md')
  await rename(reference, reference + '.saved')
  assert.equal(capability().ready, false)
  const dna = await readFile(join(project, '.whipui/project-dna.json'), 'utf8')
  await scaffoldProject(project, { ai: 'all', refresh: true })
  assert.equal(capability().ready, true)
  assert.equal(await readFile(join(project, '.whipui/project-dna.json'), 'utf8'), dna)
})

test('explicit workflow reaches CLI, brief and fingerprint consistently', () => {
  const args = ['route', 'Build a specified panel', '--workflow', 'ui', '--json']
  const route = JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8' }))
  assert.equal(route.selection.skill, 'whipui')
  assert.equal(route.creativeDirection.required, false)
  const options = { prompt: 'Build a specified panel', workflow: 'ui' }
  assert.equal(buildFingerprint(options).selection.skill, 'whipui')
  assert.equal(buildFingerprint(options).creativeDirection.required, false)
  assert.match(buildAgentBrief(options), /workflows\/implement\.md/)
  const failure = spawnSync(process.execPath, [cli, 'route', 'Build an app', '--workflow', 'bogus'], { encoding: 'utf8' })
  assert.notEqual(failure.status, 0)
  assert.throws(() => selectWorkflow({ workflow: 'bogus' }), /Unknown --workflow/)
})

test('mixed Figma and web inputs retain both providers; no Figma suffix spoof', () => {
  const plan = routeRequest({
    prompt: 'Build the selected element',
    figma: 'https://figma.com/design/key/name',
    url: 'https://example.com',
    webPick: true
  })
  assert.ok(plan.mcp.some(({ name }) => name === 'Figma MCP'))
  assert.equal(plan.mcp.filter(({ name }) => name === 'Playwright MCP').length, 1)
  assert.ok(routeRequest({ prompt: 'I want a reading app' }).mcp.some(({ name }) => name === 'Playwright MCP'))
  assert.equal(routeRequest({ url: 'https://figma.com/design/key/name' }).inputs.modes.includes('url'), false)
  assert.equal(routeRequest({ url: 'https://notfigma.com/design/key/name' }).inputs.modes.includes('figma'), false)
  assert.throws(() => parseFigmaUrl('https://notfigma.com/design/key/name'), /Expected a figma.com/)
})

test('legacy passed gate is not evidence for a new task; selected identity survives', () => {
  const old = buildFingerprint({ prompt: 'Build a reading app' })
  old.creativeDirection.gate.status = 'passed'
  old.identity.artDirection = 'A quiet reading desk'
  old.uxQa.status = 'passed'
  old.visualQa.status = 'passed'
  old.uxQa.evidence.push({ task: 'old task', observation: 'old evidence' })
  const merged = mergeFingerprint(old, buildFingerprint({ prompt: 'Build a different app' }))
  assert.equal(merged.identity.artDirection, old.identity.artDirection)
  assert.equal(merged.creativeDirection.gate.status, 'pending')
  assert.equal(merged.uxQa.status, 'not-tested')
  assert.equal(merged.visualQa.status, 'pending')
  assert.deepEqual(merged.uxQa.evidence, old.uxQa.evidence)
})

test('refresh updates old skill templates with recoverable backups and preserves product state', async () => {
  const project = await mkdtemp(join(tmpdir(), 'whipui-refresh-'))
  await scaffoldProject(project, { ai: 'all' })
  const state = ['.whipui/project-dna.json', '.whipui/design-fingerprint.json', '.whipui/config.json', 'PROJECT-DNA.md']
  for (const path of state) await writeFile(join(project, path), 'custom state: ' + path)
  const skill = '.claude/skills/whipui/SKILL.md'
  await writeFile(join(project, skill), 'custom old skill')
  await writeFile(join(project, 'AGENTS.md'), '# User rules\n\n<!-- WhipUI:BEGIN -->\nold router\n<!-- WhipUI:END -->\n\nKeep this too.\n')
  const result = await scaffoldProject(project, { ai: 'all', refresh: true, force: true })
  for (const path of state) assert.equal(await readFile(join(project, path), 'utf8'), 'custom state: ' + path)
  const changed = result.results.find(({ path }) => path === skill)
  assert.equal(changed.status, 'updated')
  assert.equal(await readFile(join(project, changed.backup), 'utf8'), 'custom old skill')
  assert.match(await readFile(join(project, skill), 'utf8'), /name: whipui/)
  const instructions = await readFile(join(project, 'AGENTS.md'), 'utf8')
  assert.ok(instructions.startsWith('# User rules\n'))
  assert.ok(instructions.endsWith('Keep this too.\n'))
  assert.equal((instructions.match(/WhipUI:BEGIN/g) ?? []).length, 1)
  const rerun = await scaffoldProject(project, { ai: 'all', refresh: true })
  assert.ok(rerun.results.every(({ status }) => status === 'skipped'))
})

test('all selected hosts receive two skills and complete linked workflow/license closure', async () => {
  const project = await mkdtemp(join(tmpdir(), 'whipui-pack-'))
  const generated = await scaffoldProject(project, { ai: 'all' })
  const bundled = buildCapabilityManifest(project).capabilities.find(({ id }) => id === 'sumi-ux-references')
  assert.equal(bundled.status, 'bundled')
  assert.equal(bundled.ready, true)
  assert.equal(bundled.installable, false)
  for (const host of ['.agents', '.claude', '.github']) {
    for (const skill of ['whipui', 'whipdesign']) {
      assert.ok(existsSync(join(project, host, 'skills', skill, 'SKILL.md')))
    }
  }
  for (const { path } of generated.results.filter(({ path }) => path.endsWith('.md'))) {
    const body = await readFile(join(project, path), 'utf8')
    for (const [, target] of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(target)) continue
      assert.ok(existsSync(resolve(dirname(join(project, path)), target)), path + ' -> missing ' + target)
    }
  }
  assert.match(await readFile(join(project, '.whipui/licenses/sumi-NOTICE.txt'), 'utf8'), /Copyright 2026 Phazur Labs LLC/)
  const claudeOnly = await mkdtemp(join(tmpdir(), 'whipui-claude-only-'))
  await scaffoldProject(claudeOnly, { ai: 'claude' })
  assert.equal(existsSync(join(claudeOnly, '.agents')), false)
  assert.equal(existsSync(join(claudeOnly, '.github')), false)
})
