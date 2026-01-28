// Paper Trading Store - Simulated wallet for practicing trades
// Persists to localStorage so progress isn't lost

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== TYPES ====================

export interface PaperTrade {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  asset: string;          // e.g., 'XRP', 'BTC', 'ETH', token name
  amount: number;         // Quantity purchased/sold
  price: number;          // Price at execution
  totalCost: number;      // amount * price
  source: 'manual' | 'signal' | 'prediction' | 'auto';  // How trade was initiated
  signalId?: string;      // If from a prediction signal
  notes?: string;
}

// Auto-trading configuration
export interface AutoTradeSettings {
  enabled: boolean;
  minConfidence: number;        // Minimum signal confidence to act on (0-100)
  maxTradePercent: number;      // Max % of portfolio per auto-trade
  maxDailyTrades: number;       // Max auto-trades per day
  allowedAssets: string[];      // Which assets can be auto-traded
  strategy: 'conservative' | 'moderate' | 'aggressive';
  takeProfitPercent: number;    // Auto-sell when position up this %
  stopLossPercent: number;      // Auto-sell when position down this %
  cooldownMinutes: number;      // Minutes between trades on same asset
  
  // Liquidation-aware settings
  useLiquidationAwareStops: boolean;     // Use liquidation zones instead of fixed %
  liquidationRiskTolerance: 'low' | 'medium' | 'high';  // How close to liq zones we allow
  blockHighLiquidationRisk: boolean;     // Block trades when liquidation risk is extreme
}

// Liquidation warning for a position
export interface LiquidationWarning {
  asset: string;
  riskLevel: 'safe' | 'caution' | 'warning' | 'danger';
  distanceToLiqZone: number;     // % distance
  liquidationPrice: number | null;
  suggestedStopLoss: number | null;
  message: string;
  timestamp: number;
}

export interface AutoTradeLog {
  id: string;
  timestamp: number;
  signalType: string;
  signalConfidence: number;
  action: 'executed' | 'skipped' | 'blocked';
  reason: string;
  tradeId?: string;
  asset: string;
  suggestedAction: 'buy' | 'sell';
}

export interface PaperPosition {
  asset: string;
  quantity: number;
  averageCost: number;    // Average purchase price
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PerformanceStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  bestTrade: { asset: string; pnl: number; } | null;
  worstTrade: { asset: string; pnl: number; } | null;
  averageTradeSize: number;
  largestPosition: string | null;
}

export interface PriceCache {
  [asset: string]: {
    price: number;
    lastUpdated: number;
  };
}

interface PaperTradingState {
  // Wallet State
  startingBalance: number;
  cashBalance: number;        // Available XRP for trading
  positions: PaperPosition[];
  tradeHistory: PaperTrade[];
  priceCache: PriceCache;
  
  // Settings
  isEnabled: boolean;
  defaultTradeSize: number;   // Default % of portfolio per trade
  
  // Auto-Trading
  autoTradeSettings: AutoTradeSettings;
  autoTradeLog: AutoTradeLog[];
  lastAutoTradeByAsset: { [asset: string]: number }; // Timestamp of last auto-trade per asset
  dailyAutoTradeCount: number;
  dailyAutoTradeDate: string; // YYYY-MM-DD to track daily limit
  
  // Liquidation Warnings
  liquidationWarnings: LiquidationWarning[];
  
  // Timestamps
  createdAt: number;
  lastTradeAt: number | null;
  
  // Actions
  executeTrade: (trade: Omit<PaperTrade, 'id' | 'timestamp' | 'totalCost'>) => boolean;
  updatePrices: (prices: { [asset: string]: number }) => void;
  closePosition: (asset: string, price: number) => boolean;
  resetWallet: (startingBalance?: number) => void;
  setEnabled: (enabled: boolean) => void;
  setDefaultTradeSize: (size: number) => void;
  getStats: () => PerformanceStats;
  getTotalPortfolioValue: () => number;
  
  // Auto-Trading Actions
  setAutoTradeSettings: (settings: Partial<AutoTradeSettings>) => void;
  processSignal: (signal: {
    id: string;
    type: string;
    asset: string;
    action: 'buy' | 'sell';
    confidence: number;
    price: number;
    reason: string;
  }) => AutoTradeLog;
  checkStopLossAndTakeProfit: (prices: { [asset: string]: number }) => void;
  clearAutoTradeLog: () => void;
  
  // Liquidation-Aware Actions
  updateLiquidationWarnings: (warnings: LiquidationWarning[]) => void;
  getLiquidationWarning: (asset: string) => LiquidationWarning | undefined;
  hasHighRiskPositions: () => boolean;
}

