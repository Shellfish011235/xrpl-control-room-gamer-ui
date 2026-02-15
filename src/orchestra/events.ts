/**
 * Event bus for Orchestra to Control Room UI.
 */

import type { ControlRoomEvent } from './types';

const listeners = new Set<(event: ControlRoomEvent) => void>();

export function publishToControlRoom(event: ControlRoomEvent): void {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error('[Orchestra] listener error:', e);
    }
  });
}

export function subscribeToControlRoom(listener: (event: ControlRoomEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
