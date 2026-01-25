// Liquidation Heatmap Component
// Visual representation of liquidation levels across price ranges

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, TrendingUp, TrendingDown, AlertTriangle, 
  Target, Activity, DollarSign, Percent, RefreshCw,
  ChevronUp, ChevronDown, Zap
} from 'lucide-react';
import { 
  useFullLiquidationAnalysis,
  type LiquidationHeatmapData,
  type LiquidationLevel 
} from '../../services/liquidationHeatmap';

interface LiquidationHeatmapProps {
  symbol: string;
  currentPrice: number;
  compact?: boolean;
}

export function LiquidationHeatmap({ symbol, currentPrice, compact = false }: LiquidationHeatmapProps) {
  const { data, loading, error } = useFullLiquidationAnalysis(symbol, currentPrice);
  const [showLongs, setShowLongs] = useState(true);
  const [showShorts, setShowShorts] = useState(true);
  
  if (loading) {
    return (
      <div className="cyber-panel p-4 flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-cyber-cyan animate-spin" />
        <span className="ml-2 text-cyber-muted">Loading liquidation data...</span>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="cyber-panel p-4 flex items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-6 h-6 text-cyber-red" />
        <span className="ml-2 text-cyber-muted">Failed to load liquidation data</span>
      </div>
    );
  }
  
  const { heatmap, openInterest, fundingRate, leverage, tradingInsights } = data;
  
  // Find max liquidation value for scaling
  const maxLiq = Math.max(
    ...heatmap.levels.map(l => Math.max(l.longLiquidations, l.shortLiquidations))
  );
  
  // Get levels around current price (most relevant)
  const relevantLevels = heatmap.levels.filter(
    l => Math.abs(l.priceFromCurrent) <= 20
  );
  
  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-cyber-orange" />
          <span className="font-cyber text-sm text-cyber-orange">LIQUIDATION HEATMAP</span>
          <span className="text-xs text-cyber-muted ml-2">{symbol}</span>
          <span className="px-2 py-0.5 rounded text-[9px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30">
            SIMULATED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLongs(!showLongs)}
            className={`px-2 py-1 text-xs rounded ${
              showLongs ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-darker text-cyber-muted'
            }`}
          >
            Longs
          </button>
          <button
            onClick={() => setShowShorts(!showShorts)}
            className={`px-2 py-1 text-xs rounded ${
              showShorts ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-darker text-cyber-muted'
            }`}
          >
            Shorts
          </button>
        </div>
      </div>
      
      {/* Current Price Indicator */}
      <div className="flex items-center justify-between mb-4 p-3 rounded bg-cyber-darker/50 border border-cyber-border">
        <div>
          <p className="text-xs text-cyber-muted">Current Price</p>
          <p className="font-cyber text-lg text-cyber-text">${currentPrice.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-cyber-muted">Liquidation Risk</p>
          <p className={`font-cyber text-lg ${
            heatmap.liquidationRiskScore > 70 ? 'text-cyber-red' :
            heatmap.liquidationRiskScore > 40 ? 'text-cyber-yellow' : 'text-cyber-green'
          }`}>
            {heatmap.liquidationRiskScore}%
          </p>
        </div>
      </div>
      
      {/* Heatmap Visualization */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-cyber-green flex items-center gap-1">
            <ChevronUp size={12} /> Shorts Liquidated
          </span>
          <span className="text-xs text-cyber-red flex items-center gap-1">
            Longs Liquidated <ChevronDown size={12} />
          </span>
        </div>
        
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          {relevantLevels.map((level, idx) => {
            const isCurrentPrice = Math.abs(level.priceFromCurrent) < 1;
            const longWidth = maxLiq > 0 ? (level.longLiquidations / maxLiq) * 100 : 0;
            const shortWidth = maxLiq > 0 ? (level.shortLiquidations / maxLiq) * 100 : 0;
            
            return (
              <div
                key={idx}
                className={`relative flex items-center h-6 rounded ${
                  isCurrentPrice ? 'bg-cyber-cyan/20 border border-cyber-cyan/50' : 'bg-cyber-darker/30'
                }`}
              >
                {/* Long liquidations (left side - red, below current price) */}
                {showLongs && level.priceFromCurrent < 0 && (
                  <div 
                    className="absolute left-0 h-full bg-gradient-to-r from-cyber-red/80 to-cyber-red/40 rounded-l"
                    style={{ width: `${longWidth}%`, opacity: 0.3 + (level.intensity / 100) * 0.7 }}
                  />
                )}
                
                {/* Short liquidations (right side - green, above current price) */}
                {showShorts && level.priceFromCurrent > 0 && (
                  <div 
                    className="absolute right-0 h-full bg-gradient-to-l from-cyber-green/80 to-cyber-green/40 rounded-r"
                    style={{ width: `${shortWidth}%`, opacity: 0.3 + (level.intensity / 100) * 0.7 }}
                  />
                )}
                
                {/* Price label */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-[10px] font-medium ${
                    isCurrentPrice ? 'text-cyber-cyan' : 'text-cyber-muted'
                  }`}>
                    ${level.price.toLocaleString()} 
                    <span className="opacity-60 ml-1">
                      ({level.priceFromCurrent > 0 ? '+' : ''}{level.priceFromCurrent.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                
                {/* Liquidation value on hover */}
                {(level.longLiquidations > 0 || level.shortLiquidations > 0) && (
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-between px-2 bg-cyber-darker/80 transition-opacity">
                    <span className="text-[10px] text-cyber-red">
                      ${(level.longLiquidations / 1000000).toFixed(1)}M
                    </span>
                    <span className="text-[10px] text-cyber-green">
                      ${(level.shortLiquidations / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Key Levels */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {heatmap.majorLongLiquidationZone && (
          <div className="p-2 rounded bg-cyber-red/10 border border-cyber-red/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown size={12} className="text-cyber-red" />
              <span className="text-[10px] text-cyber-red">Major Long Liq Zone</span>
            </div>
            <p className="font-cyber text-sm text-cyber-text">
              ${heatmap.majorLongLiquidationZone.price.toLocaleString()}
            </p>
            <p className="text-[10px] text-cyber-muted">
              ${(heatmap.majorLongLiquidationZone.value / 1000000).toFixed(1)}M at risk
            </p>
          </div>
        )}
        
        {heatmap.majorShortLiquidationZone && (
          <div className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={12} className="text-cyber-green" />
              <span className="text-[10px] text-cyber-green">Major Short Liq Zone</span>
            </div>
            <p className="font-cyber text-sm text-cyber-text">
              ${heatmap.majorShortLiquidationZone.price.toLocaleString()}
            </p>
            <p className="text-[10px] text-cyber-muted">
              ${(heatmap.majorShortLiquidationZone.value / 1000000).toFixed(1)}M at risk
            </p>
          </div>
        )}
      </div>
      
      {/* Stats Grid */}
      {!compact && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="p-2 rounded bg-cyber-darker/50 text-center">
              <p className="text-[10px] text-cyber-muted">Long/Short Ratio</p>
              <p className={`font-cyber text-sm ${
                heatmap.longShortRatio > 1.2 ? 'text-cyber-red' :
                heatmap.longShortRatio < 0.8 ? 'text-cyber-green' : 'text-cyber-text'
              }`}>
                {heatmap.longShortRatio.toFixed(2)}
              </p>
            </div>
            <div className="p-2 rounded bg-cyber-darker/50 text-center">
              <p className="text-[10px] text-cyber-muted">Funding Rate</p>
              <p className={`font-cyber text-sm ${
                fundingRate.fundingRate > 0 ? 'text-cyber-green' : 'text-cyber-red'
              }`}>
                {(fundingRate.fundingRatePercent).toFixed(4)}%
              </p>
            </div>
            <div className="p-2 rounded bg-cyber-darker/50 text-center">
              <p className="text-[10px] text-cyber-muted">Avg Leverage</p>
              <p className="font-cyber text-sm text-cyber-yellow">
                {leverage.averageLeverage.toFixed(1)}x
              </p>
            </div>
            <div className="p-2 rounded bg-cyber-darker/50 text-center">
              <p className="text-[10px] text-cyber-muted">Magnet Price</p>
              <p className="font-cyber text-sm text-cyber-purple">
                ${heatmap.magnetPrice.toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Trading Insights */}
          {tradingInsights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-cyber-cyan font-cyber">INSIGHTS</p>
              {tradingInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-cyber-text">
                  <Zap size={12} className="text-cyber-yellow shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LiquidationHeatmap;
