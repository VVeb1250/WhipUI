import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join, relative } from 'node:path'

export const AI_TARGETS = Object.freeze(['codex', 'vscode', 'claude', 'both', 'all'])

const HOSTS = Object.freeze(['codex', 'vscode', 'claude'])
const PROJECT_SKILL_ROOTS = Object.freeze([
  '.agents/skills',
  '.codex/skills',
  '.claude/skills',
  '.cursor/skills',
  '.github/skills'
])

const CONFIG_FILES = Object.freeze([
  { host: 'claude', relativePath: '.mcp.json' },
  { host: 'codex', relativePath: '.codex/config.toml' },
  { host: 'vscode', relativePath: '.vscode/mcp.json' }
])

const MCP_MARKERS = Object.freeze({
  'playwright-mcp': [/@playwright\/mcp/i, /playwright-mcp/i, /["']playwright["']/i, /\[mcp_servers\.playwright\]/i],
  'chrome-devtools-mcp': [/chrome-devtools/i, /chromeDevTools/i],
  'figma-mcp': [/figma/i],
  'firecrawl-mcp': [/firecrawl/i],
  fudge: [/fudge/i],
  agentation: [/agentation/i],
  onui: [/onui/i, /ui-annotator/i]
})

export const CAPABILITY_CATALOG = Object.freeze([
  {
    id: 'ui-ux-pro-max',
    kind: 'skill',
    role: 'design-system-and-visual-direction',
    hosts: ['codex', 'claude'],
    skillDirectories: ['ui-ux-pro-max', 'uiux-pro-max', 'ui_ux_pro_max'],
    installable: true,
    installPackage: 'ui-ux-pro-max-cli',
    docs: 'https://ui-ux-pro-max-skill.com/docs/cli-reference/'
  },
  {
    id: 'impeccable',
    kind: 'skill',
    role: 'visual-critique-refinement-and-anti-slop',
    hosts: ['codex', 'claude'],
    skillDirectories: ['impeccable'],
    installable: true,
    installPackage: 'impeccable',
    docs: 'https://github.com/pbakaus/impeccable'
  },
  {
    id: 'playwright-mcp',
    kind: 'mcp',
    role: 'primary-web-capture-and-visual-qa',
    hosts: HOSTS,
    required: true,
    installable: true,
    installPackage: '@playwright/mcp',
    docs: 'https://github.com/microsoft/playwright-mcp'
  },
  {
    id: 'chrome-devtools-mcp',
    kind: 'mcp',
    role: 'optional-runtime-inspection',
    hosts: HOSTS,
    required: false,
    installable: false,
    installPackage: null,
    docs: null
  },
  {
    id: 'figma-mcp',
    kind: 'mcp',
    role: 'conditional-figma-design-context',
    hosts: HOSTS,
    required: false,
    installable: false,
    installPackage: null,
    docs: null
  },
  {
    id: 'firecrawl-mcp',
    kind: 'mcp',
    role: 'optional-content-crawl',
    hosts: HOSTS,
    required: false,
    installable: false,
    installPackage: null,
    docs: 'https://github.com/firecrawl/firecrawl-mcp'
  },
  {
    id: 'fudge',
    kind: 'adapter',
    role: 'reference-discovery-and-style-context',
    hosts: HOSTS,
    required: false,
    installable: false,
    installPackage: null,
    docs: null
  },
  {
    id: 'agentation',
    kind: 'adapter',
    role: 'in-app-visual-annotation',
    hosts: HOSTS,
    required: false,
    installable: false,
    installPackage: null,
    docs: null
  },
  {
    id: 'onui',
    kind: 'adapter',
    role: 'visual-annotation-and-ui-inspection',
    hosts: HOSTS,
    required: false,
    installable: false,
    installPackage: null,
    docs: null
  }
].map((capability) => Object.freeze(capability)))

function getHomePath(relativePath) {
  return join(homedir(), relativePath)
}

function getGlobalSkillRoots() {
  const roots = []
  const codexHome = process.env.CODEX_HOME || getHomePath('.codex')
  const claudeHome = process.env.CLAUDE_CONFIG_DIR || getHomePath('.claude')

  roots.push([codexHome, 'codex'])
  roots.push([join(claudeHome, 'skills'), 'claude'])
  roots.push([getHomePath('.agents/skills'), 'shared'])
  roots.push([getHomePath('.cursor/skills'), 'shared'])

  return uniqueRoots(roots.map(([root, host]) => [
    root.endsWith('skills') ? root : join(root, 'skills'),
    host
  ]))
}

function uniqueRoots(roots) {
  const seen = new Set()
  return roots.filter(([root]) => {
    const key = root.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getProjectSkillRoots(projectRoot) {
  return PROJECT_SKILL_ROOTS.map((relativePath) => [join(projectRoot, relativePath), 'project'])
}

function getSkillRoots(projectRoot) {
  return uniqueRoots([
    ...getProjectSkillRoots(projectRoot),
    ...getGlobalSkillRoots()
  ])
}

function skillFileExists(root, directory) {
  return ['SKILL.md', 'skill.md'].some((fileName) => existsSync(join(root, directory, fileName)))
}

function getScope(projectRoot, filePath, fallback = 'global') {
  const pathFromProject = relative(projectRoot, filePath)
  if (!pathFromProject.startsWith('..') && !isAbsolute(pathFromProject)) return 'project'
  return fallback
}

function readText(filePath) {
  try {
    return readFileSync(filePath, 'utf8').slice(0, 512 * 1024)
  } catch {
    return ''
  }
}

function getProjectConfigFiles(projectRoot) {
  return CONFIG_FILES.map((config) => ({
    ...config,
    path: join(projectRoot, config.relativePath),
    scope: 'project'
  }))
}

function getGlobalConfigFiles() {
  const codexHome = process.env.CODEX_HOME || getHomePath('.codex')
  const claudeHome = process.env.CLAUDE_CONFIG_DIR || getHomePath('.claude')
  return [
    { host: 'codex', relativePath: null, path: join(codexHome, 'config.toml'), scope: 'global' },
    { host: 'claude', relativePath: null, path: join(claudeHome, 'settings.json'), scope: 'global' },
    { host: 'claude', relativePath: null, path: getHomePath('.claude.json'), scope: 'global' }
  ]
}

function getAllConfigFiles(projectRoot) {
  return uniqueRoots([
    ...getProjectConfigFiles(projectRoot).map((config) => [config.path, config]),
    ...getGlobalConfigFiles().map((config) => [config.path, config])
  ]).map(([, config]) => config)
}

function findSkill(projectRoot, capability) {
  for (const [root, rootScope] of getSkillRoots(projectRoot)) {
    for (const directory of capability.skillDirectories) {
      if (!skillFileExists(root, directory)) continue
      const skillPath = join(root, directory)
      return {
        status: 'installed',
        scope: rootScope === 'project' ? 'project' : getScope(projectRoot, skillPath),
        locations: [{ scope: rootScope === 'project' ? 'project' : 'global', host: null }]
      }
    }
  }

  return {
    status: 'missing',
    scope: null,
    locations: []
  }
}

function matchesMarker(text, markers) {
  return markers.some((marker) => marker.test(text))
}

function findMarkerLocations(projectRoot, capabilityId) {
  const markers = MCP_MARKERS[capabilityId] ?? []
  if (markers.length === 0) return []

  return getAllConfigFiles(projectRoot)
    .filter((config) => matchesMarker(readText(config.path), markers))
    .map((config) => ({
      scope: config.scope,
      host: config.host,
      path: config.scope === 'project' ? config.relativePath : null
    }))
}

function readPackageText(projectRoot) {
  return readText(join(projectRoot, 'package.json'))
}

function findAdapter(projectRoot, capability) {
  const configLocations = findMarkerLocations(projectRoot, capability.id)
  const packageText = readPackageText(projectRoot)
  const packageDetected = matchesMarker(packageText, MCP_MARKERS[capability.id] ?? [])

  if (configLocations.length > 0 || packageDetected) {
    return {
      status: 'detected',
      scope: configLocations[0]?.scope ?? 'project',
      locations: configLocations
    }
  }

  return {
    status: 'not-detected',
    scope: null,
    locations: []
  }
}

function detectCapability(projectRoot, capability) {
  if (capability.kind === 'skill') return findSkill(projectRoot, capability)
  if (capability.kind === 'adapter') return findAdapter(projectRoot, capability)

  const locations = findMarkerLocations(projectRoot, capability.id)
  return {
    status: locations.length > 0 ? 'configured' : 'missing',
    scope: locations[0]?.scope ?? null,
    locations
  }
}

export function resolveAiHosts(aiTarget = 'all') {
  if (!AI_TARGETS.includes(aiTarget)) {
    throw new Error('Unknown --ai target "' + aiTarget + '". Choose codex, vscode, claude, both, or all.')
  }

  if (aiTarget === 'both') return ['codex', 'vscode']
  if (aiTarget === 'all') return [...HOSTS]
  return [aiTarget]
}

export function isCapabilityReady(capability) {
  return ['installed', 'configured', 'detected'].includes(capability.status)
}

export function detectCapabilities(projectRoot, { ai = 'all' } = {}) {
  const hosts = resolveAiHosts(ai)

  return CAPABILITY_CATALOG.map((catalogEntry) => {
    const detection = detectCapability(projectRoot, catalogEntry)
    const active = catalogEntry.hosts.some((host) => hosts.includes(host))

    return {
      id: catalogEntry.id,
      kind: catalogEntry.kind,
      role: catalogEntry.role,
      hosts: catalogEntry.hosts,
      active,
      required: catalogEntry.required === true,
      installable: catalogEntry.installable === true,
      installPackage: catalogEntry.installPackage,
      docs: catalogEntry.docs,
      ...detection,
      ready: isCapabilityReady(detection)
    }
  })
}

export function buildCapabilityManifest(
  projectRoot,
  { ai = 'all', generatedAt = new Date().toISOString() } = {}
) {
  const capabilities = detectCapabilities(projectRoot, { ai })
  const activeCapabilities = capabilities.filter((capability) => capability.active)

  return {
    schemaVersion: 1,
    generatedAt,
    projectRoot: '.',
    ai,
    hosts: resolveAiHosts(ai),
    capabilities: activeCapabilities,
    requiredMissing: activeCapabilities
      .filter((capability) => capability.required && !capability.ready)
      .map((capability) => capability.id),
    installableMissing: activeCapabilities
      .filter((capability) => capability.installable && !capability.ready)
      .map((capability) => capability.id)
  }
}
