// Liquidation Heatmap Service
// Integrates liquidation data for institutional-grade risk analysis
// Shows where leveraged positions will be liquidated at different price levels

// ==================== TYPES ====================

export interface LiquidationLevel {
  price: number;
  longLiquidations: number;    // USD value of longs liquidated at this price
  shortLiquidations: number;   // USD value of shorts liquidated at this price
  totalLiquidations: number;
  intensity: number;           // 0-100 normalized intensity
  priceFromCurrent: number;    // % distance from current price
}

export interface LiquidationHeatmapData {
  symbol: string;
  currentPrice: number;
  levels: LiquidationLevel[];
  
  // Aggregated stats
  totalLongExposure: number;
  totalShortExposure: number;
  longShortRatio: number;
  
  // Key levels
  majorLongLiquidationZone: { price: number; value: number } | null;
  majorShortLiquidationZone: { price: number; value: number } | null;
  
  // Risk indicators
  liquidationRiskScore: number;  // 0-100
  dominantSide: 'long' | 'short' | 'balanced';
  magnetPrice: number;           // Price with highest liquidation density
  
  timestamp: number;
  source: string;
}

export interface OpenInterest {
  symbol: string;
  openInterest: number;
  openInterestValue: number;
  longRatio: number;
  shortRatio: number;
  topTraderLongRatio: number;
  topTraderShortRatio: number;
  timestamp: number;
}

export interface FundingRate {
  symbol: string;
  fundingRate: number;
  fundingRatePercent: number;
  predictedRate: number;
  nextFundingTime: number;
  markPrice: number;
  indexPrice: number;
  timestamp: number;
}

export interface LeverageAnalysis {
  symbol: string;
  currentPrice: number;
  
  // Leverage distribution
  averageLeverage: number;
  leverageDistribution: {
    x1_5: number;   // % using 1-5x
    x5_10: number;  // % using 5-10x
    x10_25: number; // % using 10-25x
    x25_50: number; // % using 25-50x
    x50_100: number; // % using 50-100x
    x100_plus: number; // % using 100x+
  };
  
  // Estimated liquidation prices
  estimatedLiquidations: {
    priceDown5Percent: number;
    priceDown10Percent: number;
    priceDown20Percent: number;
    priceUp5Percent: number;
    priceUp10Percent: number;
    priceUp20Percent: number;
  };
  
  timestamp: number;
}

// ==================== SIMULATED DATA (CoinGlass API integration ready) ====================

// In production, replace with actual CoinGlass API calls
// API Docs: https://docs.coinglass.com/reference/liquidation-heatmap

/**
 * Generate simulated liquidation heatmap data
 * Structure matches CoinGlass API response format for easy migration
 */
function generateLiquidationLevels(
  currentPrice: number,
  symbol: string
): LiquidationLevel[] {
  const levels: LiquidationLevel[] = [];
  
  // Generate levels from -30% to +30% from current price
  const priceRange = currentPrice * 0.30;
  const step = priceRange / 30; // 30 levels each direction
  
  for (let i = -30; i <= 30; i++) {
    const price = currentPrice + (i * step);
    const priceFromCurrent = (i * step / currentPrice) * 100;
    
    // Simulate liquidation density
    // More liquidations cluster near current price (leverage cascade effect)
    const distanceFromCurrent = Math.abs(i);
    const baseIntensity = Math.max(0, 100 - distanceFromCurrent * 3);
    
    // Add randomness and some key levels
    const noise = Math.random() * 20;
    
    // Longs get liquidated below current price
    // Shorts get liquidated above current price
    let longLiq = 0;
    let shortLiq = 0;
    
    if (i < 0) {
      // Below current price - long liquidations
      longLiq = (baseIntensity + noise) * 1000000 * (Math.random() + 0.5);
      
      // Add liquidation clusters at round numbers and % levels
      if (Math.abs(priceFromCurrent) === 5 || Math.abs(priceFromCurrent) === 10 || Math.abs(priceFromCurrent) === 20) {
        longLiq *= 2.5;
      }
    } else if (i > 0) {
      // Above current price - short liquidations
      shortLiq = (baseIntensity + noise) * 1000000 * (Math.random() + 0.5);
      
      if (Math.abs(priceFromCurrent) === 5 || Math.abs(priceFromCurrent) === 10 || Math.abs(priceFromCurrent) === 20) {
        shortLiq *= 2.5;
      }
    }
    
    // Scale based on symbol (BTC has higher values)
    const symbolMultiplier = symbol === 'BTC' ? 100 : symbol === 'ETH' ? 50 : 10;
    longLiq *= symbolMultiplier;
    shortLiq *= symbolMultiplier;
    
    const totalLiq = longLiq + shortLiq;
    
    levels.push({
      price: Math.round(price * 100) / 100,
      longLiquidations: Math.round(longLiq),
      shortLiquidations: Math.round(shortLiq),
      totalLiquidations: Math.round(totalLiq),
      intensity: Math.min(100, baseIntensity + noise),
      priceFromCurrent: Math.round(priceFromCurrent * 100) / 100,
    });
  }
  
  return levels;
}

