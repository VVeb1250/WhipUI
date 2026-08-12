import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import {
  buildCapabilityManifest,
  detectCapabilities,
  resolveAiHosts
} from './capabilities.mjs'

const PLAYWRIGHT_SERVER = Object.freeze({
  command: 'npx',
  args: ['--yes', '@playwright/mcp@latest']
})

const MCP_CONFIGS = Object.freeze({
  codex: { relativePath: '.codex/config.toml', format: 'toml' },
  claude: { relativePath: '.mcp.json', format: 'json', rootKey: 'mcpServers' },
  vscode: { relativePath: '.vscode/mcp.json', format: 'json', rootKey: 'servers' }
})

const MCP_BLOCK = [
  '# WhipUI:BEGIN MCP',
  '[mcp_servers.playwright]',
  'command = "npx"',
  'args = ["--yes", "@playwright/mcp@latest"]',
  '# WhipUI:END MCP',
  ''
].join('\n')

function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}
function readJson(filePath) {
  if (!existsSync(filePath)) return { value: {}, existed: false, error: null }

  try {
    return {
      value: JSON.parse(readText(filePath)),
      existed: true,
      error: null
    }
  } catch (error) {
    return { value: null, existed: true, error }
  }
}

function hasPlaywrightServer(host, filePath) {
  if (!existsSync(filePath)) return { configured: false, valid: true }

  if (host === 'codex') {
    const content = readText(filePath)
    return {
      configured: /(^|\n)\s*\[mcp_servers\.playwright\]\s*(\n|$)/i.test(content)
        || /@playwright\/mcp/i.test(content),
      valid: true
    }
  }

  const parsed = readJson(filePath)
  if (parsed.error) return { configured: false, valid: false, error: parsed.error }
  const servers = parsed.value?.[MCP_CONFIGS[host].rootKey]
  return {
    configured: Boolean(servers && typeof servers === 'object' && servers.playwright),
    valid: true
  }
}

function getMcpOperation(projectRoot, host) {
  const config = MCP_CONFIGS[host]
  const filePath = join(projectRoot, config.relativePath)
  const state = hasPlaywrightServer(host, filePath)

  if (state.configured) {
    return {
      kind: 'configure-mcp',
      host,
      relativePath: config.relativePath,
      path: filePath,
      status: 'already-configured'
    }
  }

  if (!state.valid) {
    return {
      kind: 'configure-mcp',
      host,
      relativePath: config.relativePath,
      path: filePath,
      status: 'blocked',
      reason: 'Existing JSON is invalid; WhipUI will not overwrite it.'
    }
  }

  return {
    kind: 'configure-mcp',
    host,
    relativePath: config.relativePath,
    path: filePath,
    status: 'pending'
  }
}

function getMissingSkillOperations(projectRoot, ai, capabilities) {
  const hosts = resolveAiHosts(ai)
  const operations = []

  const impeccable = capabilities.find((capability) => capability.id === 'impeccable')
  const impeccableHosts = hosts.filter((host) => ['codex', 'claude'].includes(host))
  if (impeccable && !impeccable.ready && impeccableHosts.length > 0) {
    const providers = impeccableHosts
      .filter((host) => host === 'codex' || host === 'claude')
      .sort()

    operations.push({
      kind: 'install-skill',
      capability: 'impeccable',
      hosts: providers,
      command: 'npx',
      args: [
        '--yes',
        'impeccable',
        'skills',
        'install',
        '-y',
        '--providers=' + providers.join(','),
        '--scope=project'
      ],
      status: 'pending'
    })
  }

  const uiUx = capabilities.find((capability) => capability.id === 'ui-ux-pro-max')
  const uiUxHosts = hosts.filter((host) => host === 'codex' || host === 'claude')
  if (uiUx && !uiUx.ready) {
    for (const host of uiUxHosts) {
      operations.push({
        kind: 'install-skill',
        capability: 'ui-ux-pro-max',
        hosts: [host],
        command: 'npx',
        args: ['--yes', 'ui-ux-pro-max-cli', 'init', '--ai', host],
        status: 'pending'
      })
    }
  }

  return operations.map((operation) => ({ ...operation, cwd: projectRoot }))
}

