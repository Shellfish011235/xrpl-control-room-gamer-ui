// Risk Dashboard Component
// Comprehensive portfolio risk analytics display

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertTriangle, TrendingDown, TrendingUp,
  Activity, Percent, BarChart3, PieChart, Target,
  Zap, ChevronRight, RefreshCw, Info
} from 'lucide-react';
import {
  useRiskMetrics,
  useStressTests,
  type RiskMetrics,
  type ScenarioAnalysis,
  type PortfolioData
} from '../../services/advancedRiskMetrics';
import { usePaperTradingStore } from '../../store/paperTradingStore';

interface RiskDashboardProps {
  compact?: boolean;
}

export function RiskDashboard({ compact = false }: RiskDashboardProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'stress' | 'sizing'>('metrics');
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  
  // Get portfolio data from paper trading store
  const { positions, cashBalance, getTotalPortfolioValue, tradeHistory, startingBalance } = usePaperTradingStore();
  
  const portfolioData: PortfolioData = useMemo(() => {
    const totalValue = getTotalPortfolioValue();
    
    // Calculate daily returns from trade history (simplified)
    const returns: number[] = [];
    for (let i = 0; i < 30; i++) {
      returns.push((Math.random() - 0.48) * 0.05); // Simulated for now
    }
    
    return {
      totalValue,
      cashBalance,
      positions: positions.map(p => ({
        asset: p.asset,
        quantity: p.quantity,
        currentPrice: p.currentPrice,
        value: p.quantity * p.currentPrice,
        weight: totalValue > 0 ? ((p.quantity * p.currentPrice) / totalValue) * 100 : 0,
        averageCost: p.averageCost,
        unrealizedPnL: p.unrealizedPnL,
        unrealizedPnLPercent: p.unrealizedPnLPercent,
      })),
      returns,
    };
  }, [positions, cashBalance, getTotalPortfolioValue]);
  
  const metrics = useRiskMetrics(portfolioData);
  const stressTests = useStressTests(portfolioData);
  
  if (!metrics) {
    return (
      <div className="cyber-panel p-4 flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-cyber-cyan animate-spin" />
        <span className="ml-2 text-cyber-muted">Calculating risk metrics...</span>
      </div>
    );
  }
  
  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyber-purple" />
          <span className="font-cyber text-sm text-cyber-purple">RISK DASHBOARD</span>
        </div>
        <div className="flex items-center gap-1">
          {['metrics', 'stress', 'sizing'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-1 text-xs rounded capitalize ${
                activeTab === tab 
                  ? 'bg-cyber-purple/20 text-cyber-purple' 
                  : 'bg-cyber-darker text-cyber-muted hover:text-cyber-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'metrics' && (
          <motion.div
            key="metrics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Risk Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <RiskCard
                label="VaR (95%)"
                value={`${metrics.var95.toFixed(2)}%`}
                status={metrics.var95 > 10 ? 'danger' : metrics.var95 > 5 ? 'warning' : 'good'}
                tooltip="Maximum expected daily loss with 95% confidence"
              />
              <RiskCard
                label="CVaR"
                value={`${metrics.cvar95.toFixed(2)}%`}
                status={metrics.cvar95 > 15 ? 'danger' : metrics.cvar95 > 8 ? 'warning' : 'good'}
                tooltip="Expected loss when VaR is exceeded"
              />
              <RiskCard
                label="Max Drawdown"
                value={`${metrics.maxDrawdown.toFixed(2)}%`}
                status={metrics.maxDrawdown > 30 ? 'danger' : metrics.maxDrawdown > 15 ? 'warning' : 'good'}
                tooltip="Largest peak-to-trough decline"
              />
              <RiskCard
                label="Volatility"
                value={`${metrics.portfolioVolatility.toFixed(1)}%`}
                status={metrics.portfolioVolatility > 80 ? 'danger' : metrics.portfolioVolatility > 50 ? 'warning' : 'good'}
                tooltip="Annualized portfolio volatility"
              />
            </div>
            
            {/* Performance Ratios */}
            <div className="mb-4">
              <p className="text-xs text-cyber-cyan mb-2 font-cyber">PERFORMANCE RATIOS</p>
              <div className="grid grid-cols-4 gap-2">
                <RatioCard label="Sharpe" value={metrics.sharpeRatio} benchmark={1} />
                <RatioCard label="Sortino" value={metrics.sortinoRatio} benchmark={1.5} />
                <RatioCard label="Calmar" value={metrics.calmarRatio} benchmark={1} />
                <RatioCard label="Beta" value={metrics.beta} benchmark={1} neutral />
              </div>
            </div>
            
            {/* Exposure & Concentration */}
            <div className="grid grid-cols-2 gap-4">
              {/* Exposure */}
              <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border">
                <p className="text-xs text-cyber-cyan mb-2 font-cyber">EXPOSURE</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Gross</span>
                    <span className="text-cyber-text">${metrics.grossExposure.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Net</span>
                    <span className={metrics.netExposure >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>
                      ${metrics.netExposure.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Leverage</span>
                    <span className={`${metrics.leverage > 2 ? 'text-cyber-red' : 'text-cyber-text'}`}>
                      {metrics.leverage.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Cash</span>
                    <span className="text-cyber-text">{metrics.cashWeight.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Concentration */}
              <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border">
                <p className="text-xs text-cyber-cyan mb-2 font-cyber">CONCENTRATION</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Largest Position</span>
                    <span className={`${metrics.largestPosition > 30 ? 'text-cyber-yellow' : 'text-cyber-text'}`}>
                      {metrics.largestPosition.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Top 5 Positions</span>
                    <span className="text-cyber-text">{metrics.top5Concentration.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">HHI</span>
                    <span className="text-cyber-text">{metrics.herfindahlIndex.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-cyber-muted">Positions</span>
                    <span className="text-cyber-text">{portfolioData.positions.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tail Risk */}
            {!compact && (
              <div className="mt-4 p-3 rounded bg-cyber-darker/50 border border-cyber-border">
                <p className="text-xs text-cyber-cyan mb-2 font-cyber">TAIL RISK</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-cyber-muted">Skewness</p>
                    <p className={`font-cyber text-sm ${
                      metrics.skewness < -0.5 ? 'text-cyber-red' : 
                      metrics.skewness > 0.5 ? 'text-cyber-green' : 'text-cyber-text'
                    }`}>
                      {metrics.skewness.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-cyber-muted">
                      {metrics.skewness < 0 ? 'Left-tailed' : 'Right-tailed'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-cyber-muted">Kurtosis</p>
                    <p className={`font-cyber text-sm ${
                      metrics.kurtosis > 3 ? 'text-cyber-yellow' : 'text-cyber-text'
                    }`}>
                      {metrics.kurtosis.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-cyber-muted">
                      {metrics.kurtosis > 3 ? 'Fat tails' : 'Normal'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-cyber-muted">Tail Ratio</p>
                    <p className={`font-cyber text-sm ${
                      metrics.tailRatio > 1.2 ? 'text-cyber-green' :
                      metrics.tailRatio < 0.8 ? 'text-cyber-red' : 'text-cyber-text'
                    }`}>
                      {metrics.tailRatio.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-cyber-muted">
                      {metrics.tailRatio > 1 ? 'Favorable' : 'Unfavorable'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'stress' && (
          <motion.div
            key="stress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <p className="text-xs text-cyber-muted mb-3">
              Scenario analysis showing portfolio impact under various market conditions
            </p>
            
            {stressTests.map((scenario) => (
              <div
                key={scenario.name}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  scenario.portfolioImpact < -20 ? 'bg-cyber-red/10 border-cyber-red/30' :
                  scenario.portfolioImpact < -10 ? 'bg-cyber-yellow/10 border-cyber-yellow/30' :
                  scenario.portfolioImpact > 10 ? 'bg-cyber-green/10 border-cyber-green/30' :
                  'bg-cyber-darker/50 border-cyber-border'
                }`}
                onClick={() => setExpandedScenario(
                  expandedScenario === scenario.name ? null : scenario.name
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {scenario.portfolioImpact < 0 ? (
                      <TrendingDown className={`w-4 h-4 ${
                        scenario.portfolioImpact < -20 ? 'text-cyber-red' : 'text-cyber-yellow'
                      }`} />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-cyber-green" />
                    )}
                    <div>
                      <p className="text-sm text-cyber-text font-medium">{scenario.name}</p>
                      <p className="text-[10px] text-cyber-muted">{scenario.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-cyber text-lg ${
                      scenario.portfolioImpact < -20 ? 'text-cyber-red' :
                      scenario.portfolioImpact < 0 ? 'text-cyber-yellow' :
                      'text-cyber-green'
                    }`}>
                      {scenario.portfolioImpact > 0 ? '+' : ''}{scenario.portfolioImpact.toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-cyber-muted">
                      ${scenario.dollarImpact.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedScenario === scenario.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-cyber-border/50"
                    >
                      <p className="text-xs text-cyber-muted mb-2">Position Impacts:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {scenario.positionImpacts.slice(0, 6).map((pos) => (
                          <div key={pos.asset} className="flex justify-between text-xs">
                            <span className="text-cyber-text">{pos.asset}</span>
                            <span className={pos.changePercent >= 0 ? 'text-cyber-green' : 'text-cyber-red'}>
                              {pos.changePercent >= 0 ? '+' : ''}{pos.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
        
        {activeTab === 'sizing' && (
          <motion.div
            key="sizing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PositionSizerWidget portfolioValue={portfolioData.totalValue} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function RiskCard({ 
  label, 
  value, 
  status, 
  tooltip 
}: { 
  label: string; 
  value: string; 
  status: 'good' | 'warning' | 'danger';
  tooltip: string;
}) {
  const colors = {
    good: 'border-cyber-green/30 bg-cyber-green/10',
    warning: 'border-cyber-yellow/30 bg-cyber-yellow/10',
    danger: 'border-cyber-red/30 bg-cyber-red/10',
  };
  
  const textColors = {
    good: 'text-cyber-green',
    warning: 'text-cyber-yellow',
    danger: 'text-cyber-red',
  };
  
  return (
    <div className={`p-2 rounded border ${colors[status]} group relative`}>
      <p className="text-[10px] text-cyber-muted">{label}</p>
      <p className={`font-cyber text-lg ${textColors[status]}`}>{value}</p>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-[10px] text-cyber-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {tooltip}
      </div>
    </div>
  );
}

function RatioCard({ 
  label, 
  value, 
  benchmark,
  neutral = false 
}: { 
  label: string; 
  value: number; 
  benchmark: number;
  neutral?: boolean;
}) {
  const isGood = neutral ? Math.abs(value - benchmark) < 0.3 : value >= benchmark;
  
  return (
    <div className="p-2 rounded bg-cyber-darker/50 text-center">
      <p className="text-[10px] text-cyber-muted">{label}</p>
      <p className={`font-cyber text-sm ${isGood ? 'text-cyber-green' : 'text-cyber-yellow'}`}>
        {value.toFixed(2)}
      </p>
      <div className="h-1 mt-1 rounded-full bg-cyber-darker overflow-hidden">
        <div 
          className={`h-full ${isGood ? 'bg-cyber-green' : 'bg-cyber-yellow'}`}
          style={{ width: `${Math.min(100, (value / (benchmark * 2)) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function PositionSizerWidget({ portfolioValue }: { portfolioValue: number }) {
  const [asset, setAsset] = useState('XRP');
  const [winRate, setWinRate] = useState(55);
  const [avgWin, setAvgWin] = useState(15);
  const [avgLoss, setAvgLoss] = useState(10);
  const [volatility, setVolatility] = useState(5);
  
  const { calculatePositionSize } = require('../../services/advancedRiskMetrics');
  
  const sizing = useMemo(() => {
    return calculatePositionSize(
      asset,
      portfolioValue,
      winRate / 100,
      avgWin / 100,
      avgLoss / 100,
      volatility / 100,
      0.02
    );
  }, [asset, portfolioValue, winRate, avgWin, avgLoss, volatility]);
  
  return (
    <div className="space-y-4">
      <p className="text-xs text-cyber-muted">
        Calculate optimal position size based on your risk parameters
      </p>
      
      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-cyber-muted">Win Rate (%)</label>
          <input
            type="number"
            value={winRate}
            onChange={(e) => setWinRate(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
          />
        </div>
        <div>
          <label className="text-[10px] text-cyber-muted">Avg Win (%)</label>
          <input
            type="number"
            value={avgWin}
            onChange={(e) => setAvgWin(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
          />
        </div>
        <div>
          <label className="text-[10px] text-cyber-muted">Avg Loss (%)</label>
          <input
            type="number"
            value={avgLoss}
            onChange={(e) => setAvgLoss(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
          />
        </div>
        <div>
          <label className="text-[10px] text-cyber-muted">Asset Volatility (%)</label>
          <input
            type="number"
            value={volatility}
            onChange={(e) => setVolatility(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
          />
        </div>
      </div>
      
      {/* Results */}
      <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-cyber-purple font-cyber">RECOMMENDED SIZE</span>
          <span className="font-cyber text-xl text-cyber-purple">
            {sizing.recommendedSize.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-cyber-muted mb-2">
          ${((portfolioValue * sizing.recommendedSize) / 100).toLocaleString()} of ${portfolioValue.toLocaleString()}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex justify-between">
            <span className="text-cyber-muted">Kelly:</span>
            <span className="text-cyber-text">{sizing.kellySize.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Fixed Frac:</span>
            <span className="text-cyber-text">{sizing.fixedFractional.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Vol Adj:</span>
            <span className="text-cyber-text">{sizing.volatilityAdjusted.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-muted">Risk Parity:</span>
            <span className="text-cyber-text">{sizing.riskParity.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Reasoning */}
      <div className="space-y-1">
        {sizing.reasoning.map((reason: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 text-[10px] text-cyber-muted">
            <Zap size={10} className="text-cyber-yellow shrink-0 mt-0.5" />
            <span>{reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskDashboard;
