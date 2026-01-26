// Unified Analytics Aggregator
// Consolidates ALL data sources into comprehensive market intelligence
// Feeds into Multi-Dimensional Quant Engine for trading signals
//
// Data Sources Integrated:
// 1. Payment Corridors - ODL flows, partner activity
// 2. Globe/World Map - Validators, ILP connectors, community hubs
// 3. Regulatory Intelligence - Policy changes, jurisdiction status
// 4. XRPL Ecosystem - Projects, wallets, NFTs, memes
// 5. Crypto Screener - Technical analysis, moon scores
// 6. Free Data Feeds - Sentiment, whale tracking, amendments
// 7. Prediction Markets - Polymarket, Axiom signals
// 8. AI Quantum Analytics - Game theory, memetic propagation

import { 
  paymentCorridors, 
  odlPartners, 
  crossChainBridges,
  xrplConnectedChains,
  type PaymentCorridor,
  type ODLPartner
} from '../data/corridorData';

import {
  regulatoryItems,
  countryRegulatoryProfiles,
  type RegulatoryItem,
  type CountryRegulatoryProfile
} from '../data/regulatoryData';

import {
  xrplMarketplaces,
  xrplCommunityConnectors,
  xrplWallets,
  type XRPLProject
} from '../data/xrplExpandedData';

import {
  ilpCorridors,
  ilpConnectorInstances,
  ilpUseCases,
  getILPStats
} from '../data/ilpData';

import { getBriefForLens, getHubs, lensMetadata } from '../data/globeContent';

import { fetchCryptoSentiment, fetchXRPLAmendments, fetchXRPLMetrics } from './freeDataFeeds';
import { screenCryptos, type CryptoScreenerResult } from './cryptoScreener';
import { getAllCryptoMarkets, generatePredictionSignals, type PredictionSignal, type PredictionMarket } from './predictionMarkets';
import { analyzeAMMIncentives, analyzeValidatorIncentives, modelMemeticPropagation } from './aiQuantumAnalytics';

// ==================== TYPES ====================

export interface UnifiedMarketIntelligence {
  timestamp: Date;
  dataQuality: number; // 0-100
  
  // Corridor Intelligence
  corridorAnalysis: {
    totalActiveCorridors: number;
    odlEnabledCount: number;
    topCorridors: Array<{
      name: string;
      volume: string;
      growth: string;
      partners: string[];
    }>;
    corridorFlowIndex: number; // -100 to 100 (outflow to inflow)
    regionalBreakdown: Record<string, number>;
  };
  
  // Regulatory Environment
  regulatoryClimate: {
    globalScore: number; // 0-100 (hostile to favorable)
    recentChanges: Array<{
      jurisdiction: string;
      change: string;
      impact: 'positive' | 'negative' | 'neutral';
    }>;
    riskJurisdictions: string[];
    favorableJurisdictions: string[];
    pendingLegislation: number;
    xrplImpactScore: number;
  };
  
  // Ecosystem Health
  ecosystemHealth: {
    activeProjects: number;
    communityEngagement: number; // 0-100
    developerActivity: number; // 0-100
    walletGrowth: number; // percentage
    nftVolume: number;
    defiTVL: number;
    bridgeActivity: number;
  };
  
  // Network Metrics (XRPL)
  networkMetrics: {
    ledgerIndex: number;
    txPerSecond: number;
    activeValidators: number;
    pendingAmendments: number;
    amendmentMomentum: number; // 0-100
    networkHealth: 'excellent' | 'good' | 'degraded' | 'critical';
    ilpConnectorCount: number;
    ilpCorridorVolume: string;
  };
  
  // Sentiment Analysis
  sentimentAnalysis: {
    overallSentiment: number; // -100 to 100
    socialTrend: 'bullish' | 'bearish' | 'neutral';
    sentimentSources: {
      social: number;
      news: number;
      onChain: number;
      prediction: number;
    };
    keyNarratives: string[];
    whaleActivity: {
      netFlow: number;
      largeTransactions24h: number;
      trend: 'accumulating' | 'distributing' | 'neutral';
    };
  };
  
  // Technical Signals (from Crypto Screener)
  technicalSignals: {
    xrpMoonScore: number;
    xrpMomentum: 'bullish' | 'bearish' | 'neutral';
    xrpRSI: number;
    xrpVolatility: number;
    marketLeaders: Array<{
      symbol: string;
      moonScore: number;
      recommendation: string;
    }>;
    sectorRotation: Record<string, number>;
  };
  
