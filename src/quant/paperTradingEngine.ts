// Local paper trading simulation only. No on-chain or execution.

import type { PaperTrade, PaperTradingStats, PaperTradeStatus, QuantOpportunity } from './privateQuantTypes';

const DEFAULT_MAX_SIMULATED_SIZE_XRP = 500;
const FEE_FRACTION = 0.0001;
const LOST_DRAWDOWN_FRACTION = 0.002;

function newPaperTradeId(): string {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `paper-${globalThis.crypto.randomUUID()}`;
  }
  return `paper-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Clamps simulated notional. Local simulation only; does not place orders.
 */
export function createPaperTradeFromOpportunity(
  opportunity: QuantOpportunity,
  sizeXRP: number,
  maxSimulatedSizeXRP: number = DEFAULT_MAX_SIMULATED_SIZE_XRP
): PaperTrade {
  const cap = Math.min(maxSimulatedSizeXRP, DEFAULT_MAX_SIMULATED_SIZE_XRP);
  const raw = Math.max(0, sizeXRP);
  const simulatedSizeXRP = Math.min(raw, cap);
  const simulatedFeesXRP = Number((simulatedSizeXRP * FEE_FRACTION).toFixed(6));

  return {
    id: newPaperTradeId(),
    timestamp: Date.now(),
    opportunityId: opportunity.id,
    pair: opportunity.pair,
    routeType: opportunity.routeType,
    entryEdgeBps: opportunity.effectiveEdgeBps,
    simulatedSizeXRP,
    simulatedFeesXRP,
    simulatedPnlXRP: 0,
    status: 'open',
    executionEnabled: false,
    mainnetExecution: false,
  };
}

/**
 * Resolves a closed state with simulated PnL. Local simulation only; no on-chain effect.
 * expired/cancelled: PnL is at most zero (no profit); fee drag is reflected as negative.
 */
export function closePaperTrade(
  trade: PaperTrade,
  outcome: Exclude<PaperTradeStatus, 'open'>
): PaperTrade {
  const { simulatedSizeXRP, simulatedFeesXRP, entryEdgeBps } = trade;
  let simulatedPnlXRP: number;
  if (outcome === 'won') {
    simulatedPnlXRP =
      simulatedSizeXRP * (entryEdgeBps / 10000) - simulatedFeesXRP;
  } else if (outcome === 'lost') {
    simulatedPnlXRP = -1 * simulatedSizeXRP * LOST_DRAWDOWN_FRACTION - simulatedFeesXRP;
  } else {
    simulatedPnlXRP = -simulatedFeesXRP;
  }
  simulatedPnlXRP = Number(simulatedPnlXRP.toFixed(6));
  return {
    ...trade,
    status: outcome,
    simulatedPnlXRP,
    closedAt: Date.now(),
  };
}

const emptyStats: PaperTradingStats = {
  totalTrades: 0,
  openTrades: 0,
  wins: 0,
  losses: 0,
  expired: 0,
  winRatePct: 0,
  totalPnlXRP: 0,
  maxDrawdownXRP: 0,
  totalFeesXRP: 0,
  avgPnlXRP: 0,
};

/**
 * Aggregates metrics from a list of local simulated paper trades.
 */
export function calculatePaperTradingStats(trades: PaperTrade[]): PaperTradingStats {
  if (trades.length === 0) {
    return { ...emptyStats };
  }

  const openTrades = trades.filter((t) => t.status === 'open').length;
  const wins = trades.filter((t) => t.status === 'won').length;
  const losses = trades.filter((t) => t.status === 'lost').length;
  const expired = trades.filter((t) => t.status === 'expired').length;

  const closed = trades
    .filter((t) => t.status !== 'open')
    .sort((a, b) => a.timestamp - b.timestamp);
  const totalPnlXRP = closed.reduce((a, t) => a + t.simulatedPnlXRP, 0);
  const totalFeesXRP = trades.reduce((a, t) => a + t.simulatedFeesXRP, 0);
  const resolved = wins + losses;
  const winRatePct = resolved > 0 ? (wins / resolved) * 100 : 0;
  const avgPnlXRP = closed.length > 0 ? totalPnlXRP / closed.length : 0;

  let cum = 0;
  let peak = 0;
  let maxDrawdownXRP = 0;
  for (const t of closed) {
    cum += t.simulatedPnlXRP;
    if (cum > peak) {
      peak = cum;
    }
    const drawdown = peak - cum;
    if (drawdown > maxDrawdownXRP) {
      maxDrawdownXRP = drawdown;
    }
  }

  return {
    totalTrades: trades.length,
    openTrades,
    wins,
    losses,
    expired,
    winRatePct: Number(winRatePct.toFixed(1)),
    totalPnlXRP: Number(totalPnlXRP.toFixed(6)),
    totalFeesXRP: Number(totalFeesXRP.toFixed(6)),
    maxDrawdownXRP: Number(maxDrawdownXRP.toFixed(6)),
    avgPnlXRP: Number(avgPnlXRP.toFixed(6)),
  };
}
