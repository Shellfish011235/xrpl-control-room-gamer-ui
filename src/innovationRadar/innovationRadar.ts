/**
 * Innovation Radar orchestrator: RSS poller + event store + publish to UI.
 * Modular: RSSPoller emits events; store dedupes; events stream to News & Trends.
 */

import { RSSPoller } from './rssPoller';
import { getRecentRadarEvents, getRecentHeadlines, getRecentSignals } from './eventStore';
import { subscribeToRadar, publishRadarEvent } from './events';
import type { InnovationRadarEvent, RadarFeedItem, TrendSignal } from './types';

let poller: RSSPoller | null = null;

export function startInnovationRadar(): void {
  if (poller) return;
  poller = new RSSPoller();
  poller.start();
}

export function stopInnovationRadar(): void {
  if (poller) {
    poller.stop();
    poller = null;
  }
}

export function getRadarPoller(): RSSPoller | null {
  return poller;
}

export {
  getRecentRadarEvents,
  getRecentHeadlines,
  getRecentSignals,
  subscribeToRadar,
  publishRadarEvent,
};

export type { InnovationRadarEvent, RadarFeedItem, TrendSignal };