export function buildSetupPlan(
  projectRoot,
  { ai = 'all', configureMcp = true, installSkills = false } = {}
) {
  const hosts = resolveAiHosts(ai)
  const capabilities = detectCapabilities(projectRoot, { ai })
  const operations = []

  if (configureMcp) {
    for (const host of hosts) operations.push(getMcpOperation(projectRoot, host))
  }

  const skillCapabilities = capabilities.filter(
    (capability) => capability.kind === 'skill' && capability.active && !capability.ready
  )
  if (installSkills) {
    operations.push(...getMissingSkillOperations(projectRoot, ai, capabilities))
  }

  return {
    projectRoot,
    ai,
    hosts,
    configureMcp,
    installSkills,
    capabilities,
    operations,
    missingSkills: skillCapabilities.map((capability) => capability.id),
    installCommands: operations
      .filter((operation) => operation.kind === 'install-skill')
      .map((operation) => ({ command: operation.command, args: operation.args, cwd: operation.cwd }))
  }
}

async function configureJsonMcp(filePath, rootKey) {
  const parsed = readJson(filePath)
  if (parsed.error) throw new Error('Existing JSON is invalid at ' + filePath + '.')

  const document = parsed.value
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new Error('Expected a JSON object at ' + filePath + '.')
  }

  if (document[rootKey] === undefined) document[rootKey] = {}
  if (!document[rootKey] || typeof document[rootKey] !== 'object' || Array.isArray(document[rootKey])) {
    throw new Error('Expected "' + rootKey + '" to be an object at ' + filePath + '.')
  }

  if (document[rootKey].playwright) return 'skipped'

  document[rootKey].playwright = {
    command: PLAYWRIGHT_SERVER.command,
    args: [...PLAYWRIGHT_SERVER.args]
  }
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(document, null, 2) + '\n', 'utf8')
  return parsed.existed ? 'updated' : 'created'
}

async function configureTomlMcp(filePath) {
  const content = readText(filePath)
  if (hasPlaywrightServer('codex', filePath).configured) return 'skipped'

  const nextContent = content.length === 0
    ? MCP_BLOCK
    : content.replace(/\s*$/, '\n\n') + MCP_BLOCK

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, nextContent, 'utf8')
  return existsSync(filePath) && content.length > 0 ? 'updated' : 'created'
}

async function applyMcpOperation(operation) {
  if (operation.status === 'already-configured') return 'skipped'
  if (operation.status === 'blocked') throw new Error(operation.reason)

  const config = MCP_CONFIGS[operation.host]
  if (config.format === 'toml') return configureTomlMcp(operation.path)
  return configureJsonMcp(operation.path, config.rootKey)
}

export function buildSpawnSpec({ command, args, cwd }) {
  const isWindows = process.platform === 'win32'
  const executable = isWindows && command === 'npx' ? 'npx.cmd' : command

  if (isWindows) {
    return {
      executable: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', executable, ...args],
      cwd,
      shell: false,
      windowsHide: true
    }
  }

  return {
    executable,
    args: [...args],
    cwd,
    shell: false,
    windowsHide: false
  }
}

function runCommand(operation) {
  const spec = buildSpawnSpec(operation)

  return new Promise((resolve, reject) => {
    const child = spawn(spec.executable, spec.args, {
      cwd: spec.cwd,
      stdio: 'inherit',
      shell: spec.shell,
      windowsHide: spec.windowsHide
    })

    child.once('error', (error) => {
      const detail = error?.code === 'EINVAL'
        ? 'Windows could not launch the package runner. WhipUI uses the Windows command shell for npx.cmd; check that Node.js and npm are installed.'
        : error.message
      const wrapped = new Error('Could not launch ' + spec.executable + ': ' + detail, { cause: error })
      wrapped.code = error?.code
      reject(wrapped)
    })
    child.once('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(spec.executable + ' exited with code ' + code + '.'))
    })
  })
}

