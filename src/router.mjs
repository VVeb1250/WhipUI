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
    return new URL(value).hostname.toLowerCase().endsWith('figma.com')
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
  const hasWebUrl = Boolean(url) || urls.some((value) => !isFigmaUrl(value))
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
    webPick: asksToPickFromWeb
  }
}

export function routeRequest({
  prompt = null,
  screenshot = null,
  figma = null,
  url = null,
  existingRepo = true,
  webPick = false
} = {}) {
  const inputs = detectInputs({ prompt, screenshot, figma, url, existingRepo, webPick })
  const skills = [
    'UI/UX Pro Max for design-system direction, when installed',
    'Impeccable for critique, refinement, and anti-slop, when installed',
    'existing design intelligence skill as the fallback',
    'frontend implementation skill, if available'
  ]
  const mcp = []
  const steps = [
    'Read Project DNA and the current Design Fingerprint.',
    'Inspect the existing repository and reuse its components, tokens, fonts, and assets.',
    'Write down the design decisions before implementation.',
    'Run visual QA across the configured axes and viewports, then refine the highest-impact mismatch.'
  ]

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
  } else if (inputs.modes.includes('figma')) {
    mcp.push({
      name: 'Figma MCP',
      role: 'conditional',
      purpose: 'Read variables, components, assets, hierarchy, and design context from the supplied Figma source.'
    })
    steps.splice(1, 0, 'Use Figma MCP when connected; treat it as higher-confidence than pixel guesses.')
  } else if (inputs.modes.includes('url')) {
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

  return {
    kind: inputs.webPick ? 'pick-from-web' : 'frontend-design-route',
    inputs,
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
