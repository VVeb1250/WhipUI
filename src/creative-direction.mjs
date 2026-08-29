const CREATIVE_DIRECTION_PATTERN = /\bcreative\s+directions?\b|\b(?:show|generate|propose|explore|compare)\s+(?:me\s+)?(?:(?:three|3|several|some)\s+)?(?:design|visual|art)?\s*directions?\b|\b(?:distinctive|non-generic|less generic)\b|\bunique\s+(?:design|direction|look|visual|interface|ui)\b|\b(?:make|feel|look)\s+(?:it\s+)?unique\b|เสนอ(?:แนวทาง|ดีไซน์|ทิศทาง)|ไม่ซ้ำ|มีเอกลักษณ์|ยูนีค/iu
const URL_IN_PROMPT_PATTERN = /https?:\/\/[^\s)]+/iu

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
  force = false
} = {}) {
  if (!hasText(prompt)) return Boolean(force)
  if (force || requestsCreativeDirection(prompt)) return true
  return ![screenshot, figma, url].some(hasText)
    && !URL_IN_PROMPT_PATTERN.test(prompt)
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
      repetitionLimit: 2
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
    minimumCandidates: 3,
    candidates: [],
    selected: '',
    rejectedReasons: []
  }
}
