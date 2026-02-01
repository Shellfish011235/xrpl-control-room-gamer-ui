// OpenClaw Revenue Dashboard
// Track your earnings from OpenClaw/Moltbot agent economy integration
// "Watch the money roll in as AI agents pay for skills"

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, DollarSign, TrendingUp, Zap, Users, Activity,
  Play, Pause, Settings, ExternalLink, Copy, Check,
  ArrowUpRight, Layers, Code, RefreshCw
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface AgentActivity {
  id: string;
  agentName: string;
  skillUsed: string;
  amount: number;
  yourFee: number;
  timestamp: number;
}

interface RevenueStats {
  totalRevenue: number;
  todayRevenue: number;
  activeAgents: number;
  totalTransactions: number;
  topSkills: { name: string; revenue: number; uses: number }[];
}

// =============================================================================
// SIMULATED DATA (Replace with real XRPL queries)
// =============================================================================

const SKILL_CATALOG = [
  { name: 'premium-search', price: 0.001, category: 'data' },
  { name: 'image-generation', price: 0.01, category: 'ai' },
  { name: 'code-execution', price: 0.005, category: 'compute' },
  { name: 'email-sender', price: 0.0001, category: 'comms' },
  { name: 'calendar-manager', price: 0.0005, category: 'productivity' },
  { name: 'flight-search', price: 0.002, category: 'travel' },
  { name: 'translation', price: 0.0005, category: 'ai' },
  { name: 'sentiment-analysis', price: 0.001, category: 'ai' },
];

const AGENT_NAMES = [
  'alice-assistant', 'bob-helper', 'charlie-bot', 'diana-agent',
  'eve-worker', 'frank-task', 'grace-auto', 'henry-proc',
];

// =============================================================================
// DASHBOARD COMPONENT
// =============================================================================

