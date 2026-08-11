import assert from 'node:assert/strict'
import { test } from 'node:test'
import { routeRequest } from '../src/router.mjs'

test('routes a natural-language URL pick request without an explicit web keyword', () => {
  const plan = routeRequest({
    prompt: 'Open https://example.com and let me pick the pricing card'
  })

  assert.equal(plan.kind, 'pick-from-web')
  assert.equal(plan.inputs.webPick, true)
  assert.equal(plan.mcp[0].name, 'Playwright MCP')
})
