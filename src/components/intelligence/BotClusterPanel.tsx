/**
 * Bot / trading cluster detection panel. Heuristic-based; may have false positives.
 */

import { useState, useEffect } from 'react';
import { Bot, AlertTriangle } from 'lucide-react';
import {
  createBotState,
  processPaymentForBots,
  type BotState,
  type BotCluster,
} from '../../lib/intelligence/bots';
import { onMessage, normalizeTransactionToPayment } from '../../lib/xrpl/wsClient';
import type { TransactionStreamEvent } from '../../lib/xrpl/types';

export default function BotClusterPanel() {
  const [state, setState] = useState<BotState>(createBotState());

  useEffect(() => {
    const unsub = onMessage((ev) => {
      if (!ev || ev.type !== 'transaction') return;
      const tx = (ev as TransactionStreamEvent).transaction;
      const txType = tx?.TransactionType;
      let payment = normalizeTransactionToPayment(ev as TransactionStreamEvent);
      if (!payment && tx) {
        payment = { from: tx.Account ?? '', to: '', amountDrops: '0', ledgerIndex: 0, ts: Date.now(), success: true };
      }
      if (payment) setState((prev) => processPaymentForBots(prev, payment, txType));
    });
    return unsub;
  }, []);

  return (
    <div className="cyber-panel rounded-lg border border-cyber-border overflow-hidden">
      <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
        <h3 className="font-cyber text-sm uppercase tracking-wider text-cyber-glow flex items-center gap-2">
          <Bot size={18} />
          Bot / Cluster Detection
        </h3>
        <span className="text-[10px] text-cyber-muted flex items-center gap-1" title="Heuristic; may include false positives">
          <AlertTriangle size={12} /> Heuristic
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-cyber-muted">
          Wallets with high tx count, offer activity, or regular timing. Not definitive.
        </p>
        {state.clusters.length === 0 ? (
          <p className="text-sm text-cyber-muted">No high-likelihood clusters in current window.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {state.clusters.map((c, i) => (
              <li key={i} className="rounded border border-cyber-border p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono truncate max-w-[180px]" title={c.wallets[0]}>{c.wallets[0]}</span>
                  <span className="text-cyber-glow">Score: {c.botLikelihoodScore}</span>
                </div>
                <p className="text-cyber-muted capitalize">{c.pattern}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-cyber-muted">
          Last updated {state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : '—'}
        </p>
      </div>
    </div>
  );
}
