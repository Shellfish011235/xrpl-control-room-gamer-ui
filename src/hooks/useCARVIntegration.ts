// CARV Integration Hook for Paper Trading
// Bridges paper trading execution with CARV co-processor

import { useCallback, useEffect, useState } from 'react';
import { getCARV, CARVSystem, PaymentIntentEnvelope, RouteResult } from '../services/carv';
import { usePaperTradingStore } from '../store/paperTradingStore';

interface CARVIntegrationState {
  enabled: boolean;
  initialized: boolean;
  testMode: boolean;
  lastPIE: PaymentIntentEnvelope | null;
  lastRoute: RouteResult | null;
  totalTrades: number;
  successfulTrades: number;
}

interface CARVIntegrationActions {
  enable: () => Promise<void>;
  disable: () => void;
  setTestMode: (testMode: boolean) => void;
  executeTradeWithCARV: (params: {
    asset: string;
    amount: number;
    side: 'buy' | 'sell';
    price: number;
  }) => Promise<{
    success: boolean;
    pie?: PaymentIntentEnvelope;
    route?: RouteResult;
    error?: string;
  }>;
}

export function useCARVIntegration(): CARVIntegrationState & CARVIntegrationActions {
  const [state, setState] = useState<CARVIntegrationState>({
    enabled: false,
    initialized: false,
    testMode: true,
    lastPIE: null,
    lastRoute: null,
    totalTrades: 0,
    successfulTrades: 0,
  });

  const [carv, setCarv] = useState<CARVSystem | null>(null);

  // Get paper trading store actions
  const { executeTrade, cashBalance, getTotalPortfolioValue } = usePaperTradingStore();

  // Enable CARV integration
  const enable = useCallback(async () => {
    try {
      const carvInstance = getCARV({
        test_mode: state.testMode,
        wallet_address: 'paper_trading_wallet',
        daily_volume_cap: 1000, // Allow larger trades for paper trading
        max_single_amount: 100,
        regime_summary: 'Paper trading mode: Learning and experimentation with simulated funds.',
      });

      await carvInstance.initialize();
      setCarv(carvInstance);
      setState(prev => ({ ...prev, enabled: true, initialized: true }));

      console.log('[CARV Integration] Enabled for Paper Trading');
    } catch (error) {
      console.error('[CARV Integration] Failed to enable:', error);
    }
  }, [state.testMode]);

  // Disable CARV integration
  const disable = useCallback(() => {
    if (carv) {
      carv.shutdown();
      setCarv(null);
    }
    setState(prev => ({ ...prev, enabled: false, initialized: false }));
    console.log('[CARV Integration] Disabled');
  }, [carv]);

  // Set test mode
  const setTestMode = useCallback((testMode: boolean) => {
    if (carv) {
      carv.setTestMode(testMode);
    }
    setState(prev => ({ ...prev, testMode }));
  }, [carv]);

  // Execute trade through CARV
  const executeTradeWithCARV = useCallback(async (params: {
    asset: string;
    amount: number;
    side: 'buy' | 'sell';
    price: number;
  }) => {
    if (!carv || !state.enabled) {
      // Fall back to direct execution if CARV not enabled
      return {
        success: false,
        error: 'CARV not enabled',
      };
    }

    const { asset, amount, side, price } = params;
    const totalValue = amount * price;

    try {
      // Create CARV flow
      const result = await carv.executeFlow({
        prompt: `Paper trading ${side.toUpperCase()} order: ${amount} ${asset} at $${price}`,
        payer: side === 'buy' ? 'paper_wallet' : `paper_position_${asset}`,
        payee: side === 'buy' ? `paper_position_${asset}` : 'paper_wallet',
        amount: totalValue,
        asset: 'USD', // CARV tracks in USD value
        regime_summary: `Paper trading ${side} order. Portfolio value: $${getTotalPortfolioValue().toFixed(2)}. Available cash: $${cashBalance.toFixed(2)}.`,
      });

      // If CARV validation passed, execute the paper trade
      if (result.validation.valid && result.route?.success) {
        // Execute the actual paper trade (this updates the paper trading store)
        const tradeSuccess = executeTrade({
          type: side,
          asset,
          amount,
          price,
          source: 'manual',
        });

        setState(prev => ({
          ...prev,
          lastPIE: result.pie,
          lastRoute: result.route || null,
          totalTrades: prev.totalTrades + 1,
          successfulTrades: tradeSuccess ? prev.successfulTrades + 1 : prev.successfulTrades,
        }));

        return {
          success: tradeSuccess,
          pie: result.pie,
          route: result.route,
          error: tradeSuccess ? undefined : 'Paper trade execution failed',
        };
      }

      // CARV validation or routing failed
      setState(prev => ({
        ...prev,
        lastPIE: result.pie,
        lastRoute: result.route || null,
        totalTrades: prev.totalTrades + 1,
      }));

      return {
        success: false,
        pie: result.pie,
        route: result.route,
        error: !result.validation.valid 
          ? result.validation.reason 
          : result.route?.error || 'Unknown error',
      };
    } catch (error) {
      console.error('[CARV Integration] Trade execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [carv, state.enabled, executeTrade, cashBalance, getTotalPortfolioValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (carv) {
        carv.shutdown();
      }
    };
  }, [carv]);

  return {
    ...state,
    enable,
    disable,
    setTestMode,
    executeTradeWithCARV,
  };
}

// Hook to check if CARV is available for paper trading
export function useCARVAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    try {
      // Check if CARV module is available
      const carv = getCARV();
      setAvailable(!!carv);
    } catch {
      setAvailable(false);
    }
  }, []);

  return available;
}

export default useCARVIntegration;
