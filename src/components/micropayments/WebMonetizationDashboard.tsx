// Web Monetization Dashboard
// Track streaming payments from browser-based content monetization
// Built on ILP - the W3C Web Monetization standard uses Interledger
// "Every second of attention can carry value"

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe, DollarSign, Clock, TrendingUp, Users, Eye,
  Play, Pause, ExternalLink, Zap, BarChart2, PieChart
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell,
} from 'recharts';

// =============================================================================
// TYPES
// =============================================================================

interface WebMonetizationDashboardProps {
  enableDemo?: boolean;
}

interface MonetizedSite {
  id: string;
  domain: string;
  paymentPointer: string;
  totalEarned: number;        // In drops
  sessionsCount: number;
  avgSessionDuration: number; // Seconds
  status: 'receiving' | 'idle' | 'offline';
  category: 'news' | 'video' | 'blog' | 'music' | 'podcast' | 'social' | 'tools';
}

interface StreamingSession {
  id: string;
  siteId: string;
  startTime: number;
  endTime?: number;
  totalPaid: number;
  ratePerSecond: number;
  packets: number;
}

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_SITES: MonetizedSite[] = [
  {
    id: 'coil-blog',
    domain: 'coil.com/blog',
    paymentPointer: '$ilp.uphold.com/ABC123',
    totalEarned: 5000000,
    sessionsCount: 1250,
    avgSessionDuration: 180,
    status: 'receiving',
    category: 'blog',
  },
  {
    id: 'cinnamon-video',
    domain: 'cinnamon.video',
    paymentPointer: '$ilp.gatehub.net/XYZ789',
    totalEarned: 12000000,
    sessionsCount: 3400,
    avgSessionDuration: 420,
    status: 'receiving',
    category: 'video',
  },
  {
    id: 'xrpl-news',
    domain: 'xrpl.news',
    paymentPointer: '$wallet.example.com/news',
    totalEarned: 2500000,
    sessionsCount: 890,
    avgSessionDuration: 120,
    status: 'idle',
    category: 'news',
  },
  {
    id: 'devtools-pro',
    domain: 'devtools.pro',
    paymentPointer: '$pay.stronghold.co/tools',
    totalEarned: 8000000,
    sessionsCount: 560,
    avgSessionDuration: 600,
    status: 'receiving',
    category: 'tools',
  },
  {
    id: 'crypto-podcast',
    domain: 'cryptotalks.fm',
    paymentPointer: '$ilp.uphold.com/podcast',
    totalEarned: 3500000,
    sessionsCount: 780,
    avgSessionDuration: 1800,
    status: 'idle',
    category: 'podcast',
  },
];

const CATEGORY_COLORS: Record<MonetizedSite['category'], string> = {
  news: '#00D4FF',
  video: '#FF6B35',
  blog: '#A855F7',
  music: '#00FF88',
  podcast: '#FFD700',
  social: '#FF4444',
  tools: '#4FFFFF',
};

// =============================================================================
// WEB MONETIZATION DASHBOARD
// =============================================================================

