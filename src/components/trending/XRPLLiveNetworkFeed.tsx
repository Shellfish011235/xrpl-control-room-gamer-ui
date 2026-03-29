import { useMemo } from 'react';
import { Activity, Radio, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useXRPLLiveActivity, type LiveActivityItem } from '../../hooks/useXRPLLiveActivity';

function kindColor(k: LiveActivityItem['kind']): string {
  if (k === 'ledger') return 'text-cyan-400';
  if (k === 'payment') return 'text-emerald-400';
  if (k === 'dex') return 'text-amber-400';
  return 'text-slate-400';
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
}

export default function XRPLLiveNetworkFeed() {
  const { connectionState, lastLedgerIndex, lastError, feed, stats, refreshHealth } = useXRPLLiveActivity();

  const statusLine = useMemo(() => {
    if (connectionState === 'connected') {
      return lastLedgerIndex != null ? `Streaming · last ledger #${lastLedgerIndex.toLocaleString()}` : 'Streaming ledger + transactions';
    }
    if (connectionState === 'connecting') return 'Connecting to node…';
    return 'Disconnected — check VITE_XRPL_WS_URL or use public endpoints';
  }, [connectionState, lastLedgerIndex]);

  return (
    <section className="cyber-panel p-4 border-cyber-glow/30 bg-cyan-950/20" aria-label="Live XRPL network activity">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Radio
            size={18}
            className={
              connectionState === 'connected' ? 'text-cyber-glow shrink-0 animate-pulse' : 'text-slate-500 shrink-0'
            }
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="font-cyber text-xs tracking-wider text-cyber-glow">LIVE XRPL NETWORK</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">{statusLine}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {connectionState === 'connected' ? (
            <span className="flex items-center gap-1 text-[10px] font-cyber text-emerald-400">
              <Wifi size={12} /> LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-cyber text-slate-500">
              <WifiOff size={12} /> OFFLINE
            </span>
          )}
          <button
            type="button"
            onClick={refreshHealth}
            className="px-2 py-1 rounded border border-slate-600 text-[10px] text-slate-300 hover:border-cyber-glow hover:text-cyber-glow transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {lastError && connectionState !== 'connected' && (
        <div className="flex items-center gap-2 text-[10px] text-amber-400 mb-3">
          <AlertCircle size={12} />
          {lastError}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-3 text-center">
        <div className="rounded bg-black/30 border border-slate-700/80 py-2 px-1">
          <p className="text-[9px] text-slate-500 font-cyber">60s EVENTS</p>
          <p className="text-sm font-cyber text-white">{stats.total}</p>
        </div>
        <div className="rounded bg-black/30 border border-slate-700/80 py-2 px-1">
          <p className="text-[9px] text-slate-500 font-cyber">PAYMENTS</p>
          <p className="text-sm font-cyber text-emerald-400">{stats.payments}</p>
        </div>
        <div className="rounded bg-black/30 border border-slate-700/80 py-2 px-1">
          <p className="text-[9px] text-slate-500 font-cyber">DEX</p>
          <p className="text-sm font-cyber text-amber-400">{stats.dex}</p>
        </div>
        <div className="rounded bg-black/30 border border-slate-700/80 py-2 px-1">
          <p className="text-[9px] text-slate-500 font-cyber">LEDGERS</p>
          <p className="text-sm font-cyber text-cyan-400">{stats.ledgers}</p>
        </div>
        <div className="rounded bg-black/30 border border-slate-700/80 py-2 px-1">
          <p className="text-[9px] text-slate-500 font-cyber">OTHER TX</p>
          <p className="text-sm font-cyber text-slate-300">{stats.txOther}</p>
        </div>
        <div className="rounded bg-black/30 border border-slate-700/80 py-2 px-1">
          <p className="text-[9px] text-slate-500 font-cyber">UNIQUE SENDERS</p>
          <p className="text-sm font-cyber text-fuchsia-300">{stats.uniqueSenders}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500">
        <Activity size={12} />
        Activity feed (newest first) · read-only
      </div>

      <ul
        className="max-h-52 overflow-y-auto rounded border border-slate-700/60 bg-black/40 divide-y divide-slate-800/80 text-[11px]"
        aria-live="polite"
        aria-relevant="additions"
      >
        {feed.length === 0 ? (
          <li className="px-3 py-6 text-center text-slate-500">
            {connectionState === 'connected'
              ? 'Waiting for ledger closes and transactions…'
              : 'Connect to an XRPL node to see live activity.'}
          </li>
        ) : (
          feed.map((row) => (
            <li key={row.id} className="px-3 py-2 hover:bg-white/[0.03]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-slate-500 tabular-nums shrink-0">{formatTime(row.ts)}</span>
                <span className={`font-cyber text-[9px] uppercase shrink-0 ${kindColor(row.kind)}`}>{row.kind}</span>
                <span className={`text-slate-200 flex-1 min-w-0 ${row.success === false ? 'text-red-400/90' : ''}`}>
                  {row.summary}
                </span>
              </div>
              {row.sub && <p className="text-[10px] text-slate-500 mt-0.5 pl-[4.5rem]">{row.sub}</p>}
              {row.txHash && (
                <p className="text-[9px] text-slate-600 mt-0.5 pl-[4.5rem] font-mono truncate" title={row.txHash}>
                  {row.txHash.slice(0, 12)}…{row.txHash.slice(-8)}
                </p>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
