import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchXRPLAmendments } from '../src/services/freeDataFeeds.ts';

test('live XRPL feature state overrides stale XRPScan enabled status', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);

    if (url.includes('api.xrpscan.com')) {
      return new Response(JSON.stringify([
        {
          amendment_id: 'batch-v11',
          name: 'BatchV1_1',
          introduced: '3.4.0',
          enabled: false,
          supported: true,
          majority: null,
          count: 27,
          threshold: 25,
          validations: 33,
        },
      ]), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    if (url.includes('xrplcluster.com')) {
      return new Response(JSON.stringify({
        result: {
          status: 'success',
          features: {
            batchFeatureId: { name: 'BatchV1_1', enabled: true, supported: true },
          },
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  }) as typeof fetch;

  try {
    const amendments = await fetchXRPLAmendments();
    const batch = amendments.find((a) => a.name === 'BatchV1_1');

    assert.ok(batch);
    assert.equal(batch.enabled, true);
    assert.equal(batch.status, 'enabled');
    assert.equal(calls.some((url) => url.includes('xrplcluster.com')), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
