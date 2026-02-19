// OpenClaw Dashboard
// Shows transaction history for the fee wallet. Platform fee is OFF by default (compliant); enable only after legal sign-off.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Zap, Users, Activity,
  ExternalLink, Copy, Check,
  Layers, Code, RefreshCw, Send
} from 'lucide-react';
import { PLATFORM_FEE_DISABLED } from '../../integrations/openclaw/OpenClawXRPL';
import { getIncomingPayments } from '../../services/xrplService';
import { useAgentPanelStore } from '../../store/agentPanelStore';

// =============================================================================
// TYPES
// =============================================================================

interface RealTransaction {
  hash: string;
  from: string;
  amount: number;
  timestamp: number;
  memo?: string;
}

interface RevenueStats {
  totalRevenue: number;
  todayRevenue: number;
  uniqueSenders: number;
  totalTransactions: number;
}

// =============================================================================
// DASHBOARD COMPONENT - REAL XRPL MAINNET DATA ONLY
// =============================================================================

export function OpenClawDashboard() {
  const setAgentOpen = useAgentPanelStore((s) => s.setOpen);
  const setPendingPrompt = useAgentPanelStore((s) => s.setPendingSecureAgentPrompt);
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    uniqueSenders: 0,
    totalTransactions: 0,
  });
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const PLATFORM_WALLET = 'ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64';

  // Fetch real incoming payments from XRPL (shared xrplService with endpoint fallback)
  const fetchRealData = useCallback(async () => {
    setLoading(true);
    try {
      const incoming = await getIncomingPayments(PLATFORM_WALLET, 50);
      const realTxs: RealTransaction[] = incoming.map((t) => ({
        hash: t.hash,
        from: t.from,
        amount: t.amount,
        timestamp: t.timestamp,
        memo: t.memo || undefined,
      }));

      setTransactions(realTxs);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const todayTxs = realTxs.filter((tx) => tx.timestamp >= todayMs);
      const uniqueSenders = new Set(realTxs.map((tx) => tx.from)).size;
      const totalRevenue = realTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const todayRevenue = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);

      setStats({
        totalRevenue,
        todayRevenue,
        uniqueSenders,
        totalTransactions: realTxs.length,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[OpenClaw] Failed to fetch XRPL data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real data on mount and every 15 seconds (live updates)
  useEffect(() => {
    fetchRealData();
    const interval = setInterval(fetchRealData, 15000);
    return () => clearInterval(interval);
  }, [fetchRealData]);

  const copyWallet = () => {
    navigator.clipboard.writeText(PLATFORM_WALLET);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };
  
  const shortenAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Unknown';

  // ==========================================================================
  // RENDER - 100% REAL XRPL MAINNET DATA
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-xl border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-cyber-border bg-gradient-to-r from-green-500/15 to-cyber-cyan/15">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/90 shrink-0">
              <Bot size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-cyber text-cyber-text text-sm tracking-wide">XRPL CONTROL ROOM</h2>
              <p className="text-[10px] font-medium mt-0.5 truncate">
                {PLATFORM_FEE_DISABLED ? 'Platform fee off (compliant default)' : 'Mainnet · Real XRP'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchRealData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-darker/80 border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan/50 transition-colors shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs">{loading ? 'Refreshing' : 'Refresh'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-darker/60 border border-cyber-border/80">
          <span className="text-[10px] text-cyber-muted uppercase tracking-wider shrink-0">
            {PLATFORM_FEE_DISABLED ? 'Fee wallet (disabled)' : 'Platform fee wallet'}
          </span>
          <code className="text-xs text-cyber-cyan flex-1 truncate font-mono">{PLATFORM_WALLET}</code>
          <button onClick={copyWallet} className="p-1.5 rounded-md hover:bg-cyber-cyan/20 text-cyber-muted hover:text-cyber-cyan transition-colors shrink-0">
            {copiedWallet ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        {lastUpdate && (
          <p className="text-[9px] text-cyber-muted mt-3">
            Updated {lastUpdate.toLocaleTimeString()} · auto-refresh 15s
          </p>
        )}
      </div>

      {/* Body: consistent padding and spacing */}
      <div className="p-5 space-y-5">
        {/* Status card */}
        <div className={`p-4 rounded-xl border ${PLATFORM_FEE_DISABLED ? 'bg-cyber-darker/50 border-cyber-border' : 'bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-500/40'}`}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className={`text-xs font-cyber uppercase tracking-wider ${PLATFORM_FEE_DISABLED ? 'text-cyber-muted' : 'text-green-400'}`}>
              {PLATFORM_FEE_DISABLED ? 'Platform fee off' : 'Platform fee active'}
            </span>
            <a
              href={`https://livenet.xrpl.org/accounts/${PLATFORM_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cyber-cyan hover:underline inline-flex items-center gap-1"
            >
              Explorer <ExternalLink size={10} />
            </a>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-lg font-cyber text-cyber-text">XRPL Mainnet</p>
              <p className="text-[10px] text-cyber-muted">Live network</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-cyber text-cyber-cyan">{stats.totalTransactions}</p>
              <p className="text-[10px] text-cyber-muted">Transactions</p>
            </div>
          </div>
        </div>

        {/* Stats grid – equal height cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 min-h-[72px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Activity size={14} className="text-cyber-cyan" />
              <span className="text-[9px] text-cyber-cyan uppercase tracking-wider">Today</span>
            </div>
            <p className="text-xl font-cyber text-cyber-cyan mt-1">
              {transactions.filter(tx => tx.timestamp >= new Date().setHours(0,0,0,0)).length}
            </p>
            <p className="text-[9px] text-cyber-muted">Transactions</p>
          </div>
          <div className="p-4 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 min-h-[72px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Users size={14} className="text-cyber-purple" />
              <span className="text-[9px] text-cyber-purple uppercase tracking-wider">Users</span>
            </div>
            <p className="text-xl font-cyber text-cyber-purple mt-1">{stats.uniqueSenders}</p>
            <p className="text-[9px] text-cyber-muted">Unique senders</p>
          </div>
          <div className="p-4 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/20 min-h-[72px] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Zap size={14} className="text-cyber-yellow" />
              <span className="text-[9px] text-cyber-yellow uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl font-cyber text-cyber-yellow mt-1">{stats.totalTransactions}</p>
            <p className="text-[9px] text-cyber-muted">All time</p>
          </div>
        </div>

        {/* Transaction feed */}
        <div className="rounded-xl border border-cyber-border overflow-hidden">
          <div className={`px-4 py-2.5 border-b flex items-center justify-between ${PLATFORM_FEE_DISABLED ? 'bg-cyber-darker/50 border-cyber-border' : 'bg-green-500/10 border-green-500/30'}`}>
            <span className={`text-xs font-cyber ${PLATFORM_FEE_DISABLED ? 'text-cyber-muted' : 'text-green-400'}`}>
              {PLATFORM_FEE_DISABLED ? 'View-only · this address' : 'Real transactions'}
            </span>
            <span className={`text-[9px] ${PLATFORM_FEE_DISABLED ? 'text-cyber-muted' : 'text-green-500/80'}`}>
              {PLATFORM_FEE_DISABLED ? 'Fee off' : 'Mainnet'}
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto bg-cyber-darker/30">
            {transactions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-cyber-text text-xs font-medium mb-1.5">{PLATFORM_FEE_DISABLED ? 'No transactions' : 'No payments yet'}</p>
                <p className="text-cyber-muted text-[10px] max-w-xs mx-auto leading-relaxed">
                  {PLATFORM_FEE_DISABLED
                    ? 'Platform fee is disabled (compliant default). See docs/COMPLIANCE-CHECKLIST.md to enable after legal sign-off.'
                    : 'When the OpenClaw plugin is used, platform fees appear here.'}
                </p>
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.hash} className="px-4 py-2.5 border-b border-cyber-border/50 last:border-0 hover:bg-cyber-border/20 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bot size={12} className="text-cyber-cyan shrink-0" />
                      <span className="text-xs text-cyber-text truncate">{shortenAddress(tx.from)}</span>
                    </div>
                    <span className="text-[10px] text-cyber-green font-medium shrink-0">Received</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <a
                      href={`https://livenet.xrpl.org/transactions/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyber-cyan hover:underline truncate"
                    >
                      {tx.hash.slice(0, 10)}…
                    </a>
                    <span className="text-[9px] text-cyber-muted shrink-0">{new Date(tx.timestamp).toLocaleString()}</span>
                  </div>
                  {tx.memo && <p className="text-[9px] text-cyber-purple mt-1 truncate">Memo: {tx.memo}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* How it works – same card rhythm */}
        <div>
          <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-3">Split</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-cyber-green/10 border border-cyber-green/20 text-center">
              <p className="text-[9px] text-cyber-muted uppercase mb-0.5">Recipient</p>
              <p className="text-lg font-cyber text-cyber-green">97%</p>
              <p className="text-[9px] text-cyber-muted">Service</p>
            </div>
            <div className="p-4 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 text-center">
              <p className="text-[9px] text-cyber-muted uppercase mb-0.5">Creator</p>
              <p className="text-lg font-cyber text-cyber-cyan">2%</p>
              <p className="text-[9px] text-cyber-muted">Developer</p>
            </div>
            <div className="p-4 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 text-center">
              <p className="text-[9px] text-cyber-muted uppercase mb-0.5">Platform</p>
              <p className="text-lg font-cyber text-cyber-purple">{PLATFORM_FEE_DISABLED ? '0%' : '1%'}</p>
              <p className="text-[9px] text-cyber-muted">{PLATFORM_FEE_DISABLED ? 'Off' : 'Fee'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setPendingPrompt(`Send 0.5 XRP to ${PLATFORM_WALLET} (OpenClaw fee wallet)`);
              setAgentOpen(true, 'chat');
            }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-green/40 bg-cyber-green/10 text-xs text-cyber-green hover:bg-cyber-green/20 transition-colors"
          >
            <Send size={12} /> Send test payment
          </button>
          <a href="https://github.com/Shellfish011235/xrpl-control-room-gamer-ui" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-border bg-cyber-darker/50 text-xs text-cyber-text hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 transition-colors">
            <Code size={12} /> GitHub
          </a>
          <a href="https://www.npmjs.com/package/openclaw-xrpl-plugin" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-border bg-cyber-darker/50 text-xs text-cyber-text hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 transition-colors">
            <Layers size={12} /> npm
          </a>
          <a href="https://xrpl.org/docs" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-border bg-cyber-darker/50 text-xs text-cyber-text hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30 transition-colors">
            <ExternalLink size={12} /> Docs
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-cyber-border bg-cyber-darker/50 text-center space-y-1">
        <p className="text-[10px] font-medium text-cyber-muted">
          {PLATFORM_FEE_DISABLED ? 'Platform fee disabled · see COMPLIANCE-CHECKLIST.md' : '1% platform fee on OpenClaw transactions'}
        </p>
        <p className="text-[9px] text-cyber-muted">
          We do not transmit money or hold your funds. You sign in your own wallet. Not legal or financial advice.
        </p>
      </div>
    </div>
  );
}

export default OpenClawDashboard;
