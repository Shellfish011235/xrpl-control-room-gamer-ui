/**
 * MVP wallet: XRP balance + trust lines (tokens). Loading and error states.
 */

import React from 'react';
import { Wallet, Coins, Loader2, AlertCircle } from 'lucide-react';
import type { XrplTrustLine } from '../hooks/useXrplAccount';

export interface BalanceDashboardProps {
  xrpBalance: string | null;
  tokens: XrplTrustLine[];
  loading: boolean;
  error: string | null;
}

export default function BalanceDashboard({
  xrpBalance,
  tokens,
  loading,
  error,
}: BalanceDashboardProps) {
  if (loading) {
    return (
      <div className="balance-dashboard p-4 rounded-xl border border-cyber-border bg-cyber-darker/50 flex items-center justify-center gap-3 min-h-[120px]">
        <Loader2 size={20} className="text-cyber-glow animate-spin" />
        <span className="text-sm text-cyber-muted">Loading balances…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="balance-dashboard p-4 rounded-xl border border-cyber-red/30 bg-cyber-darker/50 flex items-start gap-3 min-h-[80px]">
        <AlertCircle size={20} className="text-cyber-red shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-cyber-red">Error</p>
          <p className="text-xs text-cyber-muted mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="balance-dashboard p-4 rounded-xl border border-cyber-border bg-cyber-darker/50 space-y-4">
      <h2 className="font-cyber text-sm uppercase tracking-wider text-cyber-cyan flex items-center gap-2">
        <Wallet size={16} />
        Your balances
      </h2>

      <div className="balance-card rounded-lg border border-cyber-border/50 bg-cyber-dark/50 p-3">
        <h3 className="text-xs text-cyber-muted uppercase tracking-wider mb-1">XRP</h3>
        <p className="text-xl font-cyber text-cyber-text">{xrpBalance ?? 'N/A'}</p>
      </div>

      {tokens.length > 0 ? (
        <div className="tokens space-y-2">
          <h3 className="text-xs text-cyber-muted uppercase tracking-wider flex items-center gap-1">
            <Coins size={12} />
            Trust lines
          </h3>
          <div className="grid gap-2">
            {tokens.map((token, i) => (
              <div
                key={`${token.currency}-${token.peer}-${i}`}
                className="token-card rounded-lg border border-cyber-border/50 bg-cyber-dark/50 p-3"
              >
                <p className="text-sm font-medium text-cyber-text">
                  {token.currency}: {token.balance}
                </p>
                <p className="text-[10px] text-cyber-muted font-mono mt-1">
                  from {token.peer.slice(0, 12)}…
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-cyber-muted">No trust lines / tokens yet.</p>
      )}
    </div>
  );
}
