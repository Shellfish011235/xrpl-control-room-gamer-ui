/**
 * Red-team suite – Phase 4 C2V.
 * Multi-turn attacks, goal hijacks, exfiltration sims.
 * Use 2025 benchmarks (e.g. DARPA AI Cyber Challenge) to quantify robustness; aim for top-5% resilience.
 * Publish results in docs/threat-model.md.
 */

import type { PaymentIntentEnvelope } from '../src/services/carv/types';
import { buildStructuredExplain } from '../src/c2v/feynman/explain';
import { runGuardrails } from '../src/c2v/feynman/guardrails';
import { runReject } from '../src/c2v/feynman/reject';

// ==================== FIXTURES ====================

function makePIE(overrides: Partial<PaymentIntentEnvelope>): PaymentIntentEnvelope {
  return {
    intent_id: `test-${Date.now()}`,
    payer: 'rPayer',
    payee: 'rPayee',
    amount: '1',
    asset: 'XRP',
    expiry: new Date(Date.now() + 86400 * 7).toISOString(),
    created_at: new Date().toISOString(),
    constraints: { max_fee: '0.00001', slippage_bps: 20, venue: 'xrpl' },
    proofs: {
      market_snapshot_hash: '0xabc',
      model_version: '1',
      features_hash: '0xdef',
      regime_summary_hash: '0xregime',
      compute_timestamp: new Date().toISOString(),
    },
    status: 'pending',
    ...overrides,
  };
}

// ==================== RED-TEAM TESTS ====================

/**
 * Self-loop: payer === payee. Must be rejected.
 */
export function testSelfLoop(): boolean {
  const pie = makePIE({ payer: 'rSame', payee: 'rSame' });
  const explain = buildStructuredExplain(pie);
  const reject = runReject(pie, explain);
  return reject.reject === true && reject.code === 'SELF_LOOP_FORBIDDEN';
}

/**
 * Invalid amount: zero or negative. Must be rejected.
 */
export function testInvalidAmount(): boolean {
  const pie = makePIE({ amount: '0' });
  const explain = buildStructuredExplain(pie);
  const reject = runReject(pie, explain);
  return reject.reject === true && reject.code === 'INVALID_AMOUNT';
}

/**
 * Slippage out of bounds. Must be rejected by symbolic/reject.
 */
export function testSlippageOutOfBounds(): boolean {
  const pie = makePIE({
    constraints: { max_fee: '0.00001', slippage_bps: 15000, venue: 'xrpl' },
  });
  const explain = buildStructuredExplain(pie);
  const reject = runReject(pie, explain);
  return reject.reject === true && reject.code === 'INVALID_SLIPPAGE';
}

/**
 * Missing regime hash. Guardrails should fail.
 */
export function testMissingRegimeHash(): boolean {
  const pie = makePIE({
    proofs: {
      market_snapshot_hash: '0x',
      model_version: '1',
      features_hash: '0x',
      regime_summary_hash: '0xnone',
      compute_timestamp: new Date().toISOString(),
    },
  });
  const explain = buildStructuredExplain(pie);
  const guard = runGuardrails(explain);
  return guard.pass === false && guard.failures.some((f) => f.ruleId === 'regime-anchor-required');
}

/**
 * Run all red-team checks; return pass count and total.
 */
export function runRedTeamSuite(): { passed: number; total: number; results: Record<string, boolean> } {
  const cases: Record<string, () => boolean> = {
    selfLoop: testSelfLoop,
    invalidAmount: testInvalidAmount,
    slippageOutOfBounds: testSlippageOutOfBounds,
    missingRegimeHash: testMissingRegimeHash,
  };
  const results: Record<string, boolean> = {};
  let passed = 0;
  for (const [name, fn] of Object.entries(cases)) {
    try {
      const ok = fn();
      results[name] = ok;
      if (ok) passed++;
    } catch (e) {
      results[name] = false;
    }
  }
  return { passed, total: Object.keys(cases).length, results };
}

// Allow running from CLI (e.g. npx ts-node tests/redteam.ts)
if (typeof process !== 'undefined' && process.argv?.includes('--run')) {
  const { passed, total, results } = runRedTeamSuite();
  console.log('Red-team results:', results);
  console.log(`Passed: ${passed}/${total}`);
  process.exit(passed === total ? 0 : 1);
}
