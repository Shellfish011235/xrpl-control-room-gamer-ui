/**
 * Central policy resolution — do not hardcode in leaf components; import getPolicy / usePolicyContext.
 * Defaults favor read-only and user approval; "disabled" is for kill-switch or un-reviewed features.
 */
import type { PolicyContext, PolicyFeatureId } from './types';
import type { PolicyDecision } from '../../types/operating';
import { getDefaultPolicyState } from '../../config/operatingPolicy';

const KILL: Record<PolicyFeatureId, boolean> = {
  observation_network_map: false,
  observation_ledger_stream: false,
  interpretation_ai_summary: false,
  decision_simulation_dex: false,
  decision_simulation_ledger: false,
  act_wallet_sign: false,
  act_approval_queue: true,
  agents_orchestra: false,
};

export function isKillSwitchOn(feature: PolicyFeatureId, ctx: PolicyContext): boolean {
  if (ctx.featureFlags[`kill_${feature}`] === true) return true;
  if (ctx.complianceGates?.legalReview === 'block' && isHighRiskFeature(feature)) return true;
  return KILL[feature] ?? false;
}

function isHighRiskFeature(f: PolicyFeatureId): boolean {
  return f.startsWith('act_') || f === 'agents_orchestra';
}

/**
 * Resolves the effective state for a feature. Components should branch on `decision.state` and `decision.ctaEnabled`.
 */
export function resolvePolicy(feature: PolicyFeatureId, ctx: PolicyContext): PolicyDecision {
  if (isKillSwitchOn(feature, ctx)) {
    return {
      featureId: feature,
      state: 'disabled',
      reason: 'Policy or compliance gate',
      ctaEnabled: false,
    };
  }

  const base = getDefaultPolicyState(feature);
  if (ctx.complianceGates?.legalReview === 'pending' && base.state !== 'read_only' && base.state !== 'simulation_only') {
    return {
      featureId: feature,
      state: 'simulation_only',
      reason: 'Review pending; simulation and read-only only',
      ctaEnabled: false,
      blockedByComplianceReview: true,
    };
  }

  return { ...base };
}

export function getBuildPolicyContext(): PolicyContext {
  const buildEnv = import.meta.env.DEV
    ? 'development'
    : import.meta.env.MODE === 'test'
      ? 'test'
      : 'production';

  const featureFlags: Record<string, boolean> = {};

  return { buildEnv, featureFlags, regionHint: (import.meta.env as { VITE_REGION_HINT?: string }).VITE_REGION_HINT };
}
