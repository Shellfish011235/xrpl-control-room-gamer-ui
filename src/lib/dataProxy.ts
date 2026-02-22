/**
 * Data proxy — route external API calls through a proxy for cleaner, more accurate data.
 * Use when you run a backend/CORS proxy that caches, normalizes, or validates responses.
 *
 * Env:
 * - VITE_DATA_PROXY_URL  Optional. GET requests to external URLs go through this proxy.
 *   Examples: "https://api.allorigins.win/raw?url=" (CORS) or your backend "https://your-proxy.com/fetch?url="
 * - VITE_XRPL_PROXY_URL  Optional. When set, XRPL JSON-RPC POST requests use this base URL instead of
 *   public Ripple endpoints. Your backend forwards to s2.ripple.com (or similar) for caching/consistency.
 */

const DATA_PROXY_PREFIX = ((): string => {
  try {
    const v =
      typeof import.meta !== 'undefined' &&
      typeof (import.meta as { env?: Record<string, string> }).env?.VITE_DATA_PROXY_URL === 'string'
        ? (import.meta as { env: Record<string, string> }).env.VITE_DATA_PROXY_URL.trim()
        : '';
    if (!v) return '';
    if (v.includes('url=')) return v;
    return v + (v.includes('?') ? '&' : '?') + 'url=';
  } catch {
    return '';
  }
})();

const XRPL_PROXY_BASE = ((): string => {
  try {
    const v =
      typeof import.meta !== 'undefined' &&
      typeof (import.meta as { env?: Record<string, string> }).env?.VITE_XRPL_PROXY_URL === 'string'
        ? (import.meta as { env: Record<string, string> }).env.VITE_XRPL_PROXY_URL.trim().replace(/\/$/, '')
        : '';
    return v;
  } catch {
    return '';
  }
})();

/** Whether a GET proxy is configured (for CORS / cached data). */
export function hasDataProxy(): boolean {
  return DATA_PROXY_PREFIX.length > 0;
}

/** Whether an XRPL-specific proxy is configured (for JSON-RPC). */
export function hasXrplProxy(): boolean {
  return XRPL_PROXY_BASE.length > 0;
}

/**
 * Get the proxy prefix for GET requests (e.g. "https://api.allorigins.win/raw?url=").
 * Empty string if not set.
 */
export function getDataProxyPrefix(): string {
  return DATA_PROXY_PREFIX;
}

/**
 * Get the base URL for XRPL JSON-RPC when using a proxy. Empty if not set.
 * Your backend should accept POST with the same body as Ripple and forward to an XRPL node.
 */
export function getXrplProxyBase(): string {
  return XRPL_PROXY_BASE;
}

/**
 * Fetch a URL, optionally via the data proxy for GET requests.
 * Use for external APIs (CoinGecko, Binance REST, XRPScan, etc.) to get cleaner/cached data and avoid CORS.
 * - GET and no body: if VITE_DATA_PROXY_URL is set, request goes to proxy + encodeURIComponent(url).
 * - POST or with body: direct fetch (most CORS proxies are GET-only; for POST use a backend that forwards).
 */
export async function proxyFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const useProxy = hasDataProxy() && method === 'GET' && !init?.body;
  const target = useProxy ? `${DATA_PROXY_PREFIX}${encodeURIComponent(url)}` : url;
  return fetch(target, init);
}
