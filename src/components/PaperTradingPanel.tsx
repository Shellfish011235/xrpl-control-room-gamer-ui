// Paper Trading Panel - Simulated wallet for practicing strategies
// Execute trades based on signals, track performance, compete with yourself

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, History,
  Trophy, AlertTriangle, Play,
  PieChart, Zap, RotateCcw, ChevronDown, ChevronUp,
  ShoppingCart, HelpCircle, X, ChevronRight, ChevronLeft,
  GraduationCap, Lightbulb, Target, MousePointer,
  Bell, BellRing, Plus, Trash2, Volume2, VolumeX,
  Activity, Radio, Eye, CircleDot
} from 'lucide-react';
import { usePaperTradingStore } from '../store/paperTradingStore';

// Auto-trade icons
import { Bot, Settings2, Gauge, Shield, Flame, Pause, PlayCircle, Clock, CheckCircle2, XCircle, AlertCircle, List } from 'lucide-react';

// ==================== ALERTS SYSTEM ====================

interface PriceAlert {
  id: string;
  asset: string;
  condition: 'above' | 'below';
  targetPrice: number;
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
}

interface MarketSignal {
  id: string;
  type: 'price_move' | 'volatility' | 'volume_spike' | 'trend_change' | 'whale_alert';
  asset: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: number;
  priceAtSignal?: number;
  changePercent?: number;
}

// Simulated market conditions for demo
const generateMarketSignals = (prices: { [asset: string]: number }): MarketSignal[] => {
  const signals: MarketSignal[] = [];
  const now = Date.now();
  
  // Simulate some market activity
  const assets = Object.keys(prices);
  
  // Random price movement alert
  if (Math.random() > 0.6) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const change = (Math.random() - 0.5) * 10;
    signals.push({
      id: `sig_${now}_1`,
      type: 'price_move',
      asset,
      message: `${asset} ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% in last hour`,
      severity: Math.abs(change) > 5 ? 'warning' : 'info',
      timestamp: now,
      priceAtSignal: prices[asset],
      changePercent: change,
    });
  }
  
  // Volatility alert
  if (Math.random() > 0.7) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    signals.push({
      id: `sig_${now}_2`,
      type: 'volatility',
      asset,
      message: `High volatility detected on ${asset}`,
      severity: 'warning',
      timestamp: now,
      priceAtSignal: prices[asset],
    });
  }
  
  // Volume spike
  if (Math.random() > 0.8) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    signals.push({
      id: `sig_${now}_3`,
      type: 'volume_spike',
      asset,
      message: `Unusual trading volume on ${asset}`,
      severity: 'info',
      timestamp: now,
      priceAtSignal: prices[asset],
    });
  }
  
  // Whale alert (rare)
  if (Math.random() > 0.9) {
    signals.push({
      id: `sig_${now}_4`,
      type: 'whale_alert',
      asset: 'XRP',
      message: `Large XRP transfer detected (${(Math.random() * 50 + 10).toFixed(0)}M XRP)`,
      severity: 'critical',
      timestamp: now,
      priceAtSignal: prices['XRP'],
    });
  }
  
  return signals;
};

// ==================== TUTORIAL STEPS ====================

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Optional action hint
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '👋 Welcome to Paper Trading!',
    description: 'This simulator lets you practice trading with fake money (10,000 XRP) so you can learn without any risk. Let me walk you through how it works!',
    target: 'header',
    position: 'bottom',
  },
  {
    id: 'portfolio',
    title: '💰 Your Portfolio',
    description: 'This shows your total portfolio value, available cash to trade with, and your profit/loss (P&L). You start with 10,000 XRP. Green means profit, red means loss.',
    target: 'portfolio-summary',
    position: 'bottom',
  },
  {
    id: 'tabs',
    title: '📑 Navigation Tabs',
    description: 'Use these tabs to switch between: TRADE (make trades), POSITIONS (see what you own), HISTORY (past trades), and STATS (your performance).',
    target: 'tabs',
    position: 'bottom',
  },
  {
    id: 'buy-sell',
    title: '🔄 Buy or Sell',
    description: 'Click BUY when you think a crypto will go UP in price. Click SELL when you think it will go DOWN. For beginners, start with BUY.',
    target: 'buy-sell-toggle',
    position: 'bottom',
  },
  {
    id: 'asset',
    title: '🪙 Choose Your Asset',
    description: 'Select which cryptocurrency you want to trade. XRP is selected by default. The price shown is the current market price.',
    target: 'asset-select',
    position: 'bottom',
  },
  {
    id: 'amount',
    title: '📊 Enter Amount',
    description: 'Type how much you want to buy/sell, OR use the quick buttons (10%, 25%, 50%, 100%) to automatically calculate based on your available cash.',
    target: 'amount-input',
    position: 'top',
    action: 'Try clicking 10% to start small!',
  },
  {
    id: 'summary',
    title: '🧮 Trade Summary',
    description: 'This shows the math: Price × Amount = Total Cost. Make sure the total cost doesn\'t exceed your available cash!',
    target: 'trade-summary',
    position: 'top',
  },
  {
    id: 'execute',
    title: '▶️ Execute Trade',
    description: 'When ready, click this button to execute your trade. It\'s fake money, so don\'t worry - you can\'t lose real money here!',
    target: 'execute-button',
    position: 'top',
    action: 'Go ahead and make your first trade!',
  },
  {
    id: 'positions',
    title: '📈 Track Positions',
    description: 'After trading, check the POSITIONS tab to see what you own. You\'ll see your average buy price and current profit/loss.',
    target: 'tabs',
    position: 'bottom',
    action: 'Click Positions tab after your trade',
  },
  {
    id: 'stats',
    title: '🏆 Check Your Stats',
    description: 'The STATS tab shows your win rate, best/worst trades, and overall performance. Try to beat 50% win rate!',
    target: 'tabs',
    position: 'bottom',
  },
  {
    id: 'reset',
    title: '🔄 Start Fresh',
    description: 'Made mistakes? No problem! Click the reset button (↻) anytime to start over with fresh 10,000 XRP.',
    target: 'reset-button',
    position: 'left',
  },
  {
    id: 'complete',
    title: '🎉 You\'re Ready!',
    description: 'That\'s it! Remember: Buy low, sell high. Start with small trades (10-25%), and track your win rate. Good luck!',
    target: 'header',
    position: 'bottom',
  },
];

interface PaperTradingPanelProps {
  compact?: boolean;
  suggestedTrades?: Array<{
    asset: string;
    action: 'buy' | 'sell';
    price: number;
    reason: string;
    confidence: number;
  }>;
  currentPrices?: { [asset: string]: number };
}

// Default prices
const DEFAULT_PRICES: { [asset: string]: number } = {
  // Major Cryptocurrencies
  XRP: 2.45,
  BTC: 98500,
  ETH: 3850,
  SOL: 245,
  DOGE: 0.42,
  ADA: 1.15,
  LINK: 28.50,
  DOT: 12.80,
  // Additional Popular Cryptos
  AVAX: 42.50,
  MATIC: 0.85,
  ATOM: 12.40,
  UNI: 15.20,
  LTC: 125.00,
  XLM: 0.45,
  ALGO: 0.38,
  HBAR: 0.32,
  // More Options
  NEAR: 6.80,
  FTM: 0.95,
  VET: 0.048,
  SAND: 0.62,
  MANA: 0.58,
  APE: 1.85,
  CRO: 0.12,
  SHIB: 0.000028,
};

