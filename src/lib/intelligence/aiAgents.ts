/**
 * AI-agent / machine-to-machine payment detection. Heuristic and probabilistic only.
 * Detects: regular cadence, micro tx bursts, repetitive destinations, small recurring settlements.
 * Clearly labeled as heuristic; confidence scores; no claim of certainty.
 */

import type { NormalizedPayment } from '../xrpl/types';

export interface AgentWalletProfile {
  address: string;
  agentLikelihoodScore: number;
  probablePatternType: 'recurring_settlement' | 'micro_burst' | 'service_routing' | 'unknown';
  frequencyProfile: { avgIntervalMs: number; regularity: number };
  recurringDestinations: string[];
  txCount: number;
  lastActivityTs: number;
}

export interface AgentState {
  profiles: Map<string, AgentWalletProfile>;
  lastUpdated: number;
}

const MICRO_TX_MAX_XRP = 100;
const RECURRING_MIN_COUNT = 3;
const REGULARITY_THRESHOLD = 0.6;

function getOrCreateProfile(map: Map<string, AgentWalletProfile>, address: string): AgentWalletProfile {
  let p = map.get(address);
  if (!p) {
    p = {
      address,
      agentLikelihoodScore: 0,
      probablePatternType: 'unknown',
      frequencyProfile: { avgIntervalMs: 0, regularity: 0 },
      recurringDestinations: [],
      txCount: 0,
      lastActivityTs: 0,
    };
    map.set(address, p);
  }
  return p;
}

export function createAgentState(): AgentState {
  return { profiles: new Map(), lastUpdated: 0 };
}

export function processPaymentForAgents(state: AgentState, payment: NormalizedPayment): AgentState {
  const amountXrp = payment.amountValue ?? parseInt(payment.amountDrops, 10) / 1_000_000;
  const now = payment.ts || Date.now();
  const profiles = new Map(state.profiles);

  const sender = getOrCreateProfile(profiles, payment.from);
  sender.txCount += 1;
  const prevTs = sender.lastActivityTs;
  sender.lastActivityTs = now;
  if (prevTs > 0) {
    const intervals = (sender as { _intervals?: number[] })._intervals ?? [];
    intervals.push(now - prevTs);
    if (intervals.length > 30) intervals.shift();
    (sender as { _intervals: number[] })._intervals = intervals;
    const avg = intervals.reduce((s, i) => s + i, 0) / intervals.length;
    const variance = intervals.reduce((s, i) => s + (i - avg) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / (avg || 1);
    sender.frequencyProfile = { avgIntervalMs: avg, regularity: Math.max(0, 1 - cv) };
  }
  if (payment.to) {
    const dests = (sender as { _dests?: string[] })._dests ?? [];
    dests.push(payment.to);
    if (dests.length > 50) dests.shift();
    (sender as { _dests: string[] })._dests = dests;
    const counts = dests.reduce((acc, d) => ({ ...acc, [d]: (acc[d] ?? 0) + 1 }), {} as Record<string, number>);
    sender.recurringDestinations = Object.entries(counts)
      .filter(([, c]) => c >= RECURRING_MIN_COUNT)
      .map(([d]) => d);
  }
  if (amountXrp > 0 && amountXrp <= MICRO_TX_MAX_XRP) {
    (sender as { _microCount?: number })._microCount = ((sender as { _microCount?: number })._microCount ?? 0) + 1;
  }
  sender.probablePatternType = inferAgentPattern(sender);
  sender.agentLikelihoodScore = scoreAgentLikelihood(sender);
  profiles.set(payment.from, { ...sender });

  return { profiles, lastUpdated: Date.now() };
}

function inferAgentPattern(p: AgentWalletProfile): AgentWalletProfile['probablePatternType'] {
  const microCount = (p as { _microCount?: number })._microCount ?? 0;
  if (p.recurringDestinations.length >= 2 && p.frequencyProfile.regularity > REGULARITY_THRESHOLD) return 'recurring_settlement';
  if (microCount >= 5 && p.txCount <= 20) return 'micro_burst';
  if (p.recurringDestinations.length >= 3) return 'service_routing';
  return 'unknown';
}

function scoreAgentLikelihood(p: AgentWalletProfile): number {
  let score = 0;
  if (p.frequencyProfile.regularity > REGULARITY_THRESHOLD) score += 25;
  if (p.recurringDestinations.length >= 2) score += 20;
  if ((p as { _microCount?: number })._microCount >= 5) score += 15;
  if (p.txCount >= 20 && p.frequencyProfile.avgIntervalMs > 0) score += 15;
  return Math.min(100, score);
}

// TODO: configurable detection rules; wallet interaction graph; recurring route persistence; reduce false positives.

export function getAgentCandidates(state: AgentState, minScore: number = 30): AgentWalletProfile[] {
  return Array.from(state.profiles.values())
    .filter((p) => p.agentLikelihoodScore >= minScore)
    .sort((a, b) => b.agentLikelihoodScore - a.agentLikelihoodScore)
    .slice(0, 25);
}
