import assert from 'node:assert/strict'
import test from 'node:test'
import { securityIncidents } from '../src/data/securityIncidents.ts'

test('security incident records keep attribution and wallet claims sourced', () => {
  assert.ok(securityIncidents.length >= 4)

  for (const incident of securityIncidents) {
    assert.ok(incident.sources.length > 0, `${incident.id} must have at least one source`)
    assert.ok(incident.attribution.basis.trim().length > 0, `${incident.id} must explain attribution basis`)
    assert.ok(incident.amountUsd > 0, `${incident.id} must include a positive reported loss`)

    for (const address of incident.addresses) {
      assert.ok(address.sourceUrl.startsWith('https://'), `${incident.id} address must have a source URL`)
      assert.notEqual(address.confidence, 'unverified', `${incident.id} must not publish unverified addresses`)
    }
  }
})
