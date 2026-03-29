/**
 * Liquidity flow panel: aggregate flows by asset, high-velocity assets, time buckets.
 */

import { useState, useEffect } from 'react';
import { Droplets, TrendingUp } from 'lucide-react';
import {
  createLiquidityState,
  processPaymentForLiquidity,
  getDirectionalFlows,
  type LiquidityState,
} from '../../lib/intelligence/liquidity';
import { onMessage, normalizeTransactionToPayment } from '../../lib/xrpl/wsClient';
import type { TransactionStreamEvent } from '../../lib/xrpl/types';

export default function LiquidityFlowPanel() {
  const [state, setState] = useState<LiquidityState>(createLiquidityState());

  useEffect(() => {
    const unsub = onMessage((ev) => {
      if (!ev || ev.type !== 'transaction') return;
      const payment = normalizeTransactionToPayment(ev as TransactionStreamEvent);
      if (!payment) return;
      setState((prev) => processPaymentForLiquidity(prev, payment));
    });
    return unsub;
  }, []);

  const flows = getDirectionalFlows(state).slice(0, 15);

  return (
    <div className="cyber-panel rounded-lg border border-cyber-border overflow-hidden">
      <div className="px-4 py-3 border-b border-cyber-border">
        <h3 className="font-cyber text-sm uppercase tracking-wider text-cyber-glow flex items-center gap-2">
          <Droplets size={18} />
          Liquidity Flow
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {state.highVelocityAssets.length > 0 && (
          <div>
            <p className="text-cyber-muted text-xs uppercase mb-1 flex items-center gap-1">
              <TrendingUp size={12} /> High velocity
            </p>
            <p className="text-sm text-cyber-text">{state.highVelocityAssets.join(', ')}</p>
          </div>
        )}
        <div>
          <p className="text-cyber-muted text-xs uppercase mb-2">Flow by asset</p>
          {flows.length === 0 ? (
            <p className="text-sm text-cyber-muted">Subscribe to transactions for live flow data.</p>
          ) : (
            <ul className="space-y-1 max-h-56 overflow-y-auto">
              {flows.map((f) => (
                <li key={f.asset + (f.issuer ?? '')} className="flex items-center justify-between text-xs py-1 border-b border-cyber-border/50">
                  <span className="font-mono text-cyber-text">{f.asset}{f.issuer ? ` (${f.issuer.slice(0, 8)}…)` : ''}</span>
                  <span className="text-cyber-muted">{f.txCount} tx</span>
                  <span className="text-cyber-glow">{(f.inflow + f.outflow).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
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
