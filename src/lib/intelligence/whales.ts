/**
 * Whale wallet detection and scoring. Balance thresholds, large transfers, inflow/outflow.
 * Heuristic-based; extensible for graph/ML later.
 */

import type { NormalizedPayment } from '../xrpl/types';

export const DEFAULT_WHALE_THRESHOLD_XRP = 1_000_000;

export interface WhaleWallet {
  address: string;
  balanceXrp: number;
  whaleScore: number;
  categoryGuess: 'exchange' | 'institution' | 'whale' | 'unknown';
  rollingInflowXrp: number;
  rollingOutflowXrp: number;
  lastSeenTs: number;
  transferCount: number;
  largeTransferCount: number;
}

export interface WhaleTransfer {
  from: string;
  to: string;
  amountXrp: number;
  txHash?: string;
  ledgerIndex: number;
  ts: number;
  fromIsWhale: boolean;
  toIsWhale: boolean;
  unusual: boolean;
}

export interface WhaleState {
  wallets: Map<string, WhaleWallet>;
  recentTransfers: WhaleTransfer[];
  netInflowXrp: number;
  netOutflowXrp: number;
  lastUpdated: number;
  thresholdXrp: number;
}

const LARGE_TRANSFER_XRP = 100_000;
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_RECENT_TRANSFERS = 100;

function balanceToScore(xrp: number, thresholdXrp: number): number {
  if (xrp <= 0) return 0;
  const ratio = xrp / Math.max(1, thresholdXrp);
  return Math.min(100, Math.floor(20 * Math.log10(1 + ratio)));
}

function categoryFromBalanceAndActivity(xrp: number, inflow: number, outflow: number): WhaleWallet['categoryGuess'] {
  if (xrp >= 10_000_000 && (inflow + outflow) > 1_000_000) return 'exchange';
  if (xrp >= 5_000_000) return 'institution';
  if (xrp >= 1_000_000) return 'whale';
  return 'unknown';
}

export function createWhaleState(thresholdXrp: number = DEFAULT_WHALE_THRESHOLD_XRP): WhaleState {
  return {
    wallets: new Map(),
    recentTransfers: [],
    netInflowXrp: 0,
    netOutflowXrp: 0,
    lastUpdated: 0,
    thresholdXrp,
  };
}

/** Process a normalized payment and update whale state. */
export function processPaymentForWhales(
  state: WhaleState,
  payment: NormalizedPayment,
  fromBalanceXrp?: number,
  toBalanceXrp?: number
): WhaleState {
  const amountXrp = payment.amountValue ?? parseInt(payment.amountDrops, 10) / 1_000_000;
  if (amountXrp <= 0) return state;

  const now = payment.ts || Date.now();
  const wallets = new Map(state.wallets);
  const recent = [...state.recentTransfers];

  const getOrCreate = (addr: string, balanceXrp: number) => {
    let w = wallets.get(addr);
    if (!w) {
      w = {
        address: addr,
        balanceXrp,
        whaleScore: balanceToScore(balanceXrp, state.thresholdXrp),
        categoryGuess: 'unknown',
        rollingInflowXrp: 0,
        rollingOutflowXrp: 0,
        lastSeenTs: now,
        transferCount: 0,
        largeTransferCount: 0,
      };
      wallets.set(addr, w);
    }
    return w;
  };

  const fromBal = fromBalanceXrp ?? wallets.get(payment.from)?.balanceXrp ?? 0;
  const toBal = toBalanceXrp ?? wallets.get(payment.to)?.balanceXrp ?? 0;

  const fromW = getOrCreate(payment.from, fromBal);
  const toW = getOrCreate(payment.to, toBal);

  fromW.rollingOutflowXrp = pruneRolling(fromW.rollingOutflowXrp, now) + amountXrp;
  fromW.lastSeenTs = now;
  fromW.transferCount += 1;
  if (amountXrp >= LARGE_TRANSFER_XRP) fromW.largeTransferCount += 1;
  fromW.whaleScore = balanceToScore(fromW.balanceXrp, state.thresholdXrp);
  fromW.categoryGuess = categoryFromBalanceAndActivity(fromW.balanceXrp, fromW.rollingInflowXrp, fromW.rollingOutflowXrp);

  toW.rollingInflowXrp = pruneRolling(toW.rollingInflowXrp, now) + amountXrp;
  toW.lastSeenTs = now;
  toW.transferCount += 1;
  if (amountXrp >= LARGE_TRANSFER_XRP) toW.largeTransferCount += 1;
  toW.whaleScore = balanceToScore(toW.balanceXrp, state.thresholdXrp);
  toW.categoryGuess = categoryFromBalanceAndActivity(toW.balanceXrp, toW.rollingInflowXrp, toW.rollingOutflowXrp);

  const fromIsWhale = fromW.whaleScore >= 20;
  const toIsWhale = toW.whaleScore >= 20;
  const unusual = amountXrp >= LARGE_TRANSFER_XRP || (fromIsWhale && toIsWhale);

  recent.unshift({
    from: payment.from,
    to: payment.to,
    amountXrp,
    txHash: payment.txHash,
    ledgerIndex: payment.ledgerIndex,
    ts: now,
    fromIsWhale,
    toIsWhale,
    unusual,
  });
  if (recent.length > MAX_RECENT_TRANSFERS) recent.pop();

  let netInflow = state.netInflowXrp;
  let netOutflow = state.netOutflowXrp;
  if (fromIsWhale) netOutflow += amountXrp;
  if (toIsWhale) netInflow += amountXrp;

  return {
    wallets,
    recentTransfers: recent,
    netInflowXrp: netInflow,
    netOutflowXrp: netOutflow,
    lastUpdated: Date.now(),
    thresholdXrp: state.thresholdXrp,
  };
}

function pruneRolling(value: number, _now: number): number {
  return value * 0.95;
}

/** Update wallet balances from account_info (caller fetches). */
export function updateWhaleBalances(state: WhaleState, address: string, balanceXrp: number): WhaleState {
  const wallets = new Map(state.wallets);
  const w = wallets.get(address);
  if (w) {
    w.balanceXrp = balanceXrp;
    w.whaleScore = balanceToScore(balanceXrp, state.thresholdXrp);
    w.categoryGuess = categoryFromBalanceAndActivity(balanceXrp, w.rollingInflowXrp, w.rollingOutflowXrp);
    wallets.set(address, w);
  } else {
    wallets.set(address, {
      address,
      balanceXrp,
      whaleScore: balanceToScore(balanceXrp, state.thresholdXrp),
      categoryGuess: balanceXrp >= state.thresholdXrp ? 'whale' : 'unknown',
      rollingInflowXrp: 0,
      rollingOutflowXrp: 0,
      lastSeenTs: Date.now(),
      transferCount: 0,
      largeTransferCount: 0,
    });
  }
  return { ...state, wallets, lastUpdated: Date.now() };
}

// TODO: optional account_info polling for top-N balances; wallet reputation persistence; graph clustering.

/** Top whales by balance. */
export function getWhaleLeaderboard(state: WhaleState, limit: number = 20): WhaleWallet[] {
  return Array.from(state.wallets.values())
    .filter((w) => w.whaleScore >= 20)
    .sort((a, b) => b.balanceXrp - a.balanceXrp)
    .slice(0, limit);
}
