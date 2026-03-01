/**
 * Quant formulas card: Monte Carlo, SE, Brier, ESS.
 * Don't trade Polymarket (or other prediction markets) like a biased coin.
 */

import React, { useState, useMemo } from 'react';
import { Calculator, Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  standardError,
  brierScore,
  brierScoreInterpretation,
  edgeCheck,
  sampleSizeForPrecision,
  type EdgeCheck as EdgeCheckType,
} from '../services/predictionMarketQuant';

export function QuantFormulasCard() {
  const [expanded, setExpanded] = useState(false);
  const [yourEstimate, setYourEstimate] = useState('0.68');
  const [marketPrice, setMarketPrice] = useState('0.61');
  const [N, setN] = useState('10000');
  const [brierPreds, setBrierPreds] = useState('0.7, 0.3, 0.9, 0.5');
  const [brierOutcomes, setBrierOutcomes] = useState('1, 0, 1, 0');

  const edge: EdgeCheckType | null = useMemo(() => {
    const p = parseFloat(yourEstimate);
    const m = parseFloat(marketPrice);
    const n = parseInt(N, 10);
    if (Number.isNaN(p) || Number.isNaN(m) || !Number.isFinite(n) || n <= 0) return null;
    return edgeCheck(p, m, n);
  }, [yourEstimate, marketPrice, N]);

  const brier = useMemo(() => {
    const preds = brierPreds.split(/[\s,]+/).map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
    const outs = brierOutcomes.split(/[\s,]+/).map((s) => parseFloat(s.trim())).filter((n) => !Number.isNaN(n));
    if (preds.length === 0 || outs.length === 0) return null;
    return brierScore(preds, outs);
  }, [brierPreds, brierOutcomes]);

  const brierInterp = brier != null ? brierScoreInterpretation(brier) : null;
  const se = useMemo(() => {
    const p = parseFloat(yourEstimate);
    const n = parseInt(N, 10);
    if (Number.isNaN(p) || !Number.isFinite(n) || n <= 0) return null;
    return standardError(p, n);
  }, [yourEstimate, N]);

  const nFor01 = sampleSizeForPrecision(0.01);

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-dark/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Calculator className="text-cyber-cyan" size={20} />
          <span className="font-cyber text-sm text-cyber-cyan uppercase tracking-wider">
            4 Quant Formulas (Prediction Markets)
          </span>
          <span title="Monte Carlo, SE, Brier, ESS"><Info size={14} className="text-cyber-muted" /></span>
        </div>
        {expanded ? <ChevronUp size={18} className="text-cyber-muted" /> : <ChevronDown size={18} className="text-cyber-muted" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-cyber-border pt-3">
          <ul className="text-xs text-cyber-muted space-y-1 list-disc list-inside">
            <li><strong className="text-cyber-text">1. Probability (Monte Carlo):</strong> p̂ = (1/N) Σ 1_A — get a number, not a &quot;70% feeling&quot;.</li>
            <li><strong className="text-cyber-text">2. Standard error:</strong> SE = √(p(1−p)/N) — if |your p − market| &lt; ~2×SE, edge is noise.</li>
            <li><strong className="text-cyber-text">3. Brier score:</strong> BS = (1/N) Σ (p_i − y_i)² — &lt;0.20 good; worse → no systematic edge.</li>
            <li><strong className="text-cyber-text">4. ESS (particle filter):</strong> ESS = 1/Σ w̃_i² — don’t overreact to every tick; resample when ESS &lt; N/2.</li>
          </ul>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-cyber-border bg-cyber-darker/80 p-3">
              <p className="text-[10px] text-cyber-cyan uppercase tracking-wider mb-2">Edge check (your estimate vs market)</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <label className="text-[10px] text-cyber-muted w-20">Your p̂</label>
                  <input
                    type="text"
                    value={yourEstimate}
                    onChange={(e) => setYourEstimate(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text font-mono"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-[10px] text-cyber-muted w-20">Market</label>
                  <input
                    type="text"
                    value={marketPrice}
                    onChange={(e) => setMarketPrice(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text font-mono"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-[10px] text-cyber-muted w-20">N</label>
                  <input
                    type="text"
                    value={N}
                    onChange={(e) => setN(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text font-mono"
                  />
                </div>
                {edge && (
                  <div className="pt-1">
                    <p className={`text-xs font-cyber ${edge.hasEdge ? 'text-cyber-green' : 'text-cyber-yellow'}`}>
                      {edge.message}
                    </p>
                    <p className="text-[10px] text-cyber-muted">SE ≈ {se?.toFixed(4) ?? '—'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-cyber-border bg-cyber-darker/80 p-3">
              <p className="text-[10px] text-cyber-cyan uppercase tracking-wider mb-2">Brier score (predictions vs outcomes)</p>
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <label className="text-[10px] text-cyber-muted w-16">Preds</label>
                  <input
                    type="text"
                    value={brierPreds}
                    onChange={(e) => setBrierPreds(e.target.value)}
                    placeholder="0.7, 0.3, 0.9, 0.5"
                    className="flex-1 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text font-mono"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-[10px] text-cyber-muted w-16">Outcomes</label>
                  <input
                    type="text"
                    value={brierOutcomes}
                    onChange={(e) => setBrierOutcomes(e.target.value)}
                    placeholder="1, 0, 1, 0"
                    className="flex-1 px-2 py-1 rounded bg-cyber-dark border border-cyber-border text-xs text-cyber-text font-mono"
                  />
                </div>
                {brier != null && brierInterp && (
                  <p className={`text-xs font-cyber ${brierInterp.color === 'cyber-green' ? 'text-cyber-green' : brierInterp.color === 'cyber-red' ? 'text-cyber-red' : brierInterp.color === 'cyber-yellow' ? 'text-cyber-yellow' : 'text-cyber-cyan'}`}>
                    Brier = {brier.toFixed(4)} — {brierInterp.level}
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-cyber-muted">
            For ±0.01 precision at 95% (p=0.5): N ≥ {nFor01.toLocaleString()}.
          </p>
        </div>
      )}
    </div>
  );
}
