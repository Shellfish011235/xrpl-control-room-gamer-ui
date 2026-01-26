// Multi-Dimensional Quant Finance Engine
// Integrates AI, ILP corridor data, XRPL metrics, and cross-market signals
// into a unified N-dimensional trading signal system
//
// Architecture:
// - X axis: Time (multiple timeframes)
// - Y axis: Asset correlation space
// - Z axis: Signal strength/confidence
// - N dimensions: Factor exposures (momentum, liquidity, sentiment, on-chain, macro)

import { ilpCorridors, ilpConnectorInstances, getILPStats } from '../data/ilpData';
import { analyzeAMMIncentives, analyzeValidatorIncentives, quantumMonteCarlo } from './aiQuantumAnalytics';
import { getUnifiedMarketIntelligence, type UnifiedMarketIntelligence } from './unifiedAnalyticsAggregator';

// ==================== TYPES ====================

export interface FactorExposure {
  momentum: number;      // -1 to 1: price trend strength
  liquidity: number;     // 0 to 1: market depth/volume
  sentiment: number;     // -1 to 1: social/news sentiment
  onChain: number;       // -1 to 1: on-chain activity signals
  macro: number;         // -1 to 1: macro environment (risk-on/risk-off)
  corridorFlow: number;  // -1 to 1: ILP/ODL flow direction
  volatility: number;    // 0 to 1: realized volatility percentile
  valueScore: number;    // -1 to 1: relative value vs fundamentals
}

export interface MultiDimensionalSignal {
  id: string;
  timestamp: number;
  asset: string;
  
  // Core signal output
  compositeScore: number;      // -100 to 100: final trading signal
  confidence: number;          // 0 to 100: signal reliability
  action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  
  // Factor decomposition
  factors: FactorExposure;
  factorContributions: Record<keyof FactorExposure, number>;
  
  // Multi-timeframe analysis
  timeframes: {
    m5: number;   // 5-minute signal
    m15: number;  // 15-minute signal
    h1: number;   // 1-hour signal
    h4: number;   // 4-hour signal
    d1: number;   // Daily signal
  };
  timeframeAlignment: number;  // 0-100: how aligned timeframes are
  
  // Cross-asset context
  correlatedAssets: Array<{ asset: string; correlation: number; signal: number }>;
  sectorExposure: Record<string, number>;
  
  // Risk metrics
  risk: {
    valueAtRisk95: number;     // 95% VaR as % of position
    expectedShortfall: number; // CVaR/Expected Shortfall
    sharpeRatio: number;       // Risk-adjusted return
    sortinoRatio: number;      // Downside-adjusted return
    maxDrawdown: number;       // Historical max drawdown
    beta: number;              // Market beta (vs BTC)
  };
  
  // ILP/Ripple intelligence
  corridorSignals: CorridorIntelligence;
  
  // Reasoning chain
  reasoning: string[];
  dataQuality: number;  // 0-100: confidence in underlying data
}