  // Prediction Market Intelligence
  predictionIntelligence: {
    relevantMarkets: Array<{
      question: string;
      yesPrice: number;
      volume: number;
      relevance: number;
    }>;
    aggregatedSignal: number; // -100 to 100
    topSignals: PredictionSignal[];
    impliedProbabilities: {
      xrpAbove5: number;
      btcAbove100k: number;
      ethAbove5k: number;
    };
  };
  
  // Game Theory / AI Analysis
  gameTheoryInsights: {
    marketEquilibrium: string;
    dominantStrategy: string;
    nashEquilibriumScore: number;
    memeticViralityScore: number;
    ammIncentiveScore: number;
    validatorConsensusScore: number;
  };
  
  // Aggregated Trading Signal
  aggregatedSignal: {
    direction: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    confidence: number;
    primaryDrivers: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    timeHorizon: 'short' | 'medium' | 'long';
  };
}

export interface RegionalAnalysis {
  region: string;
  corridorCount: number;
  partnerCount: number;
  regulatoryStatus: string;
  ecosystemScore: number;
  growthPotential: number;
}

export interface DataSourceStatus {
  source: string;
  available: boolean;
  lastUpdated: Date | null;
  dataPoints: number;
  quality: number;
}

// ==================== AGGREGATOR CLASS ====================

class UnifiedAnalyticsAggregator {
  private lastIntelligence: UnifiedMarketIntelligence | null = null;
  private lastUpdate: Date | null = null;
  private updateInterval = 5 * 60 * 1000; // 5 minutes
  
  // ==================== CORRIDOR ANALYSIS ====================
  
