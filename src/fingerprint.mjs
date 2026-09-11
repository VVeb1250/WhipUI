import { readFileSync, statSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'
import { routeRequest } from './router.mjs'
import { selectWorkflow } from './workflow.mjs'
import {
  buildCreativeDirection,
  buildDirectionExploration,
  shouldRunCreativeDirection
} from './creative-direction.mjs'

export const MODES = Object.freeze(['recreate', 'adapt', 'inspire'])

export const DEFAULT_VIEWPORTS = Object.freeze([
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
])

export const DEFAULT_QA_AXES = Object.freeze([
  'identity',
  'product-specificity',
  'concept-coherence',
  'generic-pattern-debt',
  'composition-and-hierarchy',
  'typography',
  'color-and-contrast',
  'spacing-and-density',
  'responsive-behavior',
  'interaction-states',
  'accessibility'
])

const IMAGE_MEDIA_TYPES = Object.freeze({
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
})

const JPEG_DIMENSION_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
])

const INLINE_CODE_MARK = String.fromCharCode(96)

function inlineCode(value) {
  return INLINE_CODE_MARK + value + INLINE_CODE_MARK
}

function assertMode(mode) {
  if (!MODES.includes(mode)) {
    throw new Error('Unknown mode "' + mode + '". Choose recreate, adapt, or inspire.')
  }
  return mode
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') return null
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

function toProjectRelativePath(filePath, projectRoot) {
  const relativePath = relative(projectRoot, filePath)
  return (relativePath || filePath).split(sep).join('/')
}

function readPngDimensions(buffer) {
  const isPng = buffer.length >= 24
    && buffer.readUInt32BE(0) === 0x89504e47
    && buffer.readUInt32BE(4) === 0x0d0a1a0a

  return isPng
    ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    : null
}

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null

  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = buffer[offset + 1]
    offset += 2
    if (marker === 0xd8 || marker === 0xd9) continue
    if (marker === 0xda || offset + 2 > buffer.length) break

    const segmentLength = buffer.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break

    if (JPEG_DIMENSION_MARKERS.has(marker) && segmentLength >= 7) {
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3)
      }
    }
    offset += segmentLength
  }

  return null
}

export function readImageMetadata(filePath, projectRoot = process.cwd()) {
  const absolutePath = resolve(filePath)
  const extension = extname(absolutePath).toLowerCase()
  const baseMetadata = {
    kind: 'screenshot',
    path: toProjectRelativePath(absolutePath, resolve(projectRoot)),
    absolutePath,
    exists: false,
    mediaType: IMAGE_MEDIA_TYPES[extension] ?? null,
    byteLength: null,
    width: null,
    height: null
  }

  try {
    const fileStats = statSync(absolutePath)
    if (!fileStats.isFile()) return baseMetadata

    const fileBuffer = readFileSync(absolutePath)
    const dimensions = extension === '.png'
      ? readPngDimensions(fileBuffer)
      : extension === '.jpg' || extension === '.jpeg'
        ? readJpegDimensions(fileBuffer)
        : null

    return {
      ...baseMetadata,
      exists: true,
      byteLength: fileStats.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null
    }
  } catch {
    return baseMetadata
  }
}

