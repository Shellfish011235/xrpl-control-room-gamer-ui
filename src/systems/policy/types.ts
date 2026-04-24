import type { PolicyFeatureState, PolicyDecision } from '../../types/operating';

export type { PolicyFeatureState, PolicyDecision } from '../../types/operating';

export interface PolicyContext {
  /** e.g. US, FL, EU when hooked to geo in future */
  regionHint?: string;
  /** from env / build */
  buildEnv: 'development' | 'production' | 'test';
  /** e.g. import.meta.env.VITE_* */
  featureFlags: Record<string, boolean>;
  /** Future: KYC, subscription tier — not used for custody decisions */
  complianceGates?: { legalReview?: 'pending' | 'clear' | 'block' };
}

export type PolicyFeatureId =
  | 'observation_network_map'
  | 'observation_ledger_stream'
  | 'interpretation_ai_summary'
  | 'decision_simulation_dex'
  | 'decision_simulation_ledger'
  | 'act_wallet_sign'
  | 'act_approval_queue'
  | 'agents_orchestra';

export interface PolicyRule {
  id: PolicyFeatureId;
  defaultState: import('../../types/operating').PolicyFeatureState;
  /** If true, global flag can force disabled */
  killSwitch: boolean;
}
