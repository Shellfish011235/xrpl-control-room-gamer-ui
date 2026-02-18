/**
 * FEYNMAN symbolic validation – rule-based / Z3-style checks.
 * Verify explanation logic against formal specs. Catches adversarial inputs LLMs might miss.
 * Evolves FEYNMAN from probabilistic to hybrid deterministic.
 *
 * Implementation tip: For full SMT, use a TypeScript Z3 port or export constraints to Z3;
 * here we use pure TS predicates as a lightweight stand-in.
 */

import type { FeynmanExplainOutput } from './types';
import type { PaymentIntentEnvelope, PIEConstraints } from '../../services/carv/types';

export interface SymbolicCheckResult {
  pass: boolean;
  checks: { name: string; pass: boolean; detail?: string }[];
  latencyMs: number;
}

/** Formal bounds (align with docs/invariants.md) */
const INVARIANTS = {
  maxSlippageBps: 10000,
  minAmount: 0,
  maxFeeDigits: 20,
};

function checkAmount(pie: PaymentIntentEnvelope): { pass: boolean; detail?: string } {
  const a = parseFloat(pie.amount);
  if (Number.isNaN(a)) return { pass: false, detail: 'amount is NaN' };
  if (a <= INVARIANTS.minAmount) return { pass: false, detail: 'amount must be > 0' };
  return { pass: true };
}

function checkSlippage(constraints: PIEConstraints): { pass: boolean; detail?: string } {
  const bps = constraints.slippage_bps;
  if (typeof bps !== 'number') return { pass: false, detail: 'slippage_bps missing' };
  if (bps < 0 || bps > INVARIANTS.maxSlippageBps)
    return { pass: false, detail: `slippage_bps must be in [0, ${INVARIANTS.maxSlippageBps}]` };
  return { pass: true };
}

function checkExplainClaims(output: FeynmanExplainOutput): { pass: boolean; detail?: string } {
  const critical = output.claims.filter(
    (c) => c.kind === 'amountWithinCap' || c.kind === 'regimeHashPresent' || c.kind === 'slippageInBounds'
  );
  const allVerified = critical.every((c) => c.verified === true);
  if (!allVerified)
    return {
      pass: false,
      detail: `Critical claims not verified: ${critical.filter((c) => !c.verified).map((c) => c.id).join(', ')}`,
    };
  return { pass: true };
}

/**
 * Run symbolic checks on PIE + FEYNMAN output. Deterministic; no LLM.
 */
export function runSymbolicChecks(
  pie: PaymentIntentEnvelope,
  explainOutput: FeynmanExplainOutput
): SymbolicCheckResult {
  const start = Date.now();
  const checks: { name: string; pass: boolean; detail?: string }[] = [];

  checks.push({ name: 'amount', ...checkAmount(pie) });
  checks.push({ name: 'slippage', ...checkSlippage(pie.constraints) });
  checks.push({ name: 'explain-claims', ...checkExplainClaims(explainOutput) });

  const pass = checks.every((c) => c.pass);
  return {
    pass,
    checks,
    latencyMs: Date.now() - start,
  };
}
