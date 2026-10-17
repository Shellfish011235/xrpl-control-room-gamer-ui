import assert from 'node:assert/strict';
import { buildPlan } from '../src/orchestra/plan';

// Simulate browser runtime: Node normally provides Buffer, browsers do not.
(globalThis as any).Buffer = undefined;

const result = {
  netted: [{
    from: 'rFrom',
    to: 'rTo',
    asset: { kind: 'XRP' as const },
    amount: '1',
  }],
  remainder: [],
};

const plan = buildPlan(result as any, { maxTx: 1 });
const memoData = (plan.xrplTxs[0].payload as any).Memo.MemoData;
const expected = Array.from(new TextEncoder().encode(JSON.stringify({ batch: true, seq: 0 })))
  .map((b) => b.toString(16).padStart(2, '0'))
  .join('');
assert.equal(memoData, expected);
console.log('browser Buffer regression: PASS');