// ==================== MAIN SERVICE ====================

class LiquidationHeatmapService {
  private cache: Map<string, { data: LiquidationHeatmapData; timestamp: number }> = new Map();
  private cacheDuration = 60000; // 1 minute cache
  
  /**
   * Get liquidation heatmap for a symbol
   */
  async getHeatmap(symbol: string, currentPrice: number): Promise<LiquidationHeatmapData> {
    // Check cache
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      // Update current price in cached data
      return { ...cached.data, currentPrice };
    }
    
    // In production, this would call CoinGlass API:
    // const response = await fetch(`https://open-api.coinglass.com/public/v2/liquidation_heatmap?symbol=${symbol}`);
    
    const levels = generateLiquidationLevels(currentPrice, symbol);
    
    // Calculate aggregated stats
    const totalLongExposure = levels.reduce((sum, l) => sum + l.longLiquidations, 0);
    const totalShortExposure = levels.reduce((sum, l) => sum + l.shortLiquidations, 0);
    const longShortRatio = totalShortExposure > 0 ? totalLongExposure / totalShortExposure : 1;
    
    // Find major liquidation zones
    const majorLong = levels
      .filter(l => l.longLiquidations > 0)
      .sort((a, b) => b.longLiquidations - a.longLiquidations)[0];
    
    const majorShort = levels
      .filter(l => l.shortLiquidations > 0)
      .sort((a, b) => b.shortLiquidations - a.shortLiquidations)[0];
    
    // Find magnet price (highest total liquidations)
    const magnetLevel = levels.sort((a, b) => b.totalLiquidations - a.totalLiquidations)[0];
    
    // Calculate risk score
    // Higher score = more liquidations near current price
    const nearbyLiquidations = levels
      .filter(l => Math.abs(l.priceFromCurrent) <= 5)
      .reduce((sum, l) => sum + l.totalLiquidations, 0);
    const totalLiquidations = levels.reduce((sum, l) => sum + l.totalLiquidations, 0);
    const liquidationRiskScore = Math.min(100, (nearbyLiquidations / totalLiquidations) * 200);
    
    // Determine dominant side
    const dominantSide = longShortRatio > 1.2 ? 'long' : longShortRatio < 0.8 ? 'short' : 'balanced';
    
    const data: LiquidationHeatmapData = {
      symbol,
      currentPrice,
      levels,
      totalLongExposure,
      totalShortExposure,
      longShortRatio: Math.round(longShortRatio * 100) / 100,
      majorLongLiquidationZone: majorLong ? { price: majorLong.price, value: majorLong.longLiquidations } : null,
      majorShortLiquidationZone: majorShort ? { price: majorShort.price, value: majorShort.shortLiquidations } : null,
      liquidationRiskScore: Math.round(liquidationRiskScore),
      dominantSide,
      magnetPrice: magnetLevel.price,
      timestamp: Date.now(),
      source: 'simulated', // Change to 'coinglass' when using real API
    };
    
    // Cache result
    this.cache.set(symbol, { data, timestamp: Date.now() });
    
