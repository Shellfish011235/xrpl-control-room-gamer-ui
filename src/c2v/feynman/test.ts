/**
 * FEYNMAN test harness – symbolic checks that must pass for explanation to be accepted.
 * Used with symbolic.ts; can be driven by Z3 or other SMT solver for full formal verification.
 */

import type { FeynmanExplainOutput } from './types';
import { runSymbolicChecks } from './symbolic';
import type { PaymentIntentEnvelope } from '../../services/carv/types';

export interface TestResult {
  passed: boolean;
  symbolic: ReturnType<typeof runSymbolicChecks>;
  timestamp: string;
}

/**
 * Run test-path checks: PIE + explain output must satisfy symbolic invariants.
 */
export function runTest(pie: PaymentIntentEnvelope, explainOutput: FeynmanExplainOutput): TestResult {
  const symbolic = runSymbolicChecks(pie, explainOutput);
  return {
    passed: symbolic.pass,
    symbolic,
    timestamp: new Date().toISOString(),
  };
}
