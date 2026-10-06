import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getShellfishHealth,
  getShellfishJob,
  getShellfishReceipt,
  requestShellfishQuote,
  resolveShellfishGatewayBaseUrl,
  submitShellfishJob,
} from '../src/services/shellfishGateway.ts'

const originalFetch = globalThis.fetch

test.afterEach(() => {
  globalThis.fetch = originalFetch
})

test('resolves one configured Shellfish base URL and local dev fallback only', () => {
  assert.equal(
    resolveShellfishGatewayBaseUrl({ DEV: true }),
    'http://127.0.0.1:8787'
  )
  assert.equal(
    resolveShellfishGatewayBaseUrl({ DEV: false }),
    null
  )
  assert.equal(
    resolveShellfishGatewayBaseUrl({
      DEV: false,
      VITE_SHELLFISH_GATEWAY_URL: 'http://127.0.0.1:9999/',
    }),
    'http://127.0.0.1:9999'
  )
})

test('health returns typed success from the Shellfish gateway', async () => {
  let observedUrl = ''
  globalThis.fetch = async (input) => {
    observedUrl = String(input)
    return new Response(JSON.stringify({
      status: 'HEALTHY',
      service: 'shellfish_gateway',
      dependencies: { wave_router: { status: 'HEALTHY' } },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }

  const result = await getShellfishHealth({ baseUrl: 'http://127.0.0.1:8787' })

  assert.equal(observedUrl, 'http://127.0.0.1:8787/health')
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.equal(result.data.status, 'HEALTHY')
    assert.equal(result.data.dependencies?.wave_router.status, 'HEALTHY')
  }
})

test('structured non-2xx errors remain bounded', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    status: 'ERROR',
    errors: [{ code: 'INVALID_REQUEST', message: 'The request is invalid.' }],
  }), { status: 400, headers: { 'content-type': 'application/json' } })

  const result = await submitShellfishJob(
    { task_id: 'TASK1', task_type: 'TARGETED_RESEARCH' },
    { baseUrl: 'http://127.0.0.1:8787' }
  )

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.error.kind, 'http')
    assert.equal(result.error.code, 'INVALID_REQUEST')
    assert.equal(result.error.httpStatus, 400)
    assert.equal(result.error.message, 'The request is invalid.')
  }
})

test('malformed JSON never becomes success', async () => {
  globalThis.fetch = async () => new Response('not-json', { status: 200 })

  const result = await requestShellfishQuote(
    { task_id: 'TASK1', task_type: 'TARGETED_RESEARCH' },
    { baseUrl: 'http://127.0.0.1:8787' }
  )

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.kind, 'malformed')
})

test('network failure is explicit', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('connection refused')
  }

  const result = await getShellfishJob('JOB1', {
    baseUrl: 'http://127.0.0.1:8787',
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.kind, 'network')
})

test('abort timeout is explicit', async () => {
  globalThis.fetch = async (_input, init) => {
    return await new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'))
      })
    })
  }

  const result = await getShellfishReceipt('R1', {
    baseUrl: 'http://127.0.0.1:8787',
    timeoutMs: 5,
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.kind, 'timeout')
})

test('all integration calls stay on the single Shellfish base URL', async () => {
  const urls: string[] = []
  globalThis.fetch = async (input) => {
    urls.push(String(input))
    return new Response(JSON.stringify({ status: 'QUEUED' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  const options = { baseUrl: 'http://127.0.0.1:8787' }

  await getShellfishHealth(options)
  await requestShellfishQuote({ task_id: 'T1', task_type: 'TARGETED_RESEARCH' }, options)
  await submitShellfishJob({ task_id: 'T1', task_type: 'TARGETED_RESEARCH' }, options)
  await getShellfishJob('J1', options)
  await getShellfishReceipt('R1', options)

  assert.deepEqual(urls, [
    'http://127.0.0.1:8787/health',
    'http://127.0.0.1:8787/quotes',
    'http://127.0.0.1:8787/jobs',
    'http://127.0.0.1:8787/jobs/J1',
    'http://127.0.0.1:8787/receipts/R1',
  ])
  assert.equal(urls.some((url) => url.includes(':3000')), false)
})
