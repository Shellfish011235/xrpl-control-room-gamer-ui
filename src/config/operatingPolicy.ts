/**
 * Default feature policy (non-secret). Override via resolvePolicy() + env.
 */
import type { PolicyFeatureState, PolicyDecision } from '../types/operating';
import type { PolicyFeatureId } from '../systems/policy/types';

const S = (id: PolicyFeatureId, state: PolicyFeatureState, reason?: string): PolicyDecision => ({
  featureId: id,
  state,
  ctaEnabled: state === 'approval_required' || state === 'simulation_only' || state === 'read_only',
  reason,
});

const registry: Record<PolicyFeatureId, PolicyDecision> = {
  observation_network_map: S('observation_network_map', 'read_only'),
  observation_ledger_stream: S('observation_ledger_stream', 'read_only'),
  interpretation_ai_summary: S('interpretation_ai_summary', 'read_only', 'Interpretation is informational, not investment advice'),
  decision_simulation_dex: S('decision_simulation_dex', 'simulation_only', 'Preview and simulation only; execution requires your wallet'),
  decision_simulation_ledger: S('decision_simulation_ledger', 'simulation_only'),
  act_wallet_sign: S('act_wallet_sign', 'approval_required', 'All transactions require your explicit review and signature in your wallet'),
  act_approval_queue: S('act_approval_queue', 'disabled', 'Not enabled in this build'),
  agents_orchestra: S('agents_orchestra', 'read_only', 'Analysis only; no autonomous signing'),
};

export function getDefaultPolicyState(id: PolicyFeatureId): PolicyDecision {
  return { ...registry[id] };
}

export function allFeatureDefaults(): Readonly<typeof registry> {
  return registry;
}