    return data;
  }
  
  /**
   * Get open interest data
   */
  async getOpenInterest(symbol: string): Promise<OpenInterest> {
    // In production, call CoinGlass API
    // For now, generate simulated data
    
    const baseOI = symbol === 'BTC' ? 15000000000 : symbol === 'ETH' ? 8000000000 : 500000000;
    const longRatio = 0.45 + Math.random() * 0.15; // 45-60%
    
    return {
      symbol,
      openInterest: baseOI / 50000, // Contracts
      openInterestValue: baseOI,
      longRatio: Math.round(longRatio * 100) / 100,
      shortRatio: Math.round((1 - longRatio) * 100) / 100,
      topTraderLongRatio: Math.round((longRatio + (Math.random() - 0.5) * 0.1) * 100) / 100,
      topTraderShortRatio: Math.round((1 - longRatio + (Math.random() - 0.5) * 0.1) * 100) / 100,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Get funding rate data
   */
  async getFundingRate(symbol: string): Promise<FundingRate> {
    // In production, fetch from exchange APIs
    
    const fundingRate = (Math.random() - 0.5) * 0.002; // -0.1% to 0.1%
    
    return {
      symbol,
      fundingRate,
      fundingRatePercent: fundingRate * 100,
      predictedRate: fundingRate * (0.8 + Math.random() * 0.4),
      nextFundingTime: Date.now() + Math.random() * 8 * 60 * 60 * 1000, // Within 8 hours
      markPrice: 0, // Would be set from exchange
      indexPrice: 0,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Get leverage analysis
   */
  async getLeverageAnalysis(symbol: string, currentPrice: number): Promise<LeverageAnalysis> {
    // Simulated leverage distribution
    const distribution = {
      x1_5: 25 + Math.random() * 10,
      x5_10: 30 + Math.random() * 10,
      x10_25: 20 + Math.random() * 10,
      x25_50: 12 + Math.random() * 5,
      x50_100: 8 + Math.random() * 3,
      x100_plus: 2 + Math.random() * 2,
    };
    
    // Normalize to 100%
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    Object.keys(distribution).forEach(key => {
      distribution[key as keyof typeof distribution] = Math.round((distribution[key as keyof typeof distribution] / total) * 100);
    });
    
    // Calculate average leverage
    const avgLeverage = 
      distribution.x1_5 * 3 +
      distribution.x5_10 * 7.5 +
      distribution.x10_25 * 17.5 +
      distribution.x25_50 * 37.5 +
      distribution.x50_100 * 75 +
      distribution.x100_plus * 125;
    
    // Estimate liquidations at different price levels
    // Higher leverage = liquidated sooner
    const baseLiquidation = 1000000; // $1M base
    
    return {
      symbol,
      currentPrice,
      averageLeverage: Math.round(avgLeverage / 100 * 10) / 10,
      leverageDistribution: distribution,
      estimatedLiquidations: {
        priceDown5Percent: Math.round(baseLiquidation * (distribution.x50_100 + distribution.x100_plus) / 10),
        priceDown10Percent: Math.round(baseLiquidation * (distribution.x25_50 + distribution.x50_100 + distribution.x100_plus) / 5),
        priceDown20Percent: Math.round(baseLiquidation * (distribution.x10_25 + distribution.x25_50 + distribution.x50_100 + distribution.x100_plus) / 3),
        priceUp5Percent: Math.round(baseLiquidation * (distribution.x50_100 + distribution.x100_plus) / 10 * 0.8),
        priceUp10Percent: Math.round(baseLiquidation * (distribution.x25_50 + distribution.x50_100 + distribution.x100_plus) / 5 * 0.8),
        priceUp20Percent: Math.round(baseLiquidation * (distribution.x10_25 + distribution.x25_50 + distribution.x50_100 + distribution.x100_plus) / 3 * 0.8),
      },
      timestamp: Date.now(),
    };
  }
  
  /**
   * Get comprehensive liquidation analysis
   */
  async getFullAnalysis(symbol: string, currentPrice: number): Promise<{
    heatmap: LiquidationHeatmapData;
    openInterest: OpenInterest;
    fundingRate: FundingRate;
    leverage: LeverageAnalysis;
    tradingInsights: string[];
  }> {
    const [heatmap, openInterest, fundingRate, leverage] = await Promise.all([
      this.getHeatmap(symbol, currentPrice),
      this.getOpenInterest(symbol),
      this.getFundingRate(symbol),
      this.getLeverageAnalysis(symbol, currentPrice),
    ]);
    
    // Generate trading insights
    const insights: string[] = [];
    
    // Liquidation-based insights
    if (heatmap.liquidationRiskScore > 70) {
      insights.push('⚠️ High liquidation density near current price - expect volatility');
    }
    
    if (heatmap.dominantSide === 'long') {
      insights.push(`📊 Market is long-heavy (${heatmap.longShortRatio}:1 ratio) - potential for long squeeze`);
    } else if (heatmap.dominantSide === 'short') {
      insights.push(`📊 Market is short-heavy (1:${(1/heatmap.longShortRatio).toFixed(2)} ratio) - potential for short squeeze`);
    }
    
    if (heatmap.majorLongLiquidationZone) {
      const distFromMajorLong = ((currentPrice - heatmap.majorLongLiquidationZone.price) / currentPrice) * 100;
      if (distFromMajorLong < 5) {
        insights.push(`🔴 Major long liquidation zone at $${heatmap.majorLongLiquidationZone.price.toLocaleString()} (${distFromMajorLong.toFixed(1)}% below)`);
      }
    }
    
    if (heatmap.majorShortLiquidationZone) {
      const distFromMajorShort = ((heatmap.majorShortLiquidationZone.price - currentPrice) / currentPrice) * 100;
      if (distFromMajorShort < 5) {
        insights.push(`🟢 Major short liquidation zone at $${heatmap.majorShortLiquidationZone.price.toLocaleString()} (${distFromMajorShort.toFixed(1)}% above)`);
      }
    }
    
    // Funding rate insights
    if (Math.abs(fundingRate.fundingRatePercent) > 0.05) {
      const direction = fundingRate.fundingRate > 0 ? 'paying shorts' : 'paying longs';
      insights.push(`💰 Elevated funding rate: ${direction} (${(fundingRate.fundingRatePercent).toFixed(3)}%)`);
    }
    
    // Leverage insights
    if (leverage.averageLeverage > 20) {
      insights.push(`⚡ High average leverage (${leverage.averageLeverage}x) - market vulnerable to cascading liquidations`);
    }
    
    // Magnet price insight
    const magnetDistance = ((heatmap.magnetPrice - currentPrice) / currentPrice) * 100;
    if (Math.abs(magnetDistance) < 10) {
      insights.push(`🧲 Price magnet at $${heatmap.magnetPrice.toLocaleString()} (${magnetDistance > 0 ? '+' : ''}${magnetDistance.toFixed(1)}%) - high liquidation density`);
    }
    
    return {
      heatmap,
      openInterest,
      fundingRate,
      leverage,
      tradingInsights: insights,
    };
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ==================== SINGLETON INSTANCE ====================

export const liquidationService = new LiquidationHeatmapService();

// ==================== CONVENIENCE EXPORTS ====================

export async function getLiquidationHeatmap(symbol: string, currentPrice: number): Promise<LiquidationHeatmapData> {
  return liquidationService.getHeatmap(symbol, currentPrice);
}

export async function getOpenInterest(symbol: string): Promise<OpenInterest> {
  return liquidationService.getOpenInterest(symbol);
}

export async function getFundingRate(symbol: string): Promise<FundingRate> {
  return liquidationService.getFundingRate(symbol);
}

export async function getLeverageAnalysis(symbol: string, currentPrice: number): Promise<LeverageAnalysis> {
  return liquidationService.getLeverageAnalysis(symbol, currentPrice);
}

export async function getFullLiquidationAnalysis(symbol: string, currentPrice: number) {
  return liquidationService.getFullAnalysis(symbol, currentPrice);
}

// ==================== REACT HOOKS ====================

import { useState, useEffect } from 'react';

export function useLiquidationHeatmap(symbol: string, currentPrice: number) {
  const [data, setData] = useState<LiquidationHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetch() {
      try {
        setLoading(true);
        const result = await liquidationService.getHeatmap(symbol, currentPrice);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    fetch();
    
    // Refresh every minute
    const interval = setInterval(fetch, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [symbol, currentPrice]);
  
  return { data, loading, error };
}

export function useFullLiquidationAnalysis(symbol: string, currentPrice: number) {
  const [data, setData] = useState<Awaited<ReturnType<typeof liquidationService.getFullAnalysis>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetch() {
      try {
        setLoading(true);
        const result = await liquidationService.getFullAnalysis(symbol, currentPrice);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    fetch();
    const interval = setInterval(fetch, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [symbol, currentPrice]);
  
  return { data, loading, error };
}

export default liquidationService;
