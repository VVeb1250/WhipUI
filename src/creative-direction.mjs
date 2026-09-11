const CREATIVE_DIRECTION_PATTERN = /\bcreative\s+directions?\b|\b(?:show|generate|propose|explore|compare)\s+(?:me\s+)?(?:(?:three|3|several|some)\s+)?(?:design|visual|art)?\s*directions?\b|\b(?:distinctive|non-generic|less generic)\b|\bunique\s+(?:design|direction|look|visual|interface|ui)\b|\b(?:make|feel|look)\s+(?:it\s+)?unique\b|เสนอ(?:แนวทาง|ดีไซน์|ทิศทาง)|ไม่ซ้ำ|มีเอกลักษณ์|ยูนีค/iu
import { selectWorkflow } from './workflow.mjs'

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function requestsCreativeDirection(prompt) {
  return hasText(prompt) && CREATIVE_DIRECTION_PATTERN.test(prompt)
}

export function shouldRunCreativeDirection({
  prompt = null,
  screenshot = null,
  figma = null,
  url = null,
  force = false,
  workflow = 'auto'
} = {}) {
  if (workflow === 'ui') return false
  if (!hasText(prompt)) return Boolean(force)
  const route = selectWorkflow({ prompt, screenshot, figma, url, workflow })
  if (route.focus === 'ux' || route.action !== 'build') return false
  if (force || requestsCreativeDirection(prompt)) return true
  return route.lane === 'design' && route.focus !== 'ux' && route.action === 'build'
}

export function buildCreativeDirection({ required = false } = {}) {
  return {
    status: required ? 'required' : 'optional',
    required,
    workflow: '.whipui/workflows/creative-direction.md',
    productTruth: '',
    tension: ['', ''],
    thesis: '',
    signatureMove: {
      idea: '',
      productReason: '',
      whereUsed: '',
      repetitionLimit: null
    },
    layoutGrammar: '',
    typeVoice: '',
    colorLogic: '',
    imageryLogic: '',
    motionIdea: '',
    antiDirection: [],
    productSpecificProofs: [],
    responsivePromise: '',
    gate: {
      status: required ? 'pending' : 'optional',
      swapTest: 'pending',
      rationale: ''
    }
  }
}

export function buildDirectionExploration() {
  return {
    minimumCandidates: 1,
    compareWhen: 'material uncertainty or user request',
    evidence: [],
    candidates: [],
    selected: '',
    rejectedReasons: []
  }
}
