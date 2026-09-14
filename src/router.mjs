import {
  requestsCreativeDirection,
  shouldRunCreativeDirection
} from './creative-direction.mjs'
import { selectWorkflow } from './workflow.mjs'

const URL_PATTERN = /https?:\/\/[^\s)]+/gi
const WEB_PICK_PATTERN = /\b(pick|select|capture|extract|borrow|copy|inspect)\b|เลือก|จับ|เก็บ|ดึง/iu

export const INPUT_MODES = Object.freeze([
  'prompt',
  'screenshot',
  'figma',
  'url',
  'existing-repo'
])

function normalizeText(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function unique(values) {
  return [...new Set(values)]
}

function extractUrls(text) {
  return (text?.match(URL_PATTERN) ?? []).map((value) => value.replace(/[.,]+$/, ''))
}

function isFigmaUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host === 'figma.com' || host.endsWith('.figma.com')
  } catch {
    return false
  }
}

export function detectInputs({
  prompt = null,
  screenshot = null,
  figma = null,
  url = null,
  existingRepo = true,
  webPick = false
} = {}) {
  const normalizedPrompt = normalizeText(prompt)
  const urls = unique([
    ...extractUrls(normalizedPrompt),
    ...(url ? [url] : [])
  ])
  const hasFigma = Boolean(figma) || urls.some(isFigmaUrl)
  const hasWebUrl = urls.some((value) => !isFigmaUrl(value))
  const asksToPickFromWeb = Boolean(
    webPick
    || (
      normalizedPrompt
      && WEB_PICK_PATTERN.test(normalizedPrompt)
      && hasWebUrl
    )
  )
  const detected = []

  if (normalizedPrompt) detected.push('prompt')
  if (screenshot) detected.push('screenshot')
  if (hasFigma) detected.push('figma')
  if (hasWebUrl) detected.push('url')
  if (existingRepo) detected.push('existing-repo')

  return {
    modes: unique(detected),
    urls,
    webPick: asksToPickFromWeb,
    creativeDirectionRequested: requestsCreativeDirection(normalizedPrompt)
  }
}

export function routeRequest({
  prompt = null,
  screenshot = null,
  figma = null,
  url = null,
  existingRepo = true,
  webPick = false,
  workflow = 'auto'
} = {}) {
  const inputs = detectInputs({ prompt, screenshot, figma, url, existingRepo, webPick })
  const selection = selectWorkflow({ prompt, screenshot, figma, url, webPick: inputs.webPick, workflow })
  const creativeDirectionRequired = selection.focus !== 'ux' && selection.action === 'build' && shouldRunCreativeDirection({
    prompt,
    screenshot,
    figma,
    url,
    workflow: selection.lane
  })
  const skills = [
    selection.skill + ' as the workflow owner',
    ...(creativeDirectionRequired ? ['bundled Hallmark-derived composition reference for task-led visual exploration, not recreation or UX-only work'] : []),
    ...(selection.lane === 'design' ? ['bundled Sumi-derived UX references for flow/navigation or heuristic review, loaded by task'] : []),
    'UI/UX Pro Max only for a specific unresolved UX, typography, or component question, when installed',
    'Impeccable only for a scoped visual exploration or critique task, when installed',
    'one existing frontend skill for implementation, if needed'
  ]
  const mcp = []
  const steps = [
    'Read Project DNA and the current Design Fingerprint.',
    'Inspect the existing repository and reuse its components, tokens, fonts, and assets.',
    'Follow ' + selection.workflow + '; respect the requested ' + selection.action + ' stopping point.',
    'Load .whipui/specialists/providers.md only when selecting a provider; consult it for a bounded question, not the entire workflow.'
  ]

  if (creativeDirectionRequired) {
    steps.push('Establish the primary user task, then render a small clickable direction before expanding; compare alternatives only when useful.')
  }

  if (inputs.webPick) {
    mcp.push({
      name: 'Playwright MCP',
      role: 'primary',
      purpose: 'Open the real page, pick an element, and capture DOM, computed styles, box, screenshot, and interaction states.'
    })
    mcp.push({
      name: 'Chrome DevTools',
      role: 'optional',
      purpose: 'Use only when the host already exposes it and deeper runtime inspection is useful.'
    })
    steps.splice(1, 0, 'Run the Pick from Web workflow with Playwright MCP and save a structured capture.')
  }
  if (inputs.modes.includes('figma')) {
    mcp.push({
      name: 'Figma MCP',
      role: 'conditional',
      purpose: 'Read variables, components, assets, hierarchy, and design context from the supplied Figma source.'
    })
    steps.splice(1, 0, 'Use Figma MCP when connected; treat it as higher-confidence than pixel guesses.')
  }
  if (inputs.modes.includes('url') && !inputs.webPick) {
    mcp.push({
      name: 'Playwright MCP',
      role: 'primary',
      purpose: 'Inspect the supplied live URL as a reference in an isolated browser context.'
    })
    mcp.push({
      name: 'Chrome DevTools',
      role: 'optional',
      purpose: 'Use only for additional runtime diagnostics already supported by the host.'
    })
  }

  if (inputs.modes.includes('screenshot')) {
    skills.push('host image/screenshot understanding')
    steps.splice(1, 0, 'Analyze the screenshot as visual evidence and separate identity from accidental pixels.')
  }

  if (!mcp.some((tool) => tool.name === 'Playwright MCP')) {
    mcp.push({ name: 'Playwright MCP', role: 'primary', purpose: 'Inspect the local rendered UI and exercise the primary task; required for browser evidence, not for text-only planning.' })
  }
  if (selection.lane === 'design') {
    steps.push('Record observed facts separately from assumptions in Project DNA; use .whipui/workflows/ux-review.md to evaluate task completion and recovery.')
  }
  if (selection.focus !== 'ux') steps.push('Use .whipui/workflows/visual-qa.md for rendered fidelity or visual quality; report unverified evidence explicitly.')

  return {
    kind: inputs.webPick ? 'pick-from-web' : 'frontend-design-route',
    inputs,
    selection,
    creativeDirection: {
      required: creativeDirectionRequired,
      workflow: '.whipui/workflows/creative-direction.md'
    },
    skills: unique(skills),
    mcp,
    steps,
    ownsRuntime: false,
    note: 'WhipUI routes work to host skills and MCP tools; it does not implement an agent, browser, editor, or MCP server.'
  }
}

export function formatRouteSummary(plan) {
  const lines = [
    'WhipUI route: ' + plan.kind,
    'Inputs: ' + plan.inputs.modes.join(', '),
    'Runtime owned by WhipUI: no',
    'Skill: ' + plan.selection.skill + ' (' + plan.selection.focus + ', ' + plan.selection.action + ')',
    'Routing hint: ' + plan.selection.reason,
    'Visual exploration: ' + (plan.creativeDirection.required ? 'required' : 'optional'),
    '',
    'Skills:',
    ...plan.skills.map((skill) => '- ' + skill),
    '',
    'MCP/tool routing:',
    ...(plan.mcp.length > 0
      ? plan.mcp.map((tool) => '- ' + tool.name + ' [' + tool.role + ']: ' + tool.purpose)
      : ['- none required for this route']),
    '',
    'Steps:',
    ...plan.steps.map((step, index) => (index + 1) + '. ' + step)
  ]

  return lines.join('\n')
}
