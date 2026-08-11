import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { buildFingerprint, parseFigmaUrl } from '../src/fingerprint.mjs'
import { main } from '../src/cli.mjs'
import { routeRequest } from '../src/router.mjs'

async function createTempProject() {
  return mkdtemp(join(tmpdir(), 'whipui-router-v0-'))
}

test('routes Pick from Web to Playwright MCP and does not own a runtime', () => {
  const plan = routeRequest({
    prompt: 'Open https://example.com and let me pick the pricing card',
    webPick: true
  })

  assert.equal(plan.kind, 'pick-from-web')
  assert.equal(plan.mcp[0].name, 'Playwright MCP')
  assert.equal(plan.mcp[0].role, 'primary')
  assert.equal(plan.skills.some((skill) => skill.startsWith('UI/UX Pro Max')), true)
  assert.equal(plan.skills.some((skill) => skill.startsWith('Impeccable')), true)
  assert.equal(plan.ownsRuntime, false)
})

test('detects Figma as a conditional input route', () => {
  const plan = routeRequest({
    prompt: 'Build this screen from https://www.figma.com/design/file-key/name?node-id=1-2'
  })

  assert.equal(plan.inputs.modes.includes('figma'), true)
  assert.equal(plan.mcp[0].name, 'Figma MCP')
  assert.equal(parseFigmaUrl(plan.inputs.urls[0]).nodeId, '1:2')
})

test('builds a fingerprint for screenshot, URL, Figma, and repo context', async () => {
  const projectRoot = await createTempProject()
  const screenshotPath = join(projectRoot, 'reference.png')
  const pngHeader = Buffer.alloc(24)
  pngHeader.writeUInt32BE(0x89504e47, 0)
  pngHeader.writeUInt32BE(0x0d0a1a0a, 4)
  pngHeader.writeUInt32BE(1280, 16)
  pngHeader.writeUInt32BE(720, 20)
  await writeFile(screenshotPath, pngHeader)

  const fingerprint = buildFingerprint({
    projectRoot,
    prompt: 'Build a distinctive pricing page.',
    screenshot: screenshotPath,
    figma: 'https://www.figma.com/file/file-key/Screen?node-id=1-2',
    url: 'https://example.com/pricing',
    mode: 'adapt'
  })

  assert.equal(fingerprint.sources.screenshot.width, 1280)
  assert.equal(fingerprint.sources.figma.nodeId, '1:2')
  assert.equal(fingerprint.sources.url.url, 'https://example.com/pricing')
  assert.equal(fingerprint.sources.existingRepo.inspected, false)
  assert.equal(fingerprint.visualQa.axes.includes('responsive-behavior'), true)
})

test('init is idempotent and preserves existing AGENTS content', async () => {
  const projectRoot = await createTempProject()
  const agentsPath = join(projectRoot, 'AGENTS.md')
  await writeFile(agentsPath, '# Existing project instructions\n')

  await main(['init', projectRoot, '--ai', 'both'])
  await main(['init', projectRoot, '--ai', 'both'])

  const agentsContent = await readFile(agentsPath, 'utf8')
  assert.match(agentsContent, /^# Existing project instructions/m)
  assert.equal((agentsContent.match(/WhipUI:BEGIN/g) ?? []).length, 1)
  assert.equal(existsSync(join(projectRoot, 'WhipUI.md')), true)
  assert.equal(existsSync(join(projectRoot, 'PROJECT-DNA.md')), true)
  assert.equal(existsSync(join(projectRoot, '.whipui/project-dna.json')), true)
  assert.equal(existsSync(join(projectRoot, '.whipui/capabilities.json')), true)
  assert.equal(existsSync(join(projectRoot, '.codex/config.toml')), true)
  assert.equal(existsSync(join(projectRoot, '.vscode/mcp.json')), true)
  assert.equal(existsSync(join(projectRoot, '.github/prompts/whipui-frontend.prompt.md')), true)
  assert.match(await readFile(join(projectRoot, 'AGENTS.md'), 'utf8'), /Impeccable/)
})

test('CLI creates Pick from Web, fingerprint, and visual QA handoff artifacts', async () => {
  const projectRoot = await createTempProject()
  await main([
    'pick',
    'https://example.com/pricing',
    '--root', projectRoot,
    '--selector', '.pricing-card'
  ])
  await main([
    'fingerprint',
    '--root', projectRoot,
    '--prompt', 'Adapt the pricing page.',
    '--url', 'https://example.com/pricing'
  ])
  await main([
    'critique',
    'http://localhost:3000/pricing',
    '--root', projectRoot
  ])

  const pickRequest = await readFile(join(projectRoot, '.whipui/pick-request.md'), 'utf8')
  const fingerprint = JSON.parse(await readFile(join(projectRoot, '.whipui/design-fingerprint.json'), 'utf8'))
  const visualQa = await readFile(join(projectRoot, '.whipui/visual-qa.md'), 'utf8')

  assert.match(pickRequest, /Playwright MCP/)
  assert.match(pickRequest, /computedStyles/)
  assert.equal(fingerprint.sources.url.url, 'https://example.com/pricing')
  assert.match(visualQa, /responsive behavior/)
})
