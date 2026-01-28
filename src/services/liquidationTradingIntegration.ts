// Liquidation + Trading Integration Service
// Connects liquidation heatmap data with paper trading for smarter risk management

import { liquidationService, type LiquidationHeatmapData } from './liquidationHeatmap';

// ==================== TYPES ====================

export interface LiquidationRiskAssessment {
  currentPrice: number;
  
  // Nearest liquidation zones
  nearestLongLiqZone: { price: number; distance: number; value: number } | null;
  nearestShortLiqZone: { price: number; distance: number; value: number } | null;
  
  // Risk metrics
  liquidationRiskScore: number;  // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  
  // Suggested levels
  suggestedStopLoss: number | null;      // Price to set stop-loss
  suggestedTakeProfit: number | null;    // Price to set take-profit
  
  // Position-specific
  positionType?: 'long' | 'short';
  distanceToLiquidation?: number;        // % distance to relevant liq zone
  
  // Insights
  warnings: string[];
  recommendations: string[];
  
  timestamp: number;
}

export interface PositionLiquidationAnalysis {
  asset: string;
  positionType: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  
  // Liquidation context
  nearestDangerZone: { price: number; value: number } | null;
  distanceToDanger: number;  // % distance
  
  // Risk assessment
  riskLevel: 'safe' | 'caution' | 'warning' | 'danger';
  shouldExit: boolean;
  exitReason?: string;
  
  // Suggested actions
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
}

// ==================== RISK LEVEL THRESHOLDS ====================

const RISK_THRESHOLDS = {
  // Distance to liquidation zone (as % of current price)
  safe: 10,       // > 10% away = safe
  caution: 5,     // 5-10% = caution
  warning: 3,     // 3-5% = warning
  danger: 3,      // < 3% = danger
  
  // Liquidation risk score
  lowRisk: 30,
  mediumRisk: 50,
  highRisk: 70,
};

// ==================== CORE FUNCTIONS ====================

/**
 * Get liquidation risk assessment for a given asset and price
 */
