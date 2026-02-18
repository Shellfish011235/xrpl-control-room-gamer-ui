/**
 * PathVisualization – animated route display for Liquidity Crush / pathfinding.
 * Shows path as nodes (currencies) with arrows; "Path found: USD → XRP → EUR".
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

interface PathVisualizationProps {
  pathSteps: string[];
  pathLabel: string;
  success: boolean;
  effectiveRate?: number;
  liquidityScore?: number;
  className?: string;
}

export function PathVisualization({
  pathSteps,
  pathLabel,
  success,
  effectiveRate,
  liquidityScore,
  className = '',
}: PathVisualizationProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (pathSteps.length === 0) return null;

  return (
    <div className={`rounded-lg border border-cyber-border bg-cyber-darker/80 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className={success ? 'text-cyber-green' : 'text-cyber-yellow'} />
        <span className="text-xs font-cyber text-cyber-muted">
          {success ? 'Path found' : 'Path'}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {pathSteps.map((step, i) => (
          <React.Fragment key={`${step}-${i}`}>
            {mounted && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="px-2 py-1 rounded bg-cyber-cyan/20 text-cyber-cyan text-xs font-medium"
              >
                {step}
              </motion.span>
            )}
            {!mounted && (
              <span className="px-2 py-1 rounded bg-cyber-cyan/20 text-cyber-cyan text-xs font-medium">
                {step}
              </span>
            )}
            {i < pathSteps.length - 1 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.05 }}
                className="text-cyber-muted"
              >
                <ArrowRight size={14} className="inline" />
              </motion.span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-[10px] text-cyber-muted mt-2 truncate" title={pathLabel}>
        {pathLabel}
      </p>
      {(effectiveRate != null || liquidityScore != null) && (
        <div className="flex gap-3 mt-2 text-[10px] text-cyber-muted">
          {effectiveRate != null && (
            <span>Rate: {effectiveRate.toFixed(4)}</span>
          )}
          {liquidityScore != null && (
            <span>Liquidity: {Math.round(liquidityScore)}%</span>
          )}
        </div>
      )}
    </div>
  );
}
