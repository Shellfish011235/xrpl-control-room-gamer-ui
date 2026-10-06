import assert from 'node:assert/strict'
import test from 'node:test'
import { toGatewayViewState } from '../src/services/shellfishGatewayView.ts'

test('maps pending explicitly', () => {
  assert.equal(toGatewayViewState({ pending: true }).state, 'pending')
})

test('maps healthy gateway and dependency state', () => {
  const view = toGatewayViewState({
    result: {
      ok: true,
      data: {
        status: 'HEALTHY',
        service: 'shellfish_gateway',
        dependencies: { wave_router: { status: 'HEALTHY' } },
      },
    },
  })

  assert.equal(view.state, 'healthy')
  assert.match(view.detail, /Wave/i)
})

test('maps ordinary completed or quoted responses to success', () => {
  const view = toGatewayViewState({
    result: {
      ok: true,
      data: {
        status: 'QUOTED',
        receipt_id: 'ROUTE_RECEIPT_1',
      },
    },
  })

  assert.equal(view.state, 'success')
  assert.match(view.detail, /receipt/i)
})

test('maps policy or invalid-request errors to blocked', () => {
  const view = toGatewayViewState({
    result: {
      ok: false,
      error: {
        kind: 'http',
        code: 'INVALID_REQUEST',
        httpStatus: 400,
        message: 'The request is invalid.',
      },
    },
  })

  assert.equal(view.state, 'blocked')
  assert.equal(view.detail, 'The request is invalid.')
})

test('maps network and timeout failure to dependency_down', () => {
  for (const kind of ['network', 'timeout'] as const) {
    const view = toGatewayViewState({
      result: {
        ok: false,
        error: { kind, message: 'Backend unavailable.' },
      },
    })
    assert.equal(view.state, 'dependency_down')
  }
})

test('maps malformed responses explicitly and never invents event verdict labels', () => {
  const view = toGatewayViewState({
    result: {
      ok: false,
      error: { kind: 'malformed', message: 'Malformed response.' },
    },
  })

  assert.equal(view.state, 'malformed')
  const serialized = JSON.stringify(view)
  assert.equal(serialized.includes('ALLOW_PLAN'), false)
  assert.equal(serialized.includes('SIMULATION_ONLY'), false)
  assert.equal(serialized.includes('DENY'), false)
})

test('unknown successful response shape is malformed instead of stale success', () => {
  const view = toGatewayViewState({
    result: {
      ok: true,
      data: { status: 'SOMETHING_NEW' },
    },
  })

  assert.equal(view.state, 'malformed')
})
