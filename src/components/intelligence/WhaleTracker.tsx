/**
 * Whale wallet tracker UI: leaderboard, recent transfers, net inflow/outflow.
 */

import { useState, useEffect, useRef } from 'react';
import { Fish, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import {
  createWhaleState,
  processPaymentForWhales,
  type WhaleState,
  DEFAULT_WHALE_THRESHOLD_XRP,
} from '../../lib/intelligence/whales';
import { onMessage, normalizeTransactionToPayment } from '../../lib/xrpl/wsClient';
import type { TransactionStreamEvent } from '../../lib/xrpl/types';

const THRESHOLD_OPTIONS = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];

export default function WhaleTracker() {
  const [state, setState] = useState<WhaleState>(() => createWhaleState(DEFAULT_WHALE_THRESHOLD_XRP));
  const [threshold, setThreshold] = useState(DEFAULT_WHALE_THRESHOLD_XRP);

  useEffect(() => {
    const unsub = onMessage((ev) => {
      if (!ev || ev.type !== 'transaction') return;
      const payment = normalizeTransactionToPayment(ev as TransactionStreamEvent);
      if (!payment) return;
      setState((prev) => processPaymentForWhales(prev, payment));
    });
    return unsub;
  }, []);

  const leaderboard = Array.from(state.wallets.values())
    .filter((w) => w.balanceXrp >= threshold)
    .sort((a, b) => b.balanceXrp - a.balanceXrp)
    .slice(0, 15);
  const recent = state.recentTransfers.slice(0, 20);

  return (
    <div className="cyber-panel rounded-lg border border-cyber-border overflow-hidden">
      <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-cyber text-sm uppercase tracking-wider text-cyber-glow flex items-center gap-2">
          <Fish size={18} />
          Whale Tracker
        </h3>
        <select
          className="bg-cyber-darker border border-cyber-border rounded px-2 py-1 text-xs text-cyber-text"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        >
          {THRESHOLD_OPTIONS.map((x) => (
            <option key={x} value={x}>
              Whale ≥ {(x / 1_000_000).toFixed(1)}M XRP
            </option>
          ))}
        </select>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded border border-cyber-border p-2">
            <p className="text-cyber-muted text-xs uppercase flex items-center gap-1">
              <ArrowDownLeft size={12} /> Net inflow (whales)
            </p>
            <p className="text-cyber-green font-cyber">+{state.netInflowXrp.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP</p>
          </div>
          <div className="rounded border border-cyber-border p-2">
            <p className="text-cyber-muted text-xs uppercase flex items-center gap-1">
              <ArrowUpRight size={12} /> Net outflow (whales)
            </p>
            <p className="text-cyber-red font-cyber">−{state.netOutflowXrp.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP</p>
          </div>
        </div>

        <div>
          <p className="text-cyber-muted text-xs uppercase mb-2">Top wallets (by score)</p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-cyber-muted">Subscribe to transactions stream for live data. No whales in current window.</p>
          ) : (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {leaderboard.map((w) => (
                <li key={w.address} className="flex items-center justify-between text-xs py-1 border-b border-cyber-border/50">
                  <span className="font-mono truncate max-w-[140px]" title={w.address}>{w.address.slice(0, 8)}…{w.address.slice(-6)}</span>
                  <span className="text-cyber-glow">{(w.balanceXrp / 1_000_000).toFixed(2)}M</span>
                  <span className="text-cyber-muted capitalize">{w.categoryGuess}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-cyber-muted text-xs uppercase mb-2">Recent large / whale transfers</p>
          {recent.length === 0 ? (
            <p className="text-sm text-cyber-muted">No recent transfers in window.</p>
          ) : (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {recent.map((t, i) => (
                <li key={i} className="flex items-center justify-between text-xs py-1 border-b border-cyber-border/50">
                  <span className="font-mono truncate max-w-[100px]" title={t.from}>{t.from.slice(0, 6)}…</span>
                  <span className="text-cyber-text">→</span>
                  <span className="font-mono truncate max-w-[100px]" title={t.to}>{t.to.slice(0, 6)}…</span>
                  <span className={t.unusual ? 'text-cyber-yellow' : 'text-cyber-muted'}>
                    {t.amountXrp >= 100_000 ? `${(t.amountXrp / 1_000_000).toFixed(2)}M` : t.amountXrp.toLocaleString(undefined, { maximumFractionDigits: 0 })} XRP
                  </span>
                  {t.unusual && <AlertCircle size={12} className="text-cyber-yellow shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-[10px] text-cyber-muted">
          Last updated {state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : '—'}
        </p>
      </div>
    </div>
  );
}
