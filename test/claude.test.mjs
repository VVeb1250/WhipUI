import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { main } from '../src/cli.mjs'

test('init creates Claude Code instructions and a local WhipUI skill', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'whipui-claude-'))

  await main(['init', projectRoot, '--ai', 'claude'])

  const claudeInstructions = await readFile(join(projectRoot, 'CLAUDE.md'), 'utf8')
  const claudeSkill = await readFile(join(projectRoot, '.claude/skills/whipui/SKILL.md'), 'utf8')

  assert.match(claudeInstructions, /WhipUI frontend design router/)
  assert.match(claudeSkill, /Playwright MCP/)
})