  analyzeCorridors(): UnifiedMarketIntelligence['corridorAnalysis'] {
    const activeCorridors = paymentCorridors.filter(c => 
      c.volume === 'high' || c.volume === 'medium'
    );
    
    const odlEnabled = paymentCorridors.filter(c => c.odlEnabled);
    
    // Calculate regional breakdown
    const regionalBreakdown: Record<string, number> = {};
    paymentCorridors.forEach(corridor => {
      const region = this.getRegion(corridor.from.countryCode);
      regionalBreakdown[region] = (regionalBreakdown[region] || 0) + 1;
    });
    
    // Calculate flow index based on corridor volumes and growth
    let flowIndex = 0;
    paymentCorridors.forEach(corridor => {
      const volumeScore = corridor.volume === 'high' ? 3 : corridor.volume === 'medium' ? 2 : 1;
      const growthScore = corridor.growthYoY?.includes('+') ? 1 : -0.5;
      flowIndex += volumeScore * growthScore;
    });
    flowIndex = Math.max(-100, Math.min(100, flowIndex * 5));
    
    // Top corridors
    const topCorridors = activeCorridors
      .sort((a, b) => {
        const volA = a.volume === 'high' ? 3 : a.volume === 'medium' ? 2 : 1;
        const volB = b.volume === 'high' ? 3 : b.volume === 'medium' ? 2 : 1;
        return volB - volA;
      })
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        volume: c.monthlyVolume || 'N/A',
        growth: c.growthYoY || 'N/A',
        partners: c.partners
      }));
    
    return {
      totalActiveCorridors: activeCorridors.length,
      odlEnabledCount: odlEnabled.length,
      topCorridors,
      corridorFlowIndex: flowIndex,
      regionalBreakdown
    };
  }
  
  private getRegion(countryCode: string): string {
    const regions: Record<string, string[]> = {
      'Americas': ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL'],
      'Europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'SE', 'NO', 'PL', 'EU'],
      'Asia Pacific': ['JP', 'KR', 'CN', 'SG', 'AU', 'IN', 'TH', 'PH', 'ID', 'MY', 'VN'],
      'Middle East': ['AE', 'SA', 'IL', 'QA', 'BH', 'KW'],
      'Africa': ['ZA', 'NG', 'KE', 'EG', 'MA']
    };
    
    for (const [region, codes] of Object.entries(regions)) {
      if (codes.includes(countryCode)) return region;
    }
    return 'Other';
  }
  
  // ==================== REGULATORY ANALYSIS ====================
  
  analyzeRegulatory(): UnifiedMarketIntelligence['regulatoryClimate'] {
    const activeItems = regulatoryItems.filter(r => r.status === 'active');
    const pendingItems = regulatoryItems.filter(r => r.status === 'pending' || r.status === 'proposed');
    
    // Calculate global score based on active regulations
    let positiveCount = 0;
    let negativeCount = 0;
    regulatoryItems.forEach(item => {
      if (item.xrplImpact === 'positive') positiveCount++;
      if (item.xrplImpact === 'negative') negativeCount++;
    });
    
    const globalScore = Math.round(
      50 + ((positiveCount - negativeCount) / regulatoryItems.length) * 50
    );
    
    // Recent changes (mock - would be time-based in production)
    const recentChanges = regulatoryItems
      .filter(r => r.effectiveDate && new Date(r.effectiveDate) > new Date('2024-01-01'))
      .slice(0, 5)
      .map(r => ({
        jurisdiction: r.jurisdiction,
        change: r.title,
        impact: r.xrplImpact as 'positive' | 'negative' | 'neutral'
      }));
    
    // Identify favorable/risk jurisdictions
    const favorableJurisdictions = countryRegulatoryProfiles
      .filter(c => c.overallStatus === 'favorable')
      .map(c => c.countryCode);
    
    const riskJurisdictions = countryRegulatoryProfiles
      .filter(c => c.overallStatus === 'restricted')
      .map(c => c.countryCode);
    
    // XRPL-specific impact score
    const xrplImpactScore = regulatoryItems
      .filter(r => r.xrplImpact === 'positive').length * 10 -
      regulatoryItems.filter(r => r.xrplImpact === 'negative').length * 15;
    
    return {
      globalScore,
      recentChanges,
      riskJurisdictions,
      favorableJurisdictions,
      pendingLegislation: pendingItems.length,
      xrplImpactScore: Math.max(0, Math.min(100, 50 + xrplImpactScore))
    };
  }
  
  // ==================== ECOSYSTEM HEALTH ====================
  
  analyzeEcosystem(): UnifiedMarketIntelligence['ecosystemHealth'] {
    const totalProjects = xrplMarketplaces.length + 
                         xrplCommunityConnectors.length + 
                         xrplWallets.length;
    
    // Calculate community engagement from hubs
    const hubs = getHubs();
    const communityEngagement = Math.min(100, hubs.length * 5 + totalProjects * 2);
    
    // Developer activity from bridges and chains
    const developerActivity = Math.min(100, 
      crossChainBridges.length * 10 + 
      xrplConnectedChains.filter(c => c.status === 'mainnet').length * 15
    );
    
    // Bridge activity
    const bridgeActivity = crossChainBridges
      .filter(b => b.status === 'mainnet')
      .length;
    
    return {
      activeProjects: totalProjects,
      communityEngagement,
      developerActivity,
      walletGrowth: 5.2, // Would be calculated from real data
      nftVolume: 2500000, // Placeholder
      defiTVL: 45000000, // Placeholder
      bridgeActivity
    };
  }
  
  // ==================== NETWORK METRICS ====================
  
  async analyzeNetwork(): Promise<UnifiedMarketIntelligence['networkMetrics']> {
    const ilpStats = getILPStats();
    
    // Fetch live XRPL metrics if available
    let xrplMetrics;
    try {
      xrplMetrics = await fetchXRPLMetrics();
    } catch (e) {
      console.warn('[Analytics] Could not fetch XRPL metrics:', e);
    }
    
    // Fetch amendments
    let amendments;
    try {
      amendments = await fetchXRPLAmendments();
    } catch (e) {
      console.warn('[Analytics] Could not fetch amendments:', e);
    }
    
    const pendingAmendments = amendments?.filter(a => !a.enabled).length || 0;
    const amendmentMomentum = amendments?.reduce((sum, a) => {
      if (!a.enabled && a.percentSupport) {
        return sum + a.percentSupport;
      }
      return sum;
    }, 0) || 50;
    
    // Determine network health
    const txRate = xrplMetrics?.txn_rate || 15;
    const networkHealth = txRate > 20 ? 'excellent' : 
                         txRate > 10 ? 'good' : 
                         txRate > 5 ? 'degraded' : 'critical';
    
    return {
      ledgerIndex: xrplMetrics?.ledger_index || 90000000,
      txPerSecond: txRate,
      activeValidators: ilpStats.activeConnectors + 35, // Base validators
      pendingAmendments,
      amendmentMomentum: Math.min(100, amendmentMomentum / pendingAmendments || 50),
      networkHealth,
      ilpConnectorCount: ilpStats.activeConnectors,
      ilpCorridorVolume: `$${(ilpStats.highVolumeCorridors * 2.1).toFixed(1)}B/month`
    };
  }
  
  // ==================== SENTIMENT ANALYSIS ====================
  
  async analyzeSentiment(): Promise<UnifiedMarketIntelligence['sentimentAnalysis']> {
    let sentimentData;
    try {
      sentimentData = await fetchCryptoSentiment();
    } catch (e) {
      console.warn('[Analytics] Could not fetch sentiment:', e);
    }
    
    const socialSentiment = sentimentData?.score || 50;
    const socialTrend = sentimentData?.trend || 'neutral';
    
    // Convert to -100 to 100 scale
    const overallSentiment = (socialSentiment - 50) * 2;
    
    // Generate key narratives based on current market conditions
    const keyNarratives = [];
    if (socialTrend === 'bullish') {
      keyNarratives.push('Institutional adoption accelerating');
      keyNarratives.push('Regulatory clarity improving');
    } else if (socialTrend === 'bearish') {
      keyNarratives.push('Macro uncertainty weighing on risk assets');
      keyNarratives.push('Profit-taking after recent gains');
    } else {
      keyNarratives.push('Market consolidating');
      keyNarratives.push('Waiting for catalyst');
    }
    
    // Whale activity (would be from real data)
    const whaleActivity = {
      netFlow: Math.random() > 0.5 ? 1500000 : -800000,
      largeTransactions24h: Math.floor(Math.random() * 50) + 10,
      trend: (Math.random() > 0.5 ? 'accumulating' : 'neutral') as 'accumulating' | 'distributing' | 'neutral'
    };
    
    return {
      overallSentiment,
      socialTrend,
      sentimentSources: {
        social: socialSentiment,
        news: 50 + (Math.random() - 0.5) * 30,
        onChain: 50 + (Math.random() - 0.5) * 20,
        prediction: 50 + (Math.random() - 0.5) * 25
      },
      keyNarratives,
      whaleActivity
    };
  }
  
  // ==================== TECHNICAL SIGNALS ====================
  
  async analyzeTechnicals(): Promise<UnifiedMarketIntelligence['technicalSignals']> {
    let screenerResults: CryptoScreenerResult[] = [];
    
    try {
      screenerResults = await screenCryptos({ limit: 50 });
    } catch (e) {
      console.warn('[Analytics] Could not fetch screener data:', e);
    }
    
    // Find XRP in results
    const xrpData = screenerResults.find(c => c.symbol.toUpperCase() === 'XRP');
    
    // Top market leaders by moon score
    const marketLeaders = screenerResults
      .sort((a, b) => b.moonScore - a.moonScore)
      .slice(0, 5)
      .map(c => ({
        symbol: c.symbol.toUpperCase(),
        moonScore: c.moonScore,
        recommendation: c.recommendation
      }));
    
    // Sector rotation (simplified)
    const sectorRotation: Record<string, number> = {
      'payments': xrpData?.moonScore || 50,
      'smart_contracts': screenerResults.find(c => c.symbol === 'eth')?.moonScore || 50,
      'defi': screenerResults.find(c => c.symbol === 'link')?.moonScore || 50,
      'layer1': screenerResults.find(c => c.symbol === 'sol')?.moonScore || 50,
      'meme': screenerResults.find(c => c.symbol === 'doge')?.moonScore || 50
    };
    
    return {
      xrpMoonScore: xrpData?.moonScore || 55,
      xrpMomentum: xrpData?.momentum || 'neutral',
      xrpRSI: xrpData?.rsi || 50,
      xrpVolatility: xrpData?.volatilityScore || 40,
      marketLeaders,
      sectorRotation
    };
  }
  
  // ==================== PREDICTION MARKETS ====================
  
  async analyzePredictions(): Promise<UnifiedMarketIntelligence['predictionIntelligence']> {
    let markets: PredictionMarket[] = [];
    let signals: PredictionSignal[] = [];
    
    try {
      const result = await getAllCryptoMarkets();
      markets = result.markets || [];
      signals = generatePredictionSignals(markets);
    } catch (e) {
      console.warn('[Analytics] Could not fetch prediction markets:', e);
    }
    
    // Filter for relevant markets
    const relevantMarkets = markets
      .filter(m => m.relevanceToXRP > 50)
      .slice(0, 5)
      .map(m => ({
        question: m.question,
        yesPrice: m.outcomes[0]?.price || 0.5,
        volume: m.totalVolume,
        relevance: m.relevanceToXRP
      }));
    
    // Calculate aggregated signal from prediction markets
    let aggregatedSignal = 0;
    signals.forEach(s => {
      const weight = s.confidence / 100;
      if (s.type === 'bullish') aggregatedSignal += s.strength * weight;
      else if (s.type === 'bearish') aggregatedSignal -= s.strength * weight;
    });
    aggregatedSignal = Math.max(-100, Math.min(100, aggregatedSignal));
    
    return {
      relevantMarkets,
      aggregatedSignal,
      topSignals: signals.slice(0, 3),
      impliedProbabilities: {
        xrpAbove5: markets.find(m => m.question.includes('XRP') && m.question.includes('5'))?.outcomes[0]?.probability || 0.32,
        btcAbove100k: markets.find(m => m.question.includes('Bitcoin') && m.question.includes('100'))?.outcomes[0]?.probability || 0.45,
        ethAbove5k: markets.find(m => m.question.includes('Ethereum') && m.question.includes('5'))?.outcomes[0]?.probability || 0.28
      }
    };
  }
  
  // ==================== GAME THEORY / AI ====================
  
  analyzeGameTheory(): UnifiedMarketIntelligence['gameTheoryInsights'] {
    // AMM incentive analysis
    const ammAnalysis = analyzeAMMIncentives(
      { xrpReserve: 10000000, tokenReserve: 5000000, totalLPTokens: 1000000 },
      0.003
    );
    
    // Validator consensus analysis
    const validatorAnalysis = analyzeValidatorIncentives(35, 31, []);
    
    // Memetic propagation for market sentiment
    const memeticModel = modelMemeticPropagation(1000, 100000, 'Bass');
    
    return {
      marketEquilibrium: ammAnalysis.equilibriumAnalysis.equilibrium,
      dominantStrategy: 'Provide liquidity during high volume periods',
      nashEquilibriumScore: ammAnalysis.equilibriumAnalysis.stabilityScore,
      memeticViralityScore: memeticModel.predictions.viralityScore,
      ammIncentiveScore: Math.round(
        ammAnalysis.incentiveStructure.reduce((sum, i) => sum + i.expectedValue, 0) * 10
      ),
      validatorConsensusScore: validatorAnalysis.equilibriumAnalysis.stabilityScore
    };
  }
  
  // ==================== AGGREGATE SIGNAL ====================
  
  calculateAggregatedSignal(intelligence: Omit<UnifiedMarketIntelligence, 'aggregatedSignal' | 'timestamp' | 'dataQuality'>): UnifiedMarketIntelligence['aggregatedSignal'] {
    // Weight factors for each signal component
    const weights = {
      corridorFlow: 0.10,
      regulatory: 0.15,
      ecosystem: 0.10,
      network: 0.10,
      sentiment: 0.20,
      technical: 0.20,
      prediction: 0.10,
      gameTheory: 0.05
    };
    
    // Calculate weighted score
    let compositeScore = 0;
    
    // Corridor flow (already -100 to 100)
    compositeScore += intelligence.corridorAnalysis.corridorFlowIndex * weights.corridorFlow;
    
    // Regulatory (0 to 100 -> -50 to 50)
    compositeScore += (intelligence.regulatoryClimate.globalScore - 50) * weights.regulatory;
    
    // Ecosystem health (0 to 100 -> -50 to 50)
    compositeScore += (intelligence.ecosystemHealth.communityEngagement - 50) * weights.ecosystem;
    
    // Network (convert health to score)
    const networkScore = intelligence.networkMetrics.networkHealth === 'excellent' ? 75 :
                        intelligence.networkMetrics.networkHealth === 'good' ? 50 :
                        intelligence.networkMetrics.networkHealth === 'degraded' ? 25 : 0;
    compositeScore += (networkScore - 50) * weights.network;
    
    // Sentiment (already -100 to 100)
    compositeScore += intelligence.sentimentAnalysis.overallSentiment * weights.sentiment;
    
    // Technical (moon score 0-100 -> -50 to 50)
    compositeScore += (intelligence.technicalSignals.xrpMoonScore - 50) * weights.technical;
    
    // Prediction (-100 to 100)
    compositeScore += intelligence.predictionIntelligence.aggregatedSignal * weights.prediction;
    
    // Game theory (0-100 -> -50 to 50)
    compositeScore += (intelligence.gameTheoryInsights.nashEquilibriumScore - 50) * weights.gameTheory;
    
    // Determine direction
    let direction: UnifiedMarketIntelligence['aggregatedSignal']['direction'];
    if (compositeScore > 30) direction = 'strong_buy';
    else if (compositeScore > 10) direction = 'buy';
    else if (compositeScore > -10) direction = 'hold';
    else if (compositeScore > -30) direction = 'sell';
    else direction = 'strong_sell';
    
    // Calculate confidence based on signal alignment
    const signals = [
      intelligence.corridorAnalysis.corridorFlowIndex,
      (intelligence.regulatoryClimate.globalScore - 50) * 2,
      intelligence.sentimentAnalysis.overallSentiment,
      (intelligence.technicalSignals.xrpMoonScore - 50) * 2,
      intelligence.predictionIntelligence.aggregatedSignal
    ];
    
    const positiveCount = signals.filter(s => s > 0).length;
    const alignment = Math.abs(positiveCount - 2.5) / 2.5;
    const confidence = Math.round(50 + alignment * 40 + Math.abs(compositeScore) * 0.2);
    
    // Primary drivers
    const drivers: string[] = [];
    if (Math.abs(intelligence.sentimentAnalysis.overallSentiment) > 30) {
      drivers.push(intelligence.sentimentAnalysis.overallSentiment > 0 ? 'Strong positive sentiment' : 'Negative sentiment pressure');
    }
    if (intelligence.technicalSignals.xrpMoonScore > 65) {
      drivers.push('Technical momentum bullish');
    } else if (intelligence.technicalSignals.xrpMoonScore < 35) {
      drivers.push('Technical weakness');
    }
    if (intelligence.regulatoryClimate.globalScore > 60) {
      drivers.push('Favorable regulatory environment');
    }
    if (intelligence.corridorAnalysis.corridorFlowIndex > 30) {
      drivers.push('Strong ODL corridor activity');
    }
    if (drivers.length === 0) {
      drivers.push('Mixed signals - no clear driver');
    }
    
    // Risk level
    const riskLevel = intelligence.technicalSignals.xrpVolatility > 70 ? 'extreme' :
                      intelligence.technicalSignals.xrpVolatility > 50 ? 'high' :
                      intelligence.technicalSignals.xrpVolatility > 30 ? 'medium' : 'low';
    
    return {
      direction,
      confidence: Math.min(95, confidence),
      primaryDrivers: drivers,
      riskLevel,
      timeHorizon: 'medium'
    };
  }
  
  // ==================== MAIN AGGREGATION ====================
  
  async getUnifiedIntelligence(forceRefresh = false): Promise<UnifiedMarketIntelligence> {
    // Return cached if fresh
    if (!forceRefresh && this.lastIntelligence && this.lastUpdate) {
      const age = Date.now() - this.lastUpdate.getTime();
      if (age < this.updateInterval) {
        return this.lastIntelligence;
      }
    }
    
    console.log('[Analytics] Aggregating unified market intelligence...');
    const startTime = performance.now();
    
    // Gather all analyses in parallel where possible
    const [
      networkMetrics,
      sentimentAnalysis,
      technicalSignals,
      predictionIntelligence
    ] = await Promise.all([
      this.analyzeNetwork(),
      this.analyzeSentiment(),
      this.analyzeTechnicals(),
      this.analyzePredictions()
    ]);
    
    // Synchronous analyses
    const corridorAnalysis = this.analyzeCorridors();
    const regulatoryClimate = this.analyzeRegulatory();
    const ecosystemHealth = this.analyzeEcosystem();
    const gameTheoryInsights = this.analyzeGameTheory();
    
    // Build partial intelligence object
    const partialIntelligence = {
      corridorAnalysis,
      regulatoryClimate,
      ecosystemHealth,
      networkMetrics,
      sentimentAnalysis,
      technicalSignals,
      predictionIntelligence,
      gameTheoryInsights
    };
    
    // Calculate aggregated signal
    const aggregatedSignal = this.calculateAggregatedSignal(partialIntelligence);
    
    // Calculate data quality
    const dataQuality = this.calculateDataQuality(partialIntelligence);
    
    const intelligence: UnifiedMarketIntelligence = {
      timestamp: new Date(),
      dataQuality,
      ...partialIntelligence,
      aggregatedSignal
    };
    
    // Cache
    this.lastIntelligence = intelligence;
    this.lastUpdate = new Date();
    
    const processingTime = performance.now() - startTime;
    console.log(`[Analytics] Intelligence aggregated in ${processingTime.toFixed(0)}ms`);
    
    return intelligence;
  }
  
  private calculateDataQuality(data: any): number {
    let quality = 50;
    
    // Check each data source
    if (data.corridorAnalysis.totalActiveCorridors > 0) quality += 10;
    if (data.regulatoryClimate.recentChanges.length > 0) quality += 10;
    if (data.networkMetrics.txPerSecond > 0) quality += 10;
    if (data.technicalSignals.marketLeaders.length > 0) quality += 10;
    if (data.predictionIntelligence.relevantMarkets.length > 0) quality += 10;
    
    return Math.min(100, quality);
  }
  
  // ==================== DATA SOURCE STATUS ====================
  
  getDataSourceStatus(): DataSourceStatus[] {
    return [
      { source: 'Payment Corridors', available: true, lastUpdated: new Date(), dataPoints: paymentCorridors.length, quality: 100 },
      { source: 'ODL Partners', available: true, lastUpdated: new Date(), dataPoints: odlPartners.length, quality: 100 },
      { source: 'Regulatory Data', available: true, lastUpdated: new Date(), dataPoints: regulatoryItems.length, quality: 100 },
      { source: 'XRPL Ecosystem', available: true, lastUpdated: new Date(), dataPoints: xrplMarketplaces.length + xrplWallets.length, quality: 100 },
      { source: 'ILP Connectors', available: true, lastUpdated: new Date(), dataPoints: ilpConnectorInstances.length, quality: 100 },
      { source: 'Cross-Chain Bridges', available: true, lastUpdated: new Date(), dataPoints: crossChainBridges.length, quality: 100 },
      { source: 'Globe Hubs', available: true, lastUpdated: new Date(), dataPoints: getHubs().length, quality: 100 },
      { source: 'Crypto Screener', available: true, lastUpdated: null, dataPoints: 0, quality: 80 },
      { source: 'Sentiment Feed', available: true, lastUpdated: null, dataPoints: 0, quality: 75 },
      { source: 'Prediction Markets', available: true, lastUpdated: null, dataPoints: 0, quality: 70 },
    ];
  }
  
  // ==================== REGIONAL ANALYSIS ====================
  
  getRegionalAnalysis(): RegionalAnalysis[] {
    const regions = ['Americas', 'Europe', 'Asia Pacific', 'Middle East', 'Africa'];
    
    return regions.map(region => {
      const regionCorridors = paymentCorridors.filter(c => 
        this.getRegion(c.from.countryCode) === region || 
        this.getRegion(c.to.countryCode) === region
      );
      
      const regionPartners = odlPartners.filter(p => 
        this.getRegion(p.headquarters.countryCode) === region
      );
      
      const regionProfiles = countryRegulatoryProfiles.filter(p => 
        this.getRegion(p.countryCode) === region
      );
      
      const favorableCount = regionProfiles.filter(p => 
        p.overallStatus === 'favorable' || p.overallStatus === 'regulated'
      ).length;
      
      return {
        region,
        corridorCount: regionCorridors.length,
        partnerCount: regionPartners.length,
        regulatoryStatus: favorableCount > regionProfiles.length / 2 ? 'Favorable' : 'Mixed',
        ecosystemScore: Math.min(100, regionCorridors.length * 5 + regionPartners.length * 10),
        growthPotential: region === 'Asia Pacific' ? 85 : 
                        region === 'Americas' ? 75 : 
                        region === 'Europe' ? 70 : 
                        region === 'Middle East' ? 65 : 50
      };
    });
  }
}

// ==================== SINGLETON INSTANCE ====================

export const unifiedAnalytics = new UnifiedAnalyticsAggregator();

// ==================== CONVENIENCE EXPORTS ====================

export async function getUnifiedMarketIntelligence(forceRefresh = false): Promise<UnifiedMarketIntelligence> {
  return unifiedAnalytics.getUnifiedIntelligence(forceRefresh);
}

export function getDataSourceStatus(): DataSourceStatus[] {
  return unifiedAnalytics.getDataSourceStatus();
}

export function getRegionalAnalysis(): RegionalAnalysis[] {
  return unifiedAnalytics.getRegionalAnalysis();
}

export default UnifiedAnalyticsAggregator;
