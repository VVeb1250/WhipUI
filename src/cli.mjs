import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { buildCapabilityManifest } from './capabilities.mjs'
import { buildAgentBrief, buildCritiqueBrief, buildFingerprint, mergeFingerprint } from './fingerprint.mjs'
import { buildPickBrief } from './web-pick.mjs'
import { buildProjectDna, mergeProjectDna } from './dna.mjs'
import { formatRouteSummary, routeRequest } from './router.mjs'
import { scaffoldProject } from './scaffold.mjs'
import { buildSetupPlan, setupProject } from './setup.mjs'

const PACKAGE_JSON = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const BOOLEAN_OPTIONS = new Set([
  'dryRun',
  'force',
  'help',
  'json',
  'reset',
  'skipMcp',
  'skipSkills',
  'webPick',
  'yes'
])

const HELP_TEXT = [
  'whipui — thin frontend design router',
  '',
  'Usage:',
  '  whipui init [directory] [--ai codex|vscode|claude|both|all] [--force] [--yes]',
  '  whipui setup [directory] [--ai codex|vscode|claude|both|all] [--yes] [--skip-skills] [--skip-mcp]',
  '  whipui doctor [directory] [--ai codex|vscode|claude|both|all] [--json]',
  '  whipui route [request...] [--screenshot path] [--figma url] [--url url]',
  '  whipui fingerprint [request...] [--screenshot path] [--figma url] [--url url]',
  '  whipui brief [request...] [--screenshot path] [--figma url] [--url url]',
  '  whipui pick <url> [--selector selector]',
  '  whipui critique [url]',
  '',
  'After init, normal users should speak to Codex, Claude Code, or VS Code Agent naturally.',
  'WhipUI routes the request to existing skills and MCP tools; it owns none of them.'
].join('\n')

function toCamelCase(optionName) {
  return optionName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

function parseArguments(argumentsList) {
  const options = {}
  const positional = []

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (!argument.startsWith('--')) {
      positional.push(argument)
      continue
    }

    const [rawName, inlineValue] = argument.slice(2).split('=')
    const optionName = toCamelCase(rawName)
    if (BOOLEAN_OPTIONS.has(optionName)) {
      options[optionName] = inlineValue === undefined ? true : inlineValue !== 'false'
      continue
    }

    const nextArgument = argumentsList[index + 1]
    if (inlineValue !== undefined) {
      options[optionName] = inlineValue
      continue
    }
    if (!nextArgument || nextArgument.startsWith('--')) {
      throw new Error('Option --' + rawName + ' needs a value.')
    }

    options[optionName] = nextArgument
    index += 1
  }

  return { options, positional }
}

function resolveOutputPath(outputPath, projectRoot, fallbackPath) {
  const value = outputPath ?? fallbackPath
  return isAbsolute(value) ? value : resolve(projectRoot, value)
}

async function writeJsonFile(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error('Could not parse existing JSON at ' + filePath + ': ' + error.message)
  }
}

function getPrompt(options, positional) {
  return options.prompt ?? (positional.length > 0 ? positional.join(' ') : null)
}

function getSources(options, positional, { requireOne = true } = {}) {
  const prompt = getPrompt(options, positional)
  const sources = {
    prompt,
    screenshot: options.screenshot ?? null,
    figma: options.figma ?? null,
    url: options.url ?? null,
    existingRepo: true
  }
  const hasSource = Boolean(prompt || sources.screenshot || sources.figma || sources.url)
  if (requireOne && !hasSource) {
    throw new Error('Provide a prompt, screenshot, Figma URL, or web URL.')
  }
  return sources
}

async function runInit(positional, options) {
  const projectRoot = resolve(positional[0] ?? '.')
  const ai = options.ai ?? 'all'
  const result = await scaffoldProject(projectRoot, {
    ai,
    force: Boolean(options.force)
  })

  console.log('Initialized WhipUI in ' + projectRoot)
  for (const fileResult of result.results) {
    console.log('  ' + fileResult.status.padEnd(7) + ' ' + fileResult.path)
  }

  const installSkills = await chooseSkillInstall(projectRoot, {
    ai,
    skipSkills: Boolean(options.skipSkills),
    yes: Boolean(options.yes)
  })
  const setup = await setupProject(projectRoot, {
    ai,
    configureMcp: !Boolean(options.skipMcp),
    installSkills
  })
  printSetupSummary(setup)
  assertSetupSucceeded(setup)
  console.log('\nNow speak naturally to Codex, Claude Code, or VS Code Agent. The generated instructions route the work for you.')
}

