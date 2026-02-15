/**
 * React hook: subscribe to Innovation Radar stream and expose recent events for News & Trends card.
 */

import { useEffect, useState } from 'react';
import {
  startInnovationRadar,
  stopInnovationRadar,
  subscribeToRadar,
  getRecentHeadlines,
  getRecentSignals,
  getRecentRadarEvents,
} from './innovationRadar';
import type { InnovationRadarEvent, RadarFeedItem, TrendSignal } from './types';

export interface UseInnovationRadarOptions {
  autoStart?: boolean;
  maxHeadlines?: number;
  maxSignals?: number;
}

export function useInnovationRadar(options: UseInnovationRadarOptions = {}) {
  const { autoStart = true, maxHeadlines = 20, maxSignals = 10 } = options;
  const [events, setEvents] = useState<InnovationRadarEvent[]>(() => getRecentRadarEvents(30));
  const [headlines, setHeadlines] = useState<Array<RadarFeedItem & { relevanceScore: number }>>(() =>
    getRecentHeadlines().slice(0, maxHeadlines)
  );
  const [signals, setSignals] = useState<TrendSignal[]>(() => getRecentSignals().slice(0, maxSignals));

  useEffect(() => {
    if (autoStart) startInnovationRadar();
    const unsub = subscribeToRadar((ev) => {
      setEvents((prev) => [ev, ...prev].slice(0, 50));
      setHeadlines(getRecentHeadlines().slice(0, maxHeadlines));
      setSignals(getRecentSignals().slice(0, maxSignals));
    });
    return () => {
      unsub();
      if (autoStart) stopInnovationRadar();
    };
  }, [autoStart, maxHeadlines, maxSignals]);

  return {
    events,
    headlines,
    signals,
    refresh: () => {
      setHeadlines(getRecentHeadlines().slice(0, maxHeadlines));
      setSignals(getRecentSignals().slice(0, maxSignals));
      setEvents(getRecentRadarEvents(30));
    },
  };
}
