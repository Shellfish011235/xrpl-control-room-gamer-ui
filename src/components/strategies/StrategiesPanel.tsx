/**
 * Strategies tab: toggles for Grid / DCA / Market Maker / Arbitrage,
 * shared max exposure, PnL gauge, DCA chart, arb heatmap, strategy ladder.
 * Non-custodial: all txs require user sign via Orchestra.
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, TrendingUp, Zap, ArrowLeftRight, Shield, ChevronDown, ChevronUp, Pause, Play } from 'lucide-react';
import { useStrategyStore, type StrategyId } from '../../store/strategyStore';
import { getAmmPriceXRPUSD } from '../../services/xrplDex';
import { SharedPnLGauge } from './SharedPnLGauge';
import { DCAChart } from './DCAChart';
import { ArbitrageHeatmap } from './ArbitrageHeatmap';
import { StrategyLadder } from './StrategyLadder';

const STRATEGIES: { id: StrategyId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'grid', label: 'Grid', icon: <Layers className="w-4 h-4" />, desc: 'Adaptive offer ladder' },
  { id: 'dca', label: 'DCA', icon: <TrendingUp className="w-4 h-4" />, desc: 'Dip buy below avg cost' },
  { id: 'mm', label: 'Market Maker', icon: <Zap className="w-4 h-4" />, desc: 'Hummingbot-style spreads' },
  { id: 'arbitrage', label: 'Arbitrage', icon: <ArrowLeftRight className="w-4 h-4" />, desc: 'CLOB vs AMM' },
];

interface StrategiesPanelProps {
  currentPrice: number;
  compact?: boolean;
  killSwitch?: boolean;
  setKillSwitch?: (on: boolean) => void;
}

export function StrategiesPanel({ currentPrice, compact, killSwitch, setKillSwitch }: StrategiesPanelProps) {
  const enabled = useStrategyStore((s) => s.enabled);
  const setEnabled = useStrategyStore((s) => s.setEnabled);
  const maxExposureXRP = useStrategyStore((s) => s.maxExposureXRP);
  const setMaxExposureXRP = useStrategyStore((s) => s.setMaxExposureXRP);
  const setMarketSnapshot = useStrategyStore((s) => s.setMarketSnapshot);
  const exposureXRP = useStrategyStore((s) => s.exposureXRP);

  useEffect(() => {
    setMarketSnapshot({ mid: currentPrice, spreadBps: 25, volatility: 0.01 });
    return () => setMarketSnapshot(null);
  }, [currentPrice, setMarketSnapshot]);

  // Real AMM quote from ledger for CLOB vs AMM arb (P1)
  const setAmmQuoteFromLedger = useStrategyStore((s) => s.setAmmQuoteFromLedger);
  const ammQuoteFromLedger = useStrategyStore((s) => s.ammQuoteFromLedger);
  const [ammQuoteLoading, setAmmQuoteLoading] = React.useState(true);
  const [ammQuoteError, setAmmQuoteError] = React.useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const price = await getAmmPriceXRPUSD();
        if (!cancelled) {
          if (price != null) {
            setAmmQuoteFromLedger(price);
            setAmmQuoteError(null);
          } else setAmmQuoteError('Unavailable');
          setAmmQuoteLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setAmmQuoteError('Failed to load');
          setAmmQuoteLoading(false);
        }
      }
    };
    poll();
    const interval = setInterval(poll, 25_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setAmmQuoteFromLedger]);

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  if (compact) {
    return (
      <div className="cyber-panel p-4">
        <p className="text-cyber-muted text-xs font-cyber mb-2">STRATEGIES</p>
        <div className="flex flex-wrap gap-2">
          {STRATEGIES.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setEnabled(id, !enabled[id])}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border ${
                enabled[id] ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10' : 'border-cyber-muted text-cyber-muted'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
        <SharedPnLGauge />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="cyber-panel p-4">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyber-cyan" />
            <h3 className="font-cyber text-cyber-text">STRATEGY UNLOCKS</h3>
          </div>
          {setKillSwitch != null && (
            <button
              type="button"
              onClick={() => setKillSwitch(!killSwitch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition-colors ${
                killSwitch
                  ? 'border-cyber-yellow text-cyber-yellow bg-cyber-yellow/10'
                  : 'border-cyber-green/50 text-cyber-green bg-cyber-green/5 hover:bg-cyber-green/10'
              }`}
              title={killSwitch ? 'Resume agent suggestions' : 'Pause all strategy agent suggestions'}
            >
              {killSwitch ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {killSwitch ? 'Resume agents' : 'Pause agents'}
            </button>
          )}
        </div>
        <p className="text-cyber-muted text-xs mb-3">Enable agents; you sign all txs (non-custodial).</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STRATEGIES.map(({ id, label, icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => setEnabled(id, !enabled[id])}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-left transition-colors ${
                enabled[id]
                  ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                  : 'border-cyber-muted/50 text-cyber-muted hover:border-cyber-muted'
              }`}
            >
              {icon}
              <span className="text-xs font-medium">{label}</span>
              <span className="text-[10px] opacity-80">{desc}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 flex items-center gap-1 text-cyber-muted text-xs hover:text-cyber-cyan"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Risk & exposure
        </button>
        {showAdvanced && (
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyber-yellow" />
              <label className="text-xs text-cyber-muted">Max exposure (XRP)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={maxExposureXRP}
                onChange={(e) => setMaxExposureXRP(Number(e.target.value) || 0)}
                className="w-20 bg-cyber-darker border border-cyber-muted rounded px-2 py-1 text-cyber-text text-xs"
              />
            </div>
            <span className="text-xs text-cyber-muted">Current: {exposureXRP.toFixed(0)} XRP</span>
          </div>
        )}
      </div>

      {(ammQuoteLoading || ammQuoteError || ammQuoteFromLedger != null) && (
        <p className="text-[10px] text-cyber-muted">
          AMM quote (arb):{' '}
          {ammQuoteLoading ? 'Loading…' : ammQuoteError ? ammQuoteError : ammQuoteFromLedger != null ? `$${ammQuoteFromLedger.toFixed(4)}` : '—'}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SharedPnLGauge />
        <DCAChart />
        <ArbitrageHeatmap />
        <StrategyLadder currentPrice={currentPrice} />
      </div>
    </motion.div>
  );
}