export interface CorridorIntelligence {
  activeCorridors: number;
  flowDirection: 'inflow' | 'outflow' | 'balanced';
  flowStrength: number;        // 0-100
  topCorridors: Array<{
    name: string;
    volume: string;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  xrplUtilization: number;     // 0-100: XRPL network usage
  connectorHealth: number;     // 0-100: ILP connector network health
  odlActivityScore: number;    // 0-100: On-Demand Liquidity activity
}

export interface PortfolioOptimization {
  targetWeights: Record<string, number>;
  expectedReturn: number;
  portfolioRisk: number;
  sharpeRatio: number;
  diversificationRatio: number;
  factorTilts: FactorExposure;
  rebalanceActions: Array<{
    asset: string;
    currentWeight: number;
    targetWeight: number;
    action: 'buy' | 'sell' | 'hold';
    urgency: 'high' | 'medium' | 'low';
  }>;
}

export interface MarketRegime {
  regime: 'risk_on' | 'risk_off' | 'neutral' | 'crisis' | 'euphoria';
  confidence: number;
  characteristics: string[];
  recommendedStrategy: string;
  factorRotation: Partial<FactorExposure>;
}

export interface CrossSectorAnalysis {
  sectors: Array<{
    name: string;
    momentum: number;
    relativeStrength: number;
    topAssets: string[];
  }>;
  leadingIndicators: string[];
  sectorRotationSignal: string;
}

// ==================== FACTOR WEIGHTS BY REGIME ====================

const REGIME_FACTOR_WEIGHTS: Record<MarketRegime['regime'], FactorExposure> = {
  risk_on: {
    momentum: 0.25,
    liquidity: 0.10,
    sentiment: 0.20,
    onChain: 0.15,
    macro: 0.10,
    corridorFlow: 0.10,
    volatility: -0.05,  // Negative = prefer lower volatility
    valueScore: 0.05,
  },
  risk_off: {
    momentum: 0.05,
    liquidity: 0.25,
    sentiment: 0.10,
    onChain: 0.10,
    macro: 0.20,
    corridorFlow: 0.05,
    volatility: -0.15,
    valueScore: 0.10,
  },
  neutral: {
    momentum: 0.15,
    liquidity: 0.15,
    sentiment: 0.15,
    onChain: 0.15,
    macro: 0.15,
    corridorFlow: 0.10,
    volatility: -0.05,
    valueScore: 0.10,
  },
  crisis: {
    momentum: -0.10,  // Momentum reversal in crisis
    liquidity: 0.35,
    sentiment: 0.05,
    onChain: 0.05,
    macro: 0.30,
    corridorFlow: 0.05,
    volatility: -0.10,
    valueScore: 0.20,
  },
  euphoria: {
    momentum: 0.30,
    liquidity: 0.05,
    sentiment: 0.25,
    onChain: 0.20,
    macro: 0.05,
    corridorFlow: 0.10,
    volatility: 0.00,
    valueScore: 0.05,
  },
};

// ==================== CORRELATION MATRIX ====================

const ASSET_SECTORS: Record<string, string> = {
  BTC: 'store_of_value',
  ETH: 'smart_contracts',
  XRP: 'payments',
  SOL: 'smart_contracts',
  ADA: 'smart_contracts',
  DOGE: 'meme',
  SHIB: 'meme',
  LINK: 'infrastructure',
  DOT: 'infrastructure',
  AVAX: 'smart_contracts',
  MATIC: 'layer2',
  ATOM: 'infrastructure',
  XLM: 'payments',
  ALGO: 'smart_contracts',
  HBAR: 'enterprise',
};

// Base correlation structure (simplified - would be computed from historical data)
const BASE_CORRELATIONS: Record<string, Record<string, number>> = {
  BTC: { ETH: 0.85, XRP: 0.65, SOL: 0.80, DOGE: 0.70 },
  ETH: { BTC: 0.85, XRP: 0.60, SOL: 0.88, ADA: 0.82 },
  XRP: { BTC: 0.65, ETH: 0.60, XLM: 0.75, HBAR: 0.55 },
  SOL: { BTC: 0.80, ETH: 0.88, AVAX: 0.82, ADA: 0.78 },
};

// ==================== CORE ENGINE ====================

export class MultiDimensionalQuantEngine {
  private priceCache: Map<string, number[]> = new Map();
  private signalHistory: MultiDimensionalSignal[] = [];
  private currentRegime: MarketRegime | null = null;
  
  constructor() {
    this.initializeEngine();
  }
  
  private initializeEngine() {
    // Initialize with detection of current market regime
    this.detectMarketRegime().then(regime => {
      this.currentRegime = regime;
      console.log(`[QuantEngine] Initialized with regime: ${regime.regime}`);
    });
  }
  
  // ==================== MAIN SIGNAL GENERATION ====================
  
  async generateSignal(
    asset: string,
    currentPrice: number,
    priceHistory: number[],
    externalData?: {
      sentiment?: number;
      volume24h?: number;
      marketCap?: number;
      xrplMetrics?: any;
    }
  ): Promise<MultiDimensionalSignal> {
    const startTime = performance.now();
    const reasoning: string[] = [];
    
    // 1. Calculate factor exposures
    const factors = await this.calculateFactorExposures(
      asset, currentPrice, priceHistory, externalData
    );
    reasoning.push(`Calculated ${Object.keys(factors).length} factor exposures`);
    
    // 2. Get current market regime
    const regime = this.currentRegime || await this.detectMarketRegime();
    reasoning.push(`Market regime: ${regime.regime} (${regime.confidence}% confidence)`);
    
    // 3. Get factor weights for current regime
    const weights = REGIME_FACTOR_WEIGHTS[regime.regime];
    
    // 4. Calculate factor contributions
    const contributions = this.calculateFactorContributions(factors, weights);
    
    // 5. Multi-timeframe analysis
    const timeframes = this.analyzeMultipleTimeframes(priceHistory);
    const timeframeAlignment = this.calculateTimeframeAlignment(timeframes);
    reasoning.push(`Timeframe alignment: ${timeframeAlignment}%`);
    
    // 6. Cross-asset correlation analysis
    const correlatedAssets = await this.analyzeCorrelatedAssets(asset, factors);
    
    // 7. ILP corridor intelligence
    const corridorSignals = this.analyzeCorridorIntelligence();
    if (asset === 'XRP') {
      reasoning.push(`ODL activity score: ${corridorSignals.odlActivityScore}`);
    }
    
    // 8. Risk metrics calculation
    const risk = this.calculateRiskMetrics(priceHistory, currentPrice);
    
    // 9. Composite score calculation
    const compositeScore = this.calculateCompositeScore(
      contributions, timeframeAlignment, corridorSignals, risk
    );
    
    // 10. Determine action
    const { action, confidence } = this.determineAction(compositeScore, risk, regime);
    reasoning.push(`Final signal: ${action} (score: ${compositeScore.toFixed(1)}, confidence: ${confidence}%)`);
    
    // 11. Data quality assessment
    const dataQuality = this.assessDataQuality(priceHistory, externalData);
    
    const processingTime = performance.now() - startTime;
    reasoning.push(`Signal generated in ${processingTime.toFixed(0)}ms`);
    
    const signal: MultiDimensionalSignal = {
      id: `sig_${asset}_${Date.now()}`,
      timestamp: Date.now(),
      asset,
      compositeScore,
      confidence,
      action,
      factors,
      factorContributions: contributions,
      timeframes,
      timeframeAlignment,
      correlatedAssets,
      sectorExposure: this.calculateSectorExposure(correlatedAssets),
      risk,
      corridorSignals,
      reasoning,
      dataQuality,
    };
    
    // Store in history for pattern analysis
    this.signalHistory.push(signal);
    if (this.signalHistory.length > 1000) {
      this.signalHistory = this.signalHistory.slice(-500);
    }
    
    return signal;
  }
  
