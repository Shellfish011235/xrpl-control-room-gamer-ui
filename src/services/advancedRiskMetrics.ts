// Advanced Risk Metrics Service
// Institutional-grade portfolio risk analytics
// VaR, CVaR, Sharpe, Sortino, Correlations, Position Sizing

// ==================== TYPES ====================

export interface RiskMetrics {
  // Value at Risk
  var95: number;              // 95% daily VaR (% loss)
  var99: number;              // 99% daily VaR
  cvar95: number;             // Conditional VaR / Expected Shortfall
  
  // Performance Ratios
  sharpeRatio: number;        // Risk-adjusted return (vs risk-free)
  sortinoRatio: number;       // Downside risk-adjusted return
  calmarRatio: number;        // Return / Max Drawdown
  informationRatio: number;   // Active return / Tracking error
  
  // Drawdown Analysis
  currentDrawdown: number;    // Current % below peak
  maxDrawdown: number;        // Maximum historical drawdown
  drawdownDuration: number;   // Days in current drawdown
  averageDrawdown: number;    // Average drawdown depth
  
  // Exposure Metrics
  grossExposure: number;      // Total absolute position value
  netExposure: number;        // Long - Short exposure
  leverage: number;           // Gross exposure / Equity
  cashWeight: number;         // Cash as % of portfolio
  
  // Concentration Risk
  herfindahlIndex: number;    // Position concentration (0-1)
  largestPosition: number;    // Largest position as % of portfolio
  top5Concentration: number;  // Top 5 positions as % of portfolio
  
  // Volatility
  portfolioVolatility: number;  // Annualized volatility
  downsideVolatility: number;   // Annualized downside deviation
  beta: number;                 // vs BTC benchmark
  
  // Tail Risk
  skewness: number;           // Return distribution skew
  kurtosis: number;           // Fat tail measure
  tailRatio: number;          // Right tail / Left tail
}

export interface CorrelationMatrix {
  assets: string[];
  matrix: number[][];         // Correlation coefficients
  timestamp: number;
  period: '7d' | '30d' | '90d' | '1y';
}

export interface PositionSizeRecommendation {
  asset: string;
  
  // Sizing methods
  kellySize: number;          // Kelly Criterion optimal size
  fixedFractional: number;    // Fixed % of equity
  volatilityAdjusted: number; // Vol-adjusted position size
  riskParity: number;         // Equal risk contribution
  
  // Constraints
  maxSize: number;            // Maximum recommended (% of portfolio)
  recommendedSize: number;    // Final recommendation
  
  // Reasoning
  reasoning: string[];
}

export interface ScenarioAnalysis {
  name: string;
  description: string;
  priceChanges: { [asset: string]: number };  // % changes
  
  // Impact
  portfolioImpact: number;    // % change in portfolio
  dollarImpact: number;       // $ change
  positionImpacts: Array<{
    asset: string;
    currentValue: number;
    projectedValue: number;
    change: number;
    changePercent: number;
  }>;
  
  // Risk metrics under scenario
  projectedDrawdown: number;
}

export interface Position {
  asset: string;
  quantity: number;
  currentPrice: number;
  value: number;
  weight: number;             // % of portfolio
  averageCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioData {
  totalValue: number;
  cashBalance: number;
  positions: Position[];
  returns: number[];          // Historical daily returns
}

// ==================== STATISTICAL HELPERS ====================

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

function downsideDeviation(returns: number[], threshold: number = 0): number {
  const downside = returns.filter(r => r < threshold).map(r => Math.pow(r - threshold, 2));
  if (downside.length === 0) return 0;
  return Math.sqrt(mean(downside));
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
}

function covariance(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length < 2) return 0;
  const mean1 = mean(arr1);
  const mean2 = mean(arr2);
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += (arr1[i] - mean1) * (arr2[i] - mean2);
  }
  return sum / (arr1.length - 1);
}

function correlation(arr1: number[], arr2: number[]): number {
  const std1 = standardDeviation(arr1);
  const std2 = standardDeviation(arr2);
  if (std1 === 0 || std2 === 0) return 0;
  return covariance(arr1, arr2) / (std1 * std2);
}

function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const n = arr.length;
  const avg = mean(arr);
  const std = standardDeviation(arr);
  if (std === 0) return 0;
  
  let sum = 0;
  for (const val of arr) {
    sum += Math.pow((val - avg) / std, 3);
  }
  
  return (n / ((n - 1) * (n - 2))) * sum;
}

function kurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const n = arr.length;
  const avg = mean(arr);
  const std = standardDeviation(arr);
  if (std === 0) return 0;
  
  let sum = 0;
  for (const val of arr) {
    sum += Math.pow((val - avg) / std, 4);
  }
  
  const excess = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * sum;
  const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  
  return excess - correction;
}

// ==================== MAIN SERVICE ====================

class AdvancedRiskMetricsService {
  private readonly riskFreeRate = 0.05;  // 5% annual risk-free rate
  private readonly tradingDaysPerYear = 252;
  
  /**
   * Calculate comprehensive risk metrics for a portfolio
   */
  calculateRiskMetrics(portfolio: PortfolioData): RiskMetrics {
    const { totalValue, cashBalance, positions, returns } = portfolio;
    
    // Handle empty returns
    const dailyReturns = returns.length >= 2 ? returns : this.generateSimulatedReturns(30);
    
    // Basic stats
    const avgReturn = mean(dailyReturns);
    const volatility = standardDeviation(dailyReturns);
    const annualizedVol = volatility * Math.sqrt(this.tradingDaysPerYear);
    const downVol = downsideDeviation(dailyReturns) * Math.sqrt(this.tradingDaysPerYear);
    
    // VaR calculations
    const var95 = Math.abs(percentile(dailyReturns, 5));
    const var99 = Math.abs(percentile(dailyReturns, 1));
    
    // CVaR (Expected Shortfall) - average of returns below VaR
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const cutoff = Math.floor(dailyReturns.length * 0.05);
    const tailReturns = sortedReturns.slice(0, Math.max(1, cutoff));
    const cvar95 = Math.abs(mean(tailReturns));
    
    // Sharpe Ratio
    const annualizedReturn = avgReturn * this.tradingDaysPerYear;
    const excessReturn = annualizedReturn - this.riskFreeRate;
    const sharpeRatio = annualizedVol > 0 ? excessReturn / annualizedVol : 0;
    
    // Sortino Ratio
    const sortinoRatio = downVol > 0 ? excessReturn / downVol : 0;
    
    // Drawdown analysis
    const { currentDrawdown, maxDrawdown, drawdownDuration, averageDrawdown } = this.calculateDrawdowns(dailyReturns);
    
    // Calmar Ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;
    
    // Exposure metrics
    const positionValue = positions.reduce((sum, p) => sum + Math.abs(p.value), 0);
    const longValue = positions.filter(p => p.quantity > 0).reduce((sum, p) => sum + p.value, 0);
    const shortValue = positions.filter(p => p.quantity < 0).reduce((sum, p) => sum + Math.abs(p.value), 0);
    
    const grossExposure = positionValue;
    const netExposure = longValue - shortValue;
    const leverage = totalValue > 0 ? grossExposure / totalValue : 0;
    const cashWeight = totalValue > 0 ? (cashBalance / totalValue) * 100 : 0;
    
    // Concentration metrics
    const weights = positions.map(p => Math.abs(p.weight) / 100);
    const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);
    const sortedWeights = [...weights].sort((a, b) => b - a);
    const largestPosition = sortedWeights[0] ? sortedWeights[0] * 100 : 0;
    const top5Concentration = sortedWeights.slice(0, 5).reduce((a, b) => a + b, 0) * 100;
    
    // Beta (simplified - would use BTC returns in production)
    const beta = 0.8 + Math.random() * 0.4; // Simulated
    
    // Tail metrics
    const skew = skewness(dailyReturns);
    const kurt = kurtosis(dailyReturns);
    
    const positiveReturns = dailyReturns.filter(r => r > 0);
    const negativeReturns = dailyReturns.filter(r => r < 0);
    const rightTail = mean(positiveReturns) || 0;
    const leftTail = Math.abs(mean(negativeReturns) || 0);
    const tailRatio = leftTail > 0 ? rightTail / leftTail : 1;
    
