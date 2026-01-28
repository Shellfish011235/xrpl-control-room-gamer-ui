// Liquidation-Aware Trading Hook
// Wraps paper trading with liquidation risk checks

import { useCallback, useEffect, useRef } from 'react';
import { usePaperTradingStore } from '../store/paperTradingStore';
import { 
  checkTradeEntry, 
  getDynamicLevels,
  analyzePositionLiquidation,
  type LiquidationRiskAssessment
} from '../services/liquidationTradingIntegration';
import { liquidationService } from '../services/liquidationHeatmap';

interface LiquidationAwareTradingOptions {
  currentPrice: number;
  symbol?: string;
  enabled?: boolean;
  checkIntervalMs?: number;
}

/**
 * Hook that adds liquidation awareness to paper trading
 * - Checks liquidation risk before allowing trades
 * - Sets dynamic stop-loss/take-profit based on liquidation zones
 * - Monitors positions for liquidation danger
 */
export function useLiquidationAwareTrading({
  currentPrice,
  symbol = 'XRP',
  enabled = true,
  checkIntervalMs = 60000, // Check every minute
}: LiquidationAwareTradingOptions) {
  const store = usePaperTradingStore();
  const lastCheckRef = useRef<number>(0);
  
  const {
    positions,
    autoTradeSettings,
    executeTrade,
    updateLiquidationWarnings,
    processSignal,
  } = store;
  
  /**
   * Execute a trade with liquidation risk check
   * Returns: { allowed, adjustedAmount, warnings, reason }
   */
  const executeWithLiquidationCheck = useCallback(async (
    tradeType: 'buy' | 'sell',
    asset: string,
    amount: number,
    price: number,
    source: 'manual' | 'signal' | 'prediction' | 'auto' = 'manual',
  ) => {
    if (!enabled || !autoTradeSettings.useLiquidationAwareStops) {
      // Liquidation checks disabled, execute normally
      const success = executeTrade({ type: tradeType, asset, amount, price, source });
      return { 
        executed: success, 
        adjustedAmount: amount, 
        warnings: [], 
        reason: success ? 'Trade executed' : 'Trade failed' 
      };
    }
    
    // Check liquidation risk
    const portfolioValue = store.getTotalPortfolioValue();
    const tradeCheck = await checkTradeEntry(
      asset === 'XRP' ? 'XRP' : asset,
      price,
      tradeType,
      amount * price,
      portfolioValue
    );
    
    if (!tradeCheck.allowed) {
      console.warn(`[LiqAwareTrading] Trade blocked: ${tradeCheck.reason}`);
      return {
        executed: false,
        adjustedAmount: 0,
        warnings: tradeCheck.warnings,
        reason: tradeCheck.reason || 'Blocked by liquidation risk check',
      };
    }
    
    // Adjust amount based on risk
    const adjustedAmount = (tradeCheck.riskAdjustedSize / price);
    
    if (adjustedAmount < amount * 0.5) {
      console.warn(`[LiqAwareTrading] Trade size heavily reduced due to risk: ${amount} -> ${adjustedAmount}`);
    }
    
    // Execute with adjusted amount
    const success = executeTrade({ 
      type: tradeType, 
      asset, 
      amount: adjustedAmount, 
      price, 
      source,
      notes: tradeCheck.warnings.length > 0 
        ? `Liquidation warnings: ${tradeCheck.warnings.join('; ')}` 
        : undefined,
    });
    
    return {
      executed: success,
      adjustedAmount,
      warnings: tradeCheck.warnings,
      reason: success 
        ? `Trade executed${adjustedAmount < amount ? ' (size adjusted for risk)' : ''}`
        : 'Trade execution failed',
    };
  }, [enabled, autoTradeSettings, executeTrade, store]);
  
  /**
   * Process a signal with liquidation awareness
   */
  const processSignalWithLiquidation = useCallback(async (signal: {
    id: string;
    type: string;
    asset: string;
    action: 'buy' | 'sell';
    confidence: number;
    price: number;
    reason: string;
  }) => {
    if (!enabled || !autoTradeSettings.blockHighLiquidationRisk) {
      // Just use the normal signal processing
      return processSignal(signal);
    }
    
    // Check liquidation risk first
    const tradeCheck = await checkTradeEntry(
      signal.asset === 'XRP' ? 'XRP' : signal.asset,
      signal.price,
      signal.action,
      1000, // Dummy size for check
      store.getTotalPortfolioValue()
    );
    
    if (!tradeCheck.allowed) {
      // Return a blocked log entry
      return {
        id: `atl_${Date.now()}`,
        timestamp: Date.now(),
        signalType: signal.type,
        signalConfidence: signal.confidence,
        action: 'blocked' as const,
        reason: `Liquidation risk: ${tradeCheck.reason}`,
        asset: signal.asset,
        suggestedAction: signal.action,
      };
    }
    
    // Proceed with normal signal processing
    return processSignal(signal);
  }, [enabled, autoTradeSettings, processSignal, store]);
  
  /**
   * Get dynamic stop-loss and take-profit for a position
   */
  const getDynamicStopLevels = useCallback(async (
    asset: string,
    entryPrice: number,
    positionType: 'long' | 'short' = 'long'
  ) => {
    if (!enabled || !autoTradeSettings.useLiquidationAwareStops) {
      // Return fixed percentage levels
      const stopLossPercent = autoTradeSettings.stopLossPercent / 100;
      const takeProfitPercent = autoTradeSettings.takeProfitPercent / 100;
      
      return {
        stopLoss: positionType === 'long' 
          ? entryPrice * (1 - stopLossPercent)
          : entryPrice * (1 + stopLossPercent),
        takeProfit: positionType === 'long'
          ? entryPrice * (1 + takeProfitPercent)
          : entryPrice * (1 - takeProfitPercent),
        stopLossReason: `Fixed ${autoTradeSettings.stopLossPercent}% stop-loss`,
        takeProfitReason: `Fixed ${autoTradeSettings.takeProfitPercent}% take-profit`,
        isLiquidationAware: false,
      };
    }
    
    // Get dynamic levels based on liquidation zones
    const levels = await getDynamicLevels(
      asset === 'XRP' ? 'XRP' : asset,
      currentPrice,
      positionType
    );
    
    return {
      ...levels,
      isLiquidationAware: true,
    };
  }, [enabled, autoTradeSettings, currentPrice]);
  
  /**
   * Monitor positions for liquidation danger
   */
  const checkPositionsForDanger = useCallback(async () => {
    if (!enabled || !currentPrice || currentPrice <= 0) return;
    
    const now = Date.now();
    if (now - lastCheckRef.current < checkIntervalMs) return;
    lastCheckRef.current = now;
    
    const warnings = [];
    
    for (const position of positions) {
      if (position.asset !== 'XRP') continue; // Only XRP for now
      
      try {
        const analysis = await analyzePositionLiquidation(
          position.asset,
          position.averageCost,
          currentPrice,
          position.quantity,
          true // Assuming long
        );
        
        warnings.push({
          asset: position.asset,
          riskLevel: analysis.riskLevel,
          distanceToLiqZone: analysis.distanceToDanger,
          liquidationPrice: analysis.nearestDangerZone?.price ?? null,
          suggestedStopLoss: analysis.suggestedStopLoss,
          message: analysis.shouldExit 
            ? `EXIT RECOMMENDED: ${analysis.exitReason}` 
            : `${analysis.riskLevel.toUpperCase()}: ${analysis.distanceToDanger.toFixed(1)}% from liquidation`,
          timestamp: now,
        });
        
        // If danger and auto-trading is enabled, consider exiting
        if (analysis.shouldExit && autoTradeSettings.enabled && autoTradeSettings.useLiquidationAwareStops) {
          console.warn(`[LiqAwareTrading] Position danger detected for ${position.asset}, considering exit`);
          
          // Could auto-exit here, but let's just warn for now
          // The user should see the warning and decide
        }
      } catch (e) {
        console.error(`[LiqAwareTrading] Failed to analyze ${position.asset}:`, e);
      }
    }
    
    if (warnings.length > 0) {
      updateLiquidationWarnings(warnings);
    }
  }, [enabled, currentPrice, positions, autoTradeSettings, updateLiquidationWarnings, checkIntervalMs]);
  
  // Run periodic position checks
  useEffect(() => {
    if (!enabled) return;
    
    // Initial check
    checkPositionsForDanger();
    
    // Set up interval
    const interval = setInterval(checkPositionsForDanger, checkIntervalMs);
    
    return () => clearInterval(interval);
  }, [enabled, checkPositionsForDanger, checkIntervalMs]);
  
  return {
    executeWithLiquidationCheck,
    processSignalWithLiquidation,
    getDynamicStopLevels,
    checkPositionsForDanger,
    isEnabled: enabled && autoTradeSettings.useLiquidationAwareStops,
  };
}

export default useLiquidationAwareTrading;