async function chooseSkillInstall(projectRoot, { ai, skipSkills, yes }) {
  if (skipSkills || yes === false && !process.stdin.isTTY) return false

  const plan = buildSetupPlan(projectRoot, {
    ai,
    configureMcp: false,
    installSkills: true
  })
  if (plan.installCommands.length === 0) return false
  if (yes) return true
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('  pending  design skills (non-interactive init skipped external installs; rerun with --yes)')
    return false
  }

  const names = [...new Set(plan.operations
    .filter((operation) => operation.kind === 'install-skill')
    .map((operation) => operation.capability))]
  const prompt = createInterface({ input, output })
  try {
    const answer = await prompt.question(
      'WhipUI can install missing design skills into this project (' + names.join(', ') + '). Continue? [Y/n] '
    )
    return answer.trim() === '' || /^(y|yes)$/i.test(answer.trim())
  } finally {
    prompt.close()
  }
}

function printSetupSummary(setup) {
  for (const operation of setup.results) {
    if (operation.kind === 'configure-mcp') {
      console.log('  ' + operation.status.padEnd(10) + ' ' + operation.relativePath + ' [' + operation.host + ']')
      continue
    }
    if (operation.kind === 'install-skill') {
      console.log('  ' + operation.status.padEnd(10) + ' ' + operation.capability)
    }
  }
  for (const filePath of setup.files) console.log('  updated    ' + filePath)

  if (setup.manifest.installableMissing.length > 0) {
    console.log('  pending    ' + setup.manifest.installableMissing.join(', ') + ' (run "whipui setup --yes")')
  }
  if (setup.manifest.requiredMissing.length > 0) {
    console.log('  warning    required capability missing: ' + setup.manifest.requiredMissing.join(', '))
  }
  for (const failure of setup.failures) {
    console.log('  failed     ' + (failure.capability ?? failure.relativePath) + ': ' + failure.error)
  }
}

function assertSetupSucceeded(setup) {
  if (setup.failures.length === 0) return
  throw new Error('WhipUI setup did not complete. Fix the failed operation(s) and run "whipui setup --yes" again.')
}

async function runSetup(positional, options) {
  const projectRoot = resolve(positional[0] ?? '.')
  const ai = options.ai ?? 'all'
  const installSkills = Boolean(options.skipSkills)
    ? false
    : Boolean(options.dryRun) || await chooseSkillInstall(projectRoot, {
      ai,
      skipSkills: false,
      yes: Boolean(options.yes)
    })
  const setup = await setupProject(projectRoot, {
    ai,
    configureMcp: !Boolean(options.skipMcp),
    installSkills,
    dryRun: Boolean(options.dryRun)
  })

  if (options.json) {
    console.log(JSON.stringify({
      manifest: setup.manifest,
      results: setup.results.map(({ kind, capability, host, relativePath, status, displayCommand, error }) => ({
        kind,
        capability,
        host,
        relativePath,
        status,
        displayCommand,
        error
      }))
    }, null, 2))
  } else {
    console.log('WhipUI setup for ' + projectRoot)
    printSetupSummary(setup)
  }
  assertSetupSucceeded(setup)
}

async function runDoctor(positional, options) {
  const projectRoot = resolve(positional[0] ?? '.')
  const manifest = buildCapabilityManifest(projectRoot, { ai: options.ai ?? 'all' })

  if (options.json) {
    console.log(JSON.stringify(manifest, null, 2))
    return
  }

  console.log('WhipUI doctor for ' + projectRoot)
  for (const capability of manifest.capabilities) {
    const status = capability.status.padEnd(12)
    const required = capability.required ? ' required' : ' optional'
    console.log('  ' + status + ' ' + capability.id + ' — ' + capability.role + required)
  }
  if (manifest.requiredMissing.length > 0) {
    console.log('\nRequired missing: ' + manifest.requiredMissing.join(', '))
  } else {
    console.log('\nRequired capabilities are ready for the selected hosts.')
  }
  if (manifest.installableMissing.length > 0) {
    console.log('Installable design skills missing: ' + manifest.installableMissing.join(', '))
    console.log('Run "whipui setup --yes" to install them into this project.')
  }
}

