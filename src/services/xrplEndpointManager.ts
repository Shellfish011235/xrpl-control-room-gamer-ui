/**
 * Public/custom XRPL pool, URL registration for JSON-RPC and WebSocket, latency + RPC failover.
 */
import { useXrplEndpointStore } from '../store/xrplEndpointStore';
import { registerXrplUrlPicks } from '../lib/xrplUrlBridge';
import { type XrplEndpointDef, DEFAULT_XRPL_PUBLIC_ENDPOINTS, isPublicModeEnvPair, isKnownPublicRpc, isKnownPublicWs } from '../config/xrplPublicEndpoints';
import { setPoolSize } from './endpointPoolRuntime';
import { reconnectAfterPoolChange } from './reconnectAfterEndpointChange';

const env = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env ?? {} : {};
function getE(key: string): string {
  const v = env[key];
  return typeof v === 'string' ? v.trim().replace(/\/$/, '') : '';
}

const _listeners = new Set<() => void>();
let _pool: XrplEndpointDef[] = [];

function notify() {
  _listeners.forEach((f) => {
    try {
      f();
    } catch {
      /* */
    }
  });
}

function runBuildFromEnv(): { pool: XrplEndpointDef[]; locked: boolean; reason: string } {
  const PROXY = getE('VITE_XRPL_PROXY_URL');
  const rpcEnv = getE('VITE_XRPL_RPC_URL');
  const wsEnv = getE('VITE_XRPL_WS_URL');
  const privateMode = getE('VITE_XRPL_PRIVATE_MODE') === '1' || getE('VITE_XRPL_NO_ROTATION') === '1';

  if (PROXY) {
    return {
      pool: [
        { id: 'proxy', displayName: 'Proxy', rpc: PROXY, ws: wsEnv || 'wss://xrplcluster.com' },
      ],
      locked: true,
      reason: 'proxy',
    };
  }
  if (privateMode && (rpcEnv || wsEnv)) {
    return {
      pool: [
        {
          id: 'user-private',
          displayName: 'Custom (env)',
          rpc: rpcEnv || 'https://xrplcluster.com',
          ws: wsEnv || 'wss://xrplcluster.com',
        },
      ],
      locked: true,
      reason: 'private_mode',
    };
  }
  if (rpcEnv && wsEnv) {
    if (isPublicModeEnvPair(rpcEnv, wsEnv)) {
      return { pool: [...DEFAULT_XRPL_PUBLIC_ENDPOINTS], locked: false, reason: 'public_env' };
    }
    return {
      pool: [
        { id: 'user-custom', displayName: 'Custom (env)', rpc: rpcEnv, ws: wsEnv },
      ],
      locked: true,
      reason: 'custom_pair',
    };
  }
  if (rpcEnv && !wsEnv) {
    if (isKnownPublicRpc(rpcEnv)) {
      return { pool: [...DEFAULT_XRPL_PUBLIC_ENDPOINTS], locked: false, reason: 'public_rpc' };
    }
    const w = rpcEnv.includes('xrplcluster') ? 'wss://xrplcluster.com' : 'wss://s1.ripple.com';
    return { pool: [{ id: 'rpc-only', displayName: 'Custom (RPC only)', rpc: rpcEnv, ws: w }], locked: true, reason: 'rpc_non_public' };
  }
  if (wsEnv && !rpcEnv) {
    if (isKnownPublicWs(wsEnv)) {
      return { pool: [...DEFAULT_XRPL_PUBLIC_ENDPOINTS], locked: false, reason: 'public_ws' };
    }
    return { pool: [{ id: 'ws-only', displayName: 'Custom (WS)', rpc: 'https://xrplcluster.com', ws: wsEnv }], locked: true, reason: 'custom_ws' };
  }
  return { pool: [...DEFAULT_XRPL_PUBLIC_ENDPOINTS], locked: false, reason: 'default_public' };
}

function getCurrentFromPool(): XrplEndpointDef {
  const pool = getEndpointPool();
  if (!pool.length) return DEFAULT_XRPL_PUBLIC_ENDPOINTS[0]!;
  const s = useXrplEndpointStore.getState();
  if (s.mode === 'manual') {
    return pool[Math.max(0, Math.min(s.manualIndex, pool.length - 1))] ?? pool[0]!;
  }
  return pool[Math.max(0, Math.min(s.activeIndex, pool.length - 1))] ?? pool[0]!;
}

export function syncUrlPicksToBridge(): void {
  registerXrplUrlPicks(
    () => getCurrentFromPool().ws,
    () => getCurrentFromPool().rpc
  );
}

export function initXrplEndpointManager(): void {
  const { pool, locked } = runBuildFromEnv();
  _pool = pool;
  setPoolSize(pool.length);
  const st = useXrplEndpointStore.getState();
  st.setLocked(locked);
  if (st.activeIndex >= pool.length) st.setActiveIndex(0);
  if (st.manualIndex >= pool.length) st.setManualIndex(0);
  syncUrlPicksToBridge();
  notify();
}

export function getEndpointPool(): readonly XrplEndpointDef[] {
  if (_pool.length) return _pool;
  return DEFAULT_XRPL_PUBLIC_ENDPOINTS;
}

export function isEndpointPoolLocked(): boolean {
  if (getE('VITE_XRPL_PROXY_URL')) return true;
  return useXrplEndpointStore.getState().locked;
}

export function isRotationUnlocked(): boolean {
  if (isEndpointPoolLocked()) return false;
  return getEndpointPool().length > 1;
}

export function getSourceLabel(): string {
  return getCurrentFromPool().displayName;
}

export function advanceOnRpcFailure(): void {
  if (!isRotationUnlocked() || useXrplEndpointStore.getState().mode === 'manual') {
    return;
  }
  useXrplEndpointStore.getState().advanceInAuto(getEndpointPool().length);
  syncUrlPicksToBridge();
  reconnectAfterPoolChange();
  notify();
}

/** After changing manual / auto in UI (pool unchanged). */
export function applyUserEndpointChoice(): void {
  const st = useXrplEndpointStore.getState();
  if (st.mode === 'manual' && st.manualIndex < getEndpointPool().length) {
    st.setActiveIndex(st.manualIndex);
  }
  syncUrlPicksToBridge();
  reconnectAfterPoolChange();
  notify();
}

export async function measureCurrentLatency(): Promise<number | null> {
  const pick = getCurrentFromPool();
  const t0 = performance.now();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(pick.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'server_info', params: [{}] }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) {
      useXrplEndpointStore.getState().setLastError(`HTTP ${res.status}`);
      useXrplEndpointStore.getState().setLatency(null);
      return null;
    }
    const ms = Math.round(performance.now() - t0);
    useXrplEndpointStore.getState().setLatency(ms);
    useXrplEndpointStore.getState().setLastError(null);
    return ms;
  } catch (e) {
    clearTimeout(tid);
    const msg = e instanceof Error ? e.message : String(e);
    useXrplEndpointStore.getState().setLastError(msg);
    useXrplEndpointStore.getState().setLatency(null);
    return null;
  }
}

let latencyTimer: ReturnType<typeof setInterval> | null = null;

export function startLatencyLoop(intervalMs = 20_000): void {
  if (latencyTimer) return;
  void measureCurrentLatency();
  latencyTimer = setInterval(() => {
    void measureCurrentLatency();
  }, intervalMs);
}

export function subscribeEndpoint(b: () => void): () => void {
  _listeners.add(b);
  return () => {
    _listeners.delete(b);
  };
}
