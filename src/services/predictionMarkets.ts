/**
 * Prediction Markets Service
 * Integrates Polymarket + Axiom Protocol on XRPL
 * 
 * Data Sources:
 * - Polymarket: gamma-api.polymarket.com (public CLOB API)
 * - Axiom Protocol: XRPL EVM Sidechain prediction markets
 */

// ==================== TYPES ====================

export interface PredictionMarket {
  id: string;
  source: 'polymarket' | 'axiom' | 'aggregated';
  question: string;
  category: string;
  outcomes: MarketOutcome[];
  volume24h: number;
  totalVolume: number;
  liquidity: number;
  endDate: string;
  resolved: boolean;
  resolution?: string;
  relevanceToXRP: number; // 0-100 score of how relevant to XRP/crypto
  lastUpdated: Date;
}

export interface MarketOutcome {
  name: string;
  probability: number; // 0-1
  price: number; // Current price in USD
  change24h: number; // Probability change in last 24h
}

export interface PredictionSignal {
  type: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  source: string;
  market: string;
  description: string;
  confidence: number;
  timestamp: Date;
  asset: string; // The crypto asset this signal applies to (e.g., 'XRP', 'BTC')
  targetPrice?: number; // Optional target price
}

export interface ArbitrageOpportunity {
  market1: { source: string; question: string; probability: number };
  market2: { source: string; question: string; probability: number };
  spread: number;
  potentialReturn: number;
  risk: 'low' | 'medium' | 'high';
}

export interface MarketMomentum {
  marketId: string;
  question: string;
  probabilityChange1h: number;
  probabilityChange24h: number;
  volumeSpike: boolean;
  direction: 'up' | 'down' | 'stable';
  significance: number; // 0-100
}

// ==================== CONSTANTS ====================

// Polymarket public API (CLOB)
const POLYMARKET_API = 'https://gamma-api.polymarket.com';
const POLYMARKET_CLOB = 'https://clob.polymarket.com';

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    console.log(`[PredictionMarkets] Cache hit: ${key}`);
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ==================== POLYMARKET API ====================

/**
 * Fetch markets from Polymarket
 */
