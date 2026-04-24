/**
 * Private Quant Lab — type contracts. Simulation and paper math only; no on-chain execution.
 */

export type QuantMode = 'simulation_only' | 'paper' | 'disabled';
export type QuantRecommendation = 'ignore' | 'watch' | 'simulate' | 'needs_review';
export type QuantRouteType = 'xrpl_amm_vs_clob' | 'xrpl_path' | 'ilp_route_sim' | 'bridge_route_sim';

export interface QuantOpportunity {
  id: string;
  timestamp: number;
  pair: string;
  sourceVenue: string;
  targetVenue: string;
  routeType: QuantRouteType;
  spreadBps: number;
  estimatedFeesBps: number;
  estimatedSlippageBps: number;
  latencyPenaltyBps: number;
  riskPenaltyBps: number;
  effectiveEdgeBps: number;
  confidence: number;
  recommendation: QuantRecommendation;
  /** Always false: no in-app or autonomous execution. */
  executionEnabled: false;
}

export interface QuantAccountingSnapshot {
  simulatedBalanceXRP: number;
  reservedCapitalXRP: number;
  paperPnlXRP: number;
  feesPaidXRP: number;
  failedRoutes: number;
  winningRoutes: number;
  riskBudgetUsedPct: number;
}

export interface QuantStrategyReceipt {
  id: string;
  timestamp: number;
  mode: 'simulation_only';
  opportunityId: string;
  pair: string;
  recommendation: QuantRecommendation;
  executionEnabled: false;
  humanApprovalRequired: true;
  privateKeyAccess: false;
  mainnetExecution: false;
  noCustody: true;
  summary: string;
}

/** Local backtest / paper PnL only; not executed on XRPL. */
export type PaperTradeStatus = 'open' | 'won' | 'lost' | 'expired' | 'cancelled';

export interface PaperTrade {
  id: string;
  timestamp: number;
  opportunityId: string;
  pair: string;
  routeType: QuantRouteType;
  entryEdgeBps: number;
  simulatedSizeXRP: number;
  simulatedFeesXRP: number;
  simulatedPnlXRP: number;
  status: PaperTradeStatus;
  closedAt?: number;
  notes?: string[];
  executionEnabled: false;
  mainnetExecution: false;
}

export interface PaperTradingStats {
  totalTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  expired: number;
  winRatePct: number;
  totalPnlXRP: number;
  totalFeesXRP: number;
  maxDrawdownXRP: number;
  avgPnlXRP: number;
}
