import assert from 'node:assert/strict';
import test from 'node:test';
import {
  amendmentLifecycleEvents,
  getAmendmentLifecycle,
  isActivated,
} from '../src/data/amendmentLifecycle.ts';

test('expected activation never counts as activated', () => {
  const event = getAmendmentLifecycle('fixBatchV1_2');
  assert.ok(event);
  assert.equal(event.status, 'majority');
  assert.equal(event.expectedActivation, '2026-10-09');
  assert.equal(isActivated(event), false);
});

test('replacement lineage is explicit', () => {
  const delegation = getAmendmentLifecycle('PermissionDelegationV1_1');
  assert.deepEqual(delegation?.replaces, ['PermissionDelegation']);

  const batch = getAmendmentLifecycle('BatchV1_1');
  assert.deepEqual(batch?.replaces, ['Batch', 'fixBatchInnerSigs']);
});

test('every lifecycle event has verification date and source', () => {
  for (const event of amendmentLifecycleEvents) {
    assert.match(event.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(event.sourceUrls.length > 0);
    assert.ok(event.sourceUrls.every((url) => url.startsWith('https://')));
  }
});
