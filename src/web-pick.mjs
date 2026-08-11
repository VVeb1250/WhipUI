const INLINE_CODE_MARK = String.fromCharCode(96)

function inlineCode(value) {
  return INLINE_CODE_MARK + value + INLINE_CODE_MARK
}

export const PICK_CAPTURE_FIELDS = Object.freeze([
  'url',
  'timestamp',
  'selectorOrLocator',
  'textContent',
  'attributes',
  'outerHTML',
  'ancestorPath',
  'computedStyles',
  'boundingBox',
  'screenshotPath',
  'interactionStates',
  'accessibilitySnapshot'
])

export function buildPickBrief({
  url = 'https://example.com',
  selector = null,
  target = 'the selected element'
} = {}) {
  const selectorLine = selector
    ? 'Use this starting locator if useful: ' + inlineCode(selector)
    : 'Let the user pick the element visually. If the host cannot expose a picker, ask for a selector, text label, or coordinates.'

  return [
    '# WhipUI Pick from Web',
    '',
    'Source URL: ' + url,
    'Target: ' + target,
    '',
    'Use Playwright MCP as the primary runtime. Chrome DevTools is optional and should only add diagnostics when already available in the host. WhipUI does not launch or own a browser.',
    '',
    selectorLine,
    '',
    'Capture contract:',
    '1. Open the URL in an isolated browser context and wait for the real page to settle.',
    '2. Let the user identify the element, or resolve it with the supplied locator, text, or coordinates.',
    '3. Capture the selected element and its context:',
    ...PICK_CAPTURE_FIELDS.map((field) => '- ' + inlineCode(field)),
    '4. For computed styles, capture display, position, width/height, box model, margin/padding, typography, color/background, border/radius, shadow, opacity, overflow, transform, and z-index.',
    '5. Capture interaction states where supported: default, hover, focus-visible, active/pressed, disabled, expanded/open, and selected.',
    '6. Take an element screenshot and one surrounding viewport screenshot. Keep URL and timestamp with the capture.',
    '7. Save structured JSON under .whipui/web-captures/ and images beside it.',
    '8. Update .whipui/design-fingerprint.json with durable visual traits, not only copied CSS values.',
    '',
    'After capture:',
    'Route the evidence through the existing design-intelligence skill, map it to existing project components/tokens, implement the smallest useful adaptation, and run visual QA across all axes and viewports.',
    '',
    'Safety boundary:',
    'Do not use the users real browser profile, cookies, passwords, or unrelated tabs. Do not claim a capture happened if the browser tool was unavailable.'
  ].join('\n')
}
