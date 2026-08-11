import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
    const beforeBlock = existingContent.slice(0, startIndex).trimEnd()
    const afterBlock = existingContent.slice(endIndex + MANAGED_END.length).trimStart()
    return [beforeBlock, managedBlock.trim(), afterBlock].filter(Boolean).join('\n\n') + '\n'
  }

  return existingContent.trimEnd() + '\n\n' + managedBlock.trim() + '\n'
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

export async function scaffoldProject(projectRoot, { ai = 'both', force = false } = {}) {
  const normalizedAi = validateAiTarget(ai)
  const results = []
  const createdAt = new Date().toISOString()

  for (const [templatePath, destination] of COMMON_FILES) {
    const targetPath = join(projectRoot, destination)
    const content = await readTemplate(templatePath)
    results.push({
      path: destination,
      status: await writeGeneratedFile(targetPath, content, { force })
    })
  }

  const dnaPath = join(projectRoot, '.whipui/project-dna.json')
  const dna = buildProjectDna({ projectRoot, createdAt })
  results.push({
    path: '.whipui/project-dna.json',
    status: await writeGeneratedFile(dnaPath, JSON.stringify(dna, null, 2) + '\n', { force })
  })

  const fingerprintPath = join(projectRoot, '.whipui/design-fingerprint.json')
  const fingerprint = buildFingerprint({ projectRoot, createdAt })
  results.push({
    path: '.whipui/design-fingerprint.json',
    status: await writeGeneratedFile(fingerprintPath, JSON.stringify(fingerprint, null, 2) + '\n', { force })
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
        await readTemplate('copilot-instructions.md')
      )
    })
    results.push({
      path: '.github/prompts/whipui-frontend.prompt.md',
      status: await writeGeneratedFile(
        join(projectRoot, '.github/prompts/whipui-frontend.prompt.md'),
        await readTemplate('vscode-prompt.md'),
        { force }
      )
    })
  }

  if (normalizedAi === 'claude' || normalizedAi === 'all') {
    results.push({
      path: 'CLAUDE.md',
      status: await ensureInstructionFile(
        join(projectRoot, 'CLAUDE.md'),
        await readTemplate('claude-instructions.md')
      )
    })
    results.push({
      path: '.claude/skills/whipui/SKILL.md',
      status: await writeGeneratedFile(
        join(projectRoot, '.claude/skills/whipui/SKILL.md'),
        await readTemplate('claude-skill.md'),
        { force }
      )
    })
  }
  return { projectRoot, ai: normalizedAi, results }
}