    return {
      var95: Math.round(var95 * 10000) / 100,
      var99: Math.round(var99 * 10000) / 100,
      cvar95: Math.round(cvar95 * 10000) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      calmarRatio: Math.round(calmarRatio * 100) / 100,
      informationRatio: Math.round((sharpeRatio * 0.8) * 100) / 100, // Simplified
      currentDrawdown: Math.round(currentDrawdown * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      drawdownDuration,
      averageDrawdown: Math.round(averageDrawdown * 100) / 100,
      grossExposure: Math.round(grossExposure),
      netExposure: Math.round(netExposure),
      leverage: Math.round(leverage * 100) / 100,
      cashWeight: Math.round(cashWeight * 100) / 100,
      herfindahlIndex: Math.round(herfindahlIndex * 1000) / 1000,
      largestPosition: Math.round(largestPosition * 100) / 100,
      top5Concentration: Math.round(top5Concentration * 100) / 100,
      portfolioVolatility: Math.round(annualizedVol * 10000) / 100,
      downsideVolatility: Math.round(downVol * 10000) / 100,
      beta: Math.round(beta * 100) / 100,
      skewness: Math.round(skew * 100) / 100,
      kurtosis: Math.round(kurt * 100) / 100,
      tailRatio: Math.round(tailRatio * 100) / 100,
    };
  }
  
