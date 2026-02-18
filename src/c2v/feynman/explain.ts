/**
 * FEYNMAN explain – output structured JSON with verifiable claims.
 * Pipe output to guardrails (guardrails.ts) and ensemble voter (ensemble.ts).
 * Phase 1 target: <100ms added overhead; cut hallucination bypass by 50%.
 */

import type { FeynmanExplainOutput, FeynmanClaim } from './types';
import type { PaymentIntentEnvelope } from '../../services/carv/types';

const FEYNMAN_VERSION = '1.0.0';

/**
 * Build verifiable claims from a PIE and optional LLM/natural-language summary.
 * In production: replace or augment with real LLM call; keep claims structured for symbolic checks.
 */
export function buildStructuredExplain(
  pie: PaymentIntentEnvelope,
  naturalLanguageSummary?: string
): FeynmanExplainOutput {
  const amount = parseFloat(pie.amount);
  const claims: FeynmanClaim[] = [
    {
      id: 'amount-positive',
      statement: `amount ${amount} > 0`,
      kind: 'amountWithinCap',
      verified: amount > 0,
      evidence: pie.amount,
    },
    {
      id: 'regime-hash',
      statement: 'regime summary hash present',
      kind: 'regimeHashPresent',
      verified: !!(pie.proofs?.regime_summary_hash && pie.proofs.regime_summary_hash !== '0xnone'),
      evidence: pie.proofs?.regime_summary_hash ?? 'missing',
    },
    {
      id: 'no-self-loop',
      statement: 'payer !== payee',
      kind: 'noSelfLoop',
      verified: pie.payer !== pie.payee,
      evidence: `${pie.payer} → ${pie.payee}`,
    },
    {
      id: 'slippage-bounds',
      statement: `slippage_bps ${pie.constraints?.slippage_bps ?? 0} in [0, 10000]`,
      kind: 'slippageInBounds',
      verified:
        typeof pie.constraints?.slippage_bps === 'number' &&
        pie.constraints.slippage_bps >= 0 &&
        pie.constraints.slippage_bps <= 10000,
      evidence: String(pie.constraints?.slippage_bps ?? 'missing'),
    },
  ];

  const complexity: FeynmanExplainOutput['complexity'] =
    claims.filter((c) => c.verified === false).length > 1 ? 'complex' : claims.length > 3 ? 'moderate' : 'simple';

  return {
    summary: naturalLanguageSummary ?? `PIE ${pie.intent_id}: ${pie.amount} ${pie.asset} to ${pie.payee}`,
    complexity,
    claims,
    timestamp: new Date().toISOString(),
    modelVersion: FEYNMAN_VERSION,
  };
}

/**
 * Async variant for when explanation comes from an LLM API.
 * Return structured output that includes LLM-derived claims + rule-derived claims.
 */
export async function explainPIE(
  pie: PaymentIntentEnvelope,
  options?: { llmSummary?: string; maxLatencyMs?: number }
): Promise<FeynmanExplainOutput> {
  const maxLatencyMs = options?.maxLatencyMs ?? 100;
  const start = Date.now();
  const out = buildStructuredExplain(pie, options?.llmSummary);
  const elapsed = Date.now() - start;
  if (elapsed > maxLatencyMs) {
    console.warn(`[FEYNMAN] explain exceeded ${maxLatencyMs}ms (${elapsed}ms)`);
  }
  return out;
}
