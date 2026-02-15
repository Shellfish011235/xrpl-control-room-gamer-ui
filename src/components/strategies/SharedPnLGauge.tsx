/**
 * Shared PnL gauge across strategy agents (Grid, DCA, MM, Arbitrage).
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useStrategyStore, type StrategyId } from '../../store/strategyStore';

const LABELS: Record<StrategyId, string> = {
  grid: 'Grid',
  dca: 'DCA',
  mm: 'MM',
  arbitrage: 'Arb',
};

export function SharedPnLGauge() {
  const pnlByStrategy = useStrategyStore((s) => s.pnlByStrategy);
  const totalRealized = Object.values(pnlByStrategy).reduce((a, p) => a + p.realizedPnL, 0);
  const totalUnrealized = Object.values(pnlByStrategy).reduce((a, p) => a + p.unrealizedPnL, 0);
  const total = totalRealized + totalUnrealized;
  const isPositive = total >= 0;

  return (
    <div className="cyber-panel p-4">
      <p className="text-cyber-muted text-xs font-cyber mb-2">STRATEGY PNL (SIM)</p>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-lg font-mono ${isPositive ? 'text-cyber-green' : 'text-cyber-red'}`}>
          {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <span>{total >= 0 ? '+' : ''}{total.toFixed(2)}</span>
        </div>
        <span className="text-cyber-muted text-xs">USD</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.keys(LABELS) as StrategyId[]).map((id) => {
          const p = pnlByStrategy[id];
          const r = p.realizedPnL + p.unrealizedPnL;
          return (
            <span key={id} className="text-[10px] text-cyber-muted">
              {LABELS[id]}: <span className={r >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>{r.toFixed(2)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
