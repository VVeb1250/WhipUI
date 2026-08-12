import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  buildCapabilityManifest,
  detectCapabilities,
  resolveAiHosts
} from '../src/capabilities.mjs'
import { buildSetupPlan, buildSpawnSpec, setupProject } from '../src/setup.mjs'

async function createTempProject() {
  return mkdtemp(join(tmpdir(), 'whipui-capabilities-v0-'))
}

test('maps AI targets without changing the host contract', () => {
  assert.deepEqual(resolveAiHosts('both'), ['codex', 'vscode'])
  assert.deepEqual(resolveAiHosts('all'), ['codex', 'vscode', 'claude'])
  assert.deepEqual(resolveAiHosts('claude'), ['claude'])
})

test('builds a platform-safe package-runner process spec', () => {
  const spec = buildSpawnSpec({
    command: 'npx',
    args: ['--yes', 'impeccable'],
    cwd: 'project'
  })

  assert.equal(spec.executable, process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx')
  assert.deepEqual(spec.args, process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npx.cmd', '--yes', 'impeccable']
    : ['--yes', 'impeccable'])
  assert.equal(spec.shell, false)
  assert.equal(spec.windowsHide, process.platform === 'win32')
})

test('launches npx through the platform-safe package-runner spec', async () => {
  const spec = buildSpawnSpec({
    command: 'npx',
    args: ['--version'],
    cwd: process.cwd()
  })

  const result = await new Promise((resolve, reject) => {
    const child = spawn(spec.executable, spec.args, {
      cwd: spec.cwd,
      shell: spec.shell,
      windowsHide: spec.windowsHide,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (code) => resolve({ code, stdout, stderr }))
  })

  assert.equal(result.code, 0, result.stderr)
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/)
})

test('detects project-local skills and MCP configuration', async () => {
  const projectRoot = await createTempProject()
  const skillPath = join(projectRoot, '.claude/skills/impeccable/SKILL.md')
  const configPath = join(projectRoot, '.mcp.json')

  await mkdir(join(projectRoot, '.claude/skills/impeccable'), { recursive: true })
  await writeFile(skillPath, '# Impeccable\n')
  await writeFile(configPath, JSON.stringify({
    mcpServers: {
      playwright: { command: 'npx', args: ['@playwright/mcp@latest'] }
    }
  }))

  const capabilities = detectCapabilities(projectRoot, { ai: 'claude' })
  const impeccable = capabilities.find((capability) => capability.id === 'impeccable')
  const playwright = capabilities.find((capability) => capability.id === 'playwright-mcp')

  assert.equal(impeccable.status, 'installed')
  assert.equal(impeccable.scope, 'project')
  assert.equal(playwright.status, 'configured')
  assert.equal(playwright.scope, 'project')
})

test('setup configures Playwright locally and does not run skill installers by default', async () => {
  const projectRoot = await createTempProject()
  const plan = buildSetupPlan(projectRoot, {
    ai: 'all',
    configureMcp: true,
    installSkills: false
  })

  assert.equal(plan.installCommands.length, 0)
  assert.deepEqual(
    plan.operations.filter((operation) => operation.kind === 'configure-mcp').map((operation) => operation.relativePath),
    ['.codex/config.toml', '.vscode/mcp.json', '.mcp.json']
  )

  const setup = await setupProject(projectRoot, {
    ai: 'all',
    installSkills: false
  })

  assert.equal(setup.failures.length, 0)
  assert.equal(setup.results.some((operation) => operation.kind === 'install-skill'), false)
  assert.equal(existsSync(join(projectRoot, '.codex/config.toml')), true)
  assert.equal(existsSync(join(projectRoot, '.vscode/mcp.json')), true)
  assert.equal(existsSync(join(projectRoot, '.mcp.json')), true)

  const claudeConfig = JSON.parse(await readFile(join(projectRoot, '.mcp.json'), 'utf8'))
  const vscodeConfig = JSON.parse(await readFile(join(projectRoot, '.vscode/mcp.json'), 'utf8'))
  const codexConfig = await readFile(join(projectRoot, '.codex/config.toml'), 'utf8')

  assert.equal(claudeConfig.mcpServers.playwright.command, 'npx')
  assert.equal(vscodeConfig.servers.playwright.args[1], '@playwright/mcp@latest')
  assert.match(codexConfig, /\[mcp_servers\.playwright\]/)
  assert.equal(setup.manifest.requiredMissing.includes('playwright-mcp'), false)
  assert.equal(existsSync(join(projectRoot, '.whipui/capabilities.json')), true)
  assert.match(await readFile(join(projectRoot, '.whipui/providers.md'), 'utf8'), /impeccable/)

  const secondSetup = await setupProject(projectRoot, { ai: 'all', installSkills: false })
  assert.equal(secondSetup.failures.length, 0)
  assert.equal(secondSetup.results.every((operation) => operation.status === 'skipped'), true)
})

test('capability manifest keeps optional ecosystem adapters visible', async () => {
  const projectRoot = await createTempProject()
  const manifest = buildCapabilityManifest(projectRoot, { ai: 'all' })
  const ids = manifest.capabilities.map((capability) => capability.id)

  assert.equal(ids.includes('figma-mcp'), true)
  assert.equal(ids.includes('chrome-devtools-mcp'), true)
  assert.equal(ids.includes('fudge'), true)
  assert.equal(ids.includes('agentation'), true)
  assert.equal(ids.includes('onui'), true)
})
