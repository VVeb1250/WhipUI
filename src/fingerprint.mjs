import { readFileSync, statSync } from 'node:fs'
import { extname, relative, resolve, sep } from 'node:path'

export const MODES = Object.freeze(['recreate', 'adapt', 'inspire'])

export const DEFAULT_VIEWPORTS = Object.freeze([
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
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

  if (!parsedUrl.hostname.toLowerCase().endsWith('figma.com')) {
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
  mode = 'adapt',
  projectRoot = process.cwd(),
  createdAt = new Date().toISOString()
} = {}) {
  const intent = assertMode(mode)

  return {
    schemaVersion: 1,
    status: 'pending-agent-analysis',
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
    antiSlopChecks: [
      'No default purple-gradient-on-white treatment unless the source asks for it.',
      'No invented component variants when an existing project component can be reused.',
      'No decorative effect without a job: hierarchy, feedback, wayfinding, or brand character.',
      'No desktop-only implementation when the brief or source implies mobile use.',
      'No silent substitution of the source character with a generic dashboard or landing-page pattern.'
    ],
    openQuestions: [
      'What is the single memorable visual idea?',
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
      axes: [
        'identity',
        'composition-and-hierarchy',
        'typography',
        'color-and-contrast',
        'spacing-and-density',
        'responsive-behavior',
        'interaction-states',
        'accessibility'
      ],
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
    antiSlopChecks: existingFingerprint.antiSlopChecks ?? nextFingerprint.antiSlopChecks,
    openQuestions: existingFingerprint.openQuestions ?? nextFingerprint.openQuestions,
    analysis: existingFingerprint.analysis ?? nextFingerprint.analysis,
    visualQa: existingFingerprint.visualQa ?? nextFingerprint.visualQa
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
  target = 'the existing frontend project',
  projectRoot = process.cwd()
} = {}) {
  const intent = assertMode(mode)
  const normalizedPrompt = normalizeOptionalText(prompt)
    ?? 'Infer the missing brief from the supplied visual/design context.'
  const screenshotSource = screenshot ? readImageMetadata(screenshot, projectRoot) : null
  const figmaSource = parseFigmaUrl(figma)
  const lines = [
    '# WhipUI implementation request',
    '',
    'Build or refine ' + target + '.',
    '',
    'Intent: ' + intent,
    '',
    'User brief:',
    normalizedPrompt,
    '',
    'Reference inputs:',
    formatSourceList({
      prompt: normalizeOptionalText(prompt),
      screenshot: screenshotSource,
      figma: figmaSource,
      url: normalizeOptionalText(url),
      existingRepo
    }),
    '',
    'Required workflow:',
    '1. Read WhipUI.md, PROJECT-DNA.md, .whipui/project-dna.json, and .whipui/design-fingerprint.json.',
    '2. Inspect the existing repository and reuse its components, tokens, fonts, assets, and routes.',
    '3. Apply UI/UX Pro Max for design-system direction when installed, Impeccable for critique when installed, or the existing design-intelligence skill as fallback.',
    '4. If a screenshot is supplied, separate identity from accidental pixels and record durable traits.',
    '5. If Figma is supplied and Figma MCP is connected, use its variables, components, assets, and hierarchy as the higher-confidence source.',
    '6. If a live URL is supplied, use Playwright MCP to inspect it in an isolated context. If this is a pick request, follow .whipui/workflows/pick-from-web.md.',
    '7. Update .whipui/design-fingerprint.json with concrete decisions before or alongside implementation.',
    '8. Implement the smallest coherent slice and reuse the existing project design system.',
    '9. Run .whipui/workflows/visual-qa.md across every axis and viewport. Fix hierarchy and identity before micro-polish.',
    '10. Re-check accessibility, focus, loading, empty, error, and reduced-motion states.',
    '',
    'Acceptance bar:',
    '- The result has a clear art direction and one memorable visual idea.',
    '- The UI uses a deliberate type scale, spacing rhythm, and color hierarchy.',
    '- Existing project components are reused where appropriate.',
    '- No generic AI-slop pattern was added without a reason recorded in the fingerprint.',
    '- Visual validation is based on a rendered page or screenshot, not source code alone.',
    ''
  ]
  return lines.join('\n')
}

export function buildCritiqueBrief({
  url = 'http://localhost:3000',
  viewports = DEFAULT_VIEWPORTS,
  axes = [
    'identity',
    'composition-and-hierarchy',
    'typography',
    'color-and-contrast',
    'spacing-and-density',
    'responsive-behavior',
    'interaction-states',
    'accessibility'
  ]
} = {}) {
  const viewportRows = viewports
    .map(({ name, width, height }) => '| ' + name + ' | ' + width + ' | ' + height + ' | ☐ | ☐ |')
    .join('\n')

  return [
    '# WhipUI visual QA loop',
    '',
    'Target: ' + url,
    '',
    'Use Playwright MCP as the primary browser runtime. Chrome DevTools is optional. Do not claim visual validation from source code alone.',
    '',
    'Loop:',
    '1. Open the target and wait for the page to settle.',
    '2. Inspect the rendered result at every configured viewport.',
    '3. Compare it against Project DNA, the Design Fingerprint, and supplied sources.',
    '4. Record the three highest-impact mismatches.',
    '5. Fix one high-impact mismatch, reload, and inspect again.',
    '6. Stop after the configured iteration limit or when the result is coherent.',
    '',
    'QA axes:',
    ...axes.map((axis) => '- [ ] ' + axis),
    '',
    'Viewport checklist:',
    '| Viewport | Width | Height | Rendered | Reviewed |',
    '| --- | ---: | ---: | :---: | :---: |',
    viewportRows,
    '',
    'Findings:',
    'P0 — blocks use or breaks layout: ',
    'P1 — weakens hierarchy, identity, or responsive behavior: ',
    'P2 — polish opportunity: ',
    '',
    'Final checks:',
    '- [ ] No horizontal overflow at mobile width.',
    '- [ ] Heading wraps intentionally at every viewport.',
    '- [ ] Focus, hover, disabled, loading, empty, and error states are coherent.',
    '- [ ] Contrast and hit targets are acceptable.',
    '- [ ] Motion respects reduced-motion preferences.',
    ''
  ].join('\n')
}