export function parseFigmaUrl(value) {
  const normalizedValue = normalizeOptionalText(value)
  if (!normalizedValue) return null

  let parsedUrl
  try {
    parsedUrl = new URL(normalizedValue)
  } catch {
    throw new Error('Invalid Figma URL: "' + value + '"')
  }

  const figmaHost = parsedUrl.hostname.toLowerCase()
  if (figmaHost !== 'figma.com' && !figmaHost.endsWith('.figma.com')) {
    throw new Error('Expected a figma.com URL, received "' + value + '"')
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
  const rawNodeId = parsedUrl.searchParams.get('node-id')

  return {
    kind: 'figma',
    url: parsedUrl.toString(),
    fileType: pathSegments[0] ?? null,
    fileKey: pathSegments[1] ?? null,
    nodeId: rawNodeId ? decodeURIComponent(rawNodeId).replaceAll('-', ':') : null,
    mcp: {
      preferred: true,
      status: 'connect-in-host',
      note: 'Use the connected Figma MCP for components, variables, assets, and hierarchy.'
    }
  }
}

function buildPromptSource(prompt) {
  const normalizedPrompt = normalizeOptionalText(prompt)
  return normalizedPrompt
    ? { kind: 'prompt', present: true, text: normalizedPrompt }
    : null
}

function buildUrlSource(url) {
  const normalizedUrl = normalizeOptionalText(url)
  return normalizedUrl ? { kind: 'url', url: normalizedUrl, inspected: false } : null
}

export function buildFingerprint({
  prompt = null,
  screenshot = null,
  figma = null,
  url = null,
  existingRepo = true,
  webCapture = null,
  workflow = 'auto',
  mode = 'adapt',
  projectRoot = process.cwd(),
  createdAt = new Date().toISOString()
} = {}) {
  const intent = assertMode(mode)
  const creativeDirectionRequired = shouldRunCreativeDirection({
    prompt,
    screenshot,
    figma,
    url,
    workflow
  })

  return {
    schemaVersion: 3,
    selection: selectWorkflow({ prompt, screenshot, figma, url, workflow }),
    status: creativeDirectionRequired
      ? 'pending-creative-direction'
      : 'pending-agent-analysis',
    createdAt,
    updatedAt: createdAt,
    intent,
    projectDna: inlineCode('.whipui/project-dna.json'),
    sources: {
      prompt: buildPromptSource(prompt),
      screenshot: normalizeOptionalText(screenshot)
        ? readImageMetadata(screenshot, projectRoot)
        : null,
      figma: parseFigmaUrl(figma),
      url: buildUrlSource(url),
      existingRepo: existingRepo
        ? { kind: 'existing-repo', root: '.', inspected: false }
        : null
    },
    identity: {
      oneThingToRemember: '',
      productType: '',
      audience: '',
      artDirection: '',
      keywords: [],
      antiReferences: []
    },
    creativeDirection: buildCreativeDirection({ required: creativeDirectionRequired }),
    exploration: buildDirectionExploration(),
    composition: {
      symmetry: '',
      density: '',
      dominantAxis: '',
      contentWidth: '',
      grid: '',
      whitespace: '',
      focalPoint: ''
    },
    typography: {
      display: { category: '', family: '', scale: '', weight: '', leading: '' },
      body: { category: '', family: '', scale: '', weight: '', leading: '' },
      casing: '',
      contrast: ''
    },
    color: {
      background: '',
      surface: '',
      foreground: '',
      muted: '',
      accent: '',
      semantic: {},
      usageRules: []
    },
    spacing: {
      rhythm: '',
      baseUnit: '',
      sectionGap: '',
      layoutPadding: '',
      radius: '',
      shadow: ''
    },
    imagery: {
      treatment: '',
      subject: '',
      crop: '',
      texture: '',
      rules: []
    },
    motion: {
      personality: '',
      duration: '',
      easing: '',
      rules: []
    },
    responsive: {
      strategy: '',
      preserved: [],
      allowedToChange: [],
      breakpoints: []
    },
    webCapture: webCapture ?? {
      status: 'not-requested',
      sourceUrl: '',
      capturePath: '',
      fields: [
        'outerHTML',
        'computedStyles',
        'boundingBox',
        'screenshot',
        'interactionStates'
      ]
    },
    components: [],
    uxRules: [],
    uxQa: {
      status: 'not-tested',
      tasks: [],
      findings: [],
      evidence: [],
      humanValidation: 'not-performed'
    },
    antiSlopChecks: [
      'Preserve the user-approved visual authority rather than substituting a specialist default.',
      'No invented component variants when an existing project component can be reused.',
      'No decorative effect without a job: hierarchy, feedback, wayfinding, or brand character.',
      'No desktop-only implementation when the brief or source implies mobile use.',
      'No silent substitution of the source character with a generic dashboard or landing-page pattern.',
      'Evaluate new design choices against the product task and rendered evidence.',
      'Use visual character deliberately without making familiar tasks harder.',
      'Familiar controls stay familiar; novelty belongs in composition, identity, content treatment, or a high-signal interaction.'
    ],
    openQuestions: [
      'What user task should this screen support?',
      'Which visual decisions are supplied, selected, or still assumptions?',
      'Which visual traits are identity and which are accidental details of the reference?',
      'What must remain true at mobile widths?'
    ],
    analysis: {
      owner: 'agent',
      status: 'pending',
      notes: 'Inspect the input sources and existing repo, then replace placeholders with concrete decisions.'
    },
    visualQa: {
      status: 'pending',
      axes: [...DEFAULT_QA_AXES],
      findings: [],
      iterations: 0
    }
  }
}

export function mergeFingerprint(existingFingerprint, nextFingerprint, { reset = false } = {}) {
  if (!existingFingerprint || reset) return nextFingerprint

  return {
    ...nextFingerprint,
    createdAt: existingFingerprint.createdAt ?? nextFingerprint.createdAt,
    updatedAt: nextFingerprint.updatedAt,
    identity: existingFingerprint.identity ?? nextFingerprint.identity,
    creativeDirection: existingFingerprint.creativeDirection
      ? {
          ...nextFingerprint.creativeDirection,
          ...existingFingerprint.creativeDirection,
          status: nextFingerprint.creativeDirection.status,
          required: nextFingerprint.creativeDirection.required,
          workflow: nextFingerprint.creativeDirection.workflow,
          signatureMove: {
            ...nextFingerprint.creativeDirection.signatureMove,
            ...existingFingerprint.creativeDirection.signatureMove
          },
          gate: {
            ...nextFingerprint.creativeDirection.gate,
            ...existingFingerprint.creativeDirection.gate,
            status: nextFingerprint.creativeDirection.gate.status
          }
        }
      : nextFingerprint.creativeDirection,
    exploration: existingFingerprint.exploration ?? nextFingerprint.exploration,
    composition: existingFingerprint.composition ?? nextFingerprint.composition,
    typography: existingFingerprint.typography ?? nextFingerprint.typography,
    color: existingFingerprint.color ?? nextFingerprint.color,
    spacing: existingFingerprint.spacing ?? nextFingerprint.spacing,
    imagery: existingFingerprint.imagery ?? nextFingerprint.imagery,
    motion: existingFingerprint.motion ?? nextFingerprint.motion,
    responsive: existingFingerprint.responsive ?? nextFingerprint.responsive,
    webCapture: existingFingerprint.webCapture ?? nextFingerprint.webCapture,
    components: existingFingerprint.components ?? nextFingerprint.components,
    uxRules: existingFingerprint.uxRules ?? nextFingerprint.uxRules,
    uxQa: { ...nextFingerprint.uxQa, ...existingFingerprint.uxQa, status: 'not-tested' },
    antiSlopChecks: existingFingerprint.antiSlopChecks ?? nextFingerprint.antiSlopChecks,
    openQuestions: existingFingerprint.openQuestions ?? nextFingerprint.openQuestions,
    analysis: existingFingerprint.analysis ?? nextFingerprint.analysis,
    visualQa: { ...nextFingerprint.visualQa, ...existingFingerprint.visualQa, status: 'pending' }
  }
}

function formatSourceList({ prompt, screenshot, figma, url, existingRepo = true }) {
  const sources = []
  if (prompt) sources.push('- Prompt: provided below')
  if (screenshot) {
    const dimensions = screenshot.width && screenshot.height
      ? ' (' + screenshot.width + '×' + screenshot.height + ')'
      : ''
    sources.push('- Screenshot: ' + inlineCode(screenshot.path) + dimensions
      + (screenshot.exists ? '' : ' — file not found at generation time'))
  }
  if (figma) {
    const node = figma.nodeId ? ', node ' + inlineCode(figma.nodeId) : ''
    sources.push('- Figma: ' + figma.url + node + ' — prefer connected Figma MCP context')
  }
  if (url) sources.push('- URL: ' + url + ' — inspect with Playwright MCP when available')
  if (existingRepo) sources.push('- Existing repo: inspect local components, tokens, routes, fonts, and assets')
  return sources.length > 0 ? sources.join('\n') : '- No source was provided'
}

export function buildAgentBrief({
  prompt = null,
  screenshot = null,
  figma = null,
  url = null,
  existingRepo = true,
  mode = 'adapt',
  workflow = 'auto',
  target = 'the existing frontend project',
  projectRoot = process.cwd()
} = {}) {
  const intent = assertMode(mode)
  const plan = routeRequest({ prompt, screenshot, figma, url, existingRepo, workflow })
  return [
    '# ' + plan.selection.skill + ' request',
    '',
    'Target: ' + target,
    'Intent: ' + intent,
    'Scope: ' + plan.selection.focus + '; stopping point: ' + plan.selection.action,
    'Route is a heuristic hint. Honor the full user request over the hint.',
    '',
    'User brief:',
    normalizeOptionalText(prompt) ?? 'Use the supplied reference within the requested scope.',
    '',
    'Reference inputs:',
    formatSourceList({
      prompt,
      screenshot: screenshot ? readImageMetadata(screenshot, projectRoot) : null,
      figma: parseFigmaUrl(figma),
      url,
      existingRepo
    }),
    '',
    'Read .whipui/router.md, then ' + plan.selection.workflow + '.',
    ...plan.steps.map((step, index) => (index + 1) + '. ' + step),
    '',
    'Acceptance:',
    '- Preserve the requested scope; plan and review requests do not authorize application edits.',
    '- For WhipUI, match the specified component/page, source character and requested behavior.',
    '- For a WhipDesign build, test a small clickable slice of the primary task before expansion.',
    '- Record assumptions separately from observations. Keep UX outcomes and visual findings separate.',
    '- Missing browser evidence is not tested, not passed. Agent review is not human usability research.',
    ''
  ].join('\n')
}

export function buildCritiqueBrief({
  url = 'http://localhost:3000',
  viewports = DEFAULT_VIEWPORTS,
  axes = DEFAULT_QA_AXES
} = {}) {
  return [
    '# WhipUI + WhipDesign review',
    '',
    'Target: ' + url,
    'This is a review-only handoff. Report findings without changing application code.',
    'Read .whipui/router.md and .whipui/workflows/visual-qa.md.',
    'For task/flow evaluation also read .whipui/workflows/ux-review.md.',
    'Use Playwright MCP or available host browser tools. Configuration is not evidence.',
    '',
    'Inspect the supplied reference or selected design, realistic content and the primary task.',
    'Evaluate responsive behavior at these viewports:',
    ...viewports.map(({ name, width, height }) => '- ' + name + ': ' + width + 'x' + height),
    '',
    'Visual axes (apply only those relevant to this request):',
    ...axes.map((axis) => '- ' + axis),
    '',
    'Report each finding with task/state, screenshot or observation, impact and proposed correction.',
    'Separate UX task blockers from visual craft and reference-fidelity mismatches.',
    'Report observed, blocked, or not tested. Heuristic assessment is not human user testing.',
    'Only an explicit fix request authorizes refinement; then use the configured iteration limit.',
    ''
  ].join('\n')
}