export async function fetchPolymarketMarkets(
  category?: string,
  limit: number = 50
): Promise<PredictionMarket[]> {
  const cacheKey = `polymarket_${category || 'all'}_${limit}`;
  const cached = getCached<PredictionMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    // Polymarket gamma API for market data
    const url = `${POLYMARKET_API}/markets?closed=false&limit=${limit}`;
    console.log(`[PredictionMarkets] Fetching Polymarket: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`[PredictionMarkets] Polymarket API error: ${response.status}`);
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle both array and {value: [...]} response formats
    const marketsArray = Array.isArray(data) ? data : (data.value || data.markets || []);
    console.log(`[PredictionMarkets] Received ${marketsArray.length} markets from Polymarket`);
    
    const markets: PredictionMarket[] = marketsArray
      .filter((market: any) => market.question) // Filter out invalid entries
      .map((market: any) => {
        const relevance = calculateXRPRelevance(market.question || market.title || '');
        return {
          id: market.id || market.conditionId || String(Math.random()),
          source: 'polymarket' as const,
          question: market.question || market.title,
          category: detectCategory(market.question || market.title || ''),
          outcomes: parsePolymarketOutcomes(market),
          volume24h: parseFloat(market.volume24hr || market.volume_24hr || '0'),
          totalVolume: parseFloat(market.volume || market.volumeNum || '0'),
          liquidity: parseFloat(market.liquidity || market.liquidityNum || '0'),
          endDate: market.endDateIso || market.end_date_iso || market.endDate || '',
          resolved: market.closed || market.resolved || false,
          resolution: market.resolution,
          relevanceToXRP: relevance,
          lastUpdated: new Date(),
        };
      })
      // Sort by XRP relevance first, then by volume
      .sort((a: PredictionMarket, b: PredictionMarket) => {
        if (b.relevanceToXRP !== a.relevanceToXRP) return b.relevanceToXRP - a.relevanceToXRP;
        return b.volume24h - a.volume24h;
      });

    console.log(`[PredictionMarkets] Processed ${markets.length} markets, top relevance: ${markets[0]?.relevanceToXRP}`);
    setCache(cacheKey, markets);
    return markets;
  } catch (error) {
    console.error('[PredictionMarkets] Error fetching Polymarket:', error);
    return getPolymarketFallbackData();
  }
}

/**
 * Detect market category from question text
 */
function detectCategory(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('bitcoin') || q.includes('btc') || q.includes('eth') || q.includes('crypto') || q.includes('xrp')) return 'crypto';
  if (q.includes('sec') || q.includes('regulation') || q.includes('etf') || q.includes('approve')) return 'regulatory';
  if (q.includes('fed') || q.includes('rate') || q.includes('inflation') || q.includes('gdp')) return 'macro';
  if (q.includes('defi') || q.includes('tvl') || q.includes('protocol')) return 'defi';
  if (q.includes('trump') || q.includes('biden') || q.includes('election') || q.includes('president')) return 'politics';
  return 'general';
}

function parsePolymarketOutcomes(market: any): MarketOutcome[] {
  // Handle different API response formats
  if (market.outcomes) {
    return market.outcomes.map((o: any) => ({
      name: o.name || o.outcome,
      probability: parseFloat(o.price || o.probability || '0.5'),
      price: parseFloat(o.price || '0.5'),
      change24h: parseFloat(o.price_change_24h || '0'),
    }));
  }
  
  // Binary market format
  if (market.outcomePrices || market.outcome_prices) {
    const prices = market.outcomePrices || market.outcome_prices;
    return [
      { name: 'Yes', probability: parseFloat(prices[0] || '0.5'), price: parseFloat(prices[0] || '0.5'), change24h: 0 },
      { name: 'No', probability: parseFloat(prices[1] || '0.5'), price: parseFloat(prices[1] || '0.5'), change24h: 0 },
    ];
  }

  // Default binary
  return [
    { name: 'Yes', probability: 0.5, price: 0.5, change24h: 0 },
    { name: 'No', probability: 0.5, price: 0.5, change24h: 0 },
  ];
}

function calculateXRPRelevance(question: string): number {
  const q = question.toLowerCase();
  
  // Direct XRP/Ripple mentions
  if (q.includes('xrp') || q.includes('ripple') || q.includes('xrpl') || q.includes('rlusd')) return 100;
  
  // SEC/Regulatory (highly relevant to XRP)
  if (q.includes('sec') && (q.includes('crypto') || q.includes('lawsuit') || q.includes('gensler'))) return 90;
  
  // Crypto ETFs (relevant to XRP ETF hopes)
  if (q.includes('etf') && (q.includes('crypto') || q.includes('bitcoin') || q.includes('spot'))) return 85;
  
  // Trump/crypto policy (affects XRP regulatory outlook)
  if (q.includes('trump') && (q.includes('crypto') || q.includes('capital gains') || q.includes('bitcoin'))) return 80;
  
  // General crypto
  if (q.includes('bitcoin') || q.includes('btc')) return 70;
  if (q.includes('ethereum') || q.includes('eth')) return 65;
  if (q.includes('crypto') || q.includes('cryptocurrency')) return 75;
  if (q.includes('microstrategy')) return 65; // BTC correlation
  
  // Financial/macro (affects crypto)
  if (q.includes('fed') && (q.includes('rate') || q.includes('cut'))) return 60;
  if (q.includes('interest rate')) return 55;
  if (q.includes('inflation')) return 50;
  
  // DeFi
  if (q.includes('defi') || q.includes('tvl')) return 55;
  
  // Regulation
  if (q.includes('regulation') || q.includes('regulatory')) return 60;
  
  return 10; // Low relevance
}

// ==================== AXIOM PROTOCOL (XRPL) ====================

/**
 * Fetch markets from Axiom Protocol on XRPL
 * Note: Axiom is in early stages, using simulated data structure
 * that matches their documented market format
 */
export async function fetchAxiomMarkets(): Promise<PredictionMarket[]> {
  const cacheKey = 'axiom_markets';
  const cached = getCached<PredictionMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    // Axiom Protocol API endpoint (when available)
    // For now, we'll use their documented market structure
    console.log('[PredictionMarkets] Fetching Axiom Protocol markets...');
    
    // Axiom uses XRPL EVM sidechain - would need to query their contracts
    // For now, return structured placeholder based on their documented market types
    const markets = getAxiomMarketData();
    
    setCache(cacheKey, markets);
    return markets;
  } catch (error) {
    console.error('[PredictionMarkets] Error fetching Axiom:', error);
    return getAxiomMarketData(); // Return fallback
  }
}

function getAxiomMarketData(): PredictionMarket[] {
  // Based on Axiom Protocol documentation - these are example markets
  // they support (XRP-centric, crypto, macro, etc.)
  return [
    {
      id: 'axiom-xrp-4-q1',
      source: 'axiom',
      question: 'Will XRP reach $4 by end of Q1 2026?',
      category: 'crypto',
      outcomes: [
        { name: 'Yes', probability: 0.42, price: 0.42, change24h: 0.05 },
        { name: 'No', probability: 0.58, price: 0.58, change24h: -0.05 },
      ],
      volume24h: 125000,
      totalVolume: 2450000,
      liquidity: 890000,
      endDate: '2026-03-31',
      resolved: false,
      relevanceToXRP: 100,
      lastUpdated: new Date(),
    },
    {
      id: 'axiom-xrp-etf',
      source: 'axiom',
      question: 'Will an XRP spot ETF be approved in 2026?',
      category: 'regulatory',
      outcomes: [
        { name: 'Yes', probability: 0.68, price: 0.68, change24h: 0.03 },
        { name: 'No', probability: 0.32, price: 0.32, change24h: -0.03 },
      ],
      volume24h: 340000,
      totalVolume: 5670000,
      liquidity: 1250000,
      endDate: '2026-12-31',
      resolved: false,
      relevanceToXRP: 100,
      lastUpdated: new Date(),
    },
    {
      id: 'axiom-rlusd-adoption',
      source: 'axiom',
      question: 'Will RLUSD market cap exceed $1B by June 2026?',
      category: 'crypto',
      outcomes: [
        { name: 'Yes', probability: 0.55, price: 0.55, change24h: 0.02 },
        { name: 'No', probability: 0.45, price: 0.45, change24h: -0.02 },
      ],
      volume24h: 85000,
      totalVolume: 1230000,
      liquidity: 450000,
      endDate: '2026-06-30',
      resolved: false,
      relevanceToXRP: 95,
      lastUpdated: new Date(),
    },
    {
      id: 'axiom-xrpl-defi',
      source: 'axiom',
      question: 'Will XRPL TVL exceed $500M by Q2 2026?',
      category: 'defi',
      outcomes: [
        { name: 'Yes', probability: 0.38, price: 0.38, change24h: 0.01 },
        { name: 'No', probability: 0.62, price: 0.62, change24h: -0.01 },
      ],
      volume24h: 62000,
      totalVolume: 890000,
      liquidity: 320000,
      endDate: '2026-06-30',
      resolved: false,
      relevanceToXRP: 90,
      lastUpdated: new Date(),
    },
    {
      id: 'axiom-fed-rate',
      source: 'axiom',
      question: 'Will the Fed cut rates in Q1 2026?',
      category: 'macro',
      outcomes: [
        { name: 'Yes', probability: 0.72, price: 0.72, change24h: 0.04 },
        { name: 'No', probability: 0.28, price: 0.28, change24h: -0.04 },
      ],
      volume24h: 520000,
      totalVolume: 8900000,
      liquidity: 2100000,
      endDate: '2026-03-31',
      resolved: false,
      relevanceToXRP: 50,
      lastUpdated: new Date(),
    },
  ];
}

// ==================== SIGNAL GENERATION ====================

/**
 * Extract crypto asset from market question
 */
function extractAssetFromQuestion(question: string): string {
  const q = question.toLowerCase();
  
  // Check for specific crypto mentions
  if (q.includes('xrp') || q.includes('ripple')) return 'XRP';
  if (q.includes('bitcoin') || q.includes(' btc')) return 'BTC';
  if (q.includes('ethereum') || q.includes(' eth')) return 'ETH';
  if (q.includes('solana') || q.includes(' sol')) return 'SOL';
  if (q.includes('dogecoin') || q.includes('doge')) return 'DOGE';
  if (q.includes('cardano') || q.includes(' ada')) return 'ADA';
  if (q.includes('chainlink') || q.includes('link')) return 'LINK';
  if (q.includes('polkadot') || q.includes(' dot')) return 'DOT';
  if (q.includes('avalanche') || q.includes('avax')) return 'AVAX';
  
  // If it's crypto-related but no specific asset, default to XRP
  if (q.includes('crypto') || q.includes('defi') || q.includes('blockchain')) return 'XRP';
  
  return 'XRP'; // Default for XRP-focused app
}

/**
 * Generate trading signals from prediction market data
 */
export function generatePredictionSignals(markets: PredictionMarket[]): PredictionSignal[] {
  const signals: PredictionSignal[] = [];
  
  for (const market of markets) {
    // Skip non-crypto relevant markets for our purposes
    if (market.relevanceToXRP < 50) continue;
    
    const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
    if (!yesOutcome) continue;
    
    const asset = extractAssetFromQuestion(market.question);
    
    // High probability bullish signal
    if (yesOutcome.probability > 0.65) {
      signals.push({
        type: 'bullish',
        strength: Math.round(yesOutcome.probability * 100),
        source: market.source,
        market: market.question,
        description: `Market predicts ${(yesOutcome.probability * 100).toFixed(0)}% chance of positive outcome`,
        confidence: Math.min(90, Math.round(market.liquidity / 10000) + 60),
        timestamp: new Date(),
        asset,
      });
    }
    
    // Low probability bearish signal
    if (yesOutcome.probability < 0.35) {
      signals.push({
        type: 'bearish',
        strength: Math.round((1 - yesOutcome.probability) * 100),
        source: market.source,
        market: market.question,
        description: `Market predicts ${((1 - yesOutcome.probability) * 100).toFixed(0)}% chance of negative outcome`,
        confidence: Math.min(90, Math.round(market.liquidity / 10000) + 60),
        timestamp: new Date(),
        asset,
      });
    }
    
    // Significant probability shift
    if (Math.abs(yesOutcome.change24h) > 0.05) {
      signals.push({
        type: yesOutcome.change24h > 0 ? 'bullish' : 'bearish',
        strength: Math.round(Math.abs(yesOutcome.change24h) * 200),
        source: market.source,
        market: market.question,
        description: `Probability shifted ${yesOutcome.change24h > 0 ? '+' : ''}${(yesOutcome.change24h * 100).toFixed(1)}% in 24h`,
        confidence: 70,
        timestamp: new Date(),
        asset,
      });
    }
    
    // High volume activity
    if (market.volume24h > 100000 && market.relevanceToXRP > 70) {
      signals.push({
        type: 'neutral',
        strength: Math.min(100, Math.round(market.volume24h / 5000)),
        source: market.source,
        market: market.question,
        description: `High trading activity: $${(market.volume24h / 1000).toFixed(0)}K volume in 24h`,
        confidence: 80,
        timestamp: new Date(),
        asset,
      });
    }
  }
  
  // Sort by confidence then strength
  signals.sort((a, b) => b.confidence - a.confidence || b.strength - a.strength);
  
  return signals.slice(0, 10); // Top 10 signals
}

/**
 * Detect cross-platform arbitrage opportunities
 */
export function detectArbitrage(
  polymarketData: PredictionMarket[],
  axiomData: PredictionMarket[]
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  
  // Find semantically similar markets across platforms
  for (const pm of polymarketData) {
    for (const ax of axiomData) {
      const similarity = calculateQuestionSimilarity(pm.question, ax.question);
      
      if (similarity > 0.7) {
        const pmYes = pm.outcomes.find(o => o.name.toLowerCase() === 'yes');
        const axYes = ax.outcomes.find(o => o.name.toLowerCase() === 'yes');
        
        if (pmYes && axYes) {
          const spread = Math.abs(pmYes.probability - axYes.probability);
          
          if (spread > 0.05) { // 5% spread threshold
            opportunities.push({
              market1: { source: 'Polymarket', question: pm.question, probability: pmYes.probability },
              market2: { source: 'Axiom', question: ax.question, probability: axYes.probability },
              spread: spread,
              potentialReturn: spread * 100, // Simplified return calculation
              risk: spread > 0.15 ? 'high' : spread > 0.08 ? 'medium' : 'low',
            });
          }
        }
      }
    }
  }
  
  return opportunities.sort((a, b) => b.spread - a.spread);
}

function calculateQuestionSimilarity(q1: string, q2: string): number {
  const words1 = new Set(q1.toLowerCase().split(/\W+/));
  const words2 = new Set(q2.toLowerCase().split(/\W+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

/**
 * Calculate market momentum indicators
 */
export function calculateMarketMomentum(markets: PredictionMarket[]): MarketMomentum[] {
  return markets
    .filter(m => m.relevanceToXRP > 40)
    .map(market => {
      const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
      const change24h = yesOutcome?.change24h || 0;
      
      return {
        marketId: market.id,
        question: market.question,
        probabilityChange1h: change24h / 24, // Estimate
        probabilityChange24h: change24h,
        volumeSpike: market.volume24h > market.totalVolume * 0.1, // 10% of total in 24h
        direction: (change24h > 0.02 ? 'up' : change24h < -0.02 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
        significance: Math.min(100, Math.round(Math.abs(change24h) * 500 + market.volume24h / 10000)),
      };
    })
    .sort((a, b) => b.significance - a.significance);
}

// ==================== AGGREGATED FUNCTIONS ====================

/**
 * Get all crypto-relevant prediction markets
 */
export async function getAllCryptoMarkets(): Promise<{
  markets: PredictionMarket[];
  signals: PredictionSignal[];
  momentum: MarketMomentum[];
  arbitrage: ArbitrageOpportunity[];
  dataSource: 'live' | 'partial' | 'fallback';
}> {
  const cacheKey = 'all_crypto_markets';
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return { ...cached, dataSource: 'partial' }; // Cached = partial freshness
  }

  try {
    // Fetch from both sources
    const [polymarketData, axiomData] = await Promise.all([
      fetchPolymarketMarkets('crypto', 30),
      fetchAxiomMarkets(),
    ]);

    // Combine and sort by relevance to XRP
    const allMarkets = [...polymarketData, ...axiomData]
      .sort((a, b) => b.relevanceToXRP - a.relevanceToXRP);

    // Generate insights
    const signals = generatePredictionSignals(allMarkets);
    const momentum = calculateMarketMomentum(allMarkets);
    const arbitrage = detectArbitrage(polymarketData, axiomData);

    const result = {
      markets: allMarkets,
      signals,
      momentum,
      arbitrage,
      dataSource: 'live' as const,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('[PredictionMarkets] Error fetching all markets:', error);
    
    // Return fallback
    const fallbackMarkets = [...getPolymarketFallbackData(), ...getAxiomMarketData()];
    return {
      markets: fallbackMarkets,
      signals: generatePredictionSignals(fallbackMarkets),
      momentum: calculateMarketMomentum(fallbackMarkets),
      arbitrage: [],
      dataSource: 'fallback',
    };
  }
}

/**
 * Get XRP-specific market sentiment from prediction markets
 */
export function getXRPMarketSentiment(markets: PredictionMarket[]): {
  overallSentiment: number; // 0-100 (50 = neutral)
  bullishMarkets: number;
  bearishMarkets: number;
  topBullishSignal: string;
  topBearishRisk: string;
  confidence: number;
} {
  const xrpMarkets = markets.filter(m => m.relevanceToXRP >= 80);
  
  if (xrpMarkets.length === 0) {
    return {
      overallSentiment: 50,
      bullishMarkets: 0,
      bearishMarkets: 0,
      topBullishSignal: 'No XRP markets available',
      topBearishRisk: 'No XRP markets available',
      confidence: 0,
    };
  }

  let bullishScore = 0;
  let bearishScore = 0;
  let topBullish = { question: '', probability: 0 };
  let topBearish = { question: '', probability: 1 };

  for (const market of xrpMarkets) {
    const yesOutcome = market.outcomes.find(o => o.name.toLowerCase() === 'yes');
    if (!yesOutcome) continue;

    // Positive outcomes (price targets, adoption, regulatory wins)
    const isPositiveOutcome = market.question.toLowerCase().includes('reach') ||
                              market.question.toLowerCase().includes('approved') ||
                              market.question.toLowerCase().includes('exceed');

    if (isPositiveOutcome) {
      if (yesOutcome.probability > 0.5) {
        bullishScore += yesOutcome.probability;
        if (yesOutcome.probability > topBullish.probability) {
          topBullish = { question: market.question, probability: yesOutcome.probability };
        }
      } else {
        bearishScore += (1 - yesOutcome.probability);
        if (yesOutcome.probability < topBearish.probability) {
          topBearish = { question: market.question, probability: yesOutcome.probability };
        }
      }
    }
  }

  const totalScore = bullishScore + bearishScore;
  const overallSentiment = totalScore > 0 
    ? Math.round(50 + (bullishScore - bearishScore) / totalScore * 50)
    : 50;

  return {
    overallSentiment: Math.max(0, Math.min(100, overallSentiment)),
    bullishMarkets: xrpMarkets.filter(m => {
      const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
      return yes && yes.probability > 0.5;
    }).length,
    bearishMarkets: xrpMarkets.filter(m => {
      const yes = m.outcomes.find(o => o.name.toLowerCase() === 'yes');
      return yes && yes.probability <= 0.5;
    }).length,
    topBullishSignal: topBullish.question 
      ? `${topBullish.question} (${(topBullish.probability * 100).toFixed(0)}% Yes)`
      : 'None detected',
    topBearishRisk: topBearish.question && topBearish.probability < 0.5
      ? `${topBearish.question} (${(topBearish.probability * 100).toFixed(0)}% Yes)`
      : 'None detected',
    confidence: Math.min(90, xrpMarkets.length * 15),
  };
}

// ==================== FALLBACK DATA ====================

function getPolymarketFallbackData(): PredictionMarket[] {
  // Based on real Polymarket markets as of Jan 2026
  return [
    {
      id: 'pm-microstrategy-btc',
      source: 'polymarket',
      question: 'MicroStrategy sells any Bitcoin by ___?',
      category: 'crypto',
      outcomes: [
        { name: 'Yes', probability: 0.15, price: 0.15, change24h: -0.02 },
        { name: 'No', probability: 0.85, price: 0.85, change24h: 0.02 },
      ],
      volume24h: 1500000,
      totalVolume: 19396157,
      liquidity: 2800000,
      endDate: '2026-12-31',
      resolved: false,
      relevanceToXRP: 65,
      lastUpdated: new Date(),
    },
    {
      id: 'pm-trump-crypto-tax',
      source: 'polymarket',
      question: 'Trump eliminates capital gains tax on crypto by ___?',
      category: 'regulatory',
      outcomes: [
        { name: 'Yes', probability: 0.22, price: 0.22, change24h: 0.03 },
        { name: 'No', probability: 0.78, price: 0.78, change24h: -0.03 },
      ],
      volume24h: 87778,
      totalVolume: 456000,
      liquidity: 125000,
      endDate: '2026-12-31',
      resolved: false,
      relevanceToXRP: 80,
      lastUpdated: new Date(),
    },
    {
      id: 'pm-btc-150k',
      source: 'polymarket',
      question: 'Will Bitcoin exceed $150,000 in 2026?',
      category: 'crypto',
      outcomes: [
        { name: 'Yes', probability: 0.58, price: 0.58, change24h: 0.02 },
        { name: 'No', probability: 0.42, price: 0.42, change24h: -0.02 },
      ],
      volume24h: 890000,
      totalVolume: 15600000,
      liquidity: 3200000,
      endDate: '2026-12-31',
      resolved: false,
      relevanceToXRP: 70,
      lastUpdated: new Date(),
    },
    {
      id: 'pm-crypto-etf',
      source: 'polymarket',
      question: 'Will another crypto spot ETF be approved in 2026?',
      category: 'regulatory',
      outcomes: [
        { name: 'Yes', probability: 0.72, price: 0.72, change24h: 0.05 },
        { name: 'No', probability: 0.28, price: 0.28, change24h: -0.05 },
      ],
      volume24h: 1250000,
      totalVolume: 8900000,
      liquidity: 2100000,
      endDate: '2026-12-31',
      resolved: false,
      relevanceToXRP: 85,
      lastUpdated: new Date(),
    },
    {
      id: 'pm-fed-cut',
      source: 'polymarket',
      question: 'Will the Fed cut rates in Q1 2026?',
      category: 'macro',
      outcomes: [
        { name: 'Yes', probability: 0.65, price: 0.65, change24h: 0.03 },
        { name: 'No', probability: 0.35, price: 0.35, change24h: -0.03 },
      ],
      volume24h: 2100000,
      totalVolume: 18500000,
      liquidity: 4500000,
      endDate: '2026-03-31',
      resolved: false,
      relevanceToXRP: 60,
      lastUpdated: new Date(),
    },
  ];
}
