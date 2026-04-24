/**
 * Back-compat: RPC/WS from xrplUrlBridge (registered by xrplEndpointManager on init + on failover).
 * Call initXrplEndpointManager() from main before the app tree reads URLs.
 */
import { getPickedRpcUrl, getPickedWsUrl } from '../lib/xrplUrlBridge';
import { isEndpointPoolLocked } from '../services/xrplEndpointManager';
import { DEFAULT_XRPL_PUBLIC_ENDPOINTS } from './xrplPublicEndpoints';

export function getRpcUrl(): string {
  return getPickedRpcUrl();
}

export function getWsUrl(): string {
  return getPickedWsUrl();
}

/** @deprecated use isEndpointPoolLocked — kept for call sites. */
export function isCustomNode(): boolean {
  return isEndpointPoolLocked();
}

export function getPublicRpcFallbacks(): string[] {
  return DEFAULT_XRPL_PUBLIC_ENDPOINTS.map((e) => e.rpc);
}

export function getPublicWsFallbacks(): string[] {
  return DEFAULT_XRPL_PUBLIC_ENDPOINTS.map((e) => e.ws);
}

const env = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env ?? {} : {};
function getE(key: string): string {
  return typeof env[key] === 'string' ? (env[key] as string).trim() : '';
}

/** @deprecated VITE_XRPL_PROXY — prefer endpoint manager. */
export function getProxyUrl(): string {
  return getE('VITE_XRPL_PROXY_URL');
}
