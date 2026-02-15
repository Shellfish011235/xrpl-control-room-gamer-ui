/**
 * DCA averaging chart: entry levels and avg cost line.
 */

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useStrategyStore } from '../../store/strategyStore';

export function DCAChart() {
  const dcaEntries = useStrategyStore((s) => s.dcaEntries);
  const dcaAvgCost = useStrategyStore((s) => s.dcaAvgCost);

  const data = useMemo(() => {
    return dcaEntries.map((e, i) => ({
      index: i + 1,
      price: e.price,
      avgCostAfter: e.avgCostAfter,
      time: new Date(e.timestamp).toLocaleTimeString(),
    }));
  }, [dcaEntries]);

  if (data.length === 0) {
    return (
      <div className="cyber-panel p-4 h-[200px] flex items-center justify-center text-cyber-muted text-sm">
        No DCA entries yet. Enable DCA and run Orchestra to see levels.
      </div>
    );
  }

  return (
    <div className="cyber-panel p-4">
      <p className="text-cyber-muted text-xs font-cyber mb-2">DCA ENTRY LEVELS</p>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dcaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cyber-cyan)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--cyber-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="index" tick={{ fontSize: 10 }} stroke="var(--cyber-muted)" />
            <YAxis tick={{ fontSize: 10 }} stroke="var(--cyber-muted)" domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: 'var(--cyber-darker)', border: '1px solid var(--cyber-cyan)' }}
              labelStyle={{ color: 'var(--cyber-cyan)' }}
              formatter={(value: number) => [value.toFixed(4), 'Price']}
              labelFormatter={(_, payload) => payload[0]?.payload?.time ?? ''}
            />
            <ReferenceLine y={dcaAvgCost ?? undefined} stroke="var(--cyber-yellow)" strokeDasharray="2 2" />
            <Area type="monotone" dataKey="price" stroke="var(--cyber-cyan)" fill="url(#dcaFill)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {dcaAvgCost != null && (
        <p className="text-[10px] text-cyber-muted mt-1">Avg cost: {dcaAvgCost.toFixed(4)} (dashed)</p>
      )}
    </div>
  );
}
