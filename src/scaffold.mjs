import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFingerprint } from './fingerprint.mjs'
import { buildProjectDna } from './dna.mjs'

const TEMPLATE_ROOT = fileURLToPath(new URL('../templates/', import.meta.url))
const MANAGED_START = '<!-- WhipUI:BEGIN -->'
const MANAGED_END = '<!-- WhipUI:END -->'

const COMMON_FILES = Object.freeze([
  ['whipui.md', 'WhipUI.md'],
  ['project-dna.md', 'PROJECT-DNA.md'],
  ['config.json', '.whipui/config.json'],
  ['readme.md', '.whipui/README.md'],
  ['router.md', '.whipui/router.md'],
  ['workflows/design.md', '.whipui/workflows/design.md'],
  ['workflows/implement.md', '.whipui/workflows/implement.md'],
  ['workflows/ux-review.md', '.whipui/workflows/ux-review.md'],
  ['specialists/providers.md', '.whipui/specialists/providers.md'],
  ['specialists/ux-foundations.md', '.whipui/specialists/ux-foundations.md'],
  ['specialists/flows-and-navigation.md', '.whipui/specialists/flows-and-navigation.md'],
  ['sources.md', '.whipui/sources.md'],
  ['licenses/sumi-apache-2.0.txt', '.whipui/licenses/sumi-apache-2.0.txt'],
  ['licenses/sumi-NOTICE.txt', '.whipui/licenses/sumi-NOTICE.txt'],
  ['examples/evaluation.md', '.whipui/examples/evaluation.md'],
  ['workflows/creative-direction.md', '.whipui/workflows/creative-direction.md'],
  ['workflows/pick-from-web.md', '.whipui/workflows/pick-from-web.md'],
  ['workflows/visual-qa.md', '.whipui/workflows/visual-qa.md'],
  ['examples/README.md', '.whipui/examples/README.md']
])

async function readTemplate(templatePath) {
  return readFile(join(TEMPLATE_ROOT, templatePath), 'utf8')
}

async function writeGeneratedFile(targetPath, content, { force = false } = {}) {
  const existed = existsSync(targetPath)
  if (existed && !force) return 'skipped'

  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, content, 'utf8')
  return existed ? 'updated' : 'created'
}

function upsertManagedBlock(existingContent, managedBlock) {
  const startIndex = existingContent.indexOf(MANAGED_START)
  const endIndex = existingContent.indexOf(MANAGED_END)

  if (startIndex >= 0 && endIndex > startIndex) {
    return existingContent.slice(0, startIndex)
      + managedBlock.trim()
      + existingContent.slice(endIndex + MANAGED_END.length)
  }

  return [existingContent.trimEnd(), managedBlock.trim()].filter(Boolean).join('\n\n') + '\n'
}

async function ensureInstructionFile(targetPath, managedBlock) {
  const existed = existsSync(targetPath)
  const existingContent = existed ? await readFile(targetPath, 'utf8') : ''
  const nextContent = upsertManagedBlock(existingContent, managedBlock)

  if (existed && nextContent === existingContent) return 'skipped'

  await mkdir(dirname(targetPath), { recursive: true })
  await writeFile(targetPath, nextContent, 'utf8')
  return existed ? 'updated' : 'created'
}

function validateAiTarget(aiTarget) {
  if (!['codex', 'vscode', 'claude', 'both', 'all'].includes(aiTarget)) {
    throw new Error('Unknown --ai target "' + aiTarget + '". Choose codex, vscode, claude, both, or all.')
  }
  return aiTarget
}

export async function scaffoldProject(projectRoot, { ai = 'both', force = false, refresh = false } = {}) {
  const normalizedAi = validateAiTarget(ai)
  const results = []
  const createdAt = new Date().toISOString()
  const backupRoot = join('.whipui/backups', randomUUID())
  const refreshProtected = new Set(['PROJECT-DNA.md', '.whipui/config.json'])

  async function writeTemplate(templatePath, destination) {
    const targetPath = join(projectRoot, destination)
    const content = await readTemplate(templatePath)
    if (refresh && !refreshProtected.has(destination) && existsSync(targetPath)) {
      if (await readFile(targetPath, 'utf8') === content) return { path: destination, status: 'skipped' }
      const backup = join(backupRoot, destination)
      await mkdir(dirname(join(projectRoot, backup)), { recursive: true })
      await copyFile(targetPath, join(projectRoot, backup))
      return { path: destination, status: await writeGeneratedFile(targetPath, content, { force: true }), backup }
    }
    return { path: destination, status: await writeGeneratedFile(targetPath, content, { force: refresh ? false : force }) }
  }

  for (const [templatePath, destination] of COMMON_FILES) {
    results.push(await writeTemplate(templatePath, destination))
  }

  const dnaPath = join(projectRoot, '.whipui/project-dna.json')
  const dna = buildProjectDna({ projectRoot, createdAt })
  results.push({
    path: '.whipui/project-dna.json',
    status: await writeGeneratedFile(dnaPath, JSON.stringify(dna, null, 2) + '\n', { force: force && !refresh })
  })

  const fingerprintPath = join(projectRoot, '.whipui/design-fingerprint.json')
  const fingerprint = buildFingerprint({ projectRoot, createdAt })
  results.push({
    path: '.whipui/design-fingerprint.json',
    status: await writeGeneratedFile(fingerprintPath, JSON.stringify(fingerprint, null, 2) + '\n', { force: force && !refresh })
  })

  if (normalizedAi === 'codex' || normalizedAi === 'both' || normalizedAi === 'all') {
    results.push({
      path: 'AGENTS.md',
      status: await ensureInstructionFile(
        join(projectRoot, 'AGENTS.md'),
        await readTemplate('agent-instructions.md')
      )
    })
  }

  if (normalizedAi === 'vscode' || normalizedAi === 'both' || normalizedAi === 'all') {
    results.push({
      path: '.github/copilot-instructions.md',
      status: await ensureInstructionFile(
        join(projectRoot, '.github/copilot-instructions.md'),
        await readTemplate('agent-instructions.md')
      )
    })
    results.push(await writeTemplate('vscode-prompt.md', '.github/prompts/whipui-frontend.prompt.md'))
  }

  if (normalizedAi === 'claude' || normalizedAi === 'all') {
    results.push({
      path: 'CLAUDE.md',
      status: await ensureInstructionFile(
        join(projectRoot, 'CLAUDE.md'),
        await readTemplate('agent-instructions.md')
      )
    })
  }
  const skillRoots = []
  if (['codex', 'both', 'all'].includes(normalizedAi)) skillRoots.push('.agents/skills')
  if (['claude', 'all'].includes(normalizedAi)) skillRoots.push('.claude/skills')
  if (['vscode', 'both', 'all'].includes(normalizedAi)) skillRoots.push('.github/skills')
  for (const skillRoot of skillRoots) {
    for (const skill of ['whipui', 'whipdesign']) {
      results.push(await writeTemplate(skill + '-skill.md', skillRoot + '/' + skill + '/SKILL.md'))
    }
  }
  return { projectRoot, ai: normalizedAi, results }
}
