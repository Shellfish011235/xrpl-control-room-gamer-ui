/**
 * Strategy ladder: DCA entry levels and arbitrage alerts on a price ladder.
 */

import React from 'react';
import { useStrategyStore } from '../../store/strategyStore';

interface StrategyLadderProps {
  currentPrice: number;
  compact?: boolean;
}

export function StrategyLadder({ currentPrice, compact }: StrategyLadderProps) {
  const dcaEntries = useStrategyStore((s) => s.dcaEntries);
  const dcaAvgCost = useStrategyStore((s) => s.dcaAvgCost);
  const arbOpportunities = useStrategyStore((s) => s.arbOpportunities);
  const enabled = useStrategyStore((s) => s.enabled);

  const recentDca = dcaEntries.slice(-10);
  const recentArb = arbOpportunities.slice(-5);
  const hasDCA = enabled.dca && (recentDca.length > 0 || dcaAvgCost != null);
  const hasArb = enabled.arbitrage && recentArb.length > 0;

  if (!hasDCA && !hasArb && !compact) {
    return (
      <div className="cyber-panel p-4">
        <p className="text-cyber-muted text-xs font-cyber mb-2">STRATEGY LADDER</p>
        <p className="text-cyber-muted text-sm">Enable DCA or Arbitrage and run Orchestra to see levels and alerts.</p>
      </div>
    );
  }

  return (
    <div className="cyber-panel p-4">
      <p className="text-cyber-muted text-xs font-cyber mb-2">STRATEGY LADDER</p>
      <div className="space-y-3">
        {hasDCA && (
          <div>
            <p className="text-cyber-cyan text-[10px] uppercase mb-1">DCA entries</p>
            <ul className="space-y-0.5">
              {dcaAvgCost != null && (
                <li className="text-xs text-cyber-yellow">Avg cost: {dcaAvgCost.toFixed(4)}</li>
              )}
              {recentDca.slice(-5).reverse().map((e) => (
                <li key={e.id} className="text-xs text-cyber-text">
                  {e.price.toFixed(4)} — {e.amountXRP} XRP
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasArb && (
          <div>
            <p className="text-cyber-cyan text-[10px] uppercase mb-1">Arb alerts</p>
            <ul className="space-y-0.5">
              {recentArb.map((o) => (
                <li key={o.id} className="text-xs text-cyber-green">
                  {o.spreadBps.toFixed(0)} bps — {o.direction.replace('_', ' ')}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-cyber-muted text-[10px]">Mid: {currentPrice.toFixed(4)}</p>
      </div>
    </div>
  );
}
