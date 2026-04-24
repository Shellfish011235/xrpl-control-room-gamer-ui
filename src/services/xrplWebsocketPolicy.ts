import { useXrplEndpointStore } from '../store/xrplEndpointStore';
import { getPoolSize } from './endpointPoolRuntime';

/** Called before each WebSocket retry — rotates active endpoint in auto mode. */
export function onBeforeWebsocketRetry(): void {
  useXrplEndpointStore.getState().advanceInAuto(getPoolSize());
}