export async function getLiquidationRiskAssessment(
  symbol: string,
  currentPrice: number,
  positionType?: 'long' | 'short'
): Promise<LiquidationRiskAssessment> {
  const heatmap = await liquidationService.getHeatmap(symbol, currentPrice);
  
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Find nearest liquidation zones
  const nearestLongLiqZone = heatmap.majorLongLiquidationZone 
    ? {
        price: heatmap.majorLongLiquidationZone.price,
        distance: ((currentPrice - heatmap.majorLongLiquidationZone.price) / currentPrice) * 100,
        value: heatmap.majorLongLiquidationZone.value,
      }
    : null;
    
  const nearestShortLiqZone = heatmap.majorShortLiquidationZone
    ? {
        price: heatmap.majorShortLiquidationZone.price,
        distance: ((heatmap.majorShortLiquidationZone.price - currentPrice) / currentPrice) * 100,
        value: heatmap.majorShortLiquidationZone.value,
      }
    : null;
  
  // Determine risk level based on score
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  if (heatmap.liquidationRiskScore < RISK_THRESHOLDS.lowRisk) {
    riskLevel = 'low';
  } else if (heatmap.liquidationRiskScore < RISK_THRESHOLDS.mediumRisk) {
    riskLevel = 'medium';
  } else if (heatmap.liquidationRiskScore < RISK_THRESHOLDS.highRisk) {
    riskLevel = 'high';
  } else {
    riskLevel = 'extreme';
  }
  
  // Calculate position-specific risk
  let distanceToLiquidation: number | undefined;
  let suggestedStopLoss: number | null = null;
  let suggestedTakeProfit: number | null = null;
  
  if (positionType === 'long' && nearestLongLiqZone) {
    distanceToLiquidation = nearestLongLiqZone.distance;
    
    // Set stop-loss slightly above the major long liquidation zone
    suggestedStopLoss = nearestLongLiqZone.price * 1.02; // 2% above liq zone
    
    // Set take-profit at the short liquidation zone (resistance)
    if (nearestShortLiqZone) {
      suggestedTakeProfit = nearestShortLiqZone.price * 0.98; // 2% below short liq
    }
    
    // Warnings for longs
    if (distanceToLiquidation < RISK_THRESHOLDS.danger) {
      warnings.push(`⚠️ DANGER: Long liquidation zone only ${distanceToLiquidation.toFixed(1)}% below!`);
      recommendations.push('Consider reducing position size or setting tight stop-loss');
    } else if (distanceToLiquidation < RISK_THRESHOLDS.warning) {
      warnings.push(`⚡ WARNING: Approaching long liquidation zone (${distanceToLiquidation.toFixed(1)}% away)`);
    }
  }
  
  if (positionType === 'short' && nearestShortLiqZone) {
    distanceToLiquidation = nearestShortLiqZone.distance;
    
    // Set stop-loss slightly below the major short liquidation zone
    suggestedStopLoss = nearestShortLiqZone.price * 0.98; // 2% below liq zone
    
    // Set take-profit at the long liquidation zone (support)
    if (nearestLongLiqZone) {
      suggestedTakeProfit = nearestLongLiqZone.price * 1.02; // 2% above long liq
    }
    
    // Warnings for shorts
    if (distanceToLiquidation < RISK_THRESHOLDS.danger) {
      warnings.push(`⚠️ DANGER: Short liquidation zone only ${distanceToLiquidation.toFixed(1)}% above!`);
      recommendations.push('Consider reducing position size or setting tight stop-loss');
    } else if (distanceToLiquidation < RISK_THRESHOLDS.warning) {
      warnings.push(`⚡ WARNING: Approaching short liquidation zone (${distanceToLiquidation.toFixed(1)}% away)`);
    }
  }
  
  // General market warnings
  if (riskLevel === 'extreme') {
    warnings.push('🔥 EXTREME liquidation density near current price - high volatility expected');
    recommendations.push('Reduce position sizes or wait for clearer conditions');
  } else if (riskLevel === 'high') {
    warnings.push('📊 High liquidation concentration nearby - expect volatility');
  }
  
  // Long/short imbalance warnings
  if (heatmap.longShortRatio > 1.5) {
    warnings.push(`📉 Market heavily long (${heatmap.longShortRatio.toFixed(2)}:1) - long squeeze risk`);
    if (positionType === 'long') {
      recommendations.push('Consider tighter stops or partial profit-taking');
    }
  } else if (heatmap.longShortRatio < 0.67) {
    warnings.push(`📈 Market heavily short (1:${(1/heatmap.longShortRatio).toFixed(2)}) - short squeeze risk`);
    if (positionType === 'short') {
      recommendations.push('Consider tighter stops or partial profit-taking');
    }
  }
  
  return {
    currentPrice,
    nearestLongLiqZone,
    nearestShortLiqZone,
    liquidationRiskScore: heatmap.liquidationRiskScore,
    riskLevel,
    suggestedStopLoss,
    suggestedTakeProfit,
    positionType,
    distanceToLiquidation,
    warnings,
    recommendations,
    timestamp: Date.now(),
  };
}

/**
 * Analyze a specific position against liquidation data
 */
