/**
 * XRPL node connection config from environment.
 * Use VITE_XRPL_RPC_URL / VITE_XRPL_WS_URL for direct node (e.g. private rippled on LAN).
 * Use VITE_XRPL_PROXY_URL for production when browser cannot reach the node (proxy forwards to node).
 * No secrets; URLs only.
 */

const env = typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env;

function getEnv(key: string): string {
  if (!env || typeof env[key] !== 'string') return '';
  return (env[key] as string).trim().replace(/\/$/, '');
}

const RPC_URL = getEnv('VITE_XRPL_RPC_URL');
const WS_URL = getEnv('VITE_XRPL_WS_URL');
const PROXY_URL = getEnv('VITE_XRPL_PROXY_URL');

const PUBLIC_RPC_FALLBACKS = [
  'https://xrplcluster.com',
  'https://s2.ripple.com:51234',
  'https://s1.ripple.com:51234',
];

const PUBLIC_WS_FALLBACKS = [
  'wss://xrplcluster.com',
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
];

/** HTTP JSON-RPC base URL. Prefer direct RPC, then proxy, then first public fallback. */
export function getRpcUrl(): string {
  if (RPC_URL) return RPC_URL;
  if (PROXY_URL) return PROXY_URL;
  return PUBLIC_RPC_FALLBACKS[0];
}

/** WebSocket URL. Prefer direct WS when set, else first public fallback. */
export function getWsUrl(): string {
  if (WS_URL) return WS_URL;
  return PUBLIC_WS_FALLBACKS[0];
}

/** All public RPC fallbacks (for retry/rotation). */
export function getPublicRpcFallbacks(): string[] {
  return [...PUBLIC_RPC_FALLBACKS];
}

/** All public WS fallbacks (for retry/rotation). */
export function getPublicWsFallbacks(): string[] {
  return [...PUBLIC_WS_FALLBACKS];
}

/** True if using a custom node (private or proxy). */
export function isCustomNode(): boolean {
  return !!(RPC_URL || WS_URL || PROXY_URL);
}
