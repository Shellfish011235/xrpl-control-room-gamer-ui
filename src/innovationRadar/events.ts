/**
 * Event bus for Innovation Radar → Control Room / News & Trends UI.
 */

import type { InnovationRadarEvent } from './types';

const listeners = new Set<(event: InnovationRadarEvent) => void>();

export function publishRadarEvent(event: InnovationRadarEvent): void {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error('[InnovationRadar] listener error:', e);
    }
  });
}

export function subscribeToRadar(listener: (event: InnovationRadarEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
