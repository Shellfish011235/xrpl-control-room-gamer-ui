/**
 * Pathfinding – gamified pathfinding.
 * Match tiles (XRP, USD, EUR, etc.) → pathfinding runs → "Path found: USD → XRP → EUR" with
 * visual route. Ties to Liquidity Nexus, C2V, and optional testnet execution.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, ExternalLink, Info, Sparkles } from 'lucide-react';
import { findPathForGame, GAME_TILE_CURRENCIES, type GamePathResult } from '../services/gamePathfinding';
import { fetchRankedPaths } from '../services/optimizerService';
import type { RankedPath } from '../store/optimizerStore';
import { PathVisualization } from '../components/game';
import { useAgentPanelStore } from '../store/agentPanelStore';

const DEFAULT_AMOUNT = '10';

export default function LiquidityCrush() {
  const [selected, setSelected] = useState<string[]>([]);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [result, setResult] = useState<GamePathResult | null>(null);
  const [optimizerPaths, setOptimizerPaths] = useState<RankedPath[] | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAgentOpen = useAgentPanelStore((s) => s.setOpen);
  const setPendingPrompt = useAgentPanelStore((s) => s.setPendingSecureAgentPrompt);

  const handleTileClick = (id: string) => {
    if (selected.length === 0) {
      setSelected([id]);
      setResult(null);
      return;
    }
    if (selected.length === 1 && selected[0] === id) {
      setSelected([]);
      return;
    }
    if (selected.length === 1) {
      setSelected([selected[0], id]);
      runPathfind(selected[0], id);
      return;
    }
    setSelected([id]);
    setResult(null);
  };

  const runPathfind = async (source: string, dest: string) => {
    setLoading(true);
    setResult(null);
    setOptimizerPaths(null);
    try {
      const [res, ranked] = await Promise.all([
        findPathForGame(source, dest, amount),
        fetchRankedPaths({ sourceAsset: source, destAsset: dest, amount }).catch(() => [] as RankedPath[]),
      ]);
      setResult(res);
      if (ranked.length > 0) setOptimizerPaths(ranked);
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelected([]);
    setResult(null);
    setOptimizerPaths(null);
  };

  const handleUseInSecureAgent = () => {
    if (!result?.success || selected.length < 2) return;
    const [source] = selected;
    const prompt = `Send ${amount} ${source} to `;
    setPendingPrompt(prompt);
    setAgentOpen(true, 'chat');
    navigate(`/pay?source=${encodeURIComponent(source)}&dest=${encodeURIComponent(selected[1])}&amount=${encodeURIComponent(amount)}`);
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-text p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-cyber-cyan/20">
            <Zap size={24} className="text-cyber-cyan" />
          </div>
          <div>
            <h1 className="font-cyber text-xl text-cyber-cyan">Pathfinding</h1>
            <p className="text-xs text-cyber-muted">
              Match two tiles → we find the best route on the real ledger. Practice pathfinding.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <label className="text-xs text-cyber-muted">
            Amount
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value || DEFAULT_AMOUNT)}
              className="ml-2 w-20 px-2 py-1 rounded bg-cyber-darker border border-cyber-border text-cyber-text text-sm"
            />
          </label>
          <span className="text-[10px] text-cyber-muted">
            Select <strong>source</strong> then <strong>destination</strong> tile.
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
          {GAME_TILE_CURRENCIES.map((tile) => {
            const isSelected = selected.includes(tile.id);
            const isSource = selected[0] === tile.id;
            return (
              <motion.button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-xl border-2 p-4 text-center transition-all ${
                  isSelected
                    ? isSource
                      ? 'border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan'
                      : 'border-cyber-green bg-cyber-green/20 text-cyber-green'
                    : 'border-cyber-border bg-cyber-darker/80 hover:border-cyber-cyan/50'
                }`}
              >
                <span className="font-cyber text-lg block">{tile.label}</span>
                {isSource && <span className="text-[10px] text-cyber-muted">from</span>}
                {selected.length === 1 && !isSource && selected[0] !== tile.id && (
                  <span className="text-[10px] text-cyber-muted">to?</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-cyber-muted">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Finding path on ledger…</span>
          </div>
        )}

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <PathVisualization
                pathSteps={result.pathSteps}
                pathLabel={result.pathLabel}
                success={result.success}
                effectiveRate={result.effectiveRate}
                liquidityScore={result.liquidityScore}
              />
              {optimizerPaths != null && optimizerPaths.length > 0 && result.success && (
                <div className="p-3 rounded-lg border border-cyber-purple/40 bg-cyber-purple/10 flex gap-2 items-start">
                  <Sparkles size={16} className="text-cyber-purple shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cyber-purple">Agent found alternative routes</p>
                    <p className="text-[10px] text-cyber-muted mt-0.5">
                      Liquidity Nexus ranked {optimizerPaths.length} option{optimizerPaths.length !== 1 ? 's' : ''}:{' '}
                      {optimizerPaths.slice(0, 2).map((p) => p.label).join(', ')}.
                    </p>
                    <Link
                      to="/optimizer"
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-cyber-cyan hover:underline"
                    >
                      Compare on Optimizer
                    </Link>
                  </div>
                </div>
              )}
              {result.success ? (
                <div className="p-4 rounded-lg border border-cyber-green/40 bg-cyber-green/10 space-y-3">
                  <p className="text-sm text-cyber-green font-medium">
                    Epic path found! Via XRP bridge – best rate from ledger.
                  </p>
                  <button
                    type="button"
                    onClick={handleUseInSecureAgent}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-sm hover:bg-cyber-cyan/30"
                  >
                    <ExternalLink size={14} />
                    Use this in Secure Agent
                  </button>
                  <p className="text-[10px] text-cyber-muted">
                    Opens the agent with &quot;Send {amount} {result.sourceCurrency} to &quot; — paste an XRPL address and confirm.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-cyber-yellow/40 bg-cyber-yellow/10">
                  <p className="text-sm text-cyber-yellow">{result.error ?? 'No path found'}</p>
                  <p className="text-[10px] text-cyber-muted mt-1">
                    Try another pair or check liquidity (e.g. XRP ↔ USD, XRP ↔ EUR).
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={resetSelection}
                className="text-xs text-cyber-muted hover:text-cyber-cyan"
              >
                Clear and match again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 p-4 rounded-lg border border-cyber-border/50 bg-cyber-darker/50 flex gap-3">
          <Info size={18} className="text-cyber-cyan shrink-0 mt-0.5" />
          <div className="text-[11px] text-cyber-muted space-y-1">
            <p>
              <strong className="text-cyber-text">Educational:</strong> You’re not just matching tiles — you’re
              simulating optimized liquidity routes on the XRPL. Pathfinding is the ledger’s native superpower.
            </p>
            <p>
              <strong className="text-cyber-text">Liquidity Nexus</strong> powers the path engine; <strong>Secure Agent</strong> and{' '}
              <strong>C2V</strong> let you execute on testnet with human approval. Always testnet first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