  // ==================== FACTOR CALCULATION ====================
  
  private async calculateFactorExposures(
    asset: string,
    currentPrice: number,
    priceHistory: number[],
    externalData?: any
  ): Promise<FactorExposure> {
    // Momentum factor: multiple lookback periods
    const momentum = this.calculateMomentumFactor(priceHistory);
    
    // Liquidity factor: volume relative to market cap
    const liquidity = this.calculateLiquidityFactor(
      externalData?.volume24h,
      externalData?.marketCap
    );
    
    // Sentiment factor: external sentiment data or simulated
    const sentiment = this.calculateSentimentFactor(externalData?.sentiment);
    
    // On-chain factor: XRPL-specific metrics
    const onChain = await this.calculateOnChainFactor(asset, externalData?.xrplMetrics);
    
    // Macro factor: overall market risk appetite
    const macro = this.calculateMacroFactor(priceHistory);
    
    // Corridor flow factor: ILP payment corridor activity
    const corridorFlow = this.calculateCorridorFlowFactor(asset);
    
    // Volatility factor: realized volatility percentile
    const volatility = this.calculateVolatilityFactor(priceHistory);
    
    // Value factor: price relative to fundamental metrics
    const valueScore = this.calculateValueFactor(currentPrice, externalData);
    
    return {
      momentum,
      liquidity,
      sentiment,
      onChain,
      macro,
      corridorFlow,
      volatility,
      valueScore,
    };
  }
  
  private calculateMomentumFactor(prices: number[]): number {
    if (prices.length < 20) return 0;
    
    // Multi-period momentum
    const periods = [5, 10, 20];
    let totalMomentum = 0;
    const weights = [0.5, 0.3, 0.2];
    
    periods.forEach((period, i) => {
      if (prices.length >= period) {
        const oldPrice = prices[prices.length - period];
        const currentPrice = prices[prices.length - 1];
        const momentum = (currentPrice - oldPrice) / oldPrice;
        totalMomentum += momentum * weights[i];
      }
    });
    
    // Normalize to -1 to 1
    return Math.max(-1, Math.min(1, totalMomentum * 5));
  }
  
  private calculateLiquidityFactor(volume?: number, marketCap?: number): number {
    if (!volume || !marketCap) return 0.5;
    
    const turnover = volume / marketCap;
    // High turnover = high liquidity
    // Normalize: 0.1 turnover = 0.5, 0.3+ = 1.0, 0.01 = 0
    return Math.min(1, Math.max(0, (turnover - 0.01) / 0.29));
  }
  
  private calculateSentimentFactor(sentiment?: number): number {
    if (sentiment === undefined) {
      // Simulate if not provided
      return (Math.random() - 0.5) * 0.6;
    }
    // Convert 0-100 scale to -1 to 1
    return (sentiment - 50) / 50;
  }
  
  private async calculateOnChainFactor(asset: string, xrplMetrics?: any): Promise<number> {
    if (asset !== 'XRP' && asset !== 'XLM') {
      // For non-payment coins, use simulated on-chain activity
      return (Math.random() - 0.5) * 0.4;
    }
    
    // For XRP, analyze XRPL-specific metrics
    if (xrplMetrics) {
      const txActivity = (xrplMetrics.txPerSecond || 15) / 30; // Normalized
      const accountGrowth = 0.5; // Would be calculated from data
      return Math.min(1, Math.max(-1, (txActivity + accountGrowth - 1)));
    }
    
    // Use AMM incentive analysis as proxy
    const ammAnalysis = analyzeAMMIncentives(
      { xrpReserve: 1000000, tokenReserve: 500000, totalLPTokens: 100000 },
      0.003
    );
    
    return ammAnalysis.equilibriumAnalysis.stabilityScore / 100 - 0.5;
  }
  
  private calculateMacroFactor(priceHistory: number[]): number {
    // Simplified: use BTC proxy behavior from price correlation
    // In production, would integrate Fed rates, DXY, VIX, etc.
    
    if (priceHistory.length < 30) return 0;
    
    // Calculate 30-day trend as macro proxy
    const oldPrice = priceHistory[priceHistory.length - 30];
    const currentPrice = priceHistory[priceHistory.length - 1];
    const trend = (currentPrice - oldPrice) / oldPrice;
    
    // Risk-on = positive, risk-off = negative
    return Math.max(-1, Math.min(1, trend * 3));
  }
  
