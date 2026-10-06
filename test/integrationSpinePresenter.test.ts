import assert from 'node:assert/strict'
import test from 'node:test'
import { buildIntegrationPanelModel } from '../src/components/control-room/integrationSpinePresenter.ts'

test('presents current backend state without retaining stale success', () => {
  const model = buildIntegrationPanelModel({
    health: {
      state: 'dependency_down',
      label: 'Backend unavailable',
      detail: 'Shellfish Gateway is unavailable.',
    },
    operation: {
      state: 'dependency_down',
      label: 'Dependency unavailable',
      detail: 'Wave Router is unavailable.',
    },
  })

  assert.equal(model.healthLabel, 'Backend unavailable')
  assert.equal(model.operationLabel, 'Dependency unavailable')
  assert.equal(model.showSuccess, false)
})

test('shows receipt identity and explicit non-authority from existing facts', () => {
  const model = buildIntegrationPanelModel({
    health: {
      state: 'healthy',
      label: 'Shellfish healthy',
      detail: 'Wave Router: HEALTHY',
    },
    operation: {
      state: 'success',
      label: 'QUOTED',
      detail: 'Shellfish completed the requested integration step.',
    },
    response: {
      status: 'QUOTED',
      receipt_id: 'ROUTE_RECEIPT_1',
      authorization_state: {
        execution_authorized: false,
        payment_authorized: false,
      },
    },
  })

  assert.equal(model.receiptId, 'ROUTE_RECEIPT_1')
  assert.equal(model.authorizationCopy, 'Execution authority: not granted')
  assert.equal(model.showSuccess, true)
})

test('does not introduce hackathon verdict language', () => {
  const model = buildIntegrationPanelModel({
    health: {
      state: 'healthy',
      label: 'Shellfish healthy',
      detail: 'Wave Router: HEALTHY',
    },
  })

  const serialized = JSON.stringify(model)
  assert.equal(serialized.includes('ALLOW_PLAN'), false)
  assert.equal(serialized.includes('SIMULATION_ONLY'), false)
  assert.equal(serialized.includes('DENY'), false)
})
