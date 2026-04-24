/**
 * Default public XRPL mainnet access — primary cluster + Ripple node fallback.
 * All URLs are non-secret. Private / LAN nodes use VITE_XRPL_* and optional lock.
 */

export interface XrplEndpointDef {
  id: string;
  /** Short name for status bar, e.g. "XRPLCluster" */
  displayName: string;
  rpc: string;
  ws: string;
}

/** Order = failover order (index 0 first). */
export const DEFAULT_XRPL_PUBLIC_ENDPOINTS: readonly XrplEndpointDef[] = [
  {
    id: 'cluster',
    displayName: 'XRPLCluster',
    rpc: 'https://xrplcluster.com',
    ws: 'wss://xrplcluster.com',
  },
  {
    id: 'ripple',
    displayName: 'Ripple s1',
    rpc: 'https://s1.ripple.com:51234',
    ws: 'wss://s1.ripple.com',
  },
] as const;

export const PUBLIC_KNOWN_RPC = new Set(DEFAULT_XRPL_PUBLIC_ENDPOINTS.map((e) => normalizeBase(e.rpc)));
export const PUBLIC_KNOWN_WS = new Set(DEFAULT_XRPL_PUBLIC_ENDPOINTS.map((e) => normalizeBase(e.ws)));

function normalizeBase(u: string): string {
  return u.replace(/\/$/, '').toLowerCase();
}

/** Heuristic: this URL is one of our public defaults. */
export function isKnownPublicRpc(rpc: string | undefined | null): boolean {
  if (!rpc) return false;
  return PUBLIC_KNOWN_RPC.has(normalizeBase(rpc));
}

export function isKnownPublicWs(ws: string | undefined | null): boolean {
  if (!ws) return false;
  return PUBLIC_KNOWN_WS.has(normalizeBase(ws));
}

/**
 * If both are set and match a known public pair, we still allow public pool rotation
 * (your .env can mirror the primary without locking).
 */
export function isPublicModeEnvPair(rpc: string, ws: string): boolean {
  return isKnownPublicRpc(rpc) && isKnownPublicWs(ws);
}