export async function analyzePositionLiquidation(
  asset: string,
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  isLong: boolean = true
): Promise<PositionLiquidationAnalysis> {
  const assessment = await getLiquidationRiskAssessment(
    asset, 
    currentPrice, 
    isLong ? 'long' : 'short'
  );
  
  const positionType = isLong ? 'long' : 'short';
  const relevantZone = isLong 
    ? assessment.nearestLongLiqZone 
    : assessment.nearestShortLiqZone;
  
  const distanceToDanger = relevantZone?.distance ?? 100;
  
  // Determine risk level
  let riskLevel: 'safe' | 'caution' | 'warning' | 'danger';
  if (distanceToDanger > RISK_THRESHOLDS.safe) {
    riskLevel = 'safe';
  } else if (distanceToDanger > RISK_THRESHOLDS.caution) {
    riskLevel = 'caution';
  } else if (distanceToDanger > RISK_THRESHOLDS.warning) {
    riskLevel = 'warning';
  } else {
    riskLevel = 'danger';
  }
  
  // Should exit?
  let shouldExit = false;
  let exitReason: string | undefined;
  
  if (riskLevel === 'danger') {
    shouldExit = true;
    exitReason = `Position within ${distanceToDanger.toFixed(1)}% of major liquidation zone`;
  }
  
  // Calculate suggested levels
  let suggestedStopLoss = entryPrice * (isLong ? 0.95 : 1.05); // Default 5%
  let suggestedTakeProfit = entryPrice * (isLong ? 1.10 : 0.90); // Default 10%
  
  if (assessment.suggestedStopLoss) {
    suggestedStopLoss = assessment.suggestedStopLoss;
  }
  if (assessment.suggestedTakeProfit) {
    suggestedTakeProfit = assessment.suggestedTakeProfit;
  }
  
  return {
    asset,
    positionType,
    entryPrice,
    currentPrice,
    quantity,
    nearestDangerZone: relevantZone ? { price: relevantZone.price, value: relevantZone.value } : null,
    distanceToDanger,
    riskLevel,
    shouldExit,
    exitReason,
    suggestedStopLoss,
    suggestedTakeProfit,
  };
}

/**
 * Check if it's safe to enter a trade based on liquidation data
 */
export async function checkTradeEntry(
  symbol: string,
  currentPrice: number,
  tradeType: 'buy' | 'sell',
  tradeSize: number,
  portfolioValue: number
): Promise<{
  allowed: boolean;
  riskAdjustedSize: number;
  warnings: string[];
  reason?: string;
}> {
  const assessment = await getLiquidationRiskAssessment(
    symbol, 
    currentPrice, 
    tradeType === 'buy' ? 'long' : 'short'
  );
  
  const warnings = [...assessment.warnings];
  let allowed = true;
  let reason: string | undefined;
  let riskAdjustedSize = tradeSize;
  
  // Block trades in extreme risk
  if (assessment.riskLevel === 'extreme') {
    allowed = false;
    reason = 'Liquidation risk too high - market conditions unfavorable';
    return { allowed, riskAdjustedSize: 0, warnings, reason };
  }
  
  // Reduce size in high risk
  if (assessment.riskLevel === 'high') {
    riskAdjustedSize = tradeSize * 0.5; // Cut size in half
    warnings.push(`Trade size reduced 50% due to high liquidation risk`);
  } else if (assessment.riskLevel === 'medium') {
    riskAdjustedSize = tradeSize * 0.75; // Reduce by 25%
    warnings.push(`Trade size reduced 25% due to elevated liquidation risk`);
  }
  
  // Check if trade direction aligns with imbalance
  if (tradeType === 'buy' && assessment.nearestLongLiqZone) {
    if (assessment.nearestLongLiqZone.distance < 5) {
      warnings.push(`⚠️ Buying near major long liquidation zone - high risk`);
      riskAdjustedSize = Math.min(riskAdjustedSize, tradeSize * 0.5);
    }
  }
  
  if (tradeType === 'sell' && assessment.nearestShortLiqZone) {
    if (assessment.nearestShortLiqZone.distance < 5) {
      warnings.push(`⚠️ Shorting near major short liquidation zone - high risk`);
      riskAdjustedSize = Math.min(riskAdjustedSize, tradeSize * 0.5);
    }
  }
  
  return { allowed, riskAdjustedSize, warnings, reason };
}

/**
 * Get dynamic stop-loss and take-profit levels based on liquidation data
 */
