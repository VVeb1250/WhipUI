import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildCritiqueBrief,
  buildFingerprint,
  mergeFingerprint
} from '../src/fingerprint.mjs'
import {
  requestsCreativeDirection,
  shouldRunCreativeDirection
} from '../src/creative-direction.mjs'
import { formatRouteSummary, routeRequest } from '../src/router.mjs'

test('routes a rough product brief to UX-led design and visual exploration', () => {
  const plan = routeRequest({ prompt: 'Build a release planning dashboard.' })

  assert.equal(plan.creativeDirection.required, true)
  assert.equal(plan.creativeDirection.workflow, '.whipui/workflows/creative-direction.md')
  assert.equal(plan.selection.skill, 'whipdesign')
  assert.equal(plan.selection.focus, 'ux-and-ui')
  assert.match(formatRouteSummary(plan), /Visual exploration: required/)
})

test('keeps the gate optional when a visual source already supplies direction', () => {
  assert.equal(shouldRunCreativeDirection({
    prompt: 'Build this screen.',
    screenshot: './reference.png'
  }), false)

  const plan = routeRequest({
    prompt: 'Build this screen.',
    figma: 'https://www.figma.com/design/file-key/name?node-id=1-2'
  })

  assert.equal(plan.creativeDirection.required, false)

  const inlineFigmaPlan = routeRequest({
    prompt: 'Build https://www.figma.com/design/file-key/name?node-id=1-2'
  })

  assert.equal(inlineFigmaPlan.creativeDirection.required, false)
})

test('honors natural-language requests to explore distinctive directions', () => {
  const prompt = 'เสนอ design directions ที่มีเอกลักษณ์ก่อนทำหน้าจอนี้'

  assert.equal(requestsCreativeDirection(prompt), true)
  assert.equal(shouldRunCreativeDirection({
    prompt,
    screenshot: './reference.png'
  }), true)
})

test('builds separate unevaluated UX and visual evidence without mandatory novelty quotas', () => {
  const fingerprint = buildFingerprint({
    prompt: 'Build a release planning dashboard.'
  })

  assert.equal(fingerprint.schemaVersion, 3)
  assert.equal(fingerprint.status, 'pending-creative-direction')
  assert.equal(fingerprint.creativeDirection.required, true)
  assert.equal(fingerprint.creativeDirection.gate.status, 'pending')
  assert.equal(fingerprint.creativeDirection.signatureMove.repetitionLimit, null)
  assert.equal(fingerprint.exploration.minimumCandidates, 1)
  assert.equal(fingerprint.uxQa.status, 'not-tested')
  assert.equal(fingerprint.uxQa.humanValidation, 'not-performed')
  assert.equal(fingerprint.visualQa.axes.includes('product-specificity'), true)
  assert.equal(fingerprint.visualQa.axes.includes('concept-coherence'), true)
  assert.equal(fingerprint.visualQa.axes.includes('generic-pattern-debt'), true)
})

test('upgrades a schema v1 fingerprint without losing existing visual decisions', () => {
  const existingFingerprint = {
    schemaVersion: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    identity: {
      oneThingToRemember: 'The release train is the organizing object.',
      artDirection: 'Operational editorial'
    }
  }
  const nextFingerprint = buildFingerprint({
    prompt: 'Build a release planning dashboard.',
    createdAt: '2026-08-29T00:00:00.000Z'
  })

  const upgraded = mergeFingerprint(existingFingerprint, nextFingerprint)

  assert.equal(upgraded.schemaVersion, 3)
  assert.equal(upgraded.createdAt, existingFingerprint.createdAt)
  assert.equal(upgraded.identity, existingFingerprint.identity)
  assert.equal(upgraded.creativeDirection.required, true)
  assert.equal(upgraded.exploration.minimumCandidates, 1)
})

test('promotes the optional init fingerprint when a prompt-only task arrives', () => {
  const initialized = buildFingerprint()
  const promptTask = buildFingerprint({
    prompt: 'Build a release planning dashboard.'
  })

  const merged = mergeFingerprint(initialized, promptTask)

  assert.equal(initialized.creativeDirection.required, false)
  assert.equal(merged.creativeDirection.required, true)
  assert.equal(merged.creativeDirection.status, 'required')
  assert.equal(merged.creativeDirection.gate.status, 'pending')
})

test('does not mistake a unique identifier requirement for a design request', () => {
  assert.equal(requestsCreativeDirection('Add a unique ID field to the form.'), false)
  assert.equal(requestsCreativeDirection('Use this screenshot as visual direction.'), false)
})

test('critique handoff preserves review-only scope and separates UX from visual evidence', () => {
  const brief = buildCritiqueBrief()

  assert.match(brief, /without changing application code/)
  assert.match(brief, /ux-review\.md/)
  assert.match(brief, /visual-qa\.md/)
  assert.match(brief, /not human user testing/)
})