function formatCommand(operation) {
  return [operation.command, ...operation.args].join(' ')
}

function formatStatus(capability) {
  if (capability.status === 'installed') return 'installed'
  if (capability.status === 'configured') return 'configured'
  if (capability.status === 'detected') return 'detected'
  if (capability.status === 'not-detected') return 'not detected'
  return 'missing'
}

export function buildProvidersDocument(manifest) {
  const lines = [
    '# WhipUI capabilities',
    '',
    'This file is generated by `whipui init` / `whipui setup`.',
    'WhipUI routes to these providers; it does not own an agent, browser, editor, or MCP server.',
    '',
    '## Active capabilities',
    ''
  ]

  for (const capability of manifest.capabilities) {
    const docs = capability.docs ? ' — ' + capability.docs : ''
    const scope = capability.scope ? ' (' + capability.scope + ')' : ''
    lines.push('- **' + capability.id + '** — ' + formatStatus(capability) + scope + ': ' + capability.role + docs)
  }

  lines.push('', '## Setup notes', '')
  if (manifest.requiredMissing.length > 0) {
    lines.push('- Required capability missing: ' + manifest.requiredMissing.join(', ') + '.')
  } else {
    lines.push('- Required WhipUI capabilities are configured for the selected hosts.')
  }

  if (manifest.installableMissing.length > 0) {
    lines.push('- Installable skills still missing: ' + manifest.installableMissing.join(', ') + '.')
    lines.push('- Run `whipui setup --yes` to install them into this project.')
  }

  lines.push(
    '- Figma MCP, Chrome DevTools MCP, Firecrawl, Fudge, Agentation, and onUI remain optional adapters.',
    '- Add optional providers only when the host, project, and source require them.'
  )

  return lines.join('\n') + '\n'
}

export async function setupProject(
  projectRoot,
  {
    ai = 'all',
    configureMcp = true,
    installSkills = false,
    dryRun = false
  } = {}
) {
  const plan = buildSetupPlan(projectRoot, { ai, configureMcp, installSkills })
  const results = []
  const failures = []

  for (const operation of plan.operations) {
    if (operation.kind === 'configure-mcp') {
      if (dryRun || operation.status === 'already-configured') {
        results.push({ ...operation, status: dryRun ? 'dry-run' : 'skipped' })
        continue
      }

      try {
        const status = await applyMcpOperation(operation)
        results.push({ ...operation, status })
      } catch (error) {
        const failure = { ...operation, status: 'failed', error: error.message }
        results.push(failure)
        failures.push(failure)
      }
      continue
    }

    if (operation.kind === 'install-skill') {
      if (dryRun) {
        results.push({ ...operation, status: 'dry-run', displayCommand: formatCommand(operation) })
        continue
      }

      try {
        await runCommand(operation)
        results.push({ ...operation, status: 'installed', displayCommand: formatCommand(operation) })
      } catch (error) {
        const failure = {
          ...operation,
          status: 'failed',
          displayCommand: formatCommand(operation),
          error: error.message
        }
        results.push(failure)
        failures.push(failure)
      }
    }
  }

  const manifest = buildCapabilityManifest(projectRoot, { ai })
  if (!dryRun) {
    const capabilitiesPath = join(projectRoot, '.whipui/capabilities.json')
    const providersPath = join(projectRoot, '.whipui/providers.md')
    await mkdir(dirname(capabilitiesPath), { recursive: true })
    await writeFile(capabilitiesPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
    await writeFile(providersPath, buildProvidersDocument(manifest), 'utf8')
  }

  return {
    ...plan,
    results,
    failures,
    manifest,
    files: dryRun
      ? []
      : ['.whipui/capabilities.json', '.whipui/providers.md']
  }
}
