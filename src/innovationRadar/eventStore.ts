/**
 * In-memory store for recent radar events. Dedupe by id; cap size.
 * Backend: replace with Redis/Postgres for persistence and historical trend analysis.
 */

import type { RadarFeedItem, TrendSignal, InnovationRadarEvent } from './types';

const MAX_ITEMS = 200;
const seenIds = new Set<string>();
const recent: InnovationRadarEvent[] = [];

function dedupeId(ev: InnovationRadarEvent): string {
  if (ev.type === 'RADAR_HEADLINE') return ev.item.id;
  if (ev.type === 'RADAR_TREND') return ev.signal.id;
  if (ev.type === 'RADAR_GITHUB_ACTIVITY') return `gh_${ev.repo}_${ev.activity}`;
  return `tick_${Date.now()}`;
}

export function pushRadarEvent(event: InnovationRadarEvent): boolean {
  const id = dedupeId(event);
  if (seenIds.has(id)) return false;
  seenIds.add(id);
  recent.push(event);
  if (recent.length > MAX_ITEMS) {
    const removed = recent.shift();
    if (removed) seenIds.delete(dedupeId(removed));
  }
  return true;
}

export function getRecentRadarEvents(limit = 50): InnovationRadarEvent[] {
  return recent.slice(-limit).reverse();
}

export function getRecentHeadlines(): Array<RadarFeedItem & { relevanceScore: number }> {
  return recent
    .filter((e): e is InnovationRadarEvent & { type: 'RADAR_HEADLINE' } => e.type === 'RADAR_HEADLINE')
    .map((e) => ({ ...e.item, relevanceScore: e.relevanceScore }))
    .slice(0, 50);
}

export function getRecentSignals(): TrendSignal[] {
  return recent
    .filter((e): e is InnovationRadarEvent & { type: 'RADAR_TREND' } => e.type === 'RADAR_TREND')
    .map((e) => e.signal)
    .slice(0, 30);
}
