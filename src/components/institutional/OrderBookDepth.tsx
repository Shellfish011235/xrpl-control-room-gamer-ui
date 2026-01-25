// Order Book Depth Component
// Real-time order book visualization with depth chart

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, TrendingDown, Activity,
  RefreshCw, Layers, ArrowUpRight, ArrowDownRight, AlertCircle, Wifi, WifiOff
} from 'lucide-react';
import { useOrderBook, type OrderBook } from '../../services/websocketPriceFeeds';

// Symbol mapping for Binance
const BINANCE_SYMBOLS: Record<string, string> = {
  'XRP': 'XRPUSDT',
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
  'DOGE': 'DOGEUSDT',
};

// Fetch order book from Binance REST API (fallback when WebSocket fails)
async function fetchOrderBookFromREST(symbol: string): Promise<OrderBook | null> {
  const binanceSymbol = BINANCE_SYMBOLS[symbol];
  if (!binanceSymbol) return null;
  
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${binanceSymbol}&limit=20`
    );
    
    if (!response.ok) throw new Error('Binance API error');
    
    const data = await response.json();
    
    const bids: { price: number; size: number; total: number }[] = [];
    const asks: { price: number; size: number; total: number }[] = [];
    
    let bidTotal = 0;
    let askTotal = 0;
    
    // Process bids
    for (const [price, size] of data.bids || []) {
      const p = parseFloat(price);
      const s = parseFloat(size);
      bidTotal += s;
      bids.push({ price: p, size: s, total: bidTotal });
    }
    
    // Process asks
    for (const [price, size] of data.asks || []) {
      const p = parseFloat(price);
      const s = parseFloat(size);
      askTotal += s;
      asks.push({ price: p, size: s, total: askTotal });
    }
    
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const midPrice = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    
    const totalBidVolume = bids.reduce((sum, b) => sum + b.size * b.price, 0);
    const totalAskVolume = asks.reduce((sum, a) => sum + a.size * a.price, 0);
    const imbalance = (totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume);
    
    return {
      symbol,
      exchange: 'binance',
      bids,
      asks,
      timestamp: Date.now(),
      spread,
      midPrice,
      imbalance,
    };
  } catch (error) {
    console.error('[OrderBook] REST API error:', error);
    return null;
  }
}

interface OrderBookDepthProps {
  symbol: string;
  maxLevels?: number;
  compact?: boolean;
}

export function OrderBookDepth({ symbol, maxLevels = 15, compact = false }: OrderBookDepthProps) {
  const liveOrderBook = useOrderBook(symbol);
  const [viewMode, setViewMode] = useState<'book' | 'depth'>('book');
  const [restOrderBook, setRestOrderBook] = useState<OrderBook | null>(null);
  const [isLoadingRest, setIsLoadingRest] = useState(false);
  const [dataSource, setDataSource] = useState<'websocket' | 'rest' | 'none'>('none');
  
  // If WebSocket doesn't connect within 3 seconds, try REST API
  useEffect(() => {
    let cancelled = false;
    
    const timeout = setTimeout(async () => {
      if (!liveOrderBook && !cancelled) {
        setIsLoadingRest(true);
        const data = await fetchOrderBookFromREST(symbol);
        if (!cancelled && data) {
          setRestOrderBook(data);
          setDataSource('rest');
        }
        setIsLoadingRest(false);
      }
    }, 3000);
    
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [liveOrderBook, symbol]);
  
  // Poll REST API every 2 seconds if using REST fallback
  useEffect(() => {
    if (dataSource === 'rest' && !liveOrderBook) {
      const interval = setInterval(async () => {
        const data = await fetchOrderBookFromREST(symbol);
        if (data) setRestOrderBook(data);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [dataSource, liveOrderBook, symbol]);
  
  // Detect when WebSocket connects
  useEffect(() => {
    if (liveOrderBook) {
      setDataSource('websocket');
    }
  }, [liveOrderBook]);
  
  // Use WebSocket data if available, otherwise REST API data
  const orderBook = liveOrderBook || restOrderBook;
  const isLive = dataSource === 'websocket' || dataSource === 'rest';
  
  if (!orderBook) {
    return (
      <div className="cyber-panel p-4 flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-cyber-cyan animate-spin mb-2" />
        <span className="text-cyber-muted text-sm">
          {isLoadingRest ? 'Fetching from Binance API...' : 'Connecting to Binance...'}
        </span>
        <span className="text-cyber-muted/50 text-xs mt-1">
          {isLoadingRest ? 'REST API fallback' : 'WebSocket → REST fallback'}
        </span>
      </div>
    );
  }
  
  const { bids, asks, spread, midPrice, imbalance } = orderBook;
  
  // Take top levels
  const topBids = bids.slice(0, maxLevels);
  const topAsks = asks.slice(0, maxLevels);
  
  // Calculate max size for scaling bars
  const maxSize = Math.max(
    ...topBids.map(b => b.total),
    ...topAsks.map(a => a.total)
  );
  
  // Calculate total bid/ask volume
  const totalBidVol = topBids.reduce((sum, b) => sum + b.size * b.price, 0);
  const totalAskVol = topAsks.reduce((sum, a) => sum + a.size * a.price, 0);
  
  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyber-cyan" />
          <span className="font-cyber text-sm text-cyber-cyan">ORDER BOOK</span>
          <span className="text-xs text-cyber-muted ml-2">{symbol}</span>
          {/* Connection Status Indicator */}
          {isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
              <Wifi size={10} />
              LIVE {dataSource === 'rest' ? '(API)' : '(WS)'}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30">
              <WifiOff size={10} />
              CONNECTING...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('book')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'book' ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-cyber-darker text-cyber-muted'
            }`}
          >
            Book
          </button>
          <button
            onClick={() => setViewMode('depth')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'depth' ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-cyber-darker text-cyber-muted'
            }`}
          >
            Depth
          </button>
        </div>
      </div>
      
      {/* Spread & Imbalance Info */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded bg-cyber-darker/50 text-center">
          <p className="text-[10px] text-cyber-muted">Spread</p>
          <p className="font-cyber text-sm text-cyber-text">
            ${spread.toFixed(4)}
          </p>
          <p className="text-[10px] text-cyber-muted">
            {((spread / midPrice) * 100).toFixed(3)}%
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 text-center">
          <p className="text-[10px] text-cyber-muted">Mid Price</p>
          <p className="font-cyber text-sm text-cyber-cyan">
            ${midPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </p>
        </div>
        <div className="p-2 rounded bg-cyber-darker/50 text-center">
          <p className="text-[10px] text-cyber-muted">Imbalance</p>
          <p className={`font-cyber text-sm ${
            imbalance > 0.1 ? 'text-cyber-green' :
            imbalance < -0.1 ? 'text-cyber-red' : 'text-cyber-text'
          }`}>
            {(imbalance * 100).toFixed(1)}%
            {imbalance > 0.1 ? <ArrowUpRight className="inline w-3 h-3" /> :
             imbalance < -0.1 ? <ArrowDownRight className="inline w-3 h-3" /> : null}
          </p>
        </div>
      </div>
      
      {viewMode === 'book' ? (
        /* Order Book View */
        <div className="grid grid-cols-2 gap-2">
          {/* Bids (Buy Orders) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] text-cyber-green font-cyber">BIDS</span>
              <span className="text-[10px] text-cyber-muted">
                ${(totalBidVol / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="space-y-[2px]">
              {topBids.map((bid, idx) => {
                const widthPercent = (bid.total / maxSize) * 100;
                return (
                  <div key={idx} className="relative h-6 flex items-center">
                    {/* Background bar */}
                    <div 
                      className="absolute right-0 h-full bg-cyber-green/20 rounded-l"
                      style={{ width: `${widthPercent}%` }}
                    />
                    {/* Content */}
                    <div className="relative flex items-center justify-between w-full px-2 text-[10px]">
                      <span className="text-cyber-green font-medium">
                        ${bid.price.toFixed(4)}
                      </span>
                      <span className="text-cyber-muted">
                        {bid.size.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Asks (Sell Orders) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] text-cyber-red font-cyber">ASKS</span>
              <span className="text-[10px] text-cyber-muted">
                ${(totalAskVol / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="space-y-[2px]">
              {topAsks.map((ask, idx) => {
                const widthPercent = (ask.total / maxSize) * 100;
                return (
                  <div key={idx} className="relative h-6 flex items-center">
                    {/* Background bar */}
                    <div 
                      className="absolute left-0 h-full bg-cyber-red/20 rounded-r"
                      style={{ width: `${widthPercent}%` }}
                    />
                    {/* Content */}
                    <div className="relative flex items-center justify-between w-full px-2 text-[10px]">
                      <span className="text-cyber-muted">
                        {ask.size.toFixed(2)}
                      </span>
                      <span className="text-cyber-red font-medium">
                        ${ask.price.toFixed(4)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Depth Chart View */
        <div className="h-[300px] relative">
          <DepthChart bids={topBids} asks={topAsks} midPrice={midPrice} />
        </div>
      )}
      
      {/* Volume Balance Bar */}
      <div className="mt-4 pt-3 border-t border-cyber-border">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-cyber-green">
            Bids: {((totalBidVol / (totalBidVol + totalAskVol)) * 100).toFixed(1)}%
          </span>
          <span className="text-cyber-muted">Volume Balance</span>
          <span className="text-cyber-red">
            Asks: {((totalAskVol / (totalBidVol + totalAskVol)) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-cyber-darker overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-cyber-green to-cyber-green/50"
            style={{ width: `${(totalBidVol / (totalBidVol + totalAskVol)) * 100}%` }}
          />
          <div 
            className="h-full bg-gradient-to-l from-cyber-red to-cyber-red/50"
            style={{ width: `${(totalAskVol / (totalBidVol + totalAskVol)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Simple Depth Chart Component
function DepthChart({ bids, asks, midPrice }: { 
  bids: { price: number; size: number; total: number }[];
  asks: { price: number; size: number; total: number }[];
  midPrice: number;
}) {
  const maxTotal = Math.max(
    bids[bids.length - 1]?.total || 0,
    asks[asks.length - 1]?.total || 0
  );
  
  const chartWidth = 100;
  const chartHeight = 100;
  
  // Build bid path (cumulative from mid price going down)
  const bidPoints = bids.map((b, i) => {
    const x = 50 - (Math.abs(b.price - midPrice) / midPrice * 500);
    const y = 100 - (b.total / maxTotal * 90);
    return `${Math.max(0, x)},${y}`;
  }).join(' L ');
  
  // Build ask path (cumulative from mid price going up)
  const askPoints = asks.map((a, i) => {
    const x = 50 + (Math.abs(a.price - midPrice) / midPrice * 500);
    const y = 100 - (a.total / maxTotal * 90);
    return `${Math.min(100, x)},${y}`;
  }).join(' L ');
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      <line x1="50" y1="0" x2="50" y2="100" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="2,2" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="2,2" />
      
      {/* Bid area */}
      <path
        d={`M 50,100 L ${bidPoints} L ${bids.length > 0 ? Math.max(0, 50 - (Math.abs(bids[bids.length-1].price - midPrice) / midPrice * 500)) : 0},100 Z`}
        fill="rgba(0, 255, 136, 0.2)"
        stroke="#00ff88"
        strokeWidth="0.5"
      />
      
      {/* Ask area */}
      <path
        d={`M 50,100 L ${askPoints} L ${asks.length > 0 ? Math.min(100, 50 + (Math.abs(asks[asks.length-1].price - midPrice) / midPrice * 500)) : 100},100 Z`}
        fill="rgba(255, 68, 68, 0.2)"
        stroke="#ff4444"
        strokeWidth="0.5"
      />
      
      {/* Mid price line */}
      <line x1="50" y1="0" x2="50" y2="100" stroke="#00d4ff" strokeWidth="1" />
    </svg>
  );
}

export default OrderBookDepth;
