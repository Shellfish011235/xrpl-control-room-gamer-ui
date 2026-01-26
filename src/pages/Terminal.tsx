// Terminal Page - Institutional Trading Terminal
// Combines all institutional-grade features into one powerful view

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, TrendingUp, TrendingDown, Zap, 
  RefreshCw, Settings, Maximize2, Minimize2,
  BarChart3, Shield, Bell, Layers, Flame,
  Wifi, WifiOff, Clock
} from 'lucide-react';

import { LiquidationHeatmap } from '../components/institutional/LiquidationHeatmap';
import { OrderBookDepth } from '../components/institutional/OrderBookDepth';
import { RiskDashboard } from '../components/institutional/RiskDashboard';
import { AlertBuilder } from '../components/institutional/AlertBuilder';
import { PaperTradingPanel } from '../components/PaperTradingPanel';
import { LedgerImpactTool } from '../components/LedgerImpactTool';

import { 
  useRealtimePrices, 
  startPriceFeeds,
  type AggregatedPrice 
} from '../services/websocketPriceFeeds';
import { useAlertStore, useAlertInitialization } from '../services/alertNotifications';

export default function Terminal() {
  const [selectedAsset, setSelectedAsset] = useState('XRP');
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  
  // Initialize alerts
  useAlertInitialization();
  
  // Real-time prices
  const { prices, status, isConnected } = useRealtimePrices();
  const unreadAlerts = useAlertStore(state => state.getUnreadCount());
  
  // Start price feeds on mount
  useEffect(() => {
    startPriceFeeds();
  }, []);
  
  // Get selected asset price
  const selectedPrice = prices.get(selectedAsset);
  const currentPrice = selectedPrice?.price || getFallbackPrice(selectedAsset);
  
  // Top assets for quick selection
  const topAssets = ['XRP', 'BTC', 'ETH', 'SOL', 'DOGE'];
  
  return (
    <div className="min-h-screen pt-20 pb-8 px-4 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
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
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${
              isConnected 
                ? 'bg-cyber-green/10 border-cyber-green/30' 
                : 'bg-cyber-red/10 border-cyber-red/30'
            }`}>
              {isConnected ? (
                <Wifi className="w-4 h-4 text-cyber-green" />
              ) : (
                <WifiOff className="w-4 h-4 text-cyber-red" />
              )}
              <span className={`text-xs ${isConnected ? 'text-cyber-green' : 'text-cyber-red'}`}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            
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
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Price Ticker */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {topAssets.map((asset) => {
            const price = prices.get(asset);
            const isSelected = asset === selectedAsset;
            
            return (
              <button
                key={asset}
                onClick={() => setSelectedAsset(asset)}
                className={`flex items-center gap-3 px-4 py-2 rounded border whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-cyber-cyan/20 border-cyber-cyan/50' 
                    : 'bg-cyber-darker/50 border-cyber-border hover:border-cyber-cyan/30'
                }`}
              >
                <span className={`font-cyber text-sm ${isSelected ? 'text-cyber-cyan' : 'text-cyber-text'}`}>
                  {asset}
                </span>
                <span className="text-sm text-cyber-text">
                  ${price?.price?.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: price?.price && price.price < 1 ? 4 : 2 
                  }) || getFallbackPrice(asset).toLocaleString()}
                </span>
                {price && (
                  <span className={`text-xs flex items-center gap-0.5 ${
                    price.priceChangePercent24h >= 0 ? 'text-cyber-green' : 'text-cyber-red'
                  }`}>
                    {price.priceChangePercent24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(price.priceChangePercent24h).toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })}
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
            <LiquidationHeatmap 
              symbol={selectedAsset} 
              currentPrice={currentPrice}
              compact={expandedPanel !== 'heatmap'}
            />
          </div>
        </motion.div>
        
        {/* Center Column - Order Book */}
        {expandedPanel !== 'heatmap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`${expandedPanel === 'orderbook' ? 'lg:col-span-12' : 'lg:col-span-4'}`}
          >
            <div className="relative">
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'orderbook' ? null : 'orderbook')}
                className="absolute top-3 right-3 z-10 p-1 rounded bg-cyber-darker/80 text-cyber-muted hover:text-cyber-cyan"
              >
                {expandedPanel === 'orderbook' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <OrderBookDepth 
                symbol={selectedAsset}
                compact={expandedPanel !== 'orderbook'}
              />
            </div>
          </motion.div>
        )}
        
        {/* Right Column - Risk Dashboard */}
        {expandedPanel !== 'heatmap' && expandedPanel !== 'orderbook' && (
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
              <RiskDashboard compact={expandedPanel !== 'risk'} />
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AlertBuilder compact />
        </motion.div>
        
        {/* Ledger Impact Tool with Amendment Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <LedgerImpactTool />
        </motion.div>
        
        {/* Paper Trading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PaperTradingPanel />
        </motion.div>
      </div>
      
      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-4 cyber-panel p-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {selectedPrice && (
              <>
                <Stat label="Spread" value={`$${selectedPrice.spread.toFixed(4)}`} />
                <Stat label="Spread %" value={`${selectedPrice.spreadPercent.toFixed(3)}%`} />
                <Stat label="VWAP" value={`$${selectedPrice.vwap.toLocaleString()}`} />
                <Stat label="24h Vol" value={`$${(selectedPrice.volume24h / 1000000000).toFixed(2)}B`} />
                <Stat 
                  label="Best Bid" 
                  value={selectedPrice.bestBidExchange || 'N/A'} 
                  subValue={`$${selectedPrice.bestBid.toLocaleString()}`}
                />
                <Stat 
                  label="Best Ask" 
                  value={selectedPrice.bestAskExchange || 'N/A'} 
                  subValue={`$${selectedPrice.bestAsk.toLocaleString()}`}
                />
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-cyber-muted">
            {status.map((s) => (
              <div 
                key={s.exchange}
                className={`w-2 h-2 rounded-full ${s.connected ? 'bg-cyber-green' : 'bg-cyber-red'}`}
                title={`${s.exchange}: ${s.connected ? 'Connected' : 'Disconnected'}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper Components
function Stat({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div>
      <p className="text-[10px] text-cyber-muted">{label}</p>
      <p className="text-xs text-cyber-text font-medium">{value}</p>
      {subValue && <p className="text-[10px] text-cyber-cyan">{subValue}</p>}
    </div>
  );
}

// Fallback prices
function getFallbackPrice(symbol: string): number {
  const prices: Record<string, number> = {
    XRP: 2.45,
    BTC: 98500,
    ETH: 3850,
    SOL: 245,
    DOGE: 0.42,
    ADA: 1.15,
    LINK: 28.50,
  };
  return prices[symbol] || 1;
}