  private calculateCorridorFlowFactor(asset: string): number {
    if (asset !== 'XRP') return 0;
    
    // Analyze ILP corridor activity
    const xrplCorridors = ilpCorridors.filter(c => c.xrplBacked);
    const highVolumeCount = xrplCorridors.filter(c => c.volume === 'high').length;
    const activeConnectors = ilpConnectorInstances.filter(c => c.status === 'online').length;
    
    // Normalize: more active corridors = positive flow
    const corridorScore = highVolumeCount / Math.max(1, xrplCorridors.length);
    const connectorScore = activeConnectors / Math.max(1, ilpConnectorInstances.length);
    
    return (corridorScore + connectorScore) - 1; // Center around 0
  }
  
  private calculateVolatilityFactor(prices: number[]): number {
    if (prices.length < 10) return 0.5;
    
    // Calculate realized volatility
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    // Normalize: 0.5 vol = 0.5, 1.0+ vol = 1.0
    return Math.min(1, volatility);
  }
  
  private calculateValueFactor(currentPrice: number, externalData?: any): number {
    if (!externalData?.marketCap) return 0;
    
    // Simple value metric: market cap relative to volume
    // Low market cap / high volume = potential value
    const mcToVolume = externalData.marketCap / (externalData.volume24h || 1);
    
    // Invert and normalize (lower ratio = better value)
    const valueScore = 1 - Math.min(1, mcToVolume / 100);
    return (valueScore - 0.5) * 2; // Scale to -1 to 1
  }
  
  // ==================== SIGNAL COMPOSITION ====================
  
  private calculateFactorContributions(
    factors: FactorExposure,
    weights: FactorExposure
  ): Record<keyof FactorExposure, number> {
    const contributions: Record<keyof FactorExposure, number> = {} as any;
    
    for (const factor of Object.keys(factors) as Array<keyof FactorExposure>) {
      contributions[factor] = factors[factor] * weights[factor] * 100;
    }
    
    return contributions;
  }
  
  private analyzeMultipleTimeframes(prices: number[]): MultiDimensionalSignal['timeframes'] {
    // Simulate different timeframe signals based on price history
    const len = prices.length;
    
    const calculateSignal = (lookback: number): number => {
      if (len < lookback) return 0;
      const slice = prices.slice(-lookback);
      const momentum = (slice[slice.length - 1] - slice[0]) / slice[0];
      return Math.max(-100, Math.min(100, momentum * 500));
    };
    
    return {
      m5: calculateSignal(5),
      m15: calculateSignal(15),
      h1: calculateSignal(24),   // ~1 hour of 2.5-min candles
      h4: calculateSignal(96),   // ~4 hours
      d1: calculateSignal(288),  // ~1 day
    };
  }
  
  private calculateTimeframeAlignment(timeframes: MultiDimensionalSignal['timeframes']): number {
    const signals = Object.values(timeframes);
    const allPositive = signals.every(s => s > 0);
    const allNegative = signals.every(s => s < 0);
    
    if (allPositive || allNegative) return 100;
    
    // Calculate alignment as correlation of directions
    const positiveCount = signals.filter(s => s > 0).length;
    const alignment = Math.abs(positiveCount - 2.5) / 2.5; // 0 = mixed, 1 = aligned
    
    return Math.round(alignment * 100);
  }
  
  private async analyzeCorrelatedAssets(
    asset: string,
    factors: FactorExposure
  ): Promise<MultiDimensionalSignal['correlatedAssets']> {
    const correlations = BASE_CORRELATIONS[asset] || {};
    
    return Object.entries(correlations).map(([corAsset, correlation]) => ({
      asset: corAsset,
      correlation,
      signal: factors.momentum * correlation * 50, // Propagate momentum signal
    }));
  }
  
  private calculateSectorExposure(
    correlatedAssets: MultiDimensionalSignal['correlatedAssets']
  ): Record<string, number> {
    const exposure: Record<string, number> = {};
    
    correlatedAssets.forEach(({ asset, correlation }) => {
      const sector = ASSET_SECTORS[asset] || 'other';
      exposure[sector] = (exposure[sector] || 0) + correlation;
    });
    
    return exposure;
  }
  
  // ==================== RISK METRICS ====================
  
  private calculateRiskMetrics(
    priceHistory: number[],
    currentPrice: number
  ): MultiDimensionalSignal['risk'] {
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < priceHistory.length; i++) {
      returns.push((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]);
    }
    
    if (returns.length < 10) {
      return {
        valueAtRisk95: 5,
        expectedShortfall: 7,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 10,
        beta: 1,
      };
    }
    
    // Sort returns for VaR calculation
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(returns.length * 0.05);
    const valueAtRisk95 = Math.abs(sortedReturns[var95Index] * 100);
    
    // Expected Shortfall (average of worst 5%)
    const worstReturns = sortedReturns.slice(0, var95Index + 1);
    const expectedShortfall = Math.abs(
      worstReturns.reduce((a, b) => a + b, 0) / worstReturns.length * 100
    );
    