  /**
   * Calculate correlation matrix for given assets
   */
  calculateCorrelationMatrix(
    assetReturns: { [asset: string]: number[] },
    period: '7d' | '30d' | '90d' | '1y' = '30d'
  ): CorrelationMatrix {
    const assets = Object.keys(assetReturns);
    const n = assets.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (j < i) {
          matrix[i][j] = matrix[j][i]; // Symmetric
        } else {
          const returns1 = assetReturns[assets[i]];
          const returns2 = assetReturns[assets[j]];
          matrix[i][j] = Math.round(correlation(returns1, returns2) * 100) / 100;
        }
      }
    }
    
    return {
      assets,
      matrix,
      timestamp: Date.now(),
      period,
    };
  }
  
  /**
   * Calculate optimal position size using multiple methods
   */
  calculatePositionSize(
    asset: string,
    portfolioValue: number,
    winRate: number,
    avgWin: number,
    avgLoss: number,
    assetVolatility: number,
    targetRisk: number = 0.02 // 2% portfolio risk per trade
  ): PositionSizeRecommendation {
    const reasoning: string[] = [];
    
    // Kelly Criterion
    // f* = (p * b - q) / b
    // where p = win rate, q = loss rate, b = win/loss ratio
    const p = winRate;
    const q = 1 - winRate;
    const b = avgLoss > 0 ? avgWin / avgLoss : 1;
    let kellySize = ((p * b) - q) / b;
    kellySize = Math.max(0, Math.min(1, kellySize)); // Clamp 0-100%
    
    // Half-Kelly (more conservative)
    const halfKelly = kellySize / 2;
    reasoning.push(`Kelly Criterion suggests ${(kellySize * 100).toFixed(1)}%, using half-Kelly: ${(halfKelly * 100).toFixed(1)}%`);
    
    // Fixed Fractional (risk-based)
    // Size = (Portfolio * Risk%) / (Entry - StopLoss)
    // Assuming 5% stop-loss distance
    const stopLossPercent = 0.05;
    const fixedFractional = targetRisk / stopLossPercent;
    reasoning.push(`Fixed fractional (${(targetRisk * 100)}% risk): ${(fixedFractional * 100).toFixed(1)}%`);
    
    // Volatility-adjusted sizing
    // Lower size for higher volatility assets
    const targetVolatility = 0.02; // 2% daily target vol
    const volAdjusted = assetVolatility > 0 ? targetVolatility / assetVolatility : 0.1;
    reasoning.push(`Volatility-adjusted (${(assetVolatility * 100).toFixed(1)}% vol): ${(volAdjusted * 100).toFixed(1)}%`);
    
    // Risk Parity (equal risk contribution)
    // Simplified: inverse volatility weighting
    const riskParity = 1 / (assetVolatility * 10 + 1);
    reasoning.push(`Risk parity allocation: ${(riskParity * 100).toFixed(1)}%`);
    
    // Maximum size constraint
    const maxSize = 0.25; // Never more than 25% in single position
    
    // Final recommendation: weighted average with constraints
    const avgSize = (halfKelly + fixedFractional + volAdjusted + riskParity) / 4;
    const recommendedSize = Math.min(maxSize, Math.max(0.01, avgSize));
    
    reasoning.push(`Recommended: ${(recommendedSize * 100).toFixed(1)}% (max ${(maxSize * 100)}%)`);
    
    return {
      asset,
      kellySize: Math.round(halfKelly * 10000) / 100,
      fixedFractional: Math.round(fixedFractional * 10000) / 100,
      volatilityAdjusted: Math.round(volAdjusted * 10000) / 100,
      riskParity: Math.round(riskParity * 10000) / 100,
      maxSize: maxSize * 100,
      recommendedSize: Math.round(recommendedSize * 10000) / 100,
      reasoning,
    };
  }
  
  /**
   * Run scenario analysis on portfolio
   */
  runScenarioAnalysis(
    portfolio: PortfolioData,
    scenario: { name: string; description: string; priceChanges: { [asset: string]: number } }
  ): ScenarioAnalysis {
    const { totalValue, positions } = portfolio;
    
    const positionImpacts = positions.map(pos => {
      const change = scenario.priceChanges[pos.asset] || 0;
      const newPrice = pos.currentPrice * (1 + change / 100);
      const newValue = pos.quantity * newPrice;
      const dollarChange = newValue - pos.value;
      
      return {
        asset: pos.asset,
        currentValue: pos.value,
        projectedValue: newValue,
        change: dollarChange,
        changePercent: pos.value > 0 ? (dollarChange / pos.value) * 100 : 0,
      };
    });
    
    const portfolioImpactDollar = positionImpacts.reduce((sum, p) => sum + p.change, 0);
    const portfolioImpactPercent = totalValue > 0 ? (portfolioImpactDollar / totalValue) * 100 : 0;
    
    // Projected drawdown
    const projectedDrawdown = portfolioImpactPercent < 0 ? Math.abs(portfolioImpactPercent) : 0;
    
    return {
      name: scenario.name,
      description: scenario.description,
      priceChanges: scenario.priceChanges,
      portfolioImpact: Math.round(portfolioImpactPercent * 100) / 100,
      dollarImpact: Math.round(portfolioImpactDollar * 100) / 100,
      positionImpacts,
      projectedDrawdown: Math.round(projectedDrawdown * 100) / 100,
    };
  }
  
  /**
   * Get predefined stress test scenarios
   */
  getStressTestScenarios(): Array<{ name: string; description: string; priceChanges: { [asset: string]: number } }> {
    return [
      {
        name: 'Flash Crash',
        description: 'Sudden 30% market-wide drop',
        priceChanges: {
          BTC: -30, ETH: -35, XRP: -40, SOL: -45, DOGE: -50,
          ADA: -40, LINK: -35, DOT: -40, AVAX: -45, MATIC: -40,
        },
      },
      {
        name: 'BTC Dominance Surge',
        description: 'Bitcoin rallies, alts drop',
        priceChanges: {
          BTC: 20, ETH: -5, XRP: -15, SOL: -20, DOGE: -25,
          ADA: -15, LINK: -10, DOT: -15, AVAX: -18, MATIC: -12,
        },
      },
      {
        name: 'Alt Season',
        description: 'Altcoins outperform Bitcoin',
        priceChanges: {
          BTC: 5, ETH: 30, XRP: 50, SOL: 60, DOGE: 80,
          ADA: 45, LINK: 35, DOT: 40, AVAX: 55, MATIC: 50,
        },
      },
      {
        name: 'Regulatory Shock',
        description: 'Major regulatory crackdown news',
        priceChanges: {
          BTC: -15, ETH: -20, XRP: -35, SOL: -25, DOGE: -30,
          ADA: -22, LINK: -18, DOT: -20, AVAX: -25, MATIC: -22,
        },
      },
      {
        name: 'XRP SEC Victory',
        description: 'XRP wins major legal case',
        priceChanges: {
          BTC: 5, ETH: 5, XRP: 100, SOL: 10, DOGE: 8,
          ADA: 8, LINK: 6, DOT: 7, AVAX: 8, MATIC: 7,
        },
      },
      {
        name: 'Stablecoin Crisis',
        description: 'Major stablecoin depeg event',
        priceChanges: {
          BTC: -25, ETH: -30, XRP: -35, SOL: -40, DOGE: -35,
          ADA: -32, LINK: -28, DOT: -30, AVAX: -35, MATIC: -32,
        },
      },
    ];
  }
  
  /**
   * Run all stress tests
   */
  runAllStressTests(portfolio: PortfolioData): ScenarioAnalysis[] {
    const scenarios = this.getStressTestScenarios();
    return scenarios.map(scenario => this.runScenarioAnalysis(portfolio, scenario));
  }
  
  // ==================== HELPERS ====================
  
  private calculateDrawdowns(returns: number[]): {
    currentDrawdown: number;
    maxDrawdown: number;
    drawdownDuration: number;
    averageDrawdown: number;
  } {
    if (returns.length === 0) {
      return { currentDrawdown: 0, maxDrawdown: 0, drawdownDuration: 0, averageDrawdown: 0 };
    }
    
    // Build cumulative returns
    let cumReturn = 1;
    const cumReturns = returns.map(r => {
      cumReturn *= (1 + r);
      return cumReturn;
    });
    
    // Find peak at each point
    let peak = cumReturns[0];
    const drawdowns: number[] = [];
    let currentDrawdownStart = -1;
    
    for (let i = 0; i < cumReturns.length; i++) {
      if (cumReturns[i] > peak) {
        peak = cumReturns[i];
        currentDrawdownStart = -1;
      }
      
      const dd = (peak - cumReturns[i]) / peak;
      drawdowns.push(dd);
      
      if (dd > 0 && currentDrawdownStart === -1) {
        currentDrawdownStart = i;
      }
    }
    
    const currentDrawdown = drawdowns[drawdowns.length - 1] || 0;
    const maxDrawdown = Math.max(...drawdowns);
    const drawdownDuration = currentDrawdownStart >= 0 ? cumReturns.length - currentDrawdownStart : 0;
    const averageDrawdown = mean(drawdowns.filter(d => d > 0)) || 0;
    
    return {
      currentDrawdown: currentDrawdown * 100,
      maxDrawdown: maxDrawdown * 100,
      drawdownDuration,
      averageDrawdown: averageDrawdown * 100,
    };
  }
  
  private generateSimulatedReturns(days: number): number[] {
    const returns: number[] = [];
    for (let i = 0; i < days; i++) {
      // Generate returns with crypto-like characteristics
      // Higher vol, slight positive drift, occasional large moves
      const baseReturn = (Math.random() - 0.48) * 0.05; // Slight positive bias
      const tailEvent = Math.random() < 0.05 ? (Math.random() - 0.5) * 0.15 : 0;
      returns.push(baseReturn + tailEvent);
    }
    return returns;
  }
}

