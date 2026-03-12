/**
 * Bot / trading cluster detection: patterned txs, offer cycles, timing regularity, burst behavior.
 * Heuristic-based; extensible for graph clustering and ML.
 */

import type { NormalizedPayment } from '../xrpl/types';

export interface WalletActivity {
  address: string;
  txCount: number;
  lastTxTs: number;
  intervals: number[];
  burstCount: number;
  offerLikeCount: number;
}

export interface BotCluster {
  wallets: string[];
  botLikelihoodScore: number;
  pattern: 'arbitrage' | 'market_maker' | 'recurring_interval' | 'burst' | 'unknown';
  lastActivityTs: number;
}

export interface BotState {
  walletActivity: Map<string, WalletActivity>;
  clusters: BotCluster[];
  lastUpdated: number;
}

const BURST_WINDOW_MS = 3000;
const BURST_MIN_TX = 5;
const INTERVAL_TOLERANCE_MS = 5000;
const MAX_INTERVALS = 50;

function getOrCreateActivity(map: Map<string, WalletActivity>, address: string): WalletActivity {
  let a = map.get(address);
  if (!a) {
    a = { address, txCount: 0, lastTxTs: 0, intervals: [], burstCount: 0, offerLikeCount: 0 };
    map.set(address, a);
  }
  return a;
}

export function createBotState(): BotState {
  return {
    walletActivity: new Map(),
    clusters: [],
    lastUpdated: 0,
  };
}

export function processPaymentForBots(state: BotState, payment: NormalizedPayment, txType?: string): BotState {
  const now = payment.ts || Date.now();
  const walletActivity = new Map(state.walletActivity);

  for (const addr of [payment.from, payment.to]) {
    if (!addr) continue;
    const a = getOrCreateActivity(walletActivity, addr);
    const prevTs = a.lastTxTs;
    a.txCount += 1;
    a.lastTxTs = now;
    if (prevTs > 0) {
      const interval = (now - prevTs) / 1000;
      a.intervals.push(interval);
      if (a.intervals.length > MAX_INTERVALS) a.intervals.shift();
    }
    if (txType === 'OfferCreate' || txType === 'OfferCancel') a.offerLikeCount += 1;
    walletActivity.set(addr, { ...a });
  }

  const clusters = computeClusters(walletActivity);
  return {
    walletActivity,
    clusters,
    lastUpdated: Date.now(),
  };
}

function computeClusters(walletActivity: Map<string, WalletActivity>): BotCluster[] {
  const clusters: BotCluster[] = [];
  for (const [addr, a] of walletActivity.entries()) {
    if (a.txCount < 5) continue;
    const score = scoreBotLikelihood(a);
    if (score >= 30) {
      const pattern = inferPattern(a);
      clusters.push({
        wallets: [addr],
        botLikelihoodScore: score,
        pattern,
        lastActivityTs: a.lastTxTs,
      });
    }
  }
  return clusters.sort((x, y) => y.botLikelihoodScore - x.botLikelihoodScore).slice(0, 20);
}

function scoreBotLikelihood(a: WalletActivity): number {
  let score = 0;
  if (a.txCount >= 50) score += 25;
  else if (a.txCount >= 20) score += 15;
  else if (a.txCount >= 10) score += 5;
  if (a.offerLikeCount >= 10) score += 20;
  else if (a.offerLikeCount >= 5) score += 10;
  if (a.burstCount >= 3) score += 15;
  const regularity = intervalRegularity(a.intervals);
  if (regularity > 0.7) score += 20;
  else if (regularity > 0.4) score += 10;
  return Math.min(100, score);
}

function intervalRegularity(intervals: number[]): number {
  if (intervals.length < 3) return 0;
  const mean = intervals.reduce((s, i) => s + i, 0) / intervals.length;
  const variance = intervals.reduce((s, i) => s + (i - mean) ** 2, 0) / intervals.length;
  const std = Math.sqrt(variance);
  if (mean <= 0) return 0;
  const cv = std / mean;
  return Math.max(0, 1 - cv);
}

function inferPattern(a: WalletActivity): BotCluster['pattern'] {
  if (a.offerLikeCount >= a.txCount * 0.5) return 'market_maker';
  if (intervalRegularity(a.intervals) > 0.6) return 'recurring_interval';
  if (a.burstCount >= 2) return 'burst';
  return 'unknown';
}

// TODO: multi-wallet cluster grouping; anomaly detection; ML-based scoring; persistent indexing.

export function recordBurst(state: BotState, address: string, count: number): BotState {
  const walletActivity = new Map(state.walletActivity);
  const a = getOrCreateActivity(walletActivity, address);
  if (count >= BURST_MIN_TX) a.burstCount += 1;
  walletActivity.set(address, { ...a });
  const clusters = computeClusters(walletActivity);
  return { ...state, walletActivity, clusters, lastUpdated: Date.now() };
}
