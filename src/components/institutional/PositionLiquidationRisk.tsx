// Position Liquidation Risk Component
// Shows liquidation warnings for paper trading positions

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, TrendingDown, TrendingUp, Zap, Target, Info } from 'lucide-react';
import { usePaperTradingStore, type LiquidationWarning } from '../../store/paperTradingStore';
import { 
  analyzePositionLiquidation, 
  getLiquidationRiskAssessment,
  type PositionLiquidationAnalysis,
  type LiquidationRiskAssessment 
} from '../../services/liquidationTradingIntegration';

interface PositionLiquidationRiskProps {
  compact?: boolean;
  currentPrice?: number;  // Current XRP price for analysis
}

// Risk level colors and icons
const riskStyles = {
  safe: { bg: 'bg-cyber-green/10', border: 'border-cyber-green/30', text: 'text-cyber-green', icon: Shield },
  caution: { bg: 'bg-cyber-yellow/10', border: 'border-cyber-yellow/30', text: 'text-cyber-yellow', icon: Info },
  warning: { bg: 'bg-cyber-orange/10', border: 'border-cyber-orange/30', text: 'text-cyber-orange', icon: AlertTriangle },
  danger: { bg: 'bg-cyber-red/10', border: 'border-cyber-red/30', text: 'text-cyber-red', icon: Zap },
};

