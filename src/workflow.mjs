export const WORKFLOWS = Object.freeze(['auto', 'ui', 'design'])

const UX = /\bux\b|usability|user (?:flow|journey)|information architecture|ใช้งานยาก|ใช้งานง่าย|ขั้นตอน|ประสบการณ์ผู้ใช้/iu
const EXPLORE = /creative direction|design directions?|redesign|design from scratch|คิดดีไซน์|ออกแบบใหม่|ไม่มี(?:ภาพ)?เรฟ|ไม่มีไอเดีย|มีเอกลักษณ์|ไม่ซ้ำ|non-generic|distinctive|unique (?:design|ui|look)/iu
const LOCAL_EDIT = /^(?:please\s+)?(?:fix|change|adjust|replace|add|remove|update|rename)\b|แก้|เปลี่ยน|ปรับ|เพิ่ม|ลบ/iu
const COMPONENT_SPEC = /(?:button|badge|input|card|ปุ่ม|การ์ด).{0,80}\d+(?:px|rem|em)\b/iu
const UX_ONLY = /\bux only\b|(?:keep|preserve|without changing).{0,25}(?:appearance|visual|look)|(?:อย่า|ไม่ต้อง)เปลี่ยน(?:หน้าตา|สี|ดีไซน์)/iu
const UI_ONLY = /\bui only\b|visual only|(?:keep|preserve).{0,20}(?:flow|behavior)|คง\s*flow|เฉพาะหน้าตา/iu
const REVIEW = /\b(?:review|audit|critique|evaluate)\b|ตรวจ|ประเมิน|รีวิว/iu
const PLAN = /\b(?:plan only|do not (?:write|implement)|before (?:coding|implementation))\b|เสนอก่อน|เสนอมาก่อน|อย่าเพิ่ง(?:ทำ|เขียน)|ยังไม่ต้อง(?:ทำ|เขียน)/iu
const BUILD = /\b(?:implement|fix|build|apply|repair)\b|ลงมือ|แก้(?:ให้|ด้วย)/iu
const READ_ONLY = /\b(?:review only|read.only|no code changes|(?:do not|don't) (?:edit|fix|change) (?:anything|(?:the )?(?:code|files|source)))\b|(?:do not|don't) (?:edit|fix|change)[.!]?$|(?:อย่า|ไม่ต้อง|ห้าม)(?:(?:แก้|เปลี่ยน)(?:โค้ด|ไฟล์)|เขียนโค้ด)/iu

// This helper is a routing hint, not an NLU engine or permission decision.
// Host agents use the full request and explicit scope over these heuristics.
export function selectWorkflow({ prompt = '', screenshot, figma, url, webPick = false, workflow = 'auto' } = {}) {
  if (!WORKFLOWS.includes(workflow)) {
    throw new Error('Unknown --workflow "' + workflow + '". Choose auto, ui, or design.')
  }
  const text = typeof prompt === 'string' ? prompt : ''
  const hasReference = Boolean(screenshot || figma || url || /https?:\/\//i.test(text))
  const ux = UX.test(text)
  let lane = workflow
  let reason = 'explicit workflow'
  if (lane === 'auto') {
    if (ux && !UI_ONLY.test(text)) {
      lane = 'design'
      reason = 'user experience or flow work'
    } else if (webPick || UI_ONLY.test(text)) {
      lane = 'ui'
      reason = 'bounded UI or capture request'
    } else if (EXPLORE.test(text)) {
      lane = 'design'
      reason = 'new direction requested'
    } else if (hasReference || LOCAL_EDIT.test(text) || COMPONENT_SPEC.test(text) || !text.trim()) {
      lane = 'ui'
      reason = 'reference-led or bounded existing UI work'
    } else {
      lane = 'design'
      reason = 'open-ended brief without a supplied design'
    }
  }
  return {
    lane,
    skill: lane === 'design' ? 'whipdesign' : 'whipui',
    workflow: '.whipui/workflows/' + (lane === 'design' ? 'design' : 'implement') + '.md',
    focus: lane === 'design' && UX_ONLY.test(text) ? 'ux' : lane === 'ui' || UI_ONLY.test(text) ? 'ui' : 'ux-and-ui',
    action: PLAN.test(text) ? 'plan' : READ_ONLY.test(text) || REVIEW.test(text) && !BUILD.test(text) ? 'review' : 'build',
    reason,
    authority: 'hint-only; the host must honor the full user request'
  }
}
