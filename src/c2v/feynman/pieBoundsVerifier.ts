/**
 * PIE bounds verifier – counter-check maxSlippage, riskFlags, max_fee for coherence.
 * Use a fine-tuned smaller model (e.g. distilled Llama) or rule engine. Target: <100ms.
 * Reduces single-point failure when main LLM produces PIE.
 */

import type { PaymentIntentEnvelope, PIEConstraints } from '../../services/carv/types';

export interface BoundsVerifierResult {
  coherent: boolean;
  issues: string[];
  latencyMs: number;
}

const MAX_SLIPPAGE_BPS = 10000;
const MAX_FEE_STRING_LENGTH = 50;

/**
 * Rule-based coherence check. Replace with small model inference for richer checks.
 */
export async function verifyPIEBounds(pie: PaymentIntentEnvelope): Promise<BoundsVerifierResult> {
  const start = Date.now();
  const issues: string[] = [];

  const c = pie.constraints;
  if (!c) {
    issues.push('Missing constraints');
    return { coherent: issues.length === 0, issues, latencyMs: Date.now() - start };
  }

  if (typeof c.slippage_bps !== 'number' || c.slippage_bps < 0 || c.slippage_bps > MAX_SLIPPAGE_BPS) {
    issues.push(`slippage_bps must be in [0, ${MAX_SLIPPAGE_BPS}]`);
  }

  if (typeof c.max_fee !== 'string' || c.max_fee.length > MAX_FEE_STRING_LENGTH) {
    issues.push('max_fee must be a string within length limit');
  }

  const amount = parseFloat(pie.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    issues.push('amount must be a positive number');
  }

  // TODO: Fine-tuned small model (e.g. distilled Llama) to check riskFlags vs amount/venue
  // const modelCheck = await smallModel.checkCoherence(pie);

  return {
    coherent: issues.length === 0,
    issues,
    latencyMs: Date.now() - start,
  };
}