    // Sharpe Ratio (assuming 0 risk-free rate for simplicity)
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;
    
    // Sortino Ratio (only downside deviation)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideStdDev = negativeReturns.length > 0
      ? Math.sqrt(negativeReturns.reduce((a, b) => a + b * b, 0) / negativeReturns.length)
      : stdDev;
    const sortinoRatio = downsideStdDev > 0 ? (meanReturn / downsideStdDev) * Math.sqrt(252) : 0;
    
    // Max Drawdown
    let maxDrawdown = 0;
    let peak = priceHistory[0];
    for (const price of priceHistory) {
      if (price > peak) peak = price;
      const drawdown = (peak - price) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return {
      valueAtRisk95: Math.round(valueAtRisk95 * 100) / 100,
      expectedShortfall: Math.round(expectedShortfall * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
      beta: 1 + (Math.random() - 0.5) * 0.4, // Simplified
    };
  }
  
  // ==================== ILP CORRIDOR INTELLIGENCE ====================
  
  private analyzeCorridorIntelligence(): CorridorIntelligence {
    const stats = getILPStats();
    const xrplCorridors = ilpCorridors.filter(c => c.xrplBacked);
    const activeConnectors = ilpConnectorInstances.filter(c => c.status === 'online');
    
    // Analyze flow patterns
    const highVolumeCorridors = xrplCorridors.filter(c => c.volume === 'high');
    const flowStrength = (highVolumeCorridors.length / Math.max(1, xrplCorridors.length)) * 100;
    
    // Determine flow direction (simplified - would use real-time data)
    const flowDirection: 'inflow' | 'outflow' | 'balanced' = 
      flowStrength > 60 ? 'inflow' : flowStrength < 40 ? 'outflow' : 'balanced';
    
    const topCorridors = highVolumeCorridors.slice(0, 3).map(c => ({
      name: c.name,
      volume: c.monthlyVolume || 'N/A',
      trend: 'stable' as const, // Would be calculated from historical data
    }));
    
    // XRPL network utilization
    const xrplUtilization = Math.min(100, 50 + (stats.xrplBackedCorridors / stats.corridors) * 50);
    
    // Connector health
    const connectorHealth = (activeConnectors.length / stats.totalConnectors) * 100;
    
    // ODL activity score (On-Demand Liquidity)
    const odlActivityScore = Math.round(
      (flowStrength * 0.4 + xrplUtilization * 0.3 + connectorHealth * 0.3)
    );
    
    return {
      activeCorridors: xrplCorridors.length,
      flowDirection,
      flowStrength,
      topCorridors,
      xrplUtilization,
      connectorHealth,
      odlActivityScore,
    };
  }
  
  // ==================== COMPOSITE SIGNAL ====================
  
  private calculateCompositeScore(
    contributions: Record<keyof FactorExposure, number>,
    timeframeAlignment: number,
    corridorSignals: CorridorIntelligence,
    risk: MultiDimensionalSignal['risk']
  ): number {
    // Sum factor contributions
    let rawScore = Object.values(contributions).reduce((a, b) => a + b, 0);
    
    // Boost/penalty for timeframe alignment
    const alignmentMultiplier = 0.5 + (timeframeAlignment / 100) * 0.5;
    rawScore *= alignmentMultiplier;
    
    // Corridor flow bonus for XRP-related signals
    const corridorBonus = (corridorSignals.odlActivityScore - 50) * 0.1;
    rawScore += corridorBonus;
    
    // Risk adjustment (penalize high-risk signals)
    const riskPenalty = risk.valueAtRisk95 > 10 ? -5 : 0;
    rawScore += riskPenalty;
    
    // Normalize to -100 to 100
    return Math.max(-100, Math.min(100, rawScore));
  }
  
  private determineAction(
    score: number,
    risk: MultiDimensionalSignal['risk'],
    regime: MarketRegime
  ): { action: MultiDimensionalSignal['action']; confidence: number } {
    // Adjust thresholds based on regime
    const regimeAdjustment = regime.regime === 'crisis' ? -10 : 
                            regime.regime === 'euphoria' ? 10 : 0;
    
    const adjustedScore = score + regimeAdjustment;
    
    let action: MultiDimensionalSignal['action'];
    let confidence: number;
    
    if (adjustedScore > 50) {
      action = 'strong_buy';
      confidence = Math.min(95, 60 + adjustedScore * 0.4);
    } else if (adjustedScore > 20) {
      action = 'buy';
      confidence = Math.min(85, 50 + adjustedScore * 0.5);
    } else if (adjustedScore > -20) {
      action = 'hold';
      confidence = Math.min(75, 40 + Math.abs(adjustedScore) * 0.3);
    } else if (adjustedScore > -50) {
      action = 'sell';
      confidence = Math.min(85, 50 + Math.abs(adjustedScore) * 0.5);
    } else {
      action = 'strong_sell';
      confidence = Math.min(95, 60 + Math.abs(adjustedScore) * 0.4);
    }
    
    // Risk adjustment to confidence
    if (risk.valueAtRisk95 > 15) confidence *= 0.8;
    if (risk.sharpeRatio < 0) confidence *= 0.9;
    
    return { action, confidence: Math.round(confidence) };
  }
  
  // ==================== MARKET REGIME DETECTION ====================
  
  async detectMarketRegime(): Promise<MarketRegime> {
    // Use quantum Monte Carlo for regime probabilities
    const regimeProbabilities = quantumMonteCarlo(
      () => {
        // Simulate regime based on market indicators
        const r = Math.random();
        if (r < 0.1) return 0;      // Crisis
        if (r < 0.25) return 1;     // Risk-off
        if (r < 0.65) return 2;     // Neutral
        if (r < 0.85) return 3;     // Risk-on
        return 4;                   // Euphoria
      },
      1000
    );
    
    const regimes: MarketRegime['regime'][] = ['crisis', 'risk_off', 'neutral', 'risk_on', 'euphoria'];
    const regimeIndex = Math.round(regimeProbabilities.mean);
    const regime = regimes[Math.max(0, Math.min(4, regimeIndex))];
    
    const characteristics: Record<MarketRegime['regime'], string[]> = {
      crisis: ['High volatility', 'Flight to safety', 'Correlation spike', 'Liquidity crunch'],
      risk_off: ['Defensive positioning', 'Quality preference', 'Low beta outperforms'],
      neutral: ['Normal correlations', 'Balanced flows', 'Stock picking matters'],
      risk_on: ['Risk appetite high', 'Momentum works', 'High beta outperforms'],
      euphoria: ['Extreme optimism', 'Low VIX', 'Meme coins surge', 'Leverage increasing'],
    };
    
    const strategies: Record<MarketRegime['regime'], string> = {
      crisis: 'Reduce exposure, increase cash, hedge positions',
      risk_off: 'Favor large caps, reduce leverage, quality over growth',
      neutral: 'Balanced portfolio, factor diversification',
      risk_on: 'Increase exposure, momentum following, sector rotation',
      euphoria: 'Take profits, reduce leverage, prepare for reversal',
    };
    
    return {
      regime,
      confidence: Math.round(70 + regimeProbabilities.confidence95[1] * 10),
      characteristics: characteristics[regime],
      recommendedStrategy: strategies[regime],
      factorRotation: REGIME_FACTOR_WEIGHTS[regime],
    };
  }
  
  // ==================== PORTFOLIO OPTIMIZATION ====================
  
  optimizePortfolio(
    assets: string[],
    currentWeights: Record<string, number>,
    signals: MultiDimensionalSignal[],
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): PortfolioOptimization {
    const riskMultipliers = { conservative: 0.5, moderate: 1.0, aggressive: 1.5 };
    const riskMult = riskMultipliers[riskTolerance];
    
    // Target weights based on signals
    const targetWeights: Record<string, number> = {};
    let totalPositive = 0;
    
    // Calculate raw weights from signals
    signals.forEach(signal => {
      const weight = Math.max(0, (signal.compositeScore + 50) / 100) * riskMult;
      targetWeights[signal.asset] = weight;
      totalPositive += weight;
    });
    
    // Normalize to sum to 1 (with cash buffer)
    const cashBuffer = riskTolerance === 'conservative' ? 0.3 : 
                       riskTolerance === 'moderate' ? 0.15 : 0.05;
    const investableWeight = 1 - cashBuffer;
    
    Object.keys(targetWeights).forEach(asset => {
      targetWeights[asset] = (targetWeights[asset] / totalPositive) * investableWeight;
    });
    targetWeights['CASH'] = cashBuffer;
    
    // Calculate expected return and risk
    const expectedReturn = signals.reduce((sum, s) => {
      const weight = targetWeights[s.asset] || 0;
      return sum + weight * (s.compositeScore / 100) * 0.2; // Simplified return expectation
    }, 0);
    
    const portfolioRisk = signals.reduce((sum, s) => {
      const weight = targetWeights[s.asset] || 0;
      return sum + weight * s.risk.valueAtRisk95;
    }, 0);
    
    // Rebalance actions
    const rebalanceActions = assets.map(asset => {
      const current = currentWeights[asset] || 0;
      const target = targetWeights[asset] || 0;
      const diff = target - current;
      
      return {
        asset,
        currentWeight: current,
        targetWeight: target,
        action: diff > 0.02 ? 'buy' as const : diff < -0.02 ? 'sell' as const : 'hold' as const,
        urgency: Math.abs(diff) > 0.1 ? 'high' as const : 
                 Math.abs(diff) > 0.05 ? 'medium' as const : 'low' as const,
      };
    });
    
    return {
      targetWeights,
      expectedReturn: Math.round(expectedReturn * 10000) / 100,
      portfolioRisk: Math.round(portfolioRisk * 100) / 100,
      sharpeRatio: portfolioRisk > 0 ? Math.round((expectedReturn / portfolioRisk) * 100) / 100 : 0,
      diversificationRatio: Math.round((1 - Math.max(...Object.values(targetWeights))) * 100) / 100,
      factorTilts: this.calculatePortfolioFactorTilts(signals, targetWeights),
      rebalanceActions,
    };
  }
  
  private calculatePortfolioFactorTilts(
    signals: MultiDimensionalSignal[],
    weights: Record<string, number>
  ): FactorExposure {
    const tilts: FactorExposure = {
      momentum: 0, liquidity: 0, sentiment: 0, onChain: 0,
      macro: 0, corridorFlow: 0, volatility: 0, valueScore: 0,
    };
    
    signals.forEach(signal => {
      const weight = weights[signal.asset] || 0;
      Object.keys(tilts).forEach(factor => {
        tilts[factor as keyof FactorExposure] += 
          signal.factors[factor as keyof FactorExposure] * weight;
      });
    });
    
    return tilts;
  }
  
  // ==================== DATA QUALITY ====================
  
  private assessDataQuality(priceHistory: number[], externalData?: any): number {
    let quality = 50;
    
    // Price history completeness
    if (priceHistory.length >= 100) quality += 20;
    else if (priceHistory.length >= 50) quality += 10;
    
    // External data availability
    if (externalData?.sentiment !== undefined) quality += 10;
    if (externalData?.volume24h) quality += 10;
    if (externalData?.xrplMetrics) quality += 10;
    
    return Math.min(100, quality);
  }
  
  // ==================== CROSS-SECTOR ANALYSIS ====================
  
  analyzeCrossSectors(signals: MultiDimensionalSignal[]): CrossSectorAnalysis {
    const sectorData: Record<string, { momentum: number[]; assets: string[] }> = {};
    
    // Group signals by sector
    signals.forEach(signal => {
      const sector = ASSET_SECTORS[signal.asset] || 'other';
      if (!sectorData[sector]) {
        sectorData[sector] = { momentum: [], assets: [] };
      }
      sectorData[sector].momentum.push(signal.factors.momentum);
      sectorData[sector].assets.push(signal.asset);
    });
    
    // Calculate sector metrics
    const sectors = Object.entries(sectorData).map(([name, data]) => ({
      name,
      momentum: data.momentum.reduce((a, b) => a + b, 0) / data.momentum.length,
      relativeStrength: Math.random() * 100, // Would be calculated vs benchmark
      topAssets: data.assets.slice(0, 3),
    }));
    
    // Sort by momentum
    sectors.sort((a, b) => b.momentum - a.momentum);
    
    // Determine leading indicators
    const leadingIndicators = sectors
      .filter(s => s.momentum > 0.2)
      .map(s => s.name);
    
    // Sector rotation signal
    const topSector = sectors[0];
    const sectorRotationSignal = topSector.momentum > 0.3 
      ? `Rotate into ${topSector.name} sector`
      : 'Maintain current sector allocation';
    
    return {
      sectors,
      leadingIndicators,
      sectorRotationSignal,
    };
  }

  // ==================== UNIFIED ANALYTICS INTEGRATION ====================
  
  /**
   * Generate enhanced signal using ALL data sources via Unified Analytics
   * This is the most comprehensive signal generation, pulling from:
   * - Payment corridors, ODL flows
   * - Regulatory intelligence
   * - XRPL ecosystem health
   * - Network metrics
   * - Sentiment analysis
   * - Technical screener
   * - Prediction markets
   * - Game theory insights
   */
  async generateEnhancedSignal(
    asset: string,
    currentPrice: number,
    priceHistory: number[]
  ): Promise<MultiDimensionalSignal & { unifiedIntelligence: UnifiedMarketIntelligence }> {
    // Get unified market intelligence
    const intelligence = await getUnifiedMarketIntelligence();
    
    // Generate base signal
    const baseSignal = await this.generateSignal(asset, currentPrice, priceHistory, {
      sentiment: intelligence.sentimentAnalysis.sentimentSources.social,
      volume24h: intelligence.technicalSignals.marketLeaders[0]?.moonScore * 1000000 || 5000000000,
      xrplMetrics: {
        txPerSecond: intelligence.networkMetrics.txPerSecond,
        ledgerIndex: intelligence.networkMetrics.ledgerIndex
      }
    });
    
    // Enhance factors with unified data
    const enhancedFactors = { ...baseSignal.factors };
    
    // Corridor flow factor from unified analytics
    if (asset === 'XRP') {
      enhancedFactors.corridorFlow = intelligence.corridorAnalysis.corridorFlowIndex / 100;
    }
    
    // Adjust sentiment with unified sources
    const unifiedSentiment = (
      intelligence.sentimentAnalysis.sentimentSources.social * 0.3 +
      intelligence.sentimentAnalysis.sentimentSources.news * 0.2 +
      intelligence.sentimentAnalysis.sentimentSources.onChain * 0.3 +
      intelligence.sentimentAnalysis.sentimentSources.prediction * 0.2
    ) / 100;
    enhancedFactors.sentiment = (unifiedSentiment - 0.5) * 2;
    
    // Add regulatory impact
    enhancedFactors.macro = (enhancedFactors.macro + 
      (intelligence.regulatoryClimate.xrplImpactScore - 50) / 100) / 2;
    
    // Recalculate composite score with enhanced factors
    const weights = REGIME_FACTOR_WEIGHTS[this.currentRegime?.regime || 'neutral'];
    const contributions = this.calculateFactorContributions(enhancedFactors, weights);
    
    // Add unified intelligence signal to composite
    let enhancedComposite = baseSignal.compositeScore;
    
    // Weight from unified aggregated signal
    const unifiedSignalValue = intelligence.aggregatedSignal.direction === 'strong_buy' ? 30 :
                               intelligence.aggregatedSignal.direction === 'buy' ? 15 :
                               intelligence.aggregatedSignal.direction === 'hold' ? 0 :
                               intelligence.aggregatedSignal.direction === 'sell' ? -15 : -30;
    
    enhancedComposite = (enhancedComposite * 0.6) + (unifiedSignalValue * intelligence.aggregatedSignal.confidence / 100 * 0.4);
    
    // Update reasoning
    const enhancedReasoning = [
      ...baseSignal.reasoning,
      `Unified Intelligence: ${intelligence.aggregatedSignal.direction} (${intelligence.aggregatedSignal.confidence}% confidence)`,
      `Primary Drivers: ${intelligence.aggregatedSignal.primaryDrivers.join(', ')}`,
      `Corridor Flow Index: ${intelligence.corridorAnalysis.corridorFlowIndex > 0 ? '+' : ''}${intelligence.corridorAnalysis.corridorFlowIndex}`,
      `Regulatory Climate: ${intelligence.regulatoryClimate.globalScore}/100`,
      `Network Health: ${intelligence.networkMetrics.networkHealth}`,
      `Data Quality: ${intelligence.dataQuality}%`
    ];
    
    // Determine enhanced action
    const { action: enhancedAction, confidence: enhancedConfidence } = this.determineAction(
      enhancedComposite,
      baseSignal.risk,
      this.currentRegime || await this.detectMarketRegime()
    );
    
    return {
      ...baseSignal,
      factors: enhancedFactors,
      factorContributions: contributions,
      compositeScore: enhancedComposite,
      action: enhancedAction,
      confidence: enhancedConfidence,
      reasoning: enhancedReasoning,
      dataQuality: intelligence.dataQuality,
      unifiedIntelligence: intelligence
    };
  }
  
  /**
   * Get comprehensive market overview from all data sources
   */
  async getMarketOverview(): Promise<{
    regime: MarketRegime;
    intelligence: UnifiedMarketIntelligence;
    topOpportunities: Array<{ asset: string; score: number; reason: string }>;
    riskAlerts: string[];
  }> {
    const [regime, intelligence] = await Promise.all([
      this.detectMarketRegime(),
      getUnifiedMarketIntelligence()
    ]);
    
    // Identify top opportunities
    const topOpportunities = intelligence.technicalSignals.marketLeaders
      .filter(l => l.recommendation === 'strong_buy' || l.recommendation === 'buy')
      .map(l => ({
        asset: l.symbol,
        score: l.moonScore,
        reason: l.recommendation === 'strong_buy' ? 'Strong momentum + technicals' : 'Positive setup'
      }));
    
    // Risk alerts
    const riskAlerts: string[] = [];
    
    if (intelligence.technicalSignals.xrpVolatility > 70) {
      riskAlerts.push('High volatility detected - consider reducing position sizes');
    }
    if (intelligence.regulatoryClimate.riskJurisdictions.length > 5) {
      riskAlerts.push('Multiple jurisdictions showing regulatory concerns');
    }
    if (intelligence.sentimentAnalysis.whaleActivity.trend === 'distributing') {
      riskAlerts.push('Whale distribution detected - smart money may be selling');
    }
    if (regime.regime === 'crisis') {
      riskAlerts.push('CRISIS REGIME: Defensive positioning recommended');
    }
    if (intelligence.networkMetrics.networkHealth === 'degraded' || intelligence.networkMetrics.networkHealth === 'critical') {
      riskAlerts.push('XRPL network issues detected - monitor closely');
    }
    
    return {
      regime,
      intelligence,
      topOpportunities,
      riskAlerts
    };
  }
}

// ==================== SINGLETON INSTANCE ====================

export const quantEngine = new MultiDimensionalQuantEngine();

// ==================== CONVENIENCE FUNCTIONS ====================

export async function generateMultiDimensionalSignal(
  asset: string,
  currentPrice: number,
  priceHistory: number[],
  externalData?: any
): Promise<MultiDimensionalSignal> {
  return quantEngine.generateSignal(asset, currentPrice, priceHistory, externalData);
}

export async function getMarketRegime(): Promise<MarketRegime> {
  return quantEngine.detectMarketRegime();
}

export function optimizePortfolio(
  assets: string[],
  currentWeights: Record<string, number>,
  signals: MultiDimensionalSignal[],
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
): PortfolioOptimization {
  return quantEngine.optimizePortfolio(assets, currentWeights, signals, riskTolerance);
}

export default MultiDimensionalQuantEngine;
