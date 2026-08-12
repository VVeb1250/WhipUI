import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function runCli(argumentsList) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [join(repositoryRoot, 'bin/whipui.mjs'), ...argumentsList], {
      cwd: repositoryRoot,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.once('error', reject)
    child.once('close', (code) => resolvePromise({ code, stdout, stderr }))
  })
}

const projectRoot = await mkdtemp(join(tmpdir(), 'whipui-cross-platform-setup-'))
const dryRun = await runCli([
  'setup',
  projectRoot,
  '--ai',
  'all',
  '--yes',
  '--dry-run',
  '--json'
])

assert.equal(dryRun.code, 0, dryRun.stderr)
const plan = JSON.parse(dryRun.stdout)
const skillCommands = plan.results.filter((result) => result.kind === 'install-skill')
assert.equal(skillCommands.length, 3)
assert.equal(skillCommands.some((result) => result.displayCommand.includes('impeccable')), true)
assert.equal(skillCommands.some((result) => result.displayCommand.includes('ui-ux-pro-max-cli')), true)

const setup = await runCli([
  'setup',
  projectRoot,
  '--ai',
  'all',
  '--yes',
  '--skip-skills'
])

assert.equal(setup.code, 0, setup.stderr)
const manifest = JSON.parse(await readFile(join(projectRoot, '.whipui/capabilities.json'), 'utf8'))
assert.deepEqual(manifest.requiredMissing, [])
for (const relativePath of ['.codex/config.toml', '.vscode/mcp.json', '.mcp.json']) {
  assert.equal(existsSync(join(projectRoot, relativePath)), true, relativePath + ' was not created')
}

console.log('WhipUI cross-platform setup smoke test passed for ' + projectRoot)
