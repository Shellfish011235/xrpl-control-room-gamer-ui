import { connectToPickedUrl } from '../lib/xrplWebsocket';

/**
 * Rebind WebSocket to current bridge URL after the pool or active index changed.
 */
export function reconnectAfterPoolChange(): void {
  try {
    connectToPickedUrl();
  } catch (e) {
    console.warn('[xrpl:endpoint] reconnect', e);
  }
}
