/**
 * Liquidity Nexus – Phase 1 Path Optimizer (Revenue MVP).
 * Input source/dest/amount → ranked paths (XRPL + AMM + bridge). Cost/speed/risk scoring.
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Star, Loader2, AlertCircle } from 'lucide-react';
import { useOptimizerStore, type RankedPath } from '../store/optimizerStore';
import { fetchRankedPaths } from '../services/optimizerService';

export default function Optimizer() {
  const {
    sourceAsset,
    destAsset,
    amount,
    riskTolerance,
    setSourceAsset,
    setDestAsset,
    setAmount,
    setRiskTolerance,
    setRankedPaths,
    setLoading,
    setError,
    rankedPaths,
    loading,
    error,
    favorites,
    toggleFavorite,
  } = useOptimizerStore();

  const [runKey, setRunKey] = useState(0);

  const { refetch, isFetching } = useQuery({
    queryKey: ['optimizer', sourceAsset, destAsset, amount, runKey],
    queryFn: async () => {
      setLoading(true);
      setError(null);
      try {
        const paths = await fetchRankedPaths({ sourceAsset, destAsset, amount });
        setRankedPaths(paths);
        return paths;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch paths';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    enabled: false,
  });

  const handleRun = useCallback(() => {
    setRunKey((k) => k + 1);
    refetch();
  }, [refetch]);

  const chartData = rankedPaths.slice(0, 8).map((p) => ({
    name: p.label.slice(0, 12),
    cost: p.costScore,
    speed: p.speedScore,
    risk: p.riskScore,
  }));

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-glow/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-cyber-glow" />
          </div>
          <div>
            <h1 className="font-cyber text-xl text-cyber-text">LIQUIDITY NEXUS</h1>
            <p className="text-xs text-cyber-muted">Path Optimizer · Cost · Speed · Risk</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-xl border border-cyber-border bg-cyber-darker/40"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-[10px] text-cyber-muted uppercase mb-1">Source</label>
            <select
              value={sourceAsset}
              onChange={(e) => setSourceAsset(e.target.value)}
              className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-cyber-text text-sm"
            >
              <option value="XRP">XRP</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-cyber-muted uppercase mb-1">Destination</label>
            <select
              value={destAsset}
              onChange={(e) => setDestAsset(e.target.value)}
              className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-cyber-text text-sm"
            >
              <option value="USD">USD</option>
              <option value="XRP">XRP</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-cyber-muted uppercase mb-1">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              className="w-full bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-cyber-text text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRun}
              disabled={isFetching || loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-cyber-glow/50 text-cyber-glow hover:bg-cyber-glow/10 disabled:opacity-50"
            >
              {isFetching || loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap size={16} />}
              Run
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-cyber-muted">Risk tolerance</span>
          <input
            type="range"
            min={0}
            max={100}
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(Number(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-xs text-cyber-cyan font-mono w-8">{riskTolerance}</span>
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-sm mb-4">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {rankedPaths.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl border border-cyber-border bg-cyber-darker/40 mb-5"
          >
            <h3 className="text-[10px] text-cyber-muted uppercase tracking-wider mb-3 font-cyber">Cost vs Speed</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#64748b" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#0a0f1a', border: '1px solid #00d4ff40' }}
                    labelStyle={{ color: '#00d4ff' }}
                  />
                  <Bar dataKey="cost" fill="#00d4ff" name="Cost" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="speed" fill="#a855f7" name="Speed" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="space-y-3">
            <h3 className="text-[10px] text-cyber-muted uppercase tracking-wider font-cyber">Ranked paths</h3>
            {rankedPaths.map((p) => (
              <PathRow key={p.id} path={p} isFavorite={favorites.includes(p.id)} onToggleFavorite={() => toggleFavorite(p.id)} />
            ))}
          </div>
        </>
      )}

      {!loading && rankedPaths.length === 0 && runKey > 0 && !error && (
        <p className="text-center text-cyber-muted py-8">No paths found. Try different assets or amount.</p>
      )}
      </div>
    </div>
  );
}

function PathRow({ path, isFavorite, onToggleFavorite }: { path: RankedPath; isFavorite: boolean; onToggleFavorite: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-4 rounded-lg border border-cyber-border bg-cyber-darker/50 hover:border-cyber-glow/30"
    >
      <div className="flex items-center gap-3">
        <button type="button" onClick={onToggleFavorite} className="p-1 text-cyber-muted hover:text-cyber-yellow">
          <Star size={14} className={isFavorite ? 'fill-cyber-yellow text-cyber-yellow' : ''} />
        </button>
        <span className="font-cyber text-cyber-text">{path.label}</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-darker border border-cyber-border">
          {path.type}
        </span>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-cyber-cyan">Cost {path.costScore}</span>
        <span className="text-cyber-purple">Speed {path.speedScore}</span>
        <span className="text-cyber-muted">Risk {path.riskScore}</span>
        {path.effectiveRate != null && (
          <span className="text-cyber-glow font-mono">Rate {path.effectiveRate.toFixed(4)}</span>
        )}
      </div>
    </motion.div>
  );
}
