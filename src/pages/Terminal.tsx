// Terminal Page - Institutional Trading Terminal
// Combines all institutional-grade features into one powerful view

import React, { useState, useEffect, Component, ReactNode, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Maximize2, Minimize2,
  Bell, Clock, AlertTriangle
} from 'lucide-react';

import { useAlertStore, useAlertInitialization } from '../services/alertNotifications';

// Lazy load heavy components to prevent crashes
const LiquidationHeatmap = lazy(() => import('../components/institutional/LiquidationHeatmap').then(m => ({ default: m.LiquidationHeatmap })));
const RiskDashboard = lazy(() => import('../components/institutional/RiskDashboard').then(m => ({ default: m.RiskDashboard })));
const AlertBuilder = lazy(() => import('../components/institutional/AlertBuilder').then(m => ({ default: m.AlertBuilder })));
const PositionLiquidationRisk = lazy(() => import('../components/institutional/PositionLiquidationRisk').then(m => ({ default: m.PositionLiquidationRisk })));
const PaperTradingPanel = lazy(() => import('../components/PaperTradingPanel').then(m => ({ default: m.PaperTradingPanel })));
const LedgerImpactTool = lazy(() => import('../components/LedgerImpactTool').then(m => ({ default: m.LedgerImpactTool })));
const PathfindingTool = lazy(() => import('../components/PathfindingTool').then(m => ({ default: m.PathfindingTool })));

// Error Boundary to catch component crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Terminal] Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="cyber-panel p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
          <AlertTriangle className="w-8 h-8 text-cyber-yellow mb-2" />
          <p className="text-cyber-yellow text-sm">Component failed to load</p>
          <p className="text-cyber-muted text-xs mt-1">Please refresh the page</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading placeholder
const LoadingPanel = () => (
  <div className="cyber-panel p-4 flex items-center justify-center min-h-[200px]">
    <Activity className="w-6 h-6 text-cyber-cyan animate-spin" />
  </div>
);

export default function Terminal() {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [xrpPrice, setXrpPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceSource, setPriceSource] = useState<string>('');
  
  // Initialize alerts
  useAlertInitialization();
  const unreadAlerts = useAlertStore(state => state.getUnreadCount());
  
  // Fetch live XRP price - try multiple sources
  useEffect(() => {
    async function fetchPrice() {
      // Try CoinGecko first (same as Navigation header)
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_24hr_change=true'
        );
        if (response.ok) {
          const data = await response.json();
          if (data.ripple?.usd) {
            console.log(`[Terminal] XRP price from CoinGecko: $${data.ripple.usd}`);
            setXrpPrice(data.ripple.usd);
            setPriceSource('coingecko');
            setPriceLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[Terminal] CoinGecko failed:', e);
      }
      
      // Try Binance as backup
      try {
        const binanceResp = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT');
        if (binanceResp.ok) {
          const data = await binanceResp.json();
          const price = parseFloat(data.price);
          if (price > 0) {
            console.log(`[Terminal] XRP price from Binance: $${price}`);
            setXrpPrice(price);
            setPriceSource('binance');
            setPriceLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('[Terminal] Binance failed:', e);
      }
      
      // Last resort - use a fixed fallback
      console.warn('[Terminal] All APIs failed, using fallback price');
      setXrpPrice(1.92); // Fallback - should update periodically
      setPriceSource('fallback');
      setPriceLoading(false);
    }
    
    fetchPrice();
    // Refresh price every 30 seconds
    const priceInterval = setInterval(fetchPrice, 30000);
    return () => clearInterval(priceInterval);
  }, []);
  
  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyber-cyan" />
            </div>
            <div>
              <h1 className="font-cyber text-xl text-cyber-text">TRADING TERMINAL</h1>
              <p className="text-xs text-cyber-muted">Institutional-Grade Analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Alert Badge */}
            {unreadAlerts > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
                <Bell className="w-4 h-4 text-cyber-yellow" />
                <span className="text-xs text-cyber-yellow">{unreadAlerts} alerts</span>
              </div>
            )}
            
            {/* Time */}
            <div className="flex items-center gap-2 text-cyber-muted">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-mono">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Liquidation Heatmap */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`${expandedPanel === 'heatmap' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
        >
          <div className="relative">
            <button
              onClick={() => setExpandedPanel(expandedPanel === 'heatmap' ? null : 'heatmap')}
              className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
            >
              {expandedPanel === 'heatmap' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            {priceLoading ? (
              <div className="cyber-panel p-4 flex items-center justify-center min-h-[300px]">
                <Activity className="w-6 h-6 text-cyber-cyan animate-spin" />
                <span className="ml-2 text-cyber-muted">Loading live price...</span>
              </div>
            ) : (
              <ErrorBoundary>
                <Suspense fallback={<LoadingPanel />}>
                  <div>
                    <LiquidationHeatmap 
                      symbol="XRP" 
                      currentPrice={xrpPrice}
                      compact={expandedPanel !== 'heatmap'}
                    />
                    {priceSource && (
                      <div className="text-[9px] text-cyber-muted text-right mt-1 pr-2">
                        Price: {priceSource === 'coingecko' ? 'CoinGecko' : priceSource === 'binance' ? 'Binance' : 'Fallback'} 
                        {priceSource === 'fallback' && ' (APIs unavailable)'}
                      </div>
                    )}
                  </div>
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </motion.div>
        
        {/* Center Column - XRPL Pathfinding */}
        {expandedPanel !== 'heatmap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${expandedPanel === 'pathfinding' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
          >
            <div className="relative">
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'pathfinding' ? null : 'pathfinding')}
                className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
              >
                {expandedPanel === 'pathfinding' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <ErrorBoundary>
                <Suspense fallback={<LoadingPanel />}>
                  <PathfindingTool compact={expandedPanel !== 'pathfinding'} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
        
        {/* Right Column - Risk Dashboard */}
        {expandedPanel !== 'heatmap' && expandedPanel !== 'pathfinding' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`${expandedPanel === 'risk' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
          >
            <div className="relative">
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'risk' ? null : 'risk')}
                className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
              >
                {expandedPanel === 'risk' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <ErrorBoundary>
                <Suspense fallback={<LoadingPanel />}>
                  <RiskDashboard compact={expandedPanel !== 'risk'} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Position Liquidation Risk Monitor - Full Width */}
      {!priceLoading && xrpPrice > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <ErrorBoundary>
            <Suspense fallback={<LoadingPanel />}>
              <PositionLiquidationRisk currentPrice={xrpPrice} />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      )}
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ErrorBoundary>
            <Suspense fallback={<LoadingPanel />}>
              <AlertBuilder compact />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
        
        {/* Ledger Impact Tool with Amendment Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <ErrorBoundary>
            <Suspense fallback={<LoadingPanel />}>
              <LedgerImpactTool />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
        
        {/* Paper Trading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ErrorBoundary>
            <Suspense fallback={<LoadingPanel />}>
              <PaperTradingPanel />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </div>
      
    </div>
  );
}
