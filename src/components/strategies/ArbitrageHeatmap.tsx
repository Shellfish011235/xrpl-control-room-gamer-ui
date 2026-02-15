/**
 * Arbitrage opportunity heatmap: CLOB mid vs AMM quote spread by time.
 */

import React, { useMemo } from 'react';
import { useStrategyStore } from '../../store/strategyStore';

export function ArbitrageHeatmap() {
  const arbOpportunities = useStrategyStore((s) => s.arbOpportunities);

  const rows = useMemo(() => {
    return arbOpportunities.slice(-20).reverse().map((o) => ({
      ...o,
      heat: Math.min(100, o.spreadBps * 2),
    }));
  }, [arbOpportunities]);

  if (rows.length === 0) {
    return (
      <div className="cyber-panel p-4 h-[180px] flex items-center justify-center text-cyber-muted text-sm">
        No arb opportunities yet. Enable Arbitrage and run Orchestra with CLOB/AMM data.
      </div>
    );
  }

  return (
    <div className="cyber-panel p-4">
      <p className="text-cyber-muted text-xs font-cyber mb-2">ARB OPPORTUNITIES (CLOB vs AMM)</p>
      <div className="space-y-1 max-h-[180px] overflow-y-auto">
        {rows.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between text-xs py-1 px-2 rounded"
            style={{ background: `rgba(0, 255, 255, ${o.heat / 200})` }}
          >
            <span className="text-cyber-text">{o.pair}</span>
            <span className="text-cyber-cyan font-mono">{o.spreadBps.toFixed(1)} bps</span>
            <span className="text-cyber-muted">{new Date(o.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
