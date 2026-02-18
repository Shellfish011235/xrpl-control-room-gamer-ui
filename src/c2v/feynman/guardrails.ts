/**
 * FEYNMAN guardrails – inference-time policy rules (NeMo Guardrails–style).
 * Flag inconsistencies in explanations without full LLM re-reasoning.
 * Target: <100ms; no single-point LLM dependency for pass/fail.
 */

import type { FeynmanExplainOutput, GuardrailRule } from './types';

export interface GuardrailResult {
  pass: boolean;
  failures: { ruleId: string; reason: string }[];
  latencyMs: number;
}

const POLICY_RULES: GuardrailRule[] = [
  {
    id: 'all-claims-consistent',
    name: 'All verifiable claims must be consistent',
    check: (out) => {
      const unverified = out.claims.filter((c) => c.verified === false);
      if (unverified.length > 0) {
        return { pass: false, reason: `Unverified claims: ${unverified.map((c) => c.id).join(', ')}` };
      }
      return { pass: true };
    },
  },
  {
    id: 'regime-anchor-required',
    name: 'Regime hash must be present for salience anchoring',
    check: (out) => {
      const regimeClaim = out.claims.find((c) => c.kind === 'regimeHashPresent');
      if (!regimeClaim?.verified) return { pass: false, reason: 'Missing or invalid regime summary hash' };
      return { pass: true };
    },
  },
  {
    id: 'slippage-bounded',
    name: 'Slippage must be within 0-10000 bps',
    check: (out) => {
      const slip = out.claims.find((c) => c.kind === 'slippageInBounds');
      if (!slip?.verified) return { pass: false, reason: 'Slippage out of bounds' };
      return { pass: true };
    },
  },
];

/**
 * Run guardrails on FEYNMAN explain output. Fast, rule-based only.
 */
export function runGuardrails(output: FeynmanExplainOutput): GuardrailResult {
  const start = Date.now();
  const failures: { ruleId: string; reason: string }[] = [];

  for (const rule of POLICY_RULES) {
    const result = rule.check(output);
    if (!result.pass) {
      failures.push({ ruleId: rule.id, reason: result.reason ?? rule.name });
    }
  }

  return {
    pass: failures.length === 0,
    failures,
    latencyMs: Date.now() - start,
  };
}
