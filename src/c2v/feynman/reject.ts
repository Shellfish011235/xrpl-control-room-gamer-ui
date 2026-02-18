/**
 * FEYNMAN reject harness – conditions that force rejection regardless of LLM output.
 * Symbolic / rule-based; use with test.ts to evolve FEYNMAN to hybrid deterministic.
 */

import type { PaymentIntentEnvelope } from '../../services/carv/types';
import type { FeynmanExplainOutput } from './types';

export interface RejectResult {
  reject: boolean;
  reason?: string;
  code?: string;
}

/**
 * Deterministic reject conditions. If any is true, PIE is rejected before routing.
 */
export function runReject(pie: PaymentIntentEnvelope, explainOutput: FeynmanExplainOutput): RejectResult {
  if (pie.payer === pie.payee) {
    return { reject: true, reason: 'Self-loop forbidden', code: 'SELF_LOOP_FORBIDDEN' };
  }

  const amount = parseFloat(pie.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return { reject: true, reason: 'Invalid amount', code: 'INVALID_AMOUNT' };
  }

  const slippage = pie.constraints?.slippage_bps;
  if (typeof slippage === 'number' && (slippage < 0 || slippage > 10000)) {
    return { reject: true, reason: 'Slippage out of bounds', code: 'INVALID_SLIPPAGE' };
  }

  const unverifiedCritical = explainOutput.claims.filter(
    (c) => (c.kind === 'regimeHashPresent' || c.kind === 'amountWithinCap') && c.verified === false
  );
  if (unverifiedCritical.length > 0) {
    return {
      reject: true,
      reason: `Critical claims not verified: ${unverifiedCritical.map((c) => c.id).join(', ')}`,
      code: 'EXPLAIN_CLAIM_FAIL',
    };
  }

  return { reject: false };
}