export function WebMonetizationDashboard({
  enableDemo = true,
}: WebMonetizationDashboardProps) {
  const [sites, setSites] = useState<MonetizedSite[]>(DEMO_SITES);
  const [sessions, setSessions] = useState<StreamingSession[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [revenueHistory, setRevenueHistory] = useState<Array<{ time: string; amount: number }>>([]);

  // Stats
  const stats = useMemo(() => {
    const totalEarned = sites.reduce((s, site) => s + site.totalEarned, 0);
    const totalSessions = sites.reduce((s, site) => s + site.sessionsCount, 0);
    const activeSites = sites.filter(s => s.status === 'receiving').length;
    const avgRate = sessions.length > 0
      ? sessions.reduce((s, sess) => s + sess.ratePerSecond, 0) / sessions.length
      : 36; // Default ~$0.36/hour rate

    return { totalEarned, totalSessions, activeSites, avgRate };
  }, [sites, sessions]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    sites.forEach(site => {
      byCategory[site.category] = (byCategory[site.category] || 0) + site.totalEarned;
    });
    return Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name as MonetizedSite['category']],
    }));
  }, [sites]);

  // ==========================================================================
  // SIMULATION
  // ==========================================================================

  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Update revenue history
      setRevenueHistory(prev => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        const newAmount = Math.random() * 1000 + 500;
        return [...prev.slice(-20), { time: timeStr, amount: newAmount }];
      });

      // Simulate payments to receiving sites
      setSites(prev => prev.map(site => {
        if (site.status !== 'receiving') return site;
        const payment = 10 + Math.floor(Math.random() * 50); // 10-60 drops
        return {
          ...site,
          totalEarned: site.totalEarned + payment,
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="bg-cyber-darker rounded-lg border border-cyber-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-cyber-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-cyber-cyan" />
            <span className="font-cyber text-cyber-cyan text-sm">WEB MONETIZATION</span>
          </div>
          {enableDemo && (
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                isStreaming
                  ? 'bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30'
                  : 'bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30'
              }`}
            >
              {isStreaming ? <Pause size={12} /> : <Play size={12} />}
              {isStreaming ? 'Stop' : 'Simulate'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-green">
              {(stats.totalEarned / 1000000).toFixed(2)}
            </p>
            <p className="text-[8px] text-cyber-muted">XRP EARNED</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-cyan">{stats.activeSites}</p>
            <p className="text-[8px] text-cyber-muted">ACTIVE SITES</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-yellow">
              {stats.totalSessions.toLocaleString()}
            </p>
            <p className="text-[8px] text-cyber-muted">SESSIONS</p>
          </div>
          <div className="p-2 rounded bg-cyber-border/30 text-center">
            <p className="text-lg font-cyber text-cyber-purple">
              ${((stats.avgRate * 3600) / 1000000 * 3).toFixed(2)}/hr
            </p>
            <p className="text-[8px] text-cyber-muted">AVG RATE</p>
          </div>
        </div>
      </div>

      {/* W3C Web Monetization Info */}
      <div className="p-3 bg-cyber-purple/5 border-b border-cyber-purple/30">
        <div className="flex items-start gap-2">
          <Zap size={14} className="text-cyber-purple mt-0.5" />
          <div>
            <p className="text-[10px] text-cyber-purple font-cyber">W3C WEB MONETIZATION + ILP</p>
            <p className="text-[9px] text-cyber-text mt-1">
              Web Monetization is a W3C standard that uses <strong>Interledger Protocol (ILP)</strong> under the hood.
              When you browse a monetized site, your browser streams micropayments at ~$0.36/hour.
              ILP enables this because fees are near-zero ({'>'}$0.00001/payment).
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      {revenueHistory.length > 0 && (
        <div className="p-3 border-b border-cyber-border">
          <p className="text-[10px] text-cyber-muted mb-2">LIVE REVENUE STREAM</p>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={revenueHistory}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00FF88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#666' }} />
              <YAxis tick={{ fontSize: 8, fill: '#666' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f1a',
                  border: '1px solid #1e3a5f',
                  fontSize: '10px',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#00FF88"
                fill="url(#revenueGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Content Layout */}
      <div className="grid grid-cols-3 divide-x divide-cyber-border">
        {/* Sites List */}
        <div className="col-span-2 max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-cyber-darker border-b border-cyber-border">
            <p className="text-[10px] text-cyber-muted">MONETIZED SITES</p>
          </div>
          <div className="divide-y divide-cyber-border/30">
            {sites.map(site => (
              <div
                key={site.id}
                className={`p-2 hover:bg-cyber-border/20 cursor-pointer transition-colors ${
                  selectedSite === site.id ? 'bg-cyber-cyan/10' : ''
                }`}
                onClick={() => setSelectedSite(site.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[site.category] }}
                    />
                    <div>
                      <p className="text-xs text-cyber-text">{site.domain}</p>
                      <p className="text-[8px] text-cyber-muted font-mono truncate max-w-[150px]">
                        {site.paymentPointer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {site.status === 'receiving' && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-green"></span>
                        </span>
                      )}
                      <span className={`text-[9px] ${
                        site.status === 'receiving' ? 'text-cyber-green' : 'text-cyber-muted'
                      }`}>
                        {site.status}
                      </span>
                    </div>
                    <p className="text-xs text-cyber-cyan font-mono">
                      {(site.totalEarned / 1000000).toFixed(4)} XRP
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-3">
          <p className="text-[10px] text-cyber-muted mb-2 text-center">BY CATEGORY</p>
          <ResponsiveContainer width="100%" height={120}>
            <RechartsPie>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0f1a',
                  border: '1px solid #1e3a5f',
                  fontSize: '10px',
                }}
                formatter={(value: number) => `${(value / 1000000).toFixed(2)} XRP`}
              />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center justify-between text-[8px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: cat.color }} />
                  <span className="text-cyber-muted capitalize">{cat.name}</span>
                </div>
                <span className="text-cyber-text">{((cat.value / stats.totalEarned) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How to Enable */}
      <div className="p-3 border-t border-cyber-border bg-cyber-darker/50">
        <p className="text-[9px] text-cyber-muted mb-2">To enable Web Monetization on your site:</p>
        <code className="block p-2 rounded bg-cyber-border/30 text-[9px] text-cyber-cyan font-mono">
          {'<link rel="monetization" href="$wallet.example.com/your-pointer">'}
        </code>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-cyber-border text-center">
        <p className="text-[8px] text-cyber-muted italic">
          "Every second of attention can carry value."
        </p>
      </div>
    </div>
  );
}

export default WebMonetizationDashboard;
