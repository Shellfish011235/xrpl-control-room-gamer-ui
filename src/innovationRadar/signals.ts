/**
 * Low-noise signal detection: z-score for spikes, keyword frequency for relevance.
 */

import type { RadarFeedItem, TrendSignal } from './types';
import { TRENDING_KEYWORDS } from './types';

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/** Z-score of value vs historical values (spike if |z| > ~2) */
export function zScore(value: number, history: number[]): number {
  if (history.length === 0) return 0;
  const m = mean(history);
  const s = std(history);
  if (s === 0) return 0;
  return (value - m) / s;
}

/** Normalize text for keyword match */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

/** Count keyword mentions in text; return total relevance 0..1 */
export function keywordRelevance(text: string): { score: number; matched: string[] } {
  const normalized = normalize(text);
  const matched: string[] = [];
  let score = 0;
  for (const kw of TRENDING_KEYWORDS) {
    const re = new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const count = (normalized.match(re) ?? []).length;
    if (count > 0) {
      matched.push(kw);
      score += Math.min(1, count * 0.15); // cap per keyword
    }
  }
  return { score: Math.min(1, score), matched };
}

/** Build a trend signal for a new headline with relevance */
export function signalFromHeadline(
  item: RadarFeedItem,
  relevanceScore: number,
  matchedKeywords: string[]
): TrendSignal {
  return {
    id: `sig_${item.id}_${item.publishedAt}`,
    type: 'relevance_score',
    title: item.title,
    description: item.description ?? item.title,
    relevanceScore,
    payload: { feedItem: item, keywords: matchedKeywords },
    at: Date.now(),
  };
}

/** Detect activity spike: z-score of current count vs history */
export function activitySpikeSignal(
  currentCount: number,
  history: number[],
  label: string
): TrendSignal | null {
  const z = zScore(currentCount, history);
  if (z < 2) return null;
  return {
    id: `spike_${Date.now()}`,
    type: 'activity_spike',
    title: `Activity spike: ${label}`,
    description: `Count ${currentCount} is ${z.toFixed(1)}σ above recent average`,
    relevanceScore: Math.min(1, z / 4),
    payload: { zScore: z, count: currentCount },
    at: Date.now(),
  };
}