// ==================== HELPERS ====================

const generateId = () => `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_STARTING_BALANCE = 10000; // 10,000 XRP

const DEFAULT_AUTO_TRADE_SETTINGS: AutoTradeSettings = {
  enabled: true,  // Auto-trading enabled by default
  minConfidence: 70,
  maxTradePercent: 10,
  maxDailyTrades: 10,
  allowedAssets: [
    'XRP', 'BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'LINK', 'DOT',
    'AVAX', 'MATIC', 'ATOM', 'UNI', 'LTC', 'XLM', 'ALGO', 'HBAR',
    'NEAR', 'FTM', 'VET', 'SAND', 'MANA', 'APE', 'CRO', 'SHIB'
  ],
  strategy: 'moderate',
  takeProfitPercent: 15,
  stopLossPercent: 10,
  cooldownMinutes: 5,
  
  // Liquidation-aware settings (enabled by default for smarter trading)
  useLiquidationAwareStops: true,
  liquidationRiskTolerance: 'medium',
  blockHighLiquidationRisk: true,
};

const getToday = () => new Date().toISOString().split('T')[0];

// ==================== STORE ====================

export const usePaperTradingStore = create<PaperTradingState>()(
  persist(
    (set, get) => ({
      // Initial State
      startingBalance: DEFAULT_STARTING_BALANCE,
      cashBalance: DEFAULT_STARTING_BALANCE,
      positions: [],
      tradeHistory: [],
      priceCache: {
        XRP: { price: 1, lastUpdated: Date.now() },
      },
      isEnabled: true,
      defaultTradeSize: 10, // 10% of portfolio
      
      // Auto-Trading Initial State
      autoTradeSettings: DEFAULT_AUTO_TRADE_SETTINGS,
      autoTradeLog: [],
      lastAutoTradeByAsset: {},
      dailyAutoTradeCount: 0,
      dailyAutoTradeDate: getToday(),
      
      // Liquidation Warnings
      liquidationWarnings: [],
      
      createdAt: Date.now(),
      lastTradeAt: null,

      // Execute a trade
      executeTrade: (trade) => {
        const state = get();
        const totalCost = trade.amount * trade.price;

        // Validate trade
        if (trade.type === 'buy') {
          if (totalCost > state.cashBalance) {
            console.error('[PaperTrading] Insufficient funds');
            return false;
          }
        } else {
          // Sell - check if we have the position
          const position = state.positions.find(p => p.asset === trade.asset);
          if (!position || position.quantity < trade.amount) {
            console.error('[PaperTrading] Insufficient position to sell');
            return false;
          }
        }

        const newTrade: PaperTrade = {
          ...trade,
          id: generateId(),
          timestamp: Date.now(),
          totalCost,
        };

        set((s) => {
          let newCashBalance = s.cashBalance;
          let newPositions = [...s.positions];

          if (trade.type === 'buy') {
            // Deduct cash
            newCashBalance -= totalCost;

            // Update or create position
            const existingIdx = newPositions.findIndex(p => p.asset === trade.asset);
            if (existingIdx >= 0) {
              const existing = newPositions[existingIdx];
              const newQuantity = existing.quantity + trade.amount;
              const newAvgCost = (existing.averageCost * existing.quantity + totalCost) / newQuantity;
              newPositions[existingIdx] = {
                ...existing,
                quantity: newQuantity,
                averageCost: newAvgCost,
                currentPrice: trade.price,
                unrealizedPnL: (trade.price - newAvgCost) * newQuantity,
                unrealizedPnLPercent: ((trade.price - newAvgCost) / newAvgCost) * 100,
              };
            } else {
              newPositions.push({
                asset: trade.asset,
                quantity: trade.amount,
                averageCost: trade.price,
                currentPrice: trade.price,
                unrealizedPnL: 0,
                unrealizedPnLPercent: 0,
              });
            }
          } else {
            // Sell - add cash, reduce position
            newCashBalance += totalCost;

            const existingIdx = newPositions.findIndex(p => p.asset === trade.asset);
            if (existingIdx >= 0) {
              const existing = newPositions[existingIdx];
              const newQuantity = existing.quantity - trade.amount;
              if (newQuantity <= 0) {
                // Remove position
                newPositions = newPositions.filter(p => p.asset !== trade.asset);
              } else {
                newPositions[existingIdx] = {
                  ...existing,
                  quantity: newQuantity,
                  unrealizedPnL: (existing.currentPrice - existing.averageCost) * newQuantity,
                  unrealizedPnLPercent: ((existing.currentPrice - existing.averageCost) / existing.averageCost) * 100,
                };
              }
            }
          }

          return {
            cashBalance: newCashBalance,
            positions: newPositions,
            tradeHistory: [...s.tradeHistory, newTrade],
            lastTradeAt: Date.now(),
            priceCache: {
              ...s.priceCache,
              [trade.asset]: { price: trade.price, lastUpdated: Date.now() },
            },
          };
        });

        console.log(`[PaperTrading] Executed ${trade.type.toUpperCase()}: ${trade.amount} ${trade.asset} @ ${trade.price}`);
        return true;
      },

      // Update asset prices (for P&L calculation)
      updatePrices: (prices) => {
        set((s) => {
          const now = Date.now();
          const newPriceCache = { ...s.priceCache };
          
          for (const [asset, price] of Object.entries(prices)) {
            newPriceCache[asset] = { price, lastUpdated: now };
          }

          // Update unrealized P&L on positions
          const newPositions = s.positions.map(pos => {
            const newPrice = prices[pos.asset] ?? pos.currentPrice;
            return {
              ...pos,
              currentPrice: newPrice,
              unrealizedPnL: (newPrice - pos.averageCost) * pos.quantity,
              unrealizedPnLPercent: ((newPrice - pos.averageCost) / pos.averageCost) * 100,
            };
          });

          return {
            priceCache: newPriceCache,
            positions: newPositions,
          };
        });
      },

      // Close an entire position
      closePosition: (asset, price) => {
        const position = get().positions.find(p => p.asset === asset);
        if (!position) return false;

        return get().executeTrade({
          type: 'sell',
          asset,
          amount: position.quantity,
          price,
          source: 'manual',
        });
      },

      // Reset wallet to starting state
      resetWallet: (newStartingBalance) => {
        const balance = newStartingBalance ?? DEFAULT_STARTING_BALANCE;
        set({
          startingBalance: balance,
          cashBalance: balance,
          positions: [],
          tradeHistory: [],
          priceCache: {
            XRP: { price: 1, lastUpdated: Date.now() },
          },
          createdAt: Date.now(),
          lastTradeAt: null,
        });
        console.log(`[PaperTrading] Wallet reset with ${balance} XRP`);
      },

      setEnabled: (enabled) => set({ isEnabled: enabled }),
      setDefaultTradeSize: (size) => set({ defaultTradeSize: Math.max(1, Math.min(100, size)) }),

      // Calculate performance statistics
      getStats: () => {
        const state = get();
        const { tradeHistory, startingBalance } = state;
        
        if (tradeHistory.length === 0) {
          return {
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalPnL: 0,
            totalPnLPercent: 0,
            bestTrade: null,
            worstTrade: null,
            averageTradeSize: 0,
            largestPosition: null,
          };
        }

        // Calculate realized P&L from closed trades
        const closedTrades: { asset: string; pnl: number }[] = [];
        const assetTrades: { [asset: string]: PaperTrade[] } = {};

        for (const trade of tradeHistory) {
          if (!assetTrades[trade.asset]) assetTrades[trade.asset] = [];
          assetTrades[trade.asset].push(trade);
        }

        // Simple FIFO matching for P&L
        for (const [asset, trades] of Object.entries(assetTrades)) {
          const buys: { amount: number; price: number }[] = [];
          
          for (const trade of trades) {
            if (trade.type === 'buy') {
              buys.push({ amount: trade.amount, price: trade.price });
            } else {
              // Match sells with buys (FIFO)
              let sellAmount = trade.amount;
              while (sellAmount > 0 && buys.length > 0) {
                const buy = buys[0];
                const matchAmount = Math.min(buy.amount, sellAmount);
                const pnl = (trade.price - buy.price) * matchAmount;
                closedTrades.push({ asset, pnl });
                
                buy.amount -= matchAmount;
                sellAmount -= matchAmount;
                
                if (buy.amount <= 0) buys.shift();
              }
            }
          }
        }

        const winningTrades = closedTrades.filter(t => t.pnl > 0).length;
        const losingTrades = closedTrades.filter(t => t.pnl < 0).length;
        const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
        
        // Add unrealized P&L
        const unrealizedPnL = state.positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
        const totalPortfolioPnL = totalPnL + unrealizedPnL;

        const best = closedTrades.length > 0 
          ? closedTrades.reduce((best, t) => t.pnl > best.pnl ? t : best, closedTrades[0])
          : null;
        const worst = closedTrades.length > 0 
          ? closedTrades.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, closedTrades[0])
          : null;

        const totalTradeVolume = tradeHistory.reduce((sum, t) => sum + t.totalCost, 0);
        const largestPosition = state.positions.length > 0
          ? state.positions.reduce((max, p) => 
              p.quantity * p.currentPrice > (max?.quantity ?? 0) * (max?.currentPrice ?? 0) ? p : max
            ).asset
          : null;

        return {
          totalTrades: tradeHistory.length,
          winningTrades,
          losingTrades,
          winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
          totalPnL: totalPortfolioPnL,
          totalPnLPercent: (totalPortfolioPnL / startingBalance) * 100,
          bestTrade: best,
          worstTrade: worst,
          averageTradeSize: totalTradeVolume / tradeHistory.length,
          largestPosition,
        };
      },

      // Get total portfolio value
      getTotalPortfolioValue: () => {
        const state = get();
        const positionValue = state.positions.reduce(
          (sum, p) => sum + (p.quantity * p.currentPrice), 
          0
        );
        return state.cashBalance + positionValue;
      },
      
      // ==================== AUTO-TRADING ACTIONS ====================
      
      setAutoTradeSettings: (settings) => {
        set((s) => ({
          autoTradeSettings: { ...s.autoTradeSettings, ...settings },
        }));
      },
      
      // Process an incoming signal and decide whether to trade
      processSignal: (signal) => {
        const state = get();
        const settings = state.autoTradeSettings;
        const today = getToday();
        
        // Reset daily counter if new day
        if (state.dailyAutoTradeDate !== today) {
          set({ dailyAutoTradeCount: 0, dailyAutoTradeDate: today });
        }
        
        const logEntry: AutoTradeLog = {
          id: `atl_${Date.now()}`,
          timestamp: Date.now(),
          signalType: signal.type,
          signalConfidence: signal.confidence,
          action: 'skipped',
          reason: '',
          asset: signal.asset,
          suggestedAction: signal.action,
        };
        
        // Check if auto-trading is enabled
        if (!settings.enabled) {
          logEntry.action = 'blocked';
          logEntry.reason = 'Auto-trading is disabled';
          set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
          return logEntry;
        }
        
        // Check if asset is allowed
        if (!settings.allowedAssets.includes(signal.asset)) {
          logEntry.action = 'blocked';
          logEntry.reason = `${signal.asset} not in allowed assets`;
          set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
          return logEntry;
        }
        
        // Check confidence threshold
        if (signal.confidence < settings.minConfidence) {
          logEntry.action = 'skipped';
          logEntry.reason = `Confidence ${signal.confidence}% below threshold ${settings.minConfidence}%`;
          set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
          return logEntry;
        }
        
        // Check daily trade limit
        if (state.dailyAutoTradeCount >= settings.maxDailyTrades) {
          logEntry.action = 'blocked';
          logEntry.reason = `Daily limit reached (${settings.maxDailyTrades} trades)`;
          set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
          return logEntry;
        }
        
        // Check cooldown
        const lastTrade = state.lastAutoTradeByAsset[signal.asset];
        if (lastTrade) {
          const cooldownMs = settings.cooldownMinutes * 60 * 1000;
          if (Date.now() - lastTrade < cooldownMs) {
            const remainingMins = Math.ceil((cooldownMs - (Date.now() - lastTrade)) / 60000);
            logEntry.action = 'blocked';
            logEntry.reason = `Cooldown: ${remainingMins}min remaining for ${signal.asset}`;
            set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
            return logEntry;
          }
        }
        
        // Calculate trade amount based on strategy
        const portfolioValue = state.getTotalPortfolioValue();
        let tradePercent = settings.maxTradePercent;
        
        // Adjust based on strategy and confidence
        if (settings.strategy === 'conservative') {
          tradePercent = Math.min(tradePercent, 5) * (signal.confidence / 100);
        } else if (settings.strategy === 'moderate') {
          tradePercent = tradePercent * (signal.confidence / 100);
        } else {
          // Aggressive - use full allocation if high confidence
          tradePercent = signal.confidence > 80 ? tradePercent * 1.5 : tradePercent;
        }
        
        const tradeValue = (portfolioValue * tradePercent) / 100;
        const tradeAmount = tradeValue / signal.price;
        
        // Validate trade
        if (signal.action === 'buy') {
          if (tradeValue > state.cashBalance) {
            logEntry.action = 'blocked';
            logEntry.reason = `Insufficient funds (need ${tradeValue.toFixed(2)}, have ${state.cashBalance.toFixed(2)})`;
            set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
            return logEntry;
          }
        } else {
          const position = state.positions.find(p => p.asset === signal.asset);
          if (!position || position.quantity < tradeAmount) {
            logEntry.action = 'blocked';
            logEntry.reason = `Insufficient ${signal.asset} position to sell`;
            set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
            return logEntry;
          }
        }
        
        // Execute the trade!
        const success = state.executeTrade({
          type: signal.action,
          asset: signal.asset,
          amount: tradeAmount,
          price: signal.price,
          source: 'auto',
          signalId: signal.id,
          notes: `Auto-trade: ${signal.reason} (${signal.confidence}% confidence)`,
        });
        
        if (success) {
          logEntry.action = 'executed';
          logEntry.reason = `${signal.action.toUpperCase()} ${tradeAmount.toFixed(4)} ${signal.asset} @ $${signal.price}`;
          logEntry.tradeId = state.tradeHistory[state.tradeHistory.length - 1]?.id;
          
          set((s) => ({
            autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100),
            dailyAutoTradeCount: s.dailyAutoTradeCount + 1,
            lastAutoTradeByAsset: {
              ...s.lastAutoTradeByAsset,
              [signal.asset]: Date.now(),
            },
          }));
        } else {
          logEntry.action = 'blocked';
          logEntry.reason = 'Trade execution failed';
          set((s) => ({ autoTradeLog: [logEntry, ...s.autoTradeLog].slice(0, 100) }));
        }
        
        return logEntry;
      },
      
      // Check positions for stop-loss and take-profit
      checkStopLossAndTakeProfit: (prices) => {
        const state = get();
        const settings = state.autoTradeSettings;
        
        if (!settings.enabled) return;
        
        for (const position of state.positions) {
          const currentPrice = prices[position.asset] ?? position.currentPrice;
          const pnlPercent = ((currentPrice - position.averageCost) / position.averageCost) * 100;
          
          // Check take-profit
          if (pnlPercent >= settings.takeProfitPercent) {
            console.log(`[AutoTrade] Take-profit triggered for ${position.asset} at +${pnlPercent.toFixed(1)}%`);
            state.processSignal({
              id: `tp_${Date.now()}`,
              type: 'take_profit',
              asset: position.asset,
              action: 'sell',
              confidence: 100,
              price: currentPrice,
              reason: `Take-profit at +${pnlPercent.toFixed(1)}%`,
            });
          }
          
          // Check stop-loss
          if (pnlPercent <= -settings.stopLossPercent) {
            console.log(`[AutoTrade] Stop-loss triggered for ${position.asset} at ${pnlPercent.toFixed(1)}%`);
            state.processSignal({
              id: `sl_${Date.now()}`,
              type: 'stop_loss',
              asset: position.asset,
              action: 'sell',
              confidence: 100,
              price: currentPrice,
              reason: `Stop-loss at ${pnlPercent.toFixed(1)}%`,
            });
          }
        }
      },
      
      clearAutoTradeLog: () => {
        set({ autoTradeLog: [] });
      },
      
      // ==================== LIQUIDATION-AWARE ACTIONS ====================
      
      // Update liquidation warnings for all positions
      updateLiquidationWarnings: (warnings) => {
        set({ liquidationWarnings: warnings });
        
        // Log any danger-level warnings
        const dangerWarnings = warnings.filter(w => w.riskLevel === 'danger');
        if (dangerWarnings.length > 0) {
          console.warn('[PaperTrading] DANGER: Positions near liquidation zones:', 
            dangerWarnings.map(w => `${w.asset} (${w.distanceToLiqZone.toFixed(1)}% away)`).join(', ')
          );
        }
      },
      
      // Get liquidation warning for a specific asset
      getLiquidationWarning: (asset) => {
        return get().liquidationWarnings.find(w => w.asset === asset);
      },
      
      // Check if any positions are at high risk
      hasHighRiskPositions: () => {
        const warnings = get().liquidationWarnings;
        return warnings.some(w => w.riskLevel === 'danger' || w.riskLevel === 'warning');
      },
    }),
    {
      name: 'xrpl-paper-trading',
    }
  )
);

// ==================== SELECTORS ====================

export const selectTotalValue = (state: PaperTradingState) => 
  state.cashBalance + state.positions.reduce((sum, p) => sum + (p.quantity * p.currentPrice), 0);

export const selectPnL = (state: PaperTradingState) => 
  selectTotalValue(state) - state.startingBalance;

export const selectPnLPercent = (state: PaperTradingState) => 
  (selectPnL(state) / state.startingBalance) * 100;
