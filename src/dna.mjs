import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

function readPackageJson(projectRoot) {
  const packagePath = join(projectRoot, 'package.json')
  if (!existsSync(packagePath)) return null

  try {
    return JSON.parse(readFileSync(packagePath, 'utf8'))
  } catch {
    return null
  }
}

function detectPackageManager(projectRoot) {
  if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(projectRoot, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(projectRoot, 'bun.lockb')) || existsSync(join(projectRoot, 'bun.lock'))) return 'bun'
  if (existsSync(join(projectRoot, 'package-lock.json'))) return 'npm'
  return 'unknown'
}

function detectStack(packageJson) {
  const dependencyNames = Object.keys({
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {})
  })
  const stack = []

  if (dependencyNames.includes('next')) stack.push('Next.js')
  if (dependencyNames.includes('react')) stack.push('React')
  if (dependencyNames.includes('vue')) stack.push('Vue')
  if (dependencyNames.includes('svelte')) stack.push('Svelte')
  if (dependencyNames.includes('astro')) stack.push('Astro')
  if (dependencyNames.includes('tailwindcss')) stack.push('Tailwind CSS')
  if (dependencyNames.includes('typescript')) stack.push('TypeScript')
  if (stack.length === 0 && packageJson) stack.push('JavaScript/TypeScript project')
  return stack
}

export function buildProjectDna({
  projectRoot = process.cwd(),
  createdAt = new Date().toISOString()
} = {}) {
  const packageJson = readPackageJson(projectRoot)

  return {
    schemaVersion: 1,
    status: 'draft',
    createdAt,
    updatedAt: createdAt,
    project: {
      name: packageJson?.name ?? basename(projectRoot),
      root: '.',
      existingRepo: true,
      packageManager: detectPackageManager(projectRoot),
      stack: detectStack(packageJson),
      packageDescription: packageJson?.description ?? '',
      routes: [],
      constraints: []
    },
    product: {
      purpose: '',
      audience: '',
      primaryJobs: [],
      voice: [],
      antiReferences: []
    },
    designSystem: {
      sourceOfTruth: 'inspect-existing-repo-first',
      tokens: [],
      components: [],
      fonts: [],
      assets: [],
      references: []
    },
    inputPolicy: {
      supported: ['prompt', 'screenshot', 'figma', 'url', 'existing-repo'],
      sourcePriority: [
        'existing repository conventions',
        'connected Figma MCP context',
        'captured web element data',
        'screenshot evidence',
        'prompt inference'
      ]
    },
    routing: {
      ownsAgentRuntime: false,
      ownsBrowserRuntime: false,
      designIntelligence: {
        preferred: [
          'UI/UX Pro Max, for design-system direction, when installed',
          'Impeccable, for critique and anti-slop refinement, when installed',
          'existing frontend design skill in the host',
          'existing repository design system'
        ],
        discovery: 'use project-local capabilities first; init may install named skills with explicit confirmation'
      },
      mcp: {
        playwright: {
          role: 'primary-for-web-and-pick',
          required: true
        },
        chromeDevTools: {
          role: 'optional',
          required: false
        },
        figma: {
          role: 'conditional-on-figma-input',
          required: false
        }
      }
    },
    visualQa: {
      maxIterations: 3,
      viewports: [
        { name: 'desktop', width: 1440, height: 900 },
        { name: 'tablet', width: 1024, height: 900 },
        { name: 'mobile', width: 390, height: 844 }
      ],
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
      evidenceRequired: [
        'rendered page or screenshot',
        'written finding',
        'change and result after reload'
      ]
    }
  }
}

export function mergeProjectDna(existingDna, nextDna, { reset = false } = {}) {
  if (!existingDna || reset) return nextDna

  return {
    ...nextDna,
    createdAt: existingDna.createdAt ?? nextDna.createdAt,
    updatedAt: nextDna.updatedAt,
    project: { ...nextDna.project, ...existingDna.project },
    product: existingDna.product ?? nextDna.product,
    designSystem: existingDna.designSystem ?? nextDna.designSystem,
    inputPolicy: existingDna.inputPolicy ?? nextDna.inputPolicy,
    routing: existingDna.routing ?? nextDna.routing,
    visualQa: existingDna.visualQa ?? nextDna.visualQa
  }
}
