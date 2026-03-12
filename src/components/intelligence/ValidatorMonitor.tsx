/**
 * Validator and network health panel. Uses lib/intelligence/validators.
 */

import { useState, useEffect, useCallback } from 'react';
import { Server, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchValidatorSnapshot, computeNetworkHealth, type NetworkHealthSummary } from '../../lib/intelligence/validators';
import { getConnectionHealth, connect, onStateChange } from '../../lib/xrpl/wsClient';

const POLL_MS = 12000;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

export default function ValidatorMonitor() {
  const [summary, setSummary] = useState<NetworkHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const connection = getConnectionHealth();
    const node = await fetchValidatorSnapshot();
    const next = computeNetworkHealth(node, connection);
    setSummary(next);
    setLoading(false);
    setError(connection.lastError);
  }, []);

  useEffect(() => {
    connect();
    const unsub = onStateChange(refresh);
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [refresh]);

  const node = summary?.node;
  const conn = summary?.connection;

  return (
    <div className="cyber-panel rounded-lg border border-cyber-border overflow-hidden">
      <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
        <h3 className="font-cyber text-sm uppercase tracking-wider text-cyber-glow flex items-center gap-2">
          <Server size={18} />
          Validator & Network
        </h3>
        {summary?.ok ? (
          <span className="flex items-center gap-1 text-xs text-cyber-green">
            <CheckCircle size={14} /> Healthy
          </span>
        ) : summary?.warning ? (
          <span className="flex items-center gap-1 text-xs text-cyber-yellow" title={summary.warning}>
            <AlertTriangle size={14} /> Warning
          </span>
        ) : null}
      </div>
      <div className="p-4 space-y-3">
        {loading && !node && (
          <div className="flex items-center gap-2 text-cyber-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-glow/30 border-t-cyber-glow" />
            <span className="text-sm">Connecting...</span>
          </div>
        )}
        {error && (
          <p className="text-xs text-cyber-red flex items-center gap-1">
            <WifiOff size={12} /> {error}
          </p>
        )}
        {node && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-cyber-muted text-xs uppercase">Connection</p>
                <p className={conn?.state === 'connected' ? 'text-cyber-green' : 'text-cyber-red'}>
                  {conn?.state === 'connected' ? <Wifi size={14} className="inline mr-1" /> : <WifiOff size={14} className="inline mr-1" />}
                  {conn?.state ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-cyber-muted text-xs uppercase">Server state</p>
                <p className="font-mono text-cyber-text">{node.serverState}</p>
              </div>
              <div>
                <p className="text-cyber-muted text-xs uppercase">Ledger</p>
                <p className="text-cyber-glow font-cyber">#{node.validatedLedgerSeq.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-cyber-muted text-xs uppercase">Ledger age</p>
                <p className="text-cyber-text">{node.validatedLedgerAge}s</p>
              </div>
              <div>
                <p className="text-cyber-muted text-xs uppercase">Peers</p>
                <p className="text-cyber-text">{node.peers}</p>
              </div>
              <div>
                <p className="text-cyber-muted text-xs uppercase">Quorum</p>
                <p className="text-cyber-text">{node.quorum ?? '—'}</p>
              </div>
            </div>
            {node.loadFactor != null && (
              <p className="text-xs text-cyber-muted">Load factor: {node.loadFactor}</p>
            )}
            {summary?.warning && (
              <p className="text-xs text-cyber-yellow border border-cyber-yellow/30 rounded px-2 py-1">
                {summary.warning}
              </p>
            )}
          </>
        )}
        {summary?.lastUpdated && (
          <p className="text-[10px] text-cyber-muted">
            Updated {new Date(summary.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