export async function getDynamicLevels(
  symbol: string,
  currentPrice: number,
  positionType: 'long' | 'short'
): Promise<{
  stopLoss: number;
  takeProfit: number;
  stopLossReason: string;
  takeProfitReason: string;
}> {
  const assessment = await getLiquidationRiskAssessment(symbol, currentPrice, positionType);
  
  let stopLoss: number;
  let takeProfit: number;
  let stopLossReason: string;
  let takeProfitReason: string;
  
  if (positionType === 'long') {
    if (assessment.suggestedStopLoss) {
      stopLoss = assessment.suggestedStopLoss;
      stopLossReason = `Set above major long liquidation zone ($${assessment.nearestLongLiqZone?.price.toFixed(4)})`;
    } else {
      stopLoss = currentPrice * 0.95;
      stopLossReason = 'Default 5% stop-loss (no liquidation data)';
    }
    
    if (assessment.suggestedTakeProfit) {
      takeProfit = assessment.suggestedTakeProfit;
      takeProfitReason = `Set below major short liquidation zone ($${assessment.nearestShortLiqZone?.price.toFixed(4)})`;
    } else {
      takeProfit = currentPrice * 1.10;
      takeProfitReason = 'Default 10% take-profit (no liquidation data)';
    }
  } else {
    if (assessment.suggestedStopLoss) {
      stopLoss = assessment.suggestedStopLoss;
      stopLossReason = `Set below major short liquidation zone ($${assessment.nearestShortLiqZone?.price.toFixed(4)})`;
    } else {
      stopLoss = currentPrice * 1.05;
      stopLossReason = 'Default 5% stop-loss (no liquidation data)';
    }
    
    if (assessment.suggestedTakeProfit) {
      takeProfit = assessment.suggestedTakeProfit;
      takeProfitReason = `Set above major long liquidation zone ($${assessment.nearestLongLiqZone?.price.toFixed(4)})`;
    } else {
      takeProfit = currentPrice * 0.90;
      takeProfitReason = 'Default 10% take-profit (no liquidation data)';
    }
  }
  
  return { stopLoss, takeProfit, stopLossReason, takeProfitReason };
}

// ==================== REACT HOOKS ====================

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to get liquidation risk assessment
 */
export function useLiquidationRisk(
  symbol: string, 
  currentPrice: number,
  positionType?: 'long' | 'short'
) {
  const [assessment, setAssessment] = useState<LiquidationRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const refresh = useCallback(async () => {
    if (!currentPrice || currentPrice <= 0) return;
    
    try {
      setLoading(true);
      const result = await getLiquidationRiskAssessment(symbol, currentPrice, positionType);
      setAssessment(result);
      setError(null);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [symbol, currentPrice, positionType]);
  
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [refresh]);
  
  return { assessment, loading, error, refresh };
}

/**
 * Hook to analyze a position against liquidation data
 */
export function usePositionLiquidationAnalysis(
  asset: string,
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  isLong: boolean = true
) {
  const [analysis, setAnalysis] = useState<PositionLiquidationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!currentPrice || currentPrice <= 0 || !entryPrice) return;
    
    async function analyze() {
      try {
        setLoading(true);
        const result = await analyzePositionLiquidation(
          asset, entryPrice, currentPrice, quantity, isLong
        );
        setAnalysis(result);
      } catch (e) {
        console.error('[LiqTrade] Analysis error:', e);
      } finally {
        setLoading(false);
      }
    }
    
    analyze();
  }, [asset, entryPrice, currentPrice, quantity, isLong]);
  
  return { analysis, loading };
}

// ==================== EXPORTS ====================

export const LiquidationTradingIntegration = {
  getRiskAssessment: getLiquidationRiskAssessment,
  analyzePosition: analyzePositionLiquidation,
  checkTradeEntry,
  getDynamicLevels,
};

export default LiquidationTradingIntegration;
