/**
 * MVP Wallet – address lookup, XRP + trust lines, real-time updates.
 * Read-only; no seeds. Testnet default.
 */

import React, { useState } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BalanceDashboard from '../components/BalanceDashboard';
import ControlRoomSendReceive from '../components/ControlRoomSendReceive';
import { useXrplAccount } from '../hooks/useXrplAccount';

function isValidAddress(val: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(val.trim());
}

export default function MvpWalletPage() {
  const [address, setAddress] = useState('');
  const [useTestnet, setUseTestnet] = useState(true);
  const trimmed = address.trim();
  const { xrpBalance, tokens, error, loading } = useXrplAccount(
    trimmed || undefined,
    useTestnet
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3 border-b border-cyber-border pb-2">
          <Wallet size={22} className="text-cyber-glow" />
          <h1 className="font-cyber text-lg font-bold uppercase tracking-wider text-cyber-text">
            MVP Wallet
          </h1>
        </div>
        <p className="text-sm text-cyber-muted">
          Enter an XRPL address to view XRP balance and trust lines. Real-time updates when the account changes. Read-only; no seeds.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter XRPL address (r...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-cyber-border bg-cyber-darker text-cyber-text placeholder:text-cyber-muted focus:border-cyber-glow/50 focus:outline-none font-mono text-sm"
            aria-invalid={trimmed.length > 0 && !isValidAddress(trimmed)}
          />
          <button
            type="button"
            onClick={() => setUseTestnet(!useTestnet)}
            className="shrink-0 px-4 py-2 rounded-lg border border-cyber-border bg-cyber-darker text-cyber-text hover:bg-cyber-glow/10 hover:border-cyber-glow/30 transition-colors text-sm font-cyber"
          >
            {useTestnet ? 'Testnet' : 'Mainnet'}
          </button>
        </div>

        {trimmed.length > 0 && !isValidAddress(trimmed) && (
          <p className="text-xs text-cyber-red">Invalid address format (expected r...).</p>
        )}

        <ControlRoomSendReceive />

        {trimmed && isValidAddress(trimmed) && (
          <BalanceDashboard
            xrpBalance={xrpBalance}
            tokens={tokens}
            loading={loading}
            error={error}
          />
        )}

        {!trimmed && (
          <p className="text-sm text-cyber-muted">Enter an address to view balances.</p>
        )}

        <div className="pt-4 border-t border-cyber-border">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-glow transition-colors"
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
