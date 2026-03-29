/**
 * AI-agent / M2M payment activity panel. Heuristic detection only; confidence scores; no certainty.
 */

import { useState, useEffect } from 'react';
import { Cpu, AlertCircle } from 'lucide-react';
import {
  createAgentState,
  processPaymentForAgents,
  getAgentCandidates,
  type AgentState,
  type AgentWalletProfile,
} from '../../lib/intelligence/aiAgents';
import { onMessage, normalizeTransactionToPayment } from '../../lib/xrpl/wsClient';
import type { TransactionStreamEvent } from '../../lib/xrpl/types';

export default function AIAgentActivityPanel() {
  const [state, setState] = useState<AgentState>(createAgentState());

  useEffect(() => {
    const unsub = onMessage((ev) => {
      if (!ev || ev.type !== 'transaction') return;
      const payment = normalizeTransactionToPayment(ev as TransactionStreamEvent);
      if (!payment) return;
      setState((prev) => processPaymentForAgents(prev, payment));
    });
    return unsub;
  }, []);

  const candidates = getAgentCandidates(state, 25);

  return (
    <div className="cyber-panel rounded-lg border border-cyber-border overflow-hidden">
      <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
        <h3 className="font-cyber text-sm uppercase tracking-wider text-cyber-glow flex items-center gap-2">
          <Cpu size={18} />
          AI-Agent Activity
        </h3>
        <span className="text-[10px] text-cyber-muted flex items-center gap-1" title="Probabilistic; not definitive">
          <AlertCircle size={12} /> Heuristic
        </span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-cyber-muted">
          Possible machine-to-machine or agentic patterns: regular cadence, micro tx bursts, recurring routes. Confidence scores only; may produce false positives.
        </p>
        {candidates.length === 0 ? (
          <p className="text-sm text-cyber-muted">No high-confidence agent-like patterns in current window.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {candidates.map((p) => (
              <li key={p.address} className="rounded border border-cyber-border p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono truncate max-w-[160px]" title={p.address}>{p.address.slice(0, 8)}…{p.address.slice(-6)}</span>
                  <span className="text-cyber-glow">Score: {p.agentLikelihoodScore}</span>
                </div>
                <p className="text-cyber-muted capitalize">{p.probablePatternType.replace(/_/g, ' ')}</p>
                {p.recurringDestinations.length > 0 && (
                  <p className="text-[10px] text-cyber-muted">Recurring: {p.recurringDestinations.length} dests</p>
                )}
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
