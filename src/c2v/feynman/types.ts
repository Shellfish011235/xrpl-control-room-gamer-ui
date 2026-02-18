/**
 * FEYNMAN – Structured explanation types for verifiable claims.
 * Phase 1: Output structured JSON so guardrails and symbolic checks can validate without re-running LLM.
 */

export interface FeynmanClaim {
  id: string;
  statement: string;
  kind: 'amountWithinCap' | 'routeValid' | 'regimeHashPresent' | 'slippageInBounds' | 'noSelfLoop' | 'custom';
  verified?: boolean;
  evidence?: string;
}

export interface FeynmanExplainOutput {
  summary: string;
  complexity: 'simple' | 'moderate' | 'complex';
  claims: FeynmanClaim[];
  timestamp: string;
  modelVersion?: string;
}

export interface GuardrailRule {
  id: string;
  name: string;
  check: (output: FeynmanExplainOutput) => { pass: boolean; reason?: string };
}

export interface EnsembleVoteResult {
  accept: boolean;
  votes: { modelId: string; accept: boolean; confidence?: number }[];
  majorityAccept: boolean;
  latencyMs: number;
}
