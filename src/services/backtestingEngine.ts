// Backtesting Engine (Phase 1 - sim-first)
// Runs agent/signal logic over historical bars and computes performance.

import type { SimOHLCV } from './paperTradingSimFeeds';
import { getAgentSuggestion } from './paperTradingAgentSuggestion';

export interface BacktestBar {
  timestamp: number;
  prices: { [symbol: string]: number };
  changes24h: { [symbol: string]: number };
}

export interface BacktestTrade {
  id: string;
  timestamp: number;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  totalCost: number;
  reason: string;
  confidence: number;
}

export interface BacktestResult {
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  trades: BacktestTrade[];
  equityCurve: { timestamp: number; value: number }[];
  stats: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
  };
}

/** Build bars from per-asset OHLCV arrays (align by timestamp index). */
export function barsFromOHLCV(
  barsBySymbol: Map<string, SimOHLCV[]>,
  symbolOrder: string[]
): BacktestBar[] {
  const firstSymbol = symbolOrder[0];
  const firstBars = barsBySymbol.get(firstSymbol);
  if (!firstBars?.length) return [];

  return firstBars.map((bar, i) => {
    const prices: { [symbol: string]: number } = {};
    const changes24h: { [symbol: string]: number } = {};
    for (const sym of symbolOrder) {
      const arr = barsBySymbol.get(sym);
      const b = arr?.[i];
      if (b) {
        prices[sym] = b.close;
        if (i >= 24 && arr[i - 24]) {
          changes24h[sym] = ((b.close - arr[i - 24].close) / arr[i - 24].close) * 100;
        } else {
          changes24h[sym] = 0;
        }
      }
    }
    return { timestamp: bar.timestamp, prices, changes24h };
  });
}

/** Run backtest: at each bar, optionally run agent suggestion and execute sim trades. */
export function runBacktest(
  bars: BacktestBar[],
  options: {
    initialBalance?: number;
    symbols?: string[];
    sentimentScore?: number;
    sentimentTrend?: 'bullish' | 'bearish' | 'neutral';
    minConfidence?: number;
    maxPositionPercent?: number;
  } = {}
): BacktestResult {
  const initialBalance = options.initialBalance ?? 10000;
  const symbols = options.symbols ?? ['XRP', 'BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'LINK', 'DOT'];
  const sentimentScore = options.sentimentScore ?? 50;
  const sentimentTrend = options.sentimentTrend ?? 'neutral';
  const minConfidence = options.minConfidence ?? 60;
  const maxPositionPercent = options.maxPositionPercent ?? 10;

  let cash = initialBalance;
  const positions: { [symbol: string]: { quantity: number; avgCost: number } } = {};
  const trades: BacktestTrade[] = [];
  const equityCurve: { timestamp: number; value: number }[] = [];
  let peak = initialBalance;

  for (let i = 24; i < bars.length; i++) {
    const bar = bars[i];
    const portfolioValue = cash + Object.entries(positions).reduce(
      (sum, [sym, pos]) => sum + (bar.prices[sym] ?? 0) * pos.quantity,
      0
    );
    equityCurve.push({ timestamp: bar.timestamp, value: portfolioValue });
    if (portfolioValue > peak) peak = portfolioValue;

    // Run agent suggestion for each symbol we care about
    for (const asset of symbols) {
      const price = bar.prices[asset];
      if (price == null || price <= 0) continue;

      const suggestion = getAgentSuggestion({
        asset,
        price,
        priceChange24hPercent: bar.changes24h[asset] ?? 0,
        sentimentScore,
        sentimentTrend,
      });

      if (suggestion.action === 'hold' || suggestion.confidence < minConfidence) continue;

      const sizePercent = Math.min(suggestion.sizePercent, maxPositionPercent);
      const tradeValue = (portfolioValue * sizePercent) / 100;
      const amount = tradeValue / price;

      if (suggestion.action === 'buy') {
        if (cash >= tradeValue && amount > 0) {
          cash -= tradeValue;
          const existing = positions[asset];
          if (existing) {
            const newQty = existing.quantity + amount;
            const newAvg = (existing.avgCost * existing.quantity + tradeValue) / newQty;
            positions[asset] = { quantity: newQty, avgCost: newAvg };
          } else {
            positions[asset] = { quantity: amount, avgCost: price };
          }
          trades.push({
            id: `bt_${bar.timestamp}_${asset}_${trades.length}`,
            timestamp: bar.timestamp,
            type: 'buy',
            asset,
            amount,
            price,
            totalCost: tradeValue,
            reason: suggestion.reason,
            confidence: suggestion.confidence,
          });
        }
      } else {
        const pos = positions[asset];
        if (pos && pos.quantity >= amount && amount > 0) {
          const sellValue = amount * price;
          cash += sellValue;
          const newQty = pos.quantity - amount;
          if (newQty <= 0) delete positions[asset];
          else positions[asset] = { quantity: newQty, avgCost: pos.avgCost };
          trades.push({
            id: `bt_${bar.timestamp}_${asset}_${trades.length}`,
            timestamp: bar.timestamp,
            type: 'sell',
            asset,
            amount,
            price,
            totalCost: sellValue,
            reason: suggestion.reason,
            confidence: suggestion.confidence,
          });
        }
      }
    }
  }

  const lastBar = bars[bars.length - 1];
  const finalValue = lastBar
    ? cash + Object.entries(positions).reduce(
        (sum, [sym, pos]) => sum + (lastBar.prices[sym] ?? 0) * pos.quantity,
        0
      )
    : cash;
  equityCurve.push({ timestamp: lastBar?.timestamp ?? 0, value: finalValue });

  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let runningPeak = initialBalance;
  for (const p of equityCurve) {
    if (p.value > runningPeak) runningPeak = p.value;
    const dd = runningPeak - p.value;
    const ddPct = runningPeak > 0 ? (dd / runningPeak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (ddPct > maxDrawdownPercent) maxDrawdownPercent = ddPct;
  }

  const closedPnLs: number[] = [];
  const buyQueue: { amount: number; price: number }[] = [];
  for (const t of trades) {
    if (t.type === 'buy') {
      buyQueue.push({ amount: t.amount, price: t.price });
    } else {
      let remaining = t.amount;
      while (remaining > 0 && buyQueue.length > 0) {
        const b = buyQueue[0];
        const match = Math.min(b.amount, remaining);
        closedPnLs.push((t.price - b.price) * match);
        remaining -= match;
        b.amount -= match;
        if (b.amount <= 0) buyQueue.shift();
      }
    }
  }
  const winningTrades = closedPnLs.filter((p) => p > 0).length;
  const losingTrades = closedPnLs.filter((p) => p < 0).length;
  const winRate = closedPnLs.length > 0 ? (winningTrades / closedPnLs.length) * 100 : 0;

  return {
    initialBalance,
    finalBalance: finalValue,
    totalReturn: finalValue - initialBalance,
    totalReturnPercent: ((finalValue - initialBalance) / initialBalance) * 100,
    trades,
    equityCurve,
    stats: {
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate,
      maxDrawdown,
      maxDrawdownPercent,
    },
  };
}