// Single position risk card
function PositionRiskCard({ analysis }: { analysis: PositionLiquidationAnalysis }) {
  const style = riskStyles[analysis.riskLevel];
  const Icon = style.icon;
  
  return (
    <div className={`p-3 rounded border ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className={style.text} />
          <span className="font-cyber text-xs text-cyber-text">{analysis.asset}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text} uppercase`}>
            {analysis.riskLevel}
          </span>
        </div>
        <span className="text-xs text-cyber-muted">
          {analysis.positionType === 'long' ? (
            <span className="flex items-center gap-1"><TrendingUp size={10} /> Long</span>
          ) : (
            <span className="flex items-center gap-1"><TrendingDown size={10} /> Short</span>
          )}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <span className="text-cyber-muted">Entry:</span>
          <span className="text-cyber-text ml-1">${analysis.entryPrice.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-cyber-muted">Current:</span>
          <span className="text-cyber-text ml-1">${analysis.currentPrice.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-cyber-muted">Liq Zone:</span>
          <span className={`ml-1 ${style.text}`}>
            {analysis.nearestDangerZone 
              ? `$${analysis.nearestDangerZone.price.toFixed(4)}`
              : 'N/A'
            }
          </span>
        </div>
        <div>
          <span className="text-cyber-muted">Distance:</span>
          <span className={`ml-1 ${style.text}`}>
            {analysis.distanceToDanger.toFixed(1)}%
          </span>
        </div>
      </div>
      
      {analysis.shouldExit && (
        <div className="mt-2 pt-2 border-t border-cyber-red/30">
          <p className="text-[10px] text-cyber-red flex items-center gap-1">
            <AlertTriangle size={10} />
            {analysis.exitReason}
          </p>
        </div>
      )}
      
      {/* Suggested levels */}
      <div className="mt-2 pt-2 border-t border-cyber-border/30 flex justify-between text-[10px]">
        <div>
          <span className="text-cyber-muted">Suggested SL:</span>
          <span className="text-cyber-red ml-1">${analysis.suggestedStopLoss.toFixed(4)}</span>
        </div>
        <div>
          <span className="text-cyber-muted">Suggested TP:</span>
          <span className="text-cyber-green ml-1">${analysis.suggestedTakeProfit.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

// Market risk overview card
function MarketRiskCard({ assessment }: { assessment: LiquidationRiskAssessment }) {
  const riskLevel = assessment.riskLevel;
  const style = riskStyles[riskLevel === 'extreme' ? 'danger' : riskLevel];
  const Icon = style.icon;
  
  return (
    <div className={`p-3 rounded border ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={14} className={style.text} />
          <span className="font-cyber text-xs text-cyber-text">MARKET RISK</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text} uppercase`}>
          {riskLevel}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
        <div>
          <span className="text-cyber-muted">Risk Score:</span>
          <span className={`ml-1 ${style.text}`}>{assessment.liquidationRiskScore}%</span>
        </div>
        <div>
          <span className="text-cyber-muted">Price:</span>
          <span className="text-cyber-text ml-1">${assessment.currentPrice.toFixed(4)}</span>
        </div>
      </div>
      
      {/* Key levels */}
      <div className="flex justify-between text-[10px] mb-2">
        {assessment.nearestLongLiqZone && (
          <div>
            <span className="text-cyber-red">Long Liq: </span>
            <span className="text-cyber-muted">${assessment.nearestLongLiqZone.price.toFixed(4)}</span>
            <span className="text-cyber-red ml-1">({assessment.nearestLongLiqZone.distance.toFixed(1)}%)</span>
          </div>
        )}
        {assessment.nearestShortLiqZone && (
          <div>
            <span className="text-cyber-green">Short Liq: </span>
            <span className="text-cyber-muted">${assessment.nearestShortLiqZone.price.toFixed(4)}</span>
            <span className="text-cyber-green ml-1">(+{assessment.nearestShortLiqZone.distance.toFixed(1)}%)</span>
          </div>
        )}
      </div>
      
      {/* Warnings */}
      {assessment.warnings.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-cyber-border/30">
          {assessment.warnings.slice(0, 3).map((warning, i) => (
            <p key={i} className="text-[9px] text-cyber-muted">{warning}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function PositionLiquidationRisk({ compact = false, currentPrice }: PositionLiquidationRiskProps) {
  const { positions, autoTradeSettings, updateLiquidationWarnings } = usePaperTradingStore();
  const [analyses, setAnalyses] = useState<PositionLiquidationAnalysis[]>([]);
  const [marketAssessment, setMarketAssessment] = useState<LiquidationRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Analyze positions against liquidation data
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0) return;
    
    async function analyzeAll() {
      setLoading(true);
      
      try {
        // Get market-wide assessment
        const assessment = await getLiquidationRiskAssessment('XRP', currentPrice);
        setMarketAssessment(assessment);
        
        // Analyze each position
        const results: PositionLiquidationAnalysis[] = [];
        const warnings: LiquidationWarning[] = [];
        
        for (const position of positions) {
          // For now, analyze XRP positions (can expand to others)
          if (position.asset === 'XRP') {
            const analysis = await analyzePositionLiquidation(
              position.asset,
              position.averageCost,
              currentPrice,
              position.quantity,
              true // Assuming long positions
            );
            results.push(analysis);
            
            // Create warning for the store
            warnings.push({
              asset: position.asset,
              riskLevel: analysis.riskLevel,
              distanceToLiqZone: analysis.distanceToDanger,
              liquidationPrice: analysis.nearestDangerZone?.price ?? null,
              suggestedStopLoss: analysis.suggestedStopLoss,
              message: analysis.exitReason || `${analysis.riskLevel.toUpperCase()}: ${analysis.distanceToDanger.toFixed(1)}% from liquidation zone`,
              timestamp: Date.now(),
            });
          }
        }
        
        setAnalyses(results);
        updateLiquidationWarnings(warnings);
      } catch (e) {
        console.error('[PositionLiqRisk] Analysis failed:', e);
      } finally {
        setLoading(false);
      }
    }
    
    analyzeAll();
    
    // Refresh every 2 minutes
    const interval = setInterval(analyzeAll, 120000);
    return () => clearInterval(interval);
  }, [positions, currentPrice, updateLiquidationWarnings]);
  
  if (!autoTradeSettings.useLiquidationAwareStops) {
    return null; // Feature disabled
  }
  
  if (loading) {
    return (
      <div className="cyber-panel p-3">
        <div className="flex items-center gap-2 text-cyber-muted text-xs">
          <div className="w-4 h-4 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
          Analyzing liquidation risk...
        </div>
      </div>
    );
  }
  
  const hasPositions = positions.length > 0;
  const dangerCount = analyses.filter(a => a.riskLevel === 'danger').length;
  const warningCount = analyses.filter(a => a.riskLevel === 'warning').length;
  
  if (compact) {
    // Compact view - just show summary
    return (
      <div className="cyber-panel p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-cyber-cyan" />
            <span className="font-cyber text-xs text-cyber-cyan">LIQUIDATION MONITOR</span>
          </div>
          
          {dangerCount > 0 ? (
            <span className="px-2 py-0.5 rounded bg-cyber-red/20 text-cyber-red text-[10px]">
              {dangerCount} DANGER
            </span>
          ) : warningCount > 0 ? (
            <span className="px-2 py-0.5 rounded bg-cyber-orange/20 text-cyber-orange text-[10px]">
              {warningCount} WARNING
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green text-[10px]">
              ALL SAFE
            </span>
          )}
        </div>
        
        {marketAssessment && (
          <div className="mt-2 text-[10px] text-cyber-muted">
            Market risk: {marketAssessment.liquidationRiskScore}% • 
            Long Liq: ${marketAssessment.nearestLongLiqZone?.price.toFixed(2) || 'N/A'} • 
            Short Liq: ${marketAssessment.nearestShortLiqZone?.price.toFixed(2) || 'N/A'}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="cyber-panel p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan">LIQUIDATION RISK MONITOR</span>
        </div>
        
        <div className="flex items-center gap-2">
          {dangerCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-cyber-red/20 text-cyber-red text-[10px]">
              {dangerCount} DANGER
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-cyber-orange/20 text-cyber-orange text-[10px]">
              {warningCount} WARNING
            </span>
          )}
        </div>
      </div>
      
      {/* Market Overview */}
      {marketAssessment && (
        <div className="mb-4">
          <MarketRiskCard assessment={marketAssessment} />
        </div>
      )}
      
      {/* Position Analysis */}
      {hasPositions ? (
        <div className="space-y-3">
          <p className="text-xs text-cyber-muted">Position Risk Analysis</p>
          {analyses.map((analysis, idx) => (
            <PositionRiskCard key={idx} analysis={analysis} />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-cyber-muted text-xs">
          No open positions to analyze
        </div>
      )}
      
      {/* Settings indicator */}
      <div className="mt-4 pt-3 border-t border-cyber-border flex items-center justify-between text-[10px]">
        <span className="text-cyber-muted">
          Liquidation-aware stops: <span className="text-cyber-green">ENABLED</span>
        </span>
        <span className="text-cyber-muted">
          Risk tolerance: <span className="text-cyber-cyan">{autoTradeSettings.liquidationRiskTolerance.toUpperCase()}</span>
        </span>
      </div>
    </div>
  );
}

export default PositionLiquidationRisk;
