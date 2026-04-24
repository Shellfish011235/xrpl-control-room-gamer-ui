/**
 * Pure, client-side quant scoring and mock "TigerBeetle-style" accounting. No I/O, no signing, no ILP real backend.
 */

import type { RankedPath } from '../store/optimizerStore';
import type {
  QuantAccountingSnapshot,
  QuantOpportunity,
  QuantRecommendation,
  QuantRouteType,
  QuantStrategyReceipt,
} from './privateQuantTypes';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Recompute effective edge and recommendation. executionEnabled remains false.
 */
export function scoreQuantOpportunity(input: QuantOpportunity): QuantOpportunity {
  const effectiveEdgeBps = clamp(
    input.spreadBps -
      input.estimatedFeesBps -
      input.estimatedSlippageBps -
      input.latencyPenaltyBps -
      input.riskPenaltyBps,
    -1e6,
    1e6
  );

  let recommendation: QuantRecommendation;
  if (effectiveEdgeBps <= 0) {
    recommendation = 'ignore';
  } else if (input.riskPenaltyBps > 10 || input.estimatedSlippageBps > 10) {
    recommendation = 'needs_review';
  } else if (input.confidence < 60) {
    recommendation = 'watch';
  } else {
    recommendation = 'simulate';
  }

  return {
    ...input,
    effectiveEdgeBps,
    recommendation,
    executionEnabled: false,
  };
}

/**
 * Mock double-entry style snapshot for UI only — not a real TigerBeetle or server ledger.
 */
export function simulateTigerBeetleAccounting(opportunity: QuantOpportunity): QuantAccountingSnapshot {
  const edge = Math.max(0, opportunity.effectiveEdgeBps);
  const base = 1000;
  const paperPnlXRP = Number(((edge / 10_000) * 2.5).toFixed(4));
  const feesPaidXRP = Number((opportunity.estimatedFeesBps / 10_000).toFixed(4));
  const reservedCapitalXRP = Number((5 + opportunity.riskPenaltyBps * 0.1).toFixed(2));
  const win = opportunity.recommendation !== 'ignore' && opportunity.effectiveEdgeBps > 0;
  return {
    simulatedBalanceXRP: Number((base + paperPnlXRP - feesPaidXRP).toFixed(4)),
    reservedCapitalXRP,
    paperPnlXRP,
    feesPaidXRP,
    failedRoutes: opportunity.recommendation === 'ignore' ? 1 : 0,
    winningRoutes: win ? 1 : 0,
    riskBudgetUsedPct: Number(clamp(8 + opportunity.riskPenaltyBps * 0.4 + (100 - opportunity.confidence) * 0.05, 0, 100).toFixed(1)),
  };
}

/**
 * Local strategy audit line for the Quant table — not a chain receipt. executionEnabled / mainnetExecution stay false.
 */
export function generateQuantStrategyReceipt(
  opportunity: QuantOpportunity,
  accounting: QuantAccountingSnapshot
): QuantStrategyReceipt {
  return {
    id: `receipt-${opportunity.id}-${opportunity.timestamp}`,
    timestamp: Date.now(),
    mode: 'simulation_only',
    opportunityId: opportunity.id,
    pair: opportunity.pair,
    recommendation: opportunity.recommendation,
    executionEnabled: false,
    humanApprovalRequired: true,
    privateKeyAccess: false,
    mainnetExecution: false,
    noCustody: true,
    summary: `Simulated ${opportunity.routeType} on ${opportunity.pair}: edge ${opportunity.effectiveEdgeBps.toFixed(1)} bps, ` +
      `rec ${opportunity.recommendation}. Mock paper P&L ${accounting.paperPnlXRP} XRP. No execution; approval required for any real signing.`,
  };
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * One synthetic AMM vs CLOB cross-venue opportunity for local testing.
 */
export function createSampleQuantOpportunity(): QuantOpportunity {
  const spreadBps = randInt(5, 30);
  const id = `sim-opp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = Date.now();

  const base: QuantOpportunity = {
    id,
    timestamp,
    pair: 'XRP/USD',
    sourceVenue: 'XRPL AMM',
    targetVenue: 'XRPL CLOB',
    routeType: 'xrpl_amm_vs_clob' satisfies QuantRouteType,
    spreadBps,
    estimatedFeesBps: 2,
    estimatedSlippageBps: 3,
    latencyPenaltyBps: 1,
    riskPenaltyBps: 2,
    effectiveEdgeBps: 0,
    confidence: randInt(55, 88),
    recommendation: 'ignore',
    executionEnabled: false,
  };

  return scoreQuantOpportunity(base);
}

export interface CreateQuantFromOptimizerPathOptions {
  /** Override generated opportunity id (for tests). */
  opportunityIdOverride?: string;
}

/**
 * Build a {@link QuantOpportunity} from a Liquidity Nexus (optimizer) ranked path.
 * Heuristic / simulation only — not a live trading signal; scores are local UX ordering, not execution instructions.
 */
export function createQuantOpportunityFromRankedPath(
  path: RankedPath,
  _options?: CreateQuantFromOptimizerPathOptions
): QuantOpportunity {
  const { costScore, speedScore, riskScore } = path;
  const routeType: QuantRouteType =
    path.type === 'amm'
      ? 'xrpl_amm_vs_clob'
      : path.type === 'xrpl_native'
        ? 'xrpl_path'
        : 'bridge_route_sim';

  const q = (costScore + speedScore) / 2;
  const spreadBps = clamp(
    Math.round(6 + (q / 100) * 24),
    0,
    30
  );
  const estimatedFeesBps = clamp(Math.round(100 - costScore), 1, 20);
  const estimatedSlippageBps = clamp(Math.round(100 - riskScore), 1, 20);
  const latencyPenaltyBps = clamp(Math.round(100 - speedScore), 0, 10);
  const riskPenaltyBps = clamp(Math.round(100 - riskScore), 0, 15);
  const confidence = clamp(Math.round((costScore + speedScore + riskScore) / 3), 0, 100);

  const id =
    _options?.opportunityIdOverride ??
    `opt-opp-${path.id}-${Date.now()}`;

  const base: QuantOpportunity = {
    id,
    timestamp: Date.now(),
    pair: `${path.source}/${path.dest}`,
    sourceVenue: path.label,
    targetVenue: 'Simulated Best Alternative',
    routeType,
    spreadBps,
    estimatedFeesBps,
    estimatedSlippageBps,
    latencyPenaltyBps,
    riskPenaltyBps,
    effectiveEdgeBps: 0,
    confidence,
    recommendation: 'ignore',
    executionEnabled: false,
  };

  return scoreQuantOpportunity(base);
}