async function runRoute(positional, options) {
  const plan = routeRequest({
    ...getSources(options, positional, { requireOne: false }),
    webPick: Boolean(options.webPick)
  })

  if (options.json) {
    console.log(JSON.stringify(plan, null, 2))
    return
  }
  console.log(formatRouteSummary(plan))
}

async function runFingerprint(positional, options) {
  const projectRoot = resolve(options.root ?? '.')
  const sources = getSources(options, positional)
  const outputPath = resolveOutputPath(options.out, projectRoot, '.whipui/design-fingerprint.json')
  const nextFingerprint = buildFingerprint({
    ...sources,
    mode: options.mode ?? 'adapt',
    projectRoot
  })
  const existingFingerprint = options.reset ? null : await readJsonIfExists(outputPath)
  const fingerprint = mergeFingerprint(existingFingerprint, nextFingerprint, {
    reset: Boolean(options.reset)
  })

  await writeJsonFile(outputPath, fingerprint)
  console.log('Wrote Design Fingerprint to ' + outputPath)
  console.log('  intent: ' + fingerprint.intent)
  console.log('  source count: ' + Object.values(fingerprint.sources).filter(Boolean).length)
}

async function runBrief(positional, options) {
  const projectRoot = resolve(options.root ?? '.')
  const sources = getSources(options, positional)
  const outputPath = resolveOutputPath(options.out, projectRoot, '.whipui/request.md')
  const brief = buildAgentBrief({
    ...sources,
    mode: options.mode ?? 'adapt',
    target: options.target ?? 'the existing frontend project',
    projectRoot
  })

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, brief, 'utf8')
  console.log('Wrote implementation request to ' + outputPath)
}

async function runPick(positional, options) {
  const url = options.url ?? positional[0]
  if (!url) throw new Error('Pick from Web needs a URL.')

  const projectRoot = resolve(options.root ?? '.')
  const outputPath = resolveOutputPath(options.out, projectRoot, '.whipui/pick-request.md')
  const brief = buildPickBrief({
    url,
    selector: options.selector ?? null,
    target: options.target ?? 'the selected element'
  })

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, brief, 'utf8')
  console.log('Wrote Pick from Web request to ' + outputPath)
}

async function runCritique(positional, options) {
  const projectRoot = resolve(options.root ?? '.')
  const url = options.url ?? positional[0] ?? 'http://localhost:3000'
  const outputPath = resolveOutputPath(options.out, projectRoot, '.whipui/visual-qa.md')
  const brief = buildCritiqueBrief({ url })

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, brief, 'utf8')
  console.log('Wrote visual QA loop to ' + outputPath)
}

async function runDna(options) {
  const projectRoot = resolve(options.root ?? '.')
  const outputPath = resolveOutputPath(options.out, projectRoot, '.whipui/project-dna.json')
  const nextDna = buildProjectDna({ projectRoot })
  const existingDna = options.reset ? null : await readJsonIfExists(outputPath)
  const dna = mergeProjectDna(existingDna, nextDna, { reset: Boolean(options.reset) })
  await writeJsonFile(outputPath, dna)
  console.log('Wrote Project DNA to ' + outputPath)
}

export async function main(argumentsList = []) {
  const command = argumentsList[0] ?? 'help'
  const { options, positional } = parseArguments(argumentsList.slice(1))

  if (command === 'help' || command === '--help' || options.help) {
    console.log(HELP_TEXT)
    return
  }
  if (command === '--version' || command === 'version') {
    console.log(PACKAGE_JSON.version)
    return
  }
  if (command === 'init') return runInit(positional, options)
  if (command === 'setup') return runSetup(positional, options)
  if (command === 'doctor') return runDoctor(positional, options)
  if (command === 'route') return runRoute(positional, options)
  if (command === 'fingerprint') return runFingerprint(positional, options)
  if (command === 'brief') return runBrief(positional, options)
  if (command === 'pick') return runPick(positional, options)
  if (command === 'critique') return runCritique(positional, options)
  if (command === 'dna') return runDna(options)

  throw new Error('Unknown command "' + command + '". Run "whipui help" for usage.')
}
