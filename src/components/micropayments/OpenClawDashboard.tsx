// OpenClaw Revenue Dashboard
// Track REAL earnings from OpenClaw agent economy integration
// Live XRPL Mainnet transactions - no simulation

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, DollarSign, TrendingUp, Zap, Users, Activity,
  ExternalLink, Copy, Check,
  ArrowUpRight, Layers, Code, RefreshCw
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface RealTransaction {
  hash: string;
  from: string;
  amount: number;  // in XRP
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
  const [transactions, setTransactions] = useState<RealTransaction[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    uniqueSenders: 0,
    totalTransactions: 0,
  });
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [realBalance, setRealBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Platform fee wallet - XRPL Control Room earns 1% on all transactions
  const PLATFORM_WALLET = 'ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64';

  // Fetch REAL data from XRPL Mainnet
  const fetchRealData = useCallback(async () => {
    setLoading(true);
    try {
      // Get account info (balance)
      const balanceResponse = await fetch('https://xrplcluster.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_info',
          params: [{ account: PLATFORM_WALLET, ledger_index: 'validated' }],
        }),
      });
      const balanceData = await balanceResponse.json();
      
      if (balanceData.result?.account_data?.Balance) {
        const balanceXRP = (parseInt(balanceData.result.account_data.Balance) / 1_000_000).toFixed(2);
        setRealBalance(balanceXRP);
      } else if (balanceData.result?.error === 'actNotFound') {
        setRealBalance('Not activated');
      } else {
        setRealBalance('0.00');
      }

      // Get REAL transactions
      const txResponse = await fetch('https://xrplcluster.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_tx',
          params: [{ account: PLATFORM_WALLET, limit: 50 }],
        }),
      });
      const txData = await txResponse.json();
      
      if (txData.result?.transactions) {
        const realTxs: RealTransaction[] = txData.result.transactions
          .filter((tx: any) => tx.tx?.TransactionType === 'Payment' && tx.tx?.Destination === PLATFORM_WALLET)
          .map((tx: any) => {
            // Parse memo if present
            let memo = '';
            if (tx.tx?.Memos?.[0]?.Memo?.MemoData) {
              try {
                memo = Buffer.from(tx.tx.Memos[0].Memo.MemoData, 'hex').toString('utf8');
              } catch { memo = ''; }
            }
            
            // Amount in XRP (handle both native XRP and issued currencies)
            let amount = 0;
            if (typeof tx.tx?.Amount === 'string') {
              amount = parseInt(tx.tx.Amount) / 1_000_000;
            }
            
            return {
              hash: tx.tx?.hash || '',
              from: tx.tx?.Account || 'Unknown',
              amount,
              timestamp: tx.tx?.date ? (tx.tx.date + 946684800) * 1000 : Date.now(), // XRPL epoch to JS epoch
              memo,
            };
          });
        
        setTransactions(realTxs);
        
        // Calculate stats from real transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();
        
        const todayTxs = realTxs.filter(tx => tx.timestamp >= todayMs);
        const uniqueSenders = new Set(realTxs.map(tx => tx.from)).size;
        const totalRevenue = realTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const todayRevenue = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);
        
        setStats({
          totalRevenue,
          todayRevenue,
          uniqueSenders,
          totalTransactions: realTxs.length,
        });
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch XRPL data:', error);
      setRealBalance('Error');
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
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border bg-gradient-to-r from-green-500/20 to-cyber-cyan/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500 animate-pulse">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-cyber text-cyber-text">XRPL CONTROL ROOM</h2>
              <p className="text-[10px] text-green-400 font-bold">🟢 MAINNET LIVE - Real XRP Transactions</p>
            </div>
          </div>
          
          <button
            onClick={fetchRealData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Fetching...' : 'Refresh'}
          </button>
        </div>

        {/* Platform Wallet */}
        <div className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50">
          <span className="text-[10px] text-cyber-muted">PLATFORM FEE WALLET:</span>
          <code className="text-xs text-cyber-cyan flex-1">{PLATFORM_WALLET}</code>
          <button onClick={copyWallet} className="p-1 hover:bg-cyber-cyan/20 rounded">
            {copiedWallet ? <Check size={12} className="text-cyber-green" /> : <Copy size={12} className="text-cyber-muted" />}
          </button>
        </div>
        
        {lastUpdate && (
          <p className="text-[9px] text-cyber-muted mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()} (auto-refresh every 15s)
          </p>
        )}
      </div>

      {/* REAL MAINNET BALANCE */}
      <div className="mx-4 mt-4 p-4 rounded bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-2 border-green-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-green-400 font-cyber">💰 LIVE MAINNET BALANCE</span>
          <a 
            href={`https://livenet.xrpl.org/accounts/${PLATFORM_WALLET}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
          >
            XRPL Explorer <ExternalLink size={10} />
          </a>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-3xl font-cyber text-green-400">
              {realBalance !== null ? `${realBalance} XRP` : 'Loading...'}
            </p>
            <p className="text-[10px] text-cyber-muted">Actual wallet balance on XRPL Mainnet</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-cyber text-cyan-400">{stats.totalTransactions}</p>
            <p className="text-[10px] text-cyber-muted">Incoming payments</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - ALL REAL DATA */}
      <div className="grid grid-cols-4 gap-3 p-4">
        <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
          <div className="flex items-center justify-between mb-1">
            <DollarSign size={14} className="text-cyber-green" />
            <ArrowUpRight size={12} className="text-cyber-green" />
          </div>
          <p className="text-xl font-cyber text-cyber-green">
            {stats.totalRevenue.toFixed(4)}
          </p>
          <p className="text-[9px] text-cyber-muted">TOTAL XRP RECEIVED</p>
        </div>

        <div className="p-3 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
          <div className="flex items-center justify-between mb-1">
            <Activity size={14} className="text-cyber-cyan" />
            <span className="text-[9px] text-cyber-cyan">TODAY</span>
          </div>
          <p className="text-xl font-cyber text-cyber-cyan">
            {stats.todayRevenue.toFixed(4)}
          </p>
          <p className="text-[9px] text-cyber-muted">XRP TODAY</p>
        </div>

        <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
          <div className="flex items-center justify-between mb-1">
            <Users size={14} className="text-cyber-purple" />
          </div>
          <p className="text-xl font-cyber text-cyber-purple">
            {stats.uniqueSenders}
          </p>
          <p className="text-[9px] text-cyber-muted">UNIQUE SENDERS</p>
        </div>

        <div className="p-3 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
          <div className="flex items-center justify-between mb-1">
            <Zap size={14} className="text-cyber-yellow" />
          </div>
          <p className="text-xl font-cyber text-cyber-yellow">
            {stats.totalTransactions}
          </p>
          <p className="text-[9px] text-cyber-muted">TRANSACTIONS</p>
        </div>
      </div>

      {/* REAL Transaction Feed */}
      <div className="mx-4 mb-4">
        <div className="rounded border border-green-500/50">
          <div className="p-2 border-b border-green-500/50 bg-green-500/10 flex items-center justify-between">
            <span className="text-xs text-green-400 font-cyber">🟢 REAL TRANSACTIONS</span>
            <span className="text-[9px] text-green-500">LIVE FROM XRPL MAINNET</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-6 text-center text-xs">
                <p className="text-cyber-cyan mb-2">No incoming payments yet</p>
                <p className="text-cyber-muted text-[10px]">
                  When someone uses the OpenClaw plugin, 1% platform fee appears here.
                  <br/>Share your plugin → Get adoption → Earn real XRP
                </p>
              </div>
            ) : (
              transactions.map(tx => (
                <div key={tx.hash} className="p-2 border-b border-cyber-border/30 hover:bg-green-500/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot size={12} className="text-green-400" />
                      <span className="text-[10px] text-cyber-text">{shortenAddress(tx.from)}</span>
                    </div>
                    <span className="text-[10px] text-green-400 font-bold">+{tx.amount.toFixed(6)} XRP</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <a 
                      href={`https://livenet.xrpl.org/transactions/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-cyber-cyan hover:underline flex items-center gap-1"
                    >
                      {tx.hash.slice(0, 12)}... <ExternalLink size={8} />
                    </a>
                    <span className="text-[9px] text-cyber-muted">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {tx.memo && (
                    <p className="text-[9px] text-cyber-purple mt-1">Memo: {tx.memo}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Projection */}
      <div className="p-4 border-t border-cyber-border">
        <p className="text-[10px] text-cyber-muted mb-2">Revenue projections (based on today's activity)</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded bg-gradient-to-br from-cyber-green/20 to-transparent">
            <p className="text-[9px] text-cyber-muted mb-1">DAILY (projected)</p>
            <p className="text-lg font-cyber text-cyber-green">
              {(stats.todayRevenue || 0).toFixed(4)} XRP
            </p>
            <p className="text-[9px] text-cyber-muted">
              ≈ ${((stats.todayRevenue || 0) * 0.50).toFixed(2)} USD
            </p>
          </div>
          <div className="p-3 rounded bg-gradient-to-br from-cyber-cyan/20 to-transparent">
            <p className="text-[9px] text-cyber-muted mb-1">MONTHLY (projected)</p>
            <p className="text-lg font-cyber text-cyber-cyan">
              {((stats.todayRevenue || 0) * 30).toFixed(2)} XRP
            </p>
            <p className="text-[9px] text-cyber-muted">
              ≈ ${((stats.todayRevenue || 0) * 30 * 0.50).toFixed(0)} USD
            </p>
          </div>
          <div className="p-3 rounded bg-gradient-to-br from-cyber-purple/20 to-transparent">
            <p className="text-[9px] text-cyber-muted mb-1">YEARLY (projected)</p>
            <p className="text-lg font-cyber text-cyber-purple">
              {((stats.todayRevenue || 0) * 365).toFixed(0)} XRP
            </p>
            <p className="text-[9px] text-cyber-muted">
              ≈ ${((stats.todayRevenue || 0) * 365 * 0.50).toFixed(0)} USD
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-cyber-border">
        <div className="grid grid-cols-3 gap-2">
          <a
            href="https://github.com/Shellfish011235/xrpl-control-room-gamer-ui"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-border hover:bg-cyber-cyan/20 transition-colors text-xs text-cyber-text"
          >
            <Code size={12} />
            GitHub Repo
          </a>
          <a
            href="https://www.npmjs.com/package/openclaw-xrpl-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-border hover:bg-cyber-cyan/20 transition-colors text-xs text-cyber-text"
          >
            <Layers size={12} />
            npm Package
          </a>
          <a
            href="https://xrpl.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-border hover:bg-cyber-cyan/20 transition-colors text-xs text-cyber-text"
          >
            <ExternalLink size={12} />
            XRPL Docs
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center bg-green-500/10">
        <p className="text-[10px] text-green-400 font-bold">
          🟢 MAINNET LIVE - 1% Platform Fee on All OpenClaw Transactions
        </p>
      </div>
    </div>
  );
}

export default OpenClawDashboard;
