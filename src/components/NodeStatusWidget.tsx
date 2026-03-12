/**
 * Node Status widget: connection state, server_state, validated ledger index, peer count, uptime/ledger age.
 * Uses lib/xrplWebsocket and lib/xrplClient (server_info).
 */

import { useState, useEffect, useCallback } from 'react';
import { Server, Wifi, WifiOff } from 'lucide-react';
import {
  getConnectionState,
  getLastLedgerIndex,
  getLastError,
  getConnectionUptimeSeconds,
  onStateChange,
  connect,
} from '../lib/xrplWebsocket';
import { serverInfo, type ServerInfoResult } from '../lib/xrplClient';

const POLL_SERVER_INFO_MS = 12000;

export interface NodeStatusData {
  connected: boolean;
  serverState: string;
  validatedLedgerIndex: number | null;
  peerCount: number | null;
  uptimeSeconds: number;
  ledgerAgeSeconds: number | null;
  error: string | null;
  loading: boolean;
}

function useNodeStatus(): NodeStatusData {
  const [state, setState] = useState<'disconnected' | 'connecting' | 'connected'>(getConnectionState());
  const [ledgerIndex, setLedgerIndex] = useState<number | null>(getLastLedgerIndex());
  const [error, setError] = useState<string | null>(getLastError());
  const [info, setInfo] = useState<ServerInfoResult['info'] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setState(getConnectionState());
    setLedgerIndex(getLastLedgerIndex());
    setError(getLastError());
  }, []);

  useEffect(() => {
    connect();
    const unsub = onStateChange(refresh);
    return () => {
      unsub();
    };
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (state !== 'connected') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchInfo = async () => {
      try {
        const res = await serverInfo();
        if (!cancelled && res?.info) setInfo(res.info);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchInfo();
    const tid = setInterval(fetchInfo, POLL_SERVER_INFO_MS);
    return () => {
      cancelled = true;
      clearInterval(tid);
    };
  }, [state]);

  const validatedLedgerIndex = info?.validated_ledger?.seq ?? ledgerIndex ?? null;
  const peerCount = info?.peers ?? null;
  const ledgerAgeSeconds = info?.validated_ledger?.age ?? null;
  const uptimeSeconds = state === 'connected' ? getConnectionUptimeSeconds() : 0;

  return {
    connected: state === 'connected',
    serverState: info?.server_state ?? (state === 'connected' ? '...' : ''),
    validatedLedgerIndex,
    peerCount,
    uptimeSeconds,
    ledgerAgeSeconds,
    error: error ?? null,
    loading: state === 'connecting' || (state === 'connected' && loading && !info),
  };
}

export default function NodeStatusWidget() {
  const status = useNodeStatus();

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-cyber-border bg-cyber-darker/60 px-3 py-2 min-w-[140px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-cyber-muted font-cyber">Node</span>
        <span
          className={`flex items-center gap-1 text-[10px] font-cyber ${
            status.connected ? 'text-cyber-green' : 'text-cyber-red'
          }`}
          title={status.error ?? undefined}
        >
          {status.connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {status.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {status.loading && (
        <p className="text-xs text-cyber-muted animate-pulse">Connecting...</p>
      )}
      {!status.loading && (
        <>
          {status.serverState && (
            <div className="flex items-center gap-1.5 text-xs text-cyber-text">
              <Server size={12} className="text-cyber-muted shrink-0" />
              <span className="font-mono truncate" title={status.serverState}>
                {status.serverState}
              </span>
            </div>
          )}
          {status.validatedLedgerIndex != null && (
            <p className="text-xs text-cyber-glow font-cyber">
              Ledger #{status.validatedLedgerIndex.toLocaleString()}
            </p>
          )}
          {status.peerCount != null && (
            <p className="text-[10px] text-cyber-muted">Peers: {status.peerCount}</p>
          )}
          {(status.uptimeSeconds > 0 || status.ledgerAgeSeconds != null) && (
            <p className="text-[10px] text-cyber-muted">
              {status.uptimeSeconds > 0 && `Up: ${formatUptime(status.uptimeSeconds)}`}
              {status.uptimeSeconds > 0 && status.ledgerAgeSeconds != null && ' · '}
              {status.ledgerAgeSeconds != null && `Ledger age: ${status.ledgerAgeSeconds}s`}
            </p>
          )}
          {status.error && !status.connected && (
            <p className="text-[10px] text-cyber-red truncate" title={status.error}>
              {status.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}