export function PaperTradingPanel({ 
  compact = false, 
  suggestedTrades = [],
  currentPrices = DEFAULT_PRICES 
}: PaperTradingPanelProps) {
  const store = usePaperTradingStore();
  
  // Destructure with fallbacks
  const cashBalance = store?.cashBalance ?? 10000;
  const positions = store?.positions ?? [];
  const tradeHistory = store?.tradeHistory ?? [];
  const startingBalance = store?.startingBalance ?? 10000;
  const isEnabled = store?.isEnabled ?? true;
  const defaultTradeSize = store?.defaultTradeSize ?? 10;
  const executeTrade = store?.executeTrade;
  const closePosition = store?.closePosition;
  const resetWallet = store?.resetWallet;
  const setEnabled = store?.setEnabled;
  const getStats = store?.getStats;
  const getTotalPortfolioValue = store?.getTotalPortfolioValue;

  // Local state
  const [activeTab, setActiveTab] = useState<'trade' | 'positions' | 'history' | 'stats' | 'alerts' | 'auto'>('trade');
  const [tradeAsset, setTradeAsset] = useState('XRP');
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [showReset, setShowReset] = useState(false);
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [prices, setPrices] = useState<{ [asset: string]: number }>(currentPrices || DEFAULT_PRICES);
  
  // Alerts state
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [newAlertAsset, setNewAlertAsset] = useState('XRP');
  const [newAlertCondition, setNewAlertCondition] = useState<'above' | 'below'>('above');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [showAlertNotification, setShowAlertNotification] = useState<MarketSignal | null>(null);
  
  // Auto-trading state from store
  const autoTradeSettings = store?.autoTradeSettings;
  const autoTradeLog = store?.autoTradeLog ?? [];
  const setAutoTradeSettings = store?.setAutoTradeSettings;
  const processSignal = store?.processSignal;
  const clearAutoTradeLog = store?.clearAutoTradeLog;
  const dailyAutoTradeCount = store?.dailyAutoTradeCount ?? 0;
  const checkStopLossAndTakeProfit = store?.checkStopLossAndTakeProfit;
  
  // Process suggested trades through auto-trader when they arrive
  const [lastProcessedSignals, setLastProcessedSignals] = useState<string>('');
  
  useEffect(() => {
    // Skip if auto-trading disabled or no signals
    if (!autoTradeSettings?.enabled || !processSignal) return;
    if (!suggestedTrades || suggestedTrades.length === 0) return;
    
    // Create a signature to avoid reprocessing the same signals
    const signalSignature = suggestedTrades.map(t => `${t.asset}-${t.action}-${t.confidence}`).join('|');
    if (signalSignature === lastProcessedSignals) return;
    setLastProcessedSignals(signalSignature);
    
    // Process each suggested trade through auto-trader
    suggestedTrades.forEach((trade, idx) => {
      // Delay each signal slightly to avoid flooding
      setTimeout(() => {
        try {
          processSignal({
            id: `suggested_${Date.now()}_${idx}`,
            type: 'suggested_trade',
            asset: trade.asset || 'XRP',
            action: trade.action,
            confidence: trade.confidence,
            price: trade.price || prices[trade.asset] || 2.45,
            reason: trade.reason || 'Suggested trade signal',
          });
        } catch (e) {
          console.warn('[PaperTrading] Error processing signal:', e);
        }
      }, idx * 500);
    });
  }, [suggestedTrades, autoTradeSettings?.enabled, processSignal, lastProcessedSignals, prices]);
  
  // Check stop-loss and take-profit when prices update
  useEffect(() => {
    if (!autoTradeSettings?.enabled || !checkStopLossAndTakeProfit) return;
    try {
      checkStopLossAndTakeProfit(prices);
    } catch (e) {
      console.warn('[PaperTrading] Error checking SL/TP:', e);
    }
  }, [prices, autoTradeSettings?.enabled, checkStopLossAndTakeProfit]);
  
  // Periodic market signal generator (simulates live signals when no external signals)
  useEffect(() => {
    if (!autoTradeSettings?.enabled || !processSignal) return;
    
    // Generate a simulated market signal every 45-90 seconds
    const generateMarketSignal = () => {
      const assets = Object.keys(prices);
      const allowedAssets = autoTradeSettings?.allowedAssets || ['XRP'];
      const validAssets = assets.filter(a => allowedAssets.includes(a));
      
      if (validAssets.length === 0) return;
      
      const asset = validAssets[Math.floor(Math.random() * validAssets.length)];
      const isBullish = Math.random() > 0.45; // Slightly bullish bias
      const confidence = Math.floor(Math.random() * 35) + 55; // 55-90%
      
      const bullishReasons = [
        'Strong buying pressure detected',
        'Positive sentiment surge',
        'Breakout pattern forming',
        'Whale accumulation signal',
        'Technical indicators bullish',
        'Volume spike with upward momentum',
      ];
      
      const bearishReasons = [
        'Selling pressure increasing',
        'Bearish divergence detected',
        'Resistance level rejection',
        'Whale distribution signal',
        'Technical indicators bearish',
        'Volume spike with downward momentum',
      ];
      
      const reasons = isBullish ? bullishReasons : bearishReasons;
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      
      try {
        processSignal({
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'market_analysis',
          asset,
          action: isBullish ? 'buy' : 'sell',
          confidence,
          price: prices[asset] || 2.45,
          reason: `${reason} on ${asset}`,
        });
      } catch (e) {
        console.warn('[PaperTrading] Error generating signal:', e);
      }
    };
    
    // Initial signal after 5 seconds
    const initialTimeout = setTimeout(generateMarketSignal, 5000);
    
    // Then every 45-90 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to generate
        generateMarketSignal();
      }
    }, 45000 + Math.random() * 45000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [autoTradeSettings?.enabled, autoTradeSettings?.allowedAssets, processSignal, prices]);
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const currentTutorialStep = TUTORIAL_STEPS[tutorialStep];
  
  // Tutorial navigation
  const nextStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      setShowTutorial(false);
      setTutorialStep(0);
    }
  };
  
  const prevStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(prev => prev - 1);
    }
  };
  
  const skipTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
  };
  
  const startTutorial = () => {
    setShowTutorial(true);
    setTutorialStep(0);
    setActiveTab('trade'); // Reset to trade tab for tutorial
  };

  // Update prices when prop changes
  useEffect(() => {
    if (currentPrices) {
      setPrices(prev => ({ ...DEFAULT_PRICES, ...prev, ...currentPrices }));
    }
  }, [currentPrices]);
  
  // Check price alerts when prices change
  useEffect(() => {
    if (!alertsEnabled) return;
    
    setPriceAlerts(prev => prev.map(alert => {
      if (alert.triggered) return alert;
      
      const currentPrice = prices[alert.asset];
      if (!currentPrice) return alert;
      
      const shouldTrigger = alert.condition === 'above' 
        ? currentPrice >= alert.targetPrice
        : currentPrice <= alert.targetPrice;
      
      if (shouldTrigger) {
        // Show notification
        setShowAlertNotification({
          id: `alert_${alert.id}`,
          type: 'price_move',
          asset: alert.asset,
          message: `${alert.asset} is now ${alert.condition} $${alert.targetPrice.toLocaleString()}!`,
          severity: 'critical',
          timestamp: Date.now(),
          priceAtSignal: currentPrice,
        });
        
        return { ...alert, triggered: true, triggeredAt: Date.now() };
      }
      
      return alert;
    }));
  }, [prices, alertsEnabled]);
  
  // Generate market signals periodically
  useEffect(() => {
    if (!alertsEnabled) return;
    
    const generateSignals = () => {
      const newSignals = generateMarketSignals(prices);
      if (newSignals.length > 0) {
        setMarketSignals(prev => [...newSignals, ...prev].slice(0, 20)); // Keep last 20
        
        // Show notification for critical signals
        const critical = newSignals.find(s => s.severity === 'critical');
        if (critical) {
          setShowAlertNotification(critical);
        }
      }
    };
    
    // Generate initial signals
    generateSignals();
    
    // Then every 30 seconds
    const interval = setInterval(generateSignals, 30000);
    return () => clearInterval(interval);
  }, [prices, alertsEnabled]);
  
  // Auto-dismiss notification
  useEffect(() => {
    if (showAlertNotification) {
      const timer = setTimeout(() => setShowAlertNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlertNotification]);
  
  // Alert management functions
  const addPriceAlert = useCallback(() => {
    const targetPrice = parseFloat(newAlertPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) return;
    
    const newAlert: PriceAlert = {
      id: `pa_${Date.now()}`,
      asset: newAlertAsset,
      condition: newAlertCondition,
      targetPrice,
      createdAt: Date.now(),
      triggered: false,
    };
    
    setPriceAlerts(prev => [newAlert, ...prev]);
    setNewAlertPrice('');
  }, [newAlertAsset, newAlertCondition, newAlertPrice]);
  
  const deleteAlert = useCallback((id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  }, []);
  
  const clearTriggeredAlerts = useCallback(() => {
    setPriceAlerts(prev => prev.filter(a => !a.triggered));
  }, []);
  
  // Count active alerts
  const activeAlertCount = useMemo(() => {
    return priceAlerts.filter(a => !a.triggered).length;
  }, [priceAlerts]);

  // Safe calculations
  const totalValue = getTotalPortfolioValue?.() ?? cashBalance;
  const totalPnL = totalValue - startingBalance;
  const totalPnLPercent = startingBalance > 0 ? (totalPnL / startingBalance) * 100 : 0;
  const stats = getStats?.() ?? {
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

  const currentPrice = prices[tradeAsset] ?? DEFAULT_PRICES[tradeAsset] ?? 2.45;
  const tradeAmountNum = parseFloat(tradeAmount) || 0;
  const tradeCost = tradeAmountNum * currentPrice;

  // Execute trade handler
  const handleTrade = useCallback(() => {
    if (tradeAmountNum <= 0 || !executeTrade) return;

    const success = executeTrade({
      type: tradeType,
      asset: tradeAsset,
      amount: tradeAmountNum,
      price: currentPrice,
      source: 'manual',
    });

    if (success) {
      setTradeAmount('');
    }
  }, [executeTrade, tradeType, tradeAsset, tradeAmountNum, currentPrice]);

  // Execute suggested trade
  const handleSuggestedTrade = useCallback((trade: { asset: string; action: 'buy' | 'sell'; price: number }) => {
    if (!executeTrade) return;
    
    const tradePrice = prices[trade.asset] || trade.price || 2.45;
    const amount = (cashBalance * (defaultTradeSize / 100)) / tradePrice;
    
    executeTrade({
      type: trade.action,
      asset: trade.asset || 'XRP',
      amount: Math.floor(amount * 100) / 100,
      price: tradePrice,
      source: 'signal',
    });
  }, [executeTrade, cashBalance, defaultTradeSize, prices]);

  // Quick buy presets
  const handleQuickBuy = (percent: number) => {
    const amount = (cashBalance * (percent / 100)) / currentPrice;
    setTradeAmount(Math.floor(amount * 100) / 100 + '');
    setTradeType('buy');
  };

  if (!isEnabled) {
    return (
      <div className="cyber-panel p-4 border-cyber-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-cyber-muted" />
            <span className="text-sm text-cyber-muted">Paper Trading Disabled</span>
          </div>
          <button
            onClick={() => setEnabled?.(true)}
            className="px-3 py-1 text-xs rounded bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30"
          >
            Enable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div 
        id="header"
        className={`flex items-center justify-between mb-4 pb-2 border-b border-cyber-border ${
          showTutorial && (currentTutorialStep?.target === 'header') ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded z-50 relative' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyber-green/30 to-cyber-cyan/30 flex items-center justify-center">
            <Wallet size={16} className="text-cyber-green" />
          </div>
          <div>
            <h3 className="font-cyber text-sm text-cyber-green">PAPER TRADING</h3>
            <p className="text-[9px] text-cyber-muted">Practice without risk</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tutorial Button */}
          <button
            onClick={startTutorial}
            className="flex items-center gap-1 px-2 py-1 text-[9px] rounded bg-cyber-purple/20 text-cyber-purple hover:bg-cyber-purple/30 border border-cyber-purple/30 transition-all"
            title="Start Tutorial"
          >
            <GraduationCap size={12} />
            TUTORIAL
          </button>
          <span className="px-2 py-0.5 text-[9px] rounded bg-cyber-yellow/20 text-cyber-yellow font-cyber">
            SIMULATOR
          </span>
          <button
            id="reset-button"
            onClick={() => setShowReset(true)}
            className={`p-1 rounded hover:bg-cyber-border/30 text-cyber-muted hover:text-cyber-red ${
              showTutorial && currentTutorialStep?.target === 'reset-button' ? 'ring-2 ring-cyber-cyan' : ''
            }`}
            title="Reset Wallet"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div 
        id="portfolio-summary"
        className={`grid grid-cols-3 gap-2 mb-4 ${
          showTutorial && currentTutorialStep?.target === 'portfolio-summary' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded p-1 z-50 relative' : ''
        }`}
      >
        <div className="p-2 rounded bg-cyber-darker border border-cyber-border/50 text-center">
          <p className="text-[9px] text-cyber-muted mb-1">PORTFOLIO VALUE</p>
          <p className="font-cyber text-lg text-cyber-text">
            {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] text-cyber-muted">XRP</p>
        </div>
        <div className="p-2 rounded bg-cyber-darker border border-cyber-border/50 text-center">
          <p className="text-[9px] text-cyber-muted mb-1">AVAILABLE CASH</p>
          <p className="font-cyber text-lg text-cyber-cyan">
            {cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] text-cyber-muted">XRP</p>
        </div>
        <div className={`p-2 rounded border text-center ${
          totalPnL >= 0 
            ? 'bg-cyber-green/10 border-cyber-green/30' 
            : 'bg-cyber-red/10 border-cyber-red/30'
        }`}>
          <p className="text-[9px] text-cyber-muted mb-1">TOTAL P&L</p>
          <div className="flex items-center justify-center gap-1">
            {totalPnL >= 0 ? (
              <TrendingUp size={14} className="text-cyber-green" />
            ) : (
              <TrendingDown size={14} className="text-cyber-red" />
            )}
            <p className={`font-cyber text-lg ${totalPnL >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
              {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </p>
          </div>
          <p className={`text-[9px] ${totalPnL >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div 
        id="tabs"
        className={`flex gap-1 mb-4 ${
          showTutorial && currentTutorialStep?.target === 'tabs' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded p-1 z-50 relative' : ''
        }`}
      >
        {[
          { id: 'trade', label: 'Trade', icon: ShoppingCart },
          { id: 'positions', label: `Positions (${positions.length})`, icon: PieChart },
          { id: 'history', label: 'History', icon: History },
          { id: 'stats', label: 'Stats', icon: Trophy },
          { id: 'alerts', label: `Alerts${activeAlertCount > 0 ? ` (${activeAlertCount})` : ''}`, icon: Bell },
          { id: 'auto', label: `Auto${autoTradeSettings?.enabled ? ' ●' : ''}`, icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                activeTab === tab.id
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50'
                  : 'bg-cyber-darker text-cyber-muted hover:text-cyber-text border border-transparent'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Trade Tab */}
        {activeTab === 'trade' && (
          <motion.div
            key="trade"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Suggested Trades */}
            {suggestedTrades && suggestedTrades.length > 0 && (
              <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-cyber-purple" />
                  <span className="text-xs text-cyber-purple font-cyber">SUGGESTED TRADES</span>
                  <span className="text-[9px] text-cyber-muted">from prediction markets</span>
                </div>
                <div className="space-y-2">
                  {suggestedTrades.slice(0, 5).map((trade, idx) => (
                    <div key={idx} className="p-2 rounded bg-cyber-darker/50 hover:bg-cyber-darker/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-cyber ${
                            trade.action === 'buy' 
                              ? 'bg-cyber-green/20 text-cyber-green' 
                              : 'bg-cyber-red/20 text-cyber-red'
                          }`}>
                            {trade.action.toUpperCase()}
                          </span>
                          <span className="text-sm text-cyber-text font-cyber">{trade.asset || 'XRP'}</span>
                          <span className="text-xs text-cyber-muted">
                            @ ${(prices[trade.asset] || trade.price || 2.45).toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: trade.price >= 100 ? 0 : 2 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] ${
                            trade.confidence >= 80 ? 'text-cyber-green' : 
                            trade.confidence >= 70 ? 'text-cyber-cyan' : 'text-cyber-yellow'
                          }`}>{trade.confidence}%</span>
                          <button
                            onClick={() => handleSuggestedTrade(trade)}
                            className={`px-2 py-1 text-[10px] rounded transition-all ${
                              trade.action === 'buy'
                                ? 'bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30 border border-cyber-green/30'
                                : 'bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30 border border-cyber-red/30'
                            }`}
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                      {trade.reason && (
                        <p className="text-[9px] text-cyber-muted mt-1 pl-12 truncate" title={trade.reason}>
                          📊 {trade.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Trade Form */}
            <div className="space-y-3">
              {/* Buy/Sell Toggle */}
              <div 
                id="buy-sell-toggle"
                className={`flex gap-2 ${
                  showTutorial && currentTutorialStep?.target === 'buy-sell-toggle' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded p-1 z-50 relative' : ''
                }`}
              >
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-cyber text-sm transition-all ${
                    tradeType === 'buy'
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/50'
                      : 'bg-cyber-darker text-cyber-muted border border-cyber-border'
                  }`}
                >
                  <ArrowUpRight size={16} />
                  BUY
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-cyber text-sm transition-all ${
                    tradeType === 'sell'
                      ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/50'
                      : 'bg-cyber-darker text-cyber-muted border border-cyber-border'
                  }`}
                >
                  <ArrowDownRight size={16} />
                  SELL
                </button>
              </div>

              {/* Asset Selection */}
              <div
                id="asset-select"
                className={showTutorial && currentTutorialStep?.target === 'asset-select' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded p-1 z-50 relative' : ''}
              >
                <label className="text-[10px] text-cyber-muted mb-1 block">ASSET</label>
                <select
                  value={tradeAsset}
                  onChange={(e) => setTradeAsset(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-sm text-cyber-text focus:border-cyber-cyan outline-none"
                >
                  {Object.entries(prices).map(([asset, price]) => (
                    <option key={asset} value={asset}>
                      {asset} - ${price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div
                id="amount-input"
                className={showTutorial && currentTutorialStep?.target === 'amount-input' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded p-1 z-50 relative' : ''}
              >
                <label className="text-[10px] text-cyber-muted mb-1 block">AMOUNT ({tradeAsset})</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded bg-cyber-darker border border-cyber-border text-sm text-cyber-text focus:border-cyber-cyan outline-none"
                />
                {/* Quick Amount Buttons */}
                <div className="flex gap-1 mt-2">
                  {[10, 25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => handleQuickBuy(pct)}
                      className="flex-1 py-1 text-[10px] rounded bg-cyber-border/30 text-cyber-muted hover:bg-cyber-cyan/20 hover:text-cyber-cyan"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade Summary */}
              <div 
                id="trade-summary"
                className={`p-3 rounded bg-cyber-darker/50 border border-cyber-border/50 ${
                  showTutorial && currentTutorialStep?.target === 'trade-summary' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark z-50 relative' : ''
                }`}
              >
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyber-muted">Price</span>
                  <span className="text-cyber-text">${currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-cyber-muted">Amount</span>
                  <span className="text-cyber-text">{tradeAmountNum.toLocaleString()} {tradeAsset}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-cyber-border/50">
                  <span className="text-cyber-muted">Total Cost</span>
                  <span className={`font-cyber ${
                    tradeType === 'buy' ? 'text-cyber-red' : 'text-cyber-green'
                  }`}>
                    {tradeType === 'buy' ? '-' : '+'}{tradeCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                  </span>
                </div>
              </div>

              {/* Execute Button */}
              <div
                id="execute-button"
                className={showTutorial && currentTutorialStep?.target === 'execute-button' ? 'ring-2 ring-cyber-cyan ring-offset-2 ring-offset-cyber-dark rounded z-50 relative' : ''}
              >
                <button
                  onClick={handleTrade}
                  disabled={tradeAmountNum <= 0 || (tradeType === 'buy' && tradeCost > cashBalance)}
                  className={`w-full py-3 rounded font-cyber text-sm transition-all flex items-center justify-center gap-2 ${
                    tradeAmountNum <= 0 || (tradeType === 'buy' && tradeCost > cashBalance)
                      ? 'bg-cyber-muted/20 text-cyber-muted cursor-not-allowed'
                      : tradeType === 'buy'
                        ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/30'
                        : 'bg-cyber-red/20 text-cyber-red border border-cyber-red/50 hover:bg-cyber-red/30'
                  }`}
              >
                <Play size={16} />
                  {tradeType === 'buy' ? 'BUY' : 'SELL'} {tradeAsset}
                </button>
              </div>

              {tradeType === 'buy' && tradeCost > cashBalance && (
                <p className="text-[10px] text-cyber-red text-center">
                  Insufficient funds ({(tradeCost - cashBalance).toFixed(2)} XRP short)
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && (
          <motion.div
            key="positions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <PieChart size={32} className="mx-auto text-cyber-muted mb-2" />
                <p className="text-sm text-cyber-muted">No open positions</p>
                <p className="text-xs text-cyber-muted">Execute a trade to get started</p>
              </div>
            ) : (
              positions.map((position) => (
                <div
                  key={position.asset}
                  className="p-3 rounded bg-cyber-darker border border-cyber-border/50"
                >
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedPosition(
                      expandedPosition === position.asset ? null : position.asset
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-cyber text-sm text-cyber-text">{position.asset}</span>
                      <span className="text-xs text-cyber-muted">
                        {position.quantity.toLocaleString()} units
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-right ${
                        position.unrealizedPnL >= 0 ? 'text-cyber-green' : 'text-cyber-red'
                      }`}>
                        <p className="text-sm font-cyber">
                          {position.unrealizedPnL >= 0 ? '+' : ''}
                          {position.unrealizedPnL.toFixed(2)} XRP
                        </p>
                        <p className="text-[10px]">
                          {position.unrealizedPnLPercent >= 0 ? '+' : ''}
                          {position.unrealizedPnLPercent.toFixed(2)}%
                        </p>
                      </div>
                      {expandedPosition === position.asset ? (
                        <ChevronUp size={14} className="text-cyber-muted" />
                      ) : (
                        <ChevronDown size={14} className="text-cyber-muted" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedPosition === position.asset && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-cyber-border/50 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-cyber-muted">Avg Cost</span>
                            <span className="text-cyber-text">${position.averageCost.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-cyber-muted">Current Price</span>
                            <span className="text-cyber-text">${position.currentPrice.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-cyber-muted">Position Value</span>
                            <span className="text-cyber-text">
                              {(position.quantity * position.currentPrice).toFixed(2)} XRP
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              closePosition?.(position.asset, position.currentPrice);
                            }}
                            className="w-full mt-2 py-2 rounded bg-cyber-red/20 text-cyber-red border border-cyber-red/30 hover:bg-cyber-red/30 text-xs font-cyber"
                          >
                            CLOSE POSITION
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* History Tab - Enhanced with P&L tracking */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* History Summary Banner */}
            {tradeHistory.length > 0 && (
              <div className="p-3 rounded bg-gradient-to-r from-cyber-purple/20 to-cyber-cyan/20 border border-cyber-purple/30">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-cyber-muted">TOTAL TRADES</p>
                    <p className="font-cyber text-sm text-cyber-text">{tradeHistory.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-cyber-muted">BUYS</p>
                    <p className="font-cyber text-sm text-cyber-green">
                      {tradeHistory.filter(t => t.type === 'buy').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-cyber-muted">SELLS</p>
                    <p className="font-cyber text-sm text-cyber-red">
                      {tradeHistory.filter(t => t.type === 'sell').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-cyber-muted">VOLUME</p>
                    <p className="font-cyber text-sm text-cyber-cyan">
                      {tradeHistory.reduce((sum, t) => sum + t.totalCost, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                
                {/* Cumulative P&L Progress */}
                <div className="mt-3 pt-3 border-t border-cyber-border/30">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-cyber-muted">CUMULATIVE P&L</span>
                    <span className={`text-xs font-cyber ${totalPnL >= 0 ? 'text-cyber-green' : 'text-cyber-red'}`}>
                      {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} XRP ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-cyber-darker rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${totalPnL >= 0 ? 'bg-cyber-green' : 'bg-cyber-red'}`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(totalPnLPercent) + 50)}%`,
                        marginLeft: totalPnL < 0 ? `${50 - Math.min(50, Math.abs(totalPnLPercent))}%` : '50%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-cyber-muted mt-1">
                    <span>-50%</span>
                    <span>Start</span>
                    <span>+50%</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Trade History List */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {tradeHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History size={32} className="mx-auto text-cyber-muted mb-2" />
                  <p className="text-sm text-cyber-muted">No trade history yet</p>
                  <p className="text-[10px] text-cyber-muted mt-1">Your trades will appear here</p>
                </div>
              ) : (
                [...tradeHistory].reverse().map((trade, idx) => {
                  // Calculate running balance at this point
                  const tradesUpToThis = tradeHistory.slice(0, tradeHistory.length - idx);
                  const runningBalance = tradesUpToThis.reduce((bal, t) => {
                    return t.type === 'buy' ? bal - t.totalCost : bal + t.totalCost;
                  }, startingBalance);
                  
                  return (
                    <div
                      key={trade.id}
                      className="p-2.5 rounded bg-cyber-darker/50 border border-cyber-border/30 hover:border-cyber-border/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${
                            trade.type === 'buy'
                              ? 'bg-cyber-green/20'
                              : 'bg-cyber-red/20'
                          }`}>
                            {trade.type === 'buy' 
                              ? <ArrowDownRight size={16} className="text-cyber-green" />
                              : <ArrowUpRight size={16} className="text-cyber-red" />
                            }
                          </div>
                          <div>
                            <p className="text-xs text-cyber-text font-medium">
                              {trade.type.toUpperCase()} {trade.amount.toLocaleString()} {trade.asset}
                            </p>
                            <p className="text-[9px] text-cyber-muted">
                              @ ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${trade.type === 'buy' ? 'text-cyber-red' : 'text-cyber-green'}`}>
                            {trade.type === 'buy' ? '-' : '+'}{trade.totalCost.toFixed(2)} XRP
                          </p>
                          <p className="text-[9px] text-cyber-muted">
                            {new Date(trade.timestamp).toLocaleString(undefined, { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Running Balance */}
                      <div className="mt-2 pt-2 border-t border-cyber-border/20 flex justify-between items-center">
                        <span className="text-[9px] text-cyber-muted">Cash after trade:</span>
                        <span className="text-[10px] text-cyber-cyan font-mono">
                          {runningBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                        </span>
                      </div>
                      
                      {/* Trade Source Badge */}
                      {trade.source && trade.source !== 'manual' && (
                        <div className="mt-1.5">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                            trade.source === 'signal' 
                              ? 'bg-cyber-purple/20 text-cyber-purple'
                              : 'bg-cyber-cyan/20 text-cyber-cyan'
                          }`}>
                            {trade.source === 'signal' ? '⚡ SIGNAL TRADE' : '🔮 PREDICTION TRADE'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Export/Share Button */}
            {tradeHistory.length > 0 && (
              <button
                onClick={() => {
                  const data = {
                    exportDate: new Date().toISOString(),
                    startingBalance,
                    currentBalance: totalValue,
                    totalPnL,
                    totalPnLPercent,
                    totalTrades: tradeHistory.length,
                    trades: tradeHistory.map(t => ({
                      date: new Date(t.timestamp).toISOString(),
                      type: t.type,
                      asset: t.asset,
                      amount: t.amount,
                      price: t.price,
                      total: t.totalCost,
                      source: t.source
                    }))
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `paper-trading-history-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full py-2 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-muted hover:text-cyber-text hover:border-cyber-cyan transition-all flex items-center justify-center gap-2"
              >
                <ArrowDownRight size={12} />
                Export Trade History
              </button>
            )}
          </motion.div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Performance Rating Card */}
            <div className={`p-4 rounded border ${
              stats.winRate >= 60 
                ? 'bg-gradient-to-br from-cyber-green/20 via-cyber-cyan/10 to-cyber-green/20 border-cyber-green/50'
                : stats.winRate >= 40
                  ? 'bg-gradient-to-br from-cyber-yellow/20 via-cyber-purple/10 to-cyber-yellow/20 border-cyber-yellow/50'
                  : 'bg-gradient-to-br from-cyber-red/20 via-cyber-purple/10 to-cyber-red/20 border-cyber-red/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className={
                    stats.winRate >= 60 ? 'text-cyber-green' : stats.winRate >= 40 ? 'text-cyber-yellow' : 'text-cyber-red'
                  } />
                  <div>
                    <p className="text-[10px] text-cyber-muted">TRADER RATING</p>
                    <p className={`font-cyber text-lg ${
                      stats.winRate >= 60 ? 'text-cyber-green' : stats.winRate >= 40 ? 'text-cyber-yellow' : 'text-cyber-red'
                    }`}>
                      {stats.winRate >= 70 ? '🏆 Expert' :
                       stats.winRate >= 60 ? '⭐ Advanced' :
                       stats.winRate >= 50 ? '📈 Intermediate' :
                       stats.winRate >= 40 ? '📚 Learning' :
                       stats.totalTrades === 0 ? '🌱 New Trader' : '💪 Keep Practicing'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-cyber-muted">WIN RATE</p>
                  <p className={`font-cyber text-2xl ${
                    stats.winRate >= 50 ? 'text-cyber-green' : 'text-cyber-red'
                  }`}>
                    {stats.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Win/Loss Bar */}
              <div className="h-3 bg-cyber-darker rounded-full overflow-hidden flex">
                <div 
                  className="bg-cyber-green h-full transition-all"
                  style={{ width: `${stats.winRate}%` }}
                />
                <div 
                  className="bg-cyber-red h-full transition-all"
                  style={{ width: `${100 - stats.winRate}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] mt-1">
                <span className="text-cyber-green">{stats.winningTrades} Wins</span>
                <span className="text-cyber-red">{stats.losingTrades} Losses</span>
              </div>
            </div>

            {/* Account Summary */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <p className="text-[9px] text-cyber-muted mb-2">ACCOUNT SUMMARY</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cyber-muted">Started With:</span>
                  <span className="text-xs text-cyber-text font-mono">{startingBalance.toLocaleString()} XRP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cyber-muted">Current Value:</span>
                  <span className={`text-xs font-mono ${totalValue >= startingBalance ? 'text-cyber-green' : 'text-cyber-red'}`}>
                    {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} XRP
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-cyber-border/30">
                  <span className="text-xs text-cyber-muted">Account Age:</span>
                  <span className="text-xs text-cyber-cyan">
                    {(() => {
                      const days = Math.floor((Date.now() - (store?.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
                      if (days === 0) return 'Today';
                      if (days === 1) return '1 day';
                      return `${days} days`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cyber-muted">Last Trade:</span>
                  <span className="text-xs text-cyber-muted">
                    {store?.lastTradeAt 
                      ? new Date(store.lastTradeAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
                <p className="text-[9px] text-cyber-muted mb-1">TOTAL TRADES</p>
                <p className="font-cyber text-lg text-cyber-text">{stats.totalTrades}</p>
              </div>
              <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
                <p className="text-[9px] text-cyber-muted mb-1">AVG TRADE SIZE</p>
                <p className="font-cyber text-lg text-cyber-text">
                  {stats.averageTradeSize.toFixed(0)} XRP
                </p>
              </div>
              <div className={`p-3 rounded border ${
                stats.bestTrade && stats.bestTrade.pnl > 0
                  ? 'bg-cyber-green/10 border-cyber-green/30'
                  : 'bg-cyber-darker/50 border-cyber-border/30'
              }`}>
                <p className="text-[9px] text-cyber-muted mb-1">BEST TRADE</p>
                {stats.bestTrade ? (
                  <>
                    <p className="font-cyber text-lg text-cyber-green">
                      +{stats.bestTrade.pnl.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-cyber-muted">{stats.bestTrade.asset}</p>
                  </>
                ) : (
                  <p className="text-sm text-cyber-muted">--</p>
                )}
              </div>
              <div className={`p-3 rounded border ${
                stats.worstTrade && stats.worstTrade.pnl < 0
                  ? 'bg-cyber-red/10 border-cyber-red/30'
                  : 'bg-cyber-darker/50 border-cyber-border/30'
              }`}>
                <p className="text-[9px] text-cyber-muted mb-1">WORST TRADE</p>
                {stats.worstTrade ? (
                  <>
                    <p className="font-cyber text-lg text-cyber-red">
                      {stats.worstTrade.pnl.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-cyber-muted">{stats.worstTrade.asset}</p>
                  </>
                ) : (
                  <p className="text-sm text-cyber-muted">--</p>
                )}
              </div>
            </div>

            {/* Total P&L Banner */}
            <div className={`p-4 rounded border ${
              stats.totalPnL >= 0
                ? 'bg-gradient-to-r from-cyber-green/20 to-cyber-cyan/20 border-cyber-green/50'
                : 'bg-gradient-to-r from-cyber-red/20 to-cyber-purple/20 border-cyber-red/50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-cyber-muted">TOTAL P&L</p>
                  <p className={`font-cyber text-2xl ${
                    stats.totalPnL >= 0 ? 'text-cyber-green' : 'text-cyber-red'
                  }`}>
                    {stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)} XRP
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-cyber-muted">RETURN</p>
                  <p className={`font-cyber text-2xl ${
                    stats.totalPnLPercent >= 0 ? 'text-cyber-green' : 'text-cyber-red'
                  }`}>
                    {stats.totalPnLPercent >= 0 ? '+' : ''}{stats.totalPnLPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tips Based on Performance */}
            <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
              <div className="flex items-start gap-2">
                <Lightbulb size={14} className="text-cyber-purple shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-cyber-purple font-medium mb-1">TRADING TIP</p>
                  <p className="text-[10px] text-cyber-muted">
                    {stats.totalTrades === 0 
                      ? "Start with small trades (10-25% of portfolio) to learn without big risks."
                      : stats.winRate >= 60
                        ? "Great job! Consider increasing position sizes slightly, but always manage risk."
                        : stats.winRate >= 40
                          ? "You're learning! Focus on understanding why your winning trades succeed."
                          : "Review your losing trades. Look for patterns and adjust your strategy."
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Alerts Toggle & Status */}
            <div className="flex items-center justify-between p-3 rounded bg-cyber-darker border border-cyber-border/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${alertsEnabled ? 'bg-cyber-green animate-pulse' : 'bg-cyber-muted'}`} />
                <span className="text-xs text-cyber-text">
                  {alertsEnabled ? 'Alerts Active' : 'Alerts Paused'}
                </span>
              </div>
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`p-2 rounded transition-all ${
                  alertsEnabled 
                    ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                    : 'bg-cyber-muted/20 text-cyber-muted border border-cyber-border'
                }`}
              >
                {alertsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
            
            {/* Create Price Alert */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-cyber-cyan" />
                <span className="text-xs text-cyber-text font-medium">CREATE PRICE ALERT</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mb-3">
                <select
                  value={newAlertAsset}
                  onChange={(e) => setNewAlertAsset(e.target.value)}
                  className="col-span-1 px-2 py-1.5 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan outline-none"
                >
                  {Object.keys(prices).map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
                
                <select
                  value={newAlertCondition}
                  onChange={(e) => setNewAlertCondition(e.target.value as 'above' | 'below')}
                  className="col-span-1 px-2 py-1.5 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan outline-none"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                
                <input
                  type="number"
                  value={newAlertPrice}
                  onChange={(e) => setNewAlertPrice(e.target.value)}
                  placeholder={`$${(prices[newAlertAsset] || 0).toFixed(2)}`}
                  className="col-span-1 px-2 py-1.5 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan outline-none"
                />
                
                <button
                  onClick={addPriceAlert}
                  disabled={!newAlertPrice || parseFloat(newAlertPrice) <= 0}
                  className="col-span-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 hover:bg-cyber-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
              
              <p className="text-[9px] text-cyber-muted">
                Current {newAlertAsset}: ${(prices[newAlertAsset] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </p>
            </div>
            
            {/* Active Price Alerts */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-cyber-yellow" />
                  <span className="text-xs text-cyber-text font-medium">YOUR PRICE ALERTS</span>
                </div>
                {priceAlerts.some(a => a.triggered) && (
                  <button
                    onClick={clearTriggeredAlerts}
                    className="text-[9px] text-cyber-muted hover:text-cyber-red transition-all"
                  >
                    Clear Triggered
                  </button>
                )}
              </div>
              
              {priceAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <Bell size={24} className="mx-auto text-cyber-muted mb-2" />
                  <p className="text-xs text-cyber-muted">No price alerts set</p>
                  <p className="text-[9px] text-cyber-muted">Create one above to get notified</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {priceAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between p-2 rounded border transition-all ${
                        alert.triggered
                          ? 'bg-cyber-green/10 border-cyber-green/30'
                          : 'bg-cyber-darker border-cyber-border/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {alert.triggered ? (
                          <BellRing size={14} className="text-cyber-green" />
                        ) : (
                          <Bell size={14} className="text-cyber-muted" />
                        )}
                        <div>
                          <p className="text-xs text-cyber-text">
                            {alert.asset} {alert.condition} ${alert.targetPrice.toLocaleString()}
                          </p>
                          <p className="text-[9px] text-cyber-muted">
                            {alert.triggered 
                              ? `Triggered ${new Date(alert.triggeredAt!).toLocaleTimeString()}`
                              : `Set ${new Date(alert.createdAt).toLocaleTimeString()}`
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-1 text-cyber-muted hover:text-cyber-red transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Live Market Pulse */}
            <div className="p-3 rounded bg-gradient-to-br from-cyber-purple/10 to-cyber-cyan/10 border border-cyber-purple/30">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-cyber-purple" />
                <span className="text-xs text-cyber-text font-medium">LIVE MARKET PULSE</span>
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <Radio size={10} className="text-cyber-green animate-pulse" />
                  <span className="text-[9px] text-cyber-green">LIVE</span>
                </div>
              </div>
              
              {marketSignals.length === 0 ? (
                <div className="text-center py-4">
                  <Activity size={24} className="mx-auto text-cyber-muted mb-2" />
                  <p className="text-xs text-cyber-muted">Monitoring market activity...</p>
                  <p className="text-[9px] text-cyber-muted">Signals will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {marketSignals.slice(0, 10).map(signal => (
                    <div
                      key={signal.id}
                      className={`flex items-start gap-2 p-2 rounded border transition-all ${
                        signal.severity === 'critical'
                          ? 'bg-cyber-red/10 border-cyber-red/30'
                          : signal.severity === 'warning'
                            ? 'bg-cyber-yellow/10 border-cyber-yellow/30'
                            : 'bg-cyber-darker/50 border-cyber-border/30'
                      }`}
                    >
                      <div className={`mt-0.5 ${
                        signal.severity === 'critical' ? 'text-cyber-red' :
                        signal.severity === 'warning' ? 'text-cyber-yellow' : 'text-cyber-cyan'
                      }`}>
                        {signal.type === 'whale_alert' ? <Eye size={12} /> :
                         signal.type === 'volatility' ? <Activity size={12} /> :
                         signal.type === 'volume_spike' ? <Zap size={12} /> :
                         signal.type === 'price_move' ? (
                           signal.changePercent && signal.changePercent > 0 
                             ? <TrendingUp size={12} /> 
                             : <TrendingDown size={12} />
                         ) : <CircleDot size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-cyber-text">{signal.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-cyber-muted">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                          {signal.priceAtSignal && (
                            <span className="text-[8px] text-cyber-cyan">
                              ${signal.priceAtSignal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  // Add quick alert for 5% above current XRP price
                  const xrpPrice = prices['XRP'] || 2.45;
                  setPriceAlerts(prev => [{
                    id: `pa_${Date.now()}`,
                    asset: 'XRP',
                    condition: 'above',
                    targetPrice: xrpPrice * 1.05,
                    createdAt: Date.now(),
                    triggered: false,
                  }, ...prev]);
                }}
                className="p-2 rounded bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-xs hover:bg-cyber-green/20 transition-all"
              >
                <TrendingUp size={14} className="mx-auto mb-1" />
                Alert +5% XRP
              </button>
              <button
                onClick={() => {
                  // Add quick alert for 5% below current XRP price
                  const xrpPrice = prices['XRP'] || 2.45;
                  setPriceAlerts(prev => [{
                    id: `pa_${Date.now()}`,
                    asset: 'XRP',
                    condition: 'below',
                    targetPrice: xrpPrice * 0.95,
                    createdAt: Date.now(),
                    triggered: false,
                  }, ...prev]);
                }}
                className="p-2 rounded bg-cyber-red/10 border border-cyber-red/30 text-cyber-red text-xs hover:bg-cyber-red/20 transition-all"
              >
                <TrendingDown size={14} className="mx-auto mb-1" />
                Alert -5% XRP
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Auto Trading Tab */}
        {activeTab === 'auto' && (
          <motion.div
            key="auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Auto-Trade Master Toggle */}
            <div className={`p-4 rounded border transition-all ${
              autoTradeSettings?.enabled
                ? 'bg-gradient-to-r from-cyber-green/20 to-cyber-cyan/20 border-cyber-green/50'
                : 'bg-cyber-darker border-cyber-border/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    autoTradeSettings?.enabled ? 'bg-cyber-green/30' : 'bg-cyber-muted/20'
                  }`}>
                    <Bot size={20} className={autoTradeSettings?.enabled ? 'text-cyber-green' : 'text-cyber-muted'} />
                  </div>
                  <div>
                    <h4 className="font-cyber text-sm text-cyber-text">AUTO-TRADER</h4>
                    <p className="text-[9px] text-cyber-muted">
                      {autoTradeSettings?.enabled ? 'Monitoring signals...' : 'Click to enable'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoTradeSettings?.({ enabled: !autoTradeSettings?.enabled })}
                  className={`p-2 rounded-lg transition-all ${
                    autoTradeSettings?.enabled
                      ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/50'
                      : 'bg-cyber-muted/20 text-cyber-muted border border-cyber-border'
                  }`}
                >
                  {autoTradeSettings?.enabled ? <Pause size={18} /> : <PlayCircle size={18} />}
                </button>
              </div>
              
              {autoTradeSettings?.enabled && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-cyber-darker/50">
                    <p className="text-[9px] text-cyber-muted">TODAY'S TRADES</p>
                    <p className="font-cyber text-lg text-cyber-cyan">
                      {dailyAutoTradeCount}/{autoTradeSettings?.maxDailyTrades}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker/50">
                    <p className="text-[9px] text-cyber-muted">STRATEGY</p>
                    <p className="font-cyber text-sm text-cyber-text capitalize">
                      {autoTradeSettings?.strategy}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-cyber-darker/50">
                    <p className="text-[9px] text-cyber-muted">MIN CONFIDENCE</p>
                    <p className="font-cyber text-lg text-cyber-yellow">
                      {autoTradeSettings?.minConfidence}%
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Strategy Selector */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 size={14} className="text-cyber-purple" />
                <span className="text-xs text-cyber-text font-medium">TRADING STRATEGY</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Conservative */}
                <button
                  onClick={() => setAutoTradeSettings?.({ strategy: 'conservative' })}
                  className={`p-3 rounded border transition-all text-center ${
                    autoTradeSettings?.strategy === 'conservative'
                      ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-lg shadow-cyber-cyan/20'
                      : 'bg-cyber-darker border-cyber-border text-cyber-muted hover:border-cyber-cyan/50 hover:text-cyber-cyan'
                  }`}
                >
                  <Shield size={18} className="mx-auto mb-1" />
                  <p className="text-[10px] font-medium">Conservative</p>
                  <p className="text-[8px] opacity-70 mt-1">Low risk</p>
                </button>
                
                {/* Moderate */}
                <button
                  onClick={() => setAutoTradeSettings?.({ strategy: 'moderate' })}
                  className={`p-3 rounded border transition-all text-center ${
                    autoTradeSettings?.strategy === 'moderate'
                      ? 'bg-cyber-yellow/20 border-cyber-yellow text-cyber-yellow shadow-lg shadow-cyber-yellow/20'
                      : 'bg-cyber-darker border-cyber-border text-cyber-muted hover:border-cyber-yellow/50 hover:text-cyber-yellow'
                  }`}
                >
                  <Gauge size={18} className="mx-auto mb-1" />
                  <p className="text-[10px] font-medium">Moderate</p>
                  <p className="text-[8px] opacity-70 mt-1">Balanced</p>
                </button>
                
                {/* Aggressive */}
                <button
                  onClick={() => setAutoTradeSettings?.({ strategy: 'aggressive' })}
                  className={`p-3 rounded border transition-all text-center ${
                    autoTradeSettings?.strategy === 'aggressive'
                      ? 'bg-cyber-red/20 border-cyber-red text-cyber-red shadow-lg shadow-cyber-red/20'
                      : 'bg-cyber-darker border-cyber-border text-cyber-muted hover:border-cyber-red/50 hover:text-cyber-red'
                  }`}
                >
                  <Flame size={18} className="mx-auto mb-1" />
                  <p className="text-[10px] font-medium">Aggressive</p>
                  <p className="text-[8px] opacity-70 mt-1">High risk</p>
                </button>
              </div>
            </div>
            
            {/* Configuration */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Gauge size={14} className="text-cyber-cyan" />
                <span className="text-xs text-cyber-text font-medium">CONFIGURATION</span>
              </div>
              
              <div className="space-y-3">
                {/* Min Confidence */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-cyber-muted">Min Signal Confidence</span>
                    <span className="text-cyber-cyan">{autoTradeSettings?.minConfidence}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={autoTradeSettings?.minConfidence ?? 70}
                    onChange={(e) => setAutoTradeSettings?.({ minConfidence: parseInt(e.target.value) })}
                    className="w-full h-1 bg-cyber-border rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                  />
                </div>
                
                {/* Max Trade % */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-cyber-muted">Max Trade Size (% of portfolio)</span>
                    <span className="text-cyber-cyan">{autoTradeSettings?.maxTradePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="5"
                    value={autoTradeSettings?.maxTradePercent ?? 10}
                    onChange={(e) => setAutoTradeSettings?.({ maxTradePercent: parseInt(e.target.value) })}
                    className="w-full h-1 bg-cyber-border rounded-lg appearance-none cursor-pointer accent-cyber-cyan"
                  />
                </div>
                
                {/* Take Profit / Stop Loss */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-cyber-muted">Take Profit</span>
                      <span className="text-cyber-green">+{autoTradeSettings?.takeProfitPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={autoTradeSettings?.takeProfitPercent ?? 15}
                      onChange={(e) => setAutoTradeSettings?.({ takeProfitPercent: parseInt(e.target.value) })}
                      className="w-full h-1 bg-cyber-border rounded-lg appearance-none cursor-pointer accent-cyber-green"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-cyber-muted">Stop Loss</span>
                      <span className="text-cyber-red">-{autoTradeSettings?.stopLossPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="5"
                      value={autoTradeSettings?.stopLossPercent ?? 10}
                      onChange={(e) => setAutoTradeSettings?.({ stopLossPercent: parseInt(e.target.value) })}
                      className="w-full h-1 bg-cyber-border rounded-lg appearance-none cursor-pointer accent-cyber-red"
                    />
                  </div>
                </div>
                
                {/* Daily Limit & Cooldown */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-cyber-muted block mb-1">Max Daily Trades</label>
                    <select
                      value={autoTradeSettings?.maxDailyTrades ?? 10}
                      onChange={(e) => setAutoTradeSettings?.({ maxDailyTrades: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan outline-none"
                    >
                      {[5, 10, 15, 20, 30, 50].map(n => (
                        <option key={n} value={n}>{n} trades</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-cyber-muted block mb-1">Cooldown per Asset</label>
                    <select
                      value={autoTradeSettings?.cooldownMinutes ?? 5}
                      onChange={(e) => setAutoTradeSettings?.({ cooldownMinutes: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 rounded bg-cyber-darker border border-cyber-border text-xs text-cyber-text focus:border-cyber-cyan outline-none"
                    >
                      {[1, 2, 5, 10, 15, 30, 60].map(n => (
                        <option key={n} value={n}>{n} min</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Allowed Assets */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <div className="flex items-center gap-2 mb-3">
                <List size={14} className="text-cyber-yellow" />
                <span className="text-xs text-cyber-text font-medium">ALLOWED ASSETS</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.keys(prices).map(asset => {
                  const isAllowed = autoTradeSettings?.allowedAssets?.includes(asset);
                  return (
                    <button
                      key={asset}
                      onClick={() => {
                        const current = autoTradeSettings?.allowedAssets ?? [];
                        setAutoTradeSettings?.({
                          allowedAssets: isAllowed
                            ? current.filter(a => a !== asset)
                            : [...current, asset]
                        });
                      }}
                      className={`px-2 py-1 rounded text-[10px] transition-all ${
                        isAllowed
                          ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30'
                          : 'bg-cyber-muted/10 text-cyber-muted border border-cyber-border'
                      }`}
                    >
                      {asset}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Test Signal Buttons */}
            <div className="p-3 rounded bg-gradient-to-r from-cyber-green/10 to-cyber-red/10 border border-cyber-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-cyber-yellow" />
                <span className="text-xs text-cyber-text font-medium">TEST SIGNALS</span>
                <span className="text-[9px] text-cyber-muted ml-auto">Try the auto-trader</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (!processSignal) return;
                    const assets = ['XRP', 'BTC', 'ETH', 'SOL', 'DOGE'];
                    const asset = assets[Math.floor(Math.random() * assets.length)];
                    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
                    processSignal({
                      id: `test_buy_${Date.now()}`,
                      type: 'test_signal',
                      asset,
                      action: 'buy',
                      confidence,
                      price: prices[asset] || 2.45,
                      reason: `Test BUY signal (${confidence}% confidence)`,
                    });
                  }}
                  className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-green/20 border border-cyber-green/30 text-cyber-green text-xs hover:bg-cyber-green/30 transition-all"
                >
                  <TrendingUp size={14} />
                  Send BUY Signal
                </button>
                
                <button
                  onClick={() => {
                    if (!processSignal) return;
                    const assets = ['XRP', 'BTC', 'ETH', 'SOL', 'DOGE'];
                    const asset = assets[Math.floor(Math.random() * assets.length)];
                    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
                    processSignal({
                      id: `test_sell_${Date.now()}`,
                      type: 'test_signal',
                      asset,
                      action: 'sell',
                      confidence,
                      price: prices[asset] || 2.45,
                      reason: `Test SELL signal (${confidence}% confidence)`,
                    });
                  }}
                  className="flex items-center justify-center gap-2 p-2 rounded bg-cyber-red/20 border border-cyber-red/30 text-cyber-red text-xs hover:bg-cyber-red/30 transition-all"
                >
                  <TrendingDown size={14} />
                  Send SELL Signal
                </button>
              </div>
              
              <p className="text-[9px] text-cyber-muted mt-2 text-center">
                Click to simulate signals and see how the auto-trader responds
              </p>
            </div>
            
            {/* Activity Log */}
            <div className="p-3 rounded bg-cyber-darker/50 border border-cyber-border/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-cyber-purple" />
                  <span className="text-xs text-cyber-text font-medium">ACTIVITY LOG</span>
                </div>
                {autoTradeLog.length > 0 && (
                  <button
                    onClick={() => clearAutoTradeLog?.()}
                    className="text-[9px] text-cyber-muted hover:text-cyber-red transition-all"
                  >
                    Clear Log
                  </button>
                )}
              </div>
              
              {autoTradeLog.length === 0 ? (
                <div className="text-center py-4">
                  <Bot size={24} className="mx-auto text-cyber-muted mb-2" />
                  <p className="text-xs text-cyber-muted">No activity yet</p>
                  <p className="text-[9px] text-cyber-muted">Click "Send Signal" above to test</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {autoTradeLog.slice(0, 15).map(log => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 p-2 rounded border ${
                        log.action === 'executed'
                          ? 'bg-cyber-green/10 border-cyber-green/30'
                          : log.action === 'blocked'
                            ? 'bg-cyber-red/10 border-cyber-red/30'
                            : 'bg-cyber-muted/10 border-cyber-border/30'
                      }`}
                    >
                      <div className={`mt-0.5 ${
                        log.action === 'executed' ? 'text-cyber-green' :
                        log.action === 'blocked' ? 'text-cyber-red' : 'text-cyber-yellow'
                      }`}>
                        {log.action === 'executed' ? <CheckCircle2 size={12} /> :
                         log.action === 'blocked' ? <XCircle size={12} /> :
                         <AlertCircle size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-1 rounded ${
                            log.suggestedAction === 'buy' ? 'bg-cyber-green/20 text-cyber-green' : 'bg-cyber-red/20 text-cyber-red'
                          }`}>
                            {log.suggestedAction.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-cyber-text">{log.asset}</span>
                          <span className="text-[9px] text-cyber-muted">({log.signalConfidence}%)</span>
                        </div>
                        <p className="text-[9px] text-cyber-muted mt-0.5">{log.reason}</p>
                        <p className="text-[8px] text-cyber-muted">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Info Banner */}
            <div className="p-3 rounded bg-cyber-purple/10 border border-cyber-purple/30">
              <div className="flex items-start gap-2">
                <Lightbulb size={14} className="text-cyber-purple shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-cyber-purple font-medium mb-1">HOW IT WORKS</p>
                  <p className="text-[9px] text-cyber-muted leading-relaxed">
                    Auto-trader monitors prediction signals from the Analytics Lab. When a signal meets your confidence 
                    threshold and other criteria, it automatically executes trades in your paper wallet. 
                    Use stop-loss and take-profit to manage risk automatically.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Alert Notification Popup */}
      <AnimatePresence>
        {showAlertNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`absolute top-2 left-2 right-2 p-3 rounded-lg border shadow-lg z-50 ${
              showAlertNotification.severity === 'critical'
                ? 'bg-cyber-red/90 border-cyber-red text-white'
                : showAlertNotification.severity === 'warning'
                  ? 'bg-cyber-yellow/90 border-cyber-yellow text-cyber-dark'
                  : 'bg-cyber-cyan/90 border-cyber-cyan text-cyber-dark'
            }`}
          >
            <div className="flex items-start gap-2">
              <BellRing size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium">{showAlertNotification.asset} ALERT</p>
                <p className="text-[10px] opacity-90">{showAlertNotification.message}</p>
              </div>
              <button
                onClick={() => setShowAlertNotification(null)}
                className="p-1 hover:opacity-70"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowReset(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-cyber-dark p-6 rounded border border-cyber-red/50 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-cyber-red" />
                <h3 className="font-cyber text-cyber-red">RESET WALLET?</h3>
              </div>
              <p className="text-sm text-cyber-muted mb-4">
                This will reset your paper trading wallet to {startingBalance.toLocaleString()} XRP. 
                All positions and history will be lost.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReset(false)}
                  className="flex-1 py-2 rounded bg-cyber-darker border border-cyber-border text-cyber-text hover:border-cyber-cyan"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetWallet?.();
                    setShowReset(false);
                  }}
                  className="flex-1 py-2 rounded bg-cyber-red/20 border border-cyber-red text-cyber-red hover:bg-cyber-red/30"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && currentTutorialStep && (
          <>
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={skipTutorial}
            />
            
            {/* Tutorial Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-cyber-dark border-2 border-cyber-cyan rounded-lg p-4 z-50 shadow-2xl shadow-cyber-cyan/20"
            >
              {/* Progress Bar */}
              <div className="flex gap-1 mb-3">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      idx < tutorialStep ? 'bg-cyber-green' :
                      idx === tutorialStep ? 'bg-cyber-cyan' : 'bg-cyber-border'
                    }`}
                  />
                ))}
              </div>
              
              {/* Step Counter */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-cyber-muted">
                  Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
                </span>
                <button
                  onClick={skipTutorial}
                  className="text-cyber-muted hover:text-cyber-text p-1"
                  title="Skip Tutorial"
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* Title */}
              <h4 className="font-cyber text-lg text-cyber-cyan mb-2">
                {currentTutorialStep.title}
              </h4>
              
              {/* Description */}
              <p className="text-sm text-cyber-text mb-3 leading-relaxed">
                {currentTutorialStep.description}
              </p>
              
              {/* Action Hint */}
              {currentTutorialStep.action && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">
                  <MousePointer size={14} className="text-cyber-cyan shrink-0" />
                  <span className="text-xs text-cyber-cyan">{currentTutorialStep.action}</span>
                </div>
              )}
              
              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={prevStep}
                  disabled={tutorialStep === 0}
                  className={`flex items-center gap-1 px-3 py-2 rounded text-xs transition-all ${
                    tutorialStep === 0
                      ? 'bg-cyber-muted/20 text-cyber-muted cursor-not-allowed'
                      : 'bg-cyber-darker border border-cyber-border text-cyber-text hover:border-cyber-cyan'
                  }`}
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
                
                <button
                  onClick={skipTutorial}
                  className="px-3 py-2 rounded text-xs text-cyber-muted hover:text-cyber-text transition-all"
                >
                  Skip Tutorial
                </button>
                
                <button
                  onClick={nextStep}
                  className="flex items-center gap-1 px-4 py-2 rounded text-xs bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/30 transition-all"
                >
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight size={14} />
                </button>
              </div>
              
              {/* Pointer Arrow */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-cyber-dark border-l-2 border-t-2 border-cyber-cyan" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-cyber-border">
        <p className="text-[9px] text-cyber-muted text-center">
          💡 Paper trading uses simulated funds. No real transactions are made.
        </p>
      </div>
    </div>
  );
}

export default PaperTradingPanel;