export function OpenClawDashboard() {
  const [isLive, setIsLive] = useState(false); // Simulation OFF by default
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    activeAgents: 0,
    totalTransactions: 0,
    topSkills: [],
  });
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [feePercent, setFeePercent] = useState(3);
  const [realBalance, setRealBalance] = useState<string | null>(null);
  const [realTxCount, setRealTxCount] = useState<number | null>(null);
  const [loadingReal, setLoadingReal] = useState(false);

  // Your wallet address
  const YOUR_WALLET = 'ra7Zj3GMAvuY7QEAJr1YADJ6Ss43Rxyo64';

  // Fetch REAL wallet balance from XRPL Mainnet
  const fetchRealBalance = useCallback(async () => {
    setLoadingReal(true);
    try {
      // Get account info
      const response = await fetch('https://xrplcluster.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_info',
          params: [{ account: YOUR_WALLET, ledger_index: 'validated' }],
        }),
      });
      const data = await response.json();
      
      if (data.result?.account_data?.Balance) {
        const balanceXRP = (parseInt(data.result.account_data.Balance) / 1_000_000).toFixed(2);
        setRealBalance(balanceXRP);
      } else if (data.result?.error === 'actNotFound') {
        setRealBalance('Not activated');
      } else {
        setRealBalance('0.00');
      }

      // Get transaction count
      const txResponse = await fetch('https://xrplcluster.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'account_tx',
          params: [{ account: YOUR_WALLET, limit: 100 }],
        }),
      });
      const txData = await txResponse.json();
      setRealTxCount(txData.result?.transactions?.length || 0);
    } catch (error) {
      console.error('Failed to fetch real balance:', error);
      setRealBalance('Error');
    } finally {
      setLoadingReal(false);
    }
  }, [YOUR_WALLET]);

  // Fetch real balance on mount and every 30 seconds
  useEffect(() => {
    fetchRealBalance();
    const interval = setInterval(fetchRealBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchRealBalance]);

  // Simulate live agent activity
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Random skill usage
      const skill = SKILL_CATALOG[Math.floor(Math.random() * SKILL_CATALOG.length)];
      const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
      const yourFee = skill.price * (feePercent / 100);

      const activity: AgentActivity = {
        id: `${Date.now()}-${Math.random()}`,
        agentName: agent,
        skillUsed: skill.name,
        amount: skill.price,
        yourFee,
        timestamp: Date.now(),
      };

      setActivities(prev => [activity, ...prev].slice(0, 50));
      
      setStats(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + yourFee,
        todayRevenue: prev.todayRevenue + yourFee,
        totalTransactions: prev.totalTransactions + 1,
        activeAgents: new Set([...AGENT_NAMES.slice(0, Math.floor(Math.random() * 8) + 1)]).size,
      }));
    }, 500 + Math.random() * 2000); // Random interval 0.5-2.5s

    return () => clearInterval(interval);
  }, [isLive, feePercent]);

  // Calculate top skills
  useEffect(() => {
    const skillCounts = new Map<string, { revenue: number; uses: number }>();
    activities.forEach(a => {
      const current = skillCounts.get(a.skillUsed) || { revenue: 0, uses: 0 };
      skillCounts.set(a.skillUsed, {
        revenue: current.revenue + a.yourFee,
        uses: current.uses + 1,
      });
    });

    const topSkills = Array.from(skillCounts.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setStats(prev => ({ ...prev, topSkills }));
  }, [activities]);

  const copyWallet = () => {
    navigator.clipboard.writeText(YOUR_WALLET);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-cyber text-cyber-text">OPENCLAW REVENUE</h2>
              <p className="text-[10px] text-cyber-green">🔴 MAINNET LIVE - Real XRP</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              isLive 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-cyber-border text-cyber-muted hover:text-cyber-text'
            }`}
          >
            {isLive ? <Pause size={14} /> : <Play size={14} />}
            {isLive ? '🔴 MAINNET LIVE' : 'Start'}
          </button>
        </div>

        {/* Your Wallet */}
        <div className="flex items-center gap-2 p-2 rounded bg-cyber-darker/50">
          <span className="text-[10px] text-cyber-muted">YOUR FEE WALLET:</span>
          <code className="text-xs text-cyber-cyan flex-1">{YOUR_WALLET}</code>
          <button onClick={copyWallet} className="p-1 hover:bg-cyber-cyan/20 rounded">
            {copiedWallet ? <Check size={12} className="text-cyber-green" /> : <Copy size={12} className="text-cyber-muted" />}
          </button>
        </div>
      </div>

      {/* REAL MAINNET BALANCE */}
      <div className="mx-4 mt-4 p-4 rounded bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-2 border-green-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-green-400 font-cyber">💰 REAL MAINNET BALANCE</span>
          <button 
            onClick={fetchRealBalance} 
            disabled={loadingReal}
            className="p-1 rounded hover:bg-green-500/20"
          >
            <RefreshCw size={14} className={`text-green-400 ${loadingReal ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-3xl font-cyber text-green-400">
              {realBalance !== null ? `${realBalance} XRP` : 'Loading...'}
            </p>
            <p className="text-[10px] text-cyber-muted">Actual wallet balance on XRPL Mainnet</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-cyber text-cyan-400">{realTxCount ?? '-'}</p>
            <p className="text-[10px] text-cyber-muted">Real transactions</p>
          </div>
        </div>
        <a 
          href={`https://livenet.xrpl.org/accounts/${YOUR_WALLET}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
        >
          View on XRPL Explorer <ExternalLink size={10} />
        </a>
      </div>

      {/* Stats Grid (Simulated Activity Below) */}
      <div className="grid grid-cols-4 gap-3 p-4">
        <div className="col-span-4 mb-2">
          <p className="text-[10px] text-yellow-500">⚠️ Below stats are SIMULATED - Real fees appear in green box above</p>
        </div>
        <div className="p-3 rounded bg-cyber-green/10 border border-cyber-green/30">
          <div className="flex items-center justify-between mb-1">
            <DollarSign size={14} className="text-cyber-green" />
            <ArrowUpRight size={12} className="text-cyber-green" />
          </div>
          <p className="text-xl font-cyber text-cyber-green">
            {stats.totalRevenue.toFixed(4)}
          </p>
          <p className="text-[9px] text-cyber-muted">TOTAL XRP EARNED</p>
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
            {stats.activeAgents}
          </p>
          <p className="text-[9px] text-cyber-muted">ACTIVE AGENTS</p>
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

      {/* Fee Configuration */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-3 p-2 rounded bg-cyber-border/30">
          <Settings size={14} className="text-cyber-muted" />
          <span className="text-xs text-cyber-muted">Your Fee:</span>
          <input
            type="range"
            min="1"
            max="10"
            value={feePercent}
            onChange={(e) => setFeePercent(Number(e.target.value))}
            className="flex-1 accent-cyber-purple"
          />
          <span className="text-sm text-cyber-purple font-cyber w-12">{feePercent}%</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-4 p-4 pt-0">
        {/* Activity Feed - CLEARLY MARKED AS SIMULATION */}
        <div className="rounded border border-yellow-500/50">
          <div className="p-2 border-b border-yellow-500/50 bg-yellow-500/10 flex items-center justify-between">
            <span className="text-xs text-yellow-400 font-cyber">⚠️ SIMULATED PREVIEW</span>
            <span className="text-[9px] text-yellow-500">NOT REAL TRANSACTIONS</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-4 text-center text-xs">
                <p className="text-yellow-400 mb-2">No real transactions yet</p>
                <p className="text-cyber-muted text-[10px]">
                  Real fees appear when OpenClaw users integrate your plugin.
                  <br/>Push to GitHub → Post to community → Get adoption
                </p>
                {!isLive && (
                  <button 
                    onClick={() => setIsLive(true)}
                    className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] rounded"
                  >
                    Show simulation preview
                  </button>
                )}
              </div>
            ) : (
              activities.map(activity => (
                <div key={activity.id} className="p-2 border-b border-cyber-border/30 hover:bg-cyber-cyan/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot size={12} className="text-cyber-purple" />
                      <span className="text-[10px] text-cyber-text">{activity.agentName}</span>
                    </div>
                    <span className="text-[10px] text-cyber-green">+{activity.yourFee.toFixed(6)} XRP</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-cyber-cyan">{activity.skillUsed}</span>
                    <span className="text-[9px] text-cyber-muted">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Skills */}
        <div className="rounded border border-cyber-border">
          <div className="p-2 border-b border-cyber-border">
            <span className="text-xs text-cyber-text font-cyber">TOP EARNING SKILLS</span>
          </div>
          <div className="p-2">
            {stats.topSkills.length === 0 ? (
              <div className="p-4 text-center text-cyber-muted text-xs">
                No data yet
              </div>
            ) : (
              stats.topSkills.map((skill, i) => (
                <div key={skill.name} className="flex items-center justify-between p-2 rounded hover:bg-cyber-purple/10">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-cyber-purple/20 text-cyber-purple text-[10px] flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-xs text-cyber-text">{skill.name}</p>
                      <p className="text-[9px] text-cyber-muted">{skill.uses} uses</p>
                    </div>
                  </div>
                  <span className="text-xs text-cyber-green font-mono">
                    {skill.revenue.toFixed(6)} XRP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Projection */}
      <div className="p-4 border-t border-cyber-border">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded bg-gradient-to-br from-cyber-green/20 to-transparent">
            <p className="text-[9px] text-cyber-muted mb-1">DAILY (projected)</p>
            <p className="text-lg font-cyber text-cyber-green">
              {(stats.todayRevenue * 24 * 60).toFixed(2)} XRP
            </p>
            <p className="text-[9px] text-cyber-muted">
              ≈ ${(stats.todayRevenue * 24 * 60 * 0.50).toFixed(2)} USD
            </p>
          </div>
          <div className="p-3 rounded bg-gradient-to-br from-cyber-cyan/20 to-transparent">
            <p className="text-[9px] text-cyber-muted mb-1">MONTHLY (projected)</p>
            <p className="text-lg font-cyber text-cyber-cyan">
              {(stats.todayRevenue * 24 * 60 * 30).toFixed(0)} XRP
            </p>
            <p className="text-[9px] text-cyber-muted">
              ≈ ${(stats.todayRevenue * 24 * 60 * 30 * 0.50).toFixed(0)} USD
            </p>
          </div>
          <div className="p-3 rounded bg-gradient-to-br from-cyber-purple/20 to-transparent">
            <p className="text-[9px] text-cyber-muted mb-1">YEARLY (projected)</p>
            <p className="text-lg font-cyber text-cyber-purple">
              {(stats.todayRevenue * 24 * 60 * 365).toFixed(0)} XRP
            </p>
            <p className="text-[9px] text-cyber-muted">
              ≈ ${(stats.todayRevenue * 24 * 60 * 365 * 0.50).toFixed(0)} USD
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-cyber-border">
        <div className="grid grid-cols-3 gap-2">
          <a
            href="https://github.com/openclaw/openclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-border hover:bg-cyber-cyan/20 transition-colors text-xs text-cyber-text"
          >
            <Code size={12} />
            Fork OpenClaw
          </a>
          <a
            href="https://xrpl.org/payment-channels.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-border hover:bg-cyber-cyan/20 transition-colors text-xs text-cyber-text"
          >
            <Layers size={12} />
            XRPL Channels Docs
          </a>
          <a
            href="https://interledger.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-border hover:bg-cyber-cyan/20 transition-colors text-xs text-cyber-text"
          >
            <ExternalLink size={12} />
            Interledger
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center bg-red-500/10">
        <p className="text-[10px] text-red-400 font-bold">
          🔴 MAINNET LIVE - Earning {feePercent}% on every transaction
        </p>
      </div>
    </div>
  );
}

export default OpenClawDashboard;