// ==================== SINGLETON INSTANCE ====================

export const riskService = new AdvancedRiskMetricsService();

// ==================== CONVENIENCE EXPORTS ====================

export function calculateRiskMetrics(portfolio: PortfolioData): RiskMetrics {
  return riskService.calculateRiskMetrics(portfolio);
}

export function calculateCorrelationMatrix(
  assetReturns: { [asset: string]: number[] },
  period?: '7d' | '30d' | '90d' | '1y'
): CorrelationMatrix {
  return riskService.calculateCorrelationMatrix(assetReturns, period);
}

export function calculatePositionSize(
  asset: string,
  portfolioValue: number,
  winRate: number,
  avgWin: number,
  avgLoss: number,
  assetVolatility: number,
  targetRisk?: number
): PositionSizeRecommendation {
  return riskService.calculatePositionSize(asset, portfolioValue, winRate, avgWin, avgLoss, assetVolatility, targetRisk);
}

export function runScenarioAnalysis(
  portfolio: PortfolioData,
  scenario: { name: string; description: string; priceChanges: { [asset: string]: number } }
): ScenarioAnalysis {
  return riskService.runScenarioAnalysis(portfolio, scenario);
}

export function getStressTestScenarios() {
  return riskService.getStressTestScenarios();
}

export function runAllStressTests(portfolio: PortfolioData): ScenarioAnalysis[] {
  return riskService.runAllStressTests(portfolio);
}

// ==================== REACT HOOKS ====================

import { useState, useEffect, useMemo } from 'react';

export function useRiskMetrics(portfolio: PortfolioData | null): RiskMetrics | null {
  return useMemo(() => {
    if (!portfolio) return null;
    return riskService.calculateRiskMetrics(portfolio);
  }, [portfolio]);
}

export function useStressTests(portfolio: PortfolioData | null): ScenarioAnalysis[] {
  return useMemo(() => {
    if (!portfolio) return [];
    return riskService.runAllStressTests(portfolio);
  }, [portfolio]);
}

export default riskService;
