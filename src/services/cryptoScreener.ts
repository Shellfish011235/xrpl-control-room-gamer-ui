/**
 * Crypto Screener Service
 * 
 * Inspired by:
 * - BenGOsborn/Crypto-Screener (moon score logic)
 * - mnwato/tradingview-scraper (market movers)
 * - sajanpoudel/CryptoSensei (technical indicators + sentiment)
 * 
 * Calculates potential scores, risk levels, and rankings for cryptocurrencies
 */

// ==================== TYPES ====================

export interface CryptoScreenerResult {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  volume24h: number;
  marketCap: number;
  marketCapRank: number;
  high24h: number;
  low24h: number;
  ath: number;
  athChangePercent: number;
  circulatingSupply: number;
  totalSupply: number;
  sparkline7d: number[];
  
  // Calculated Scores
  moonScore: number;           // 0-100 potential score
  momentumScore: number;       // 0-100 momentum
  volumeScore: number;         // 0-100 volume analysis
  volatilityScore: number;     // 0-100 volatility
  technicalScore: number;      // 0-100 technicals
  
  // Risk Assessment
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: string[];
  
  // Signals
  momentum: 'bullish' | 'bearish' | 'neutral';
  trend: 'uptrend' | 'downtrend' | 'sideways';
  
  // Technical Indicators
  rsi: number;
  macdSignal: 'buy' | 'sell' | 'neutral';
  
  // Narrative/Catalysts
  narratives: string[];
  
  // Final Recommendation
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidenceScore: number;
}

export interface ScreenerConfig {
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  excludeStablecoins?: boolean;
  limit?: number;
}

// ==================== CONSTANTS ====================

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Stablecoins to exclude
const STABLECOINS = ['usdt', 'usdc', 'busd', 'dai', 'tusd', 'usdp', 'usdd', 'frax', 'lusd', 'gusd'];

// ==================== CACHING ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    console.log(`[CryptoScreener] Cache hit for: ${key}`);
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Rate limit tracking
let lastApiCall = 0;
const MIN_API_INTERVAL = 2000; // 2 seconds between calls

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < MIN_API_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_API_INTERVAL - timeSinceLastCall));
  }
  
  lastApiCall = Date.now();
  console.log(`[CryptoScreener] Fetching: ${url}`);
  
  const response = await fetch(url);
  
  if (response.status === 429) {
    console.warn('[CryptoScreener] Rate limited! Waiting 60 seconds...');
    throw new Error('RATE_LIMITED');
  }
  
  return response;
}

// Known narratives/catalysts for major cryptos
const CRYPTO_NARRATIVES: Record<string, string[]> = {
  'ripple': ['SEC case resolution momentum', 'XRPL DeFi ecosystem expansion', 'ODL corridor growth', 'Institutional partnerships'],
  'bitcoin': ['Post-halving supply shock', 'ETF inflows', 'Digital gold narrative', 'Institutional adoption'],
  'ethereum': ['ETH ETF approval', 'Layer 2 growth', 'Staking yield', 'DeFi dominance'],
  'solana': ['High throughput chain', 'Firedancer upgrade', 'Mobile-first strategy', 'DeFi/NFT ecosystem'],
  'cardano': ['Hydra scaling', 'Academic peer-review', 'Africa partnerships', 'Governance improvements'],
  'hedera': ['Enterprise adoption', 'HBAR Foundation grants', 'Tokenization narrative', 'Council members'],
  'chainlink': ['CCIP adoption', 'Oracle dominance', 'Staking launch', 'Real-world data feeds'],
  'avalanche': ['Subnet growth', 'Institutional interest', 'Gaming ecosystem', 'Teleporter upgrades'],
  'polkadot': ['Parachain auctions', 'Cross-chain messaging', 'JAM upgrade', 'Governance 2.0'],
  'polygon': ['zkEVM adoption', 'Enterprise partnerships', 'CDK launches', 'Aggregation layer'],
  'injective': ['DeFi momentum', 'Low market cap potential', 'Cosmos ecosystem', 'Fast finality'],
  'sui': ['L1 competition', 'Gaming ecosystem', 'Move language', 'Parallel execution'],
  'ondo': ['RWA tokenization leader', 'Institutional backing', 'Treasury products', 'BlackRock partnership'],
  'aave': ['DeFi blue chip', 'GHO stablecoin', 'Multi-chain expansion', 'Safety module'],
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate RSI (Relative Strength Index) from price data
 * RSI < 30 = oversold (buy signal)
 * RSI > 70 = overbought (sell signal)
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate momentum score based on price changes
 * Looks at short-term vs long-term momentum
 */
function calculateMomentumScore(prices: number[]): number {
  if (prices.length < 14) return 50;
  
  // Short-term momentum (last 3 days)
  const shortTerm = prices.slice(-3);
  const shortTermChange = ((shortTerm[shortTerm.length - 1] - shortTerm[0]) / shortTerm[0]) * 100;
  
  // Medium-term momentum (last 7 days)
  const mediumTerm = prices.slice(-7);
  const mediumTermChange = ((mediumTerm[mediumTerm.length - 1] - mediumTerm[0]) / mediumTerm[0]) * 100;
  
  // Long-term momentum (all data, up to 30 days)
  const longTermChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
  
  // Weight: short-term 50%, medium-term 30%, long-term 20%
  let score = 50;
  score += shortTermChange * 2.5;  // ±10% short-term = ±25 points
  score += mediumTermChange * 1.5; // ±10% medium-term = ±15 points
  score += longTermChange * 0.5;   // ±20% long-term = ±10 points
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate volatility from price data
 * Returns standard deviation as percentage
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1] * 100);
  }
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate volume score
 * Based on volume/market cap ratio and volume trend
 */
function calculateVolumeScore(volume24h: number, marketCap: number, avgVolume?: number): number {
  const volumeToMcap = volume24h / marketCap;
  
  let score = 50;
  
  // Volume/Market Cap ratio scoring
  // > 30% is very high activity
  // 15-30% is high
  // 5-15% is normal
  // < 5% is low
  if (volumeToMcap > 0.30) score += 30;
  else if (volumeToMcap > 0.15) score += 20;
  else if (volumeToMcap > 0.05) score += 10;
  else score -= 10;
  
  // Volume trend (if we have average)
  if (avgVolume && avgVolume > 0) {
    const volumeChange = (volume24h - avgVolume) / avgVolume;
    if (volumeChange > 0.5) score += 15; // 50% above average
    else if (volumeChange > 0.2) score += 10;
    else if (volumeChange < -0.3) score -= 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Moon Score Calculation (inspired by Crypto-Screener)
 * Combines multiple factors into a single potential score
 */
function calculateMoonScore(
  priceChange24h: number,
  priceChange7d: number,
  volumeScore: number,
  momentumScore: number,
  rsi: number,
  athChangePercent: number,
  marketCapRank: number
): number {
  let score = 50;
  
  // Price momentum (40% weight)
  // 24h change contribution
  if (priceChange24h > 10) score += 15;
  else if (priceChange24h > 5) score += 10;
  else if (priceChange24h > 2) score += 5;
  else if (priceChange24h < -5) score -= 5;
  else if (priceChange24h < -10) score -= 10;
  
  // 7d change contribution
  if (priceChange7d > 20) score += 12;
  else if (priceChange7d > 10) score += 8;
  else if (priceChange7d > 5) score += 4;
  else if (priceChange7d < -10) score -= 5;
  else if (priceChange7d < -20) score -= 10;
  
  // Volume analysis (20% weight)
  score += (volumeScore - 50) * 0.4;
  
  // Momentum (15% weight)
  score += (momentumScore - 50) * 0.3;
  
  // RSI analysis (10% weight)
  // Oversold = opportunity, Overbought = caution
  if (rsi < 30) score += 10; // Oversold - good entry
  else if (rsi < 40) score += 5;
  else if (rsi > 75) score -= 8; // Overbought - risky
  else if (rsi > 70) score -= 4;
  
  // ATH distance (10% weight)
  // Far from ATH = recovery potential
  if (athChangePercent < -80) score += 8;
  else if (athChangePercent < -60) score += 5;
  else if (athChangePercent < -40) score += 2;
  else if (athChangePercent > -10) score -= 5; // Near ATH
  
  // Market cap consideration (5% weight)
  // Smaller caps have more growth potential but more risk
  if (marketCapRank > 100 && marketCapRank <= 300) score += 5;
  else if (marketCapRank > 50 && marketCapRank <= 100) score += 3;
  else if (marketCapRank > 300) score += 2; // Very small, high risk
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Assess risk level based on multiple factors
 */
function assessRisk(
  marketCapRank: number,
  volatility: number,
  volume24h: number,
  marketCap: number,
  priceChange24h: number
): { level: 'low' | 'medium' | 'high' | 'extreme'; factors: string[] } {
  const factors: string[] = [];
  let riskScore = 0;
  
  // Market cap risk
  if (marketCapRank <= 10) {
    riskScore += 1;
  } else if (marketCapRank <= 50) {
    riskScore += 2;
    factors.push('Mid-cap volatility');
  } else if (marketCapRank <= 200) {
    riskScore += 3;
    factors.push('Smaller market cap');
  } else {
    riskScore += 4;
    factors.push('Low market cap - high volatility risk');
  }
  
  // Volatility risk
  if (volatility > 15) {
    riskScore += 3;
    factors.push('Extreme price swings');
  } else if (volatility > 10) {
    riskScore += 2;
    factors.push('High volatility');
  } else if (volatility > 5) {
    riskScore += 1;
  }
  
  // Liquidity risk
  const volumeToMcap = volume24h / marketCap;
  if (volumeToMcap < 0.02) {
    riskScore += 2;
    factors.push('Low liquidity');
  } else if (volumeToMcap < 0.05) {
    riskScore += 1;
  }
  
  // Recent extreme moves
  if (Math.abs(priceChange24h) > 20) {
    riskScore += 2;
    factors.push('Extreme recent price movement');
  } else if (Math.abs(priceChange24h) > 10) {
    riskScore += 1;
  }
  
  // Determine level
  let level: 'low' | 'medium' | 'high' | 'extreme';
  if (riskScore <= 3) level = 'low';
  else if (riskScore <= 5) level = 'medium';
  else if (riskScore <= 8) level = 'high';
  else level = 'extreme';
  
  if (factors.length === 0) factors.push('Standard market risk');
  
  return { level, factors };
}

/**
 * Determine momentum signal
 */
function getMomentumSignal(
  priceChange24h: number,
  priceChange7d: number,
  rsi: number,
  momentumScore: number
): 'bullish' | 'bearish' | 'neutral' {
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  if (priceChange24h > 3) bullishSignals++;
  else if (priceChange24h < -3) bearishSignals++;
  
  if (priceChange7d > 5) bullishSignals++;
  else if (priceChange7d < -5) bearishSignals++;
  
  if (rsi < 40) bullishSignals++; // Oversold = bullish potential
  else if (rsi > 65) bearishSignals++;
  
  if (momentumScore > 60) bullishSignals++;
  else if (momentumScore < 40) bearishSignals++;
  
  if (bullishSignals >= 3) return 'bullish';
  if (bearishSignals >= 3) return 'bearish';
  return 'neutral';
}

/**
 * Get recommendation based on all factors
 */
function getRecommendation(
  moonScore: number,
  rsi: number,
  momentum: 'bullish' | 'bearish' | 'neutral',
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
): { recommendation: CryptoScreenerResult['recommendation']; confidence: number } {
  let score = moonScore;
  let confidence = 50;
  
  // Adjust for RSI
  if (rsi < 30) {
    score += 10;
    confidence += 10;
  } else if (rsi > 70) {
    score -= 10;
    confidence += 5; // High confidence it's overbought
  }
  
  // Adjust for momentum
  if (momentum === 'bullish') {
    score += 5;
    confidence += 10;
  } else if (momentum === 'bearish') {
    score -= 5;
    confidence += 5;
  }
  
  // Risk adjustment
  if (riskLevel === 'extreme') {
    confidence -= 20;
  } else if (riskLevel === 'high') {
    confidence -= 10;
  } else if (riskLevel === 'low') {
    confidence += 10;
  }
  
  confidence = Math.min(95, Math.max(30, confidence));
  
  let recommendation: CryptoScreenerResult['recommendation'];
  if (score >= 75) recommendation = 'strong_buy';
  else if (score >= 60) recommendation = 'buy';
  else if (score >= 40) recommendation = 'hold';
  else if (score >= 25) recommendation = 'sell';
  else recommendation = 'strong_sell';
  
  return { recommendation, confidence };
}

/**
 * Get narratives/catalysts for a crypto
 */
function getNarratives(id: string, priceChange7d: number, volumeScore: number): string[] {
  const knownNarratives = CRYPTO_NARRATIVES[id] || [];
  const narratives = [...knownNarratives];
  
  // Add dynamic narratives based on performance
  if (priceChange7d > 15) {
    narratives.unshift('Strong weekly momentum');
  }
  if (volumeScore > 70) {
    narratives.unshift('Increased trading activity');
  }
  
  // Limit to top 3
  return narratives.slice(0, 3);
}

// ==================== MAIN API FUNCTIONS ====================

// Fallback data when API is rate limited
const FALLBACK_DATA: CryptoScreenerResult[] = [
  {
    id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    currentPrice: 104250, priceChange24h: 2.5, priceChange7d: 8.3, priceChange30d: 15.2,
    volume24h: 45000000000, marketCap: 2050000000000, marketCapRank: 1,
    high24h: 105000, low24h: 102000, ath: 108000, athChangePercent: -3.5,
    circulatingSupply: 19600000, totalSupply: 21000000, sparkline7d: [],
    moonScore: 72, momentumScore: 68, volumeScore: 75, volatilityScore: 45, technicalScore: 70,
    riskLevel: 'low', riskFactors: ['Established asset'], momentum: 'bullish', trend: 'uptrend',
    rsi: 58, macdSignal: 'buy', narratives: ['Post-halving supply shock', 'ETF inflows', 'Digital gold narrative'],
    recommendation: 'buy', confidenceScore: 75,
  },
  {
    id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    currentPrice: 3.15, priceChange24h: 5.8, priceChange7d: 12.4, priceChange30d: 28.5,
    volume24h: 8500000000, marketCap: 180000000000, marketCapRank: 3,
    high24h: 3.25, low24h: 2.95, ath: 3.84, athChangePercent: -18.0,
    circulatingSupply: 57000000000, totalSupply: 100000000000, sparkline7d: [],
    moonScore: 82, momentumScore: 78, volumeScore: 72, volatilityScore: 55, technicalScore: 75,
    riskLevel: 'medium', riskFactors: ['Regulatory uncertainty'], momentum: 'bullish', trend: 'uptrend',
    rsi: 62, macdSignal: 'buy', narratives: ['SEC case resolution momentum', 'XRPL DeFi expansion', 'ODL growth'],
    recommendation: 'strong_buy', confidenceScore: 80,
  },
  {
    id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    currentPrice: 3850, priceChange24h: 1.8, priceChange7d: 6.2, priceChange30d: 12.8,
    volume24h: 22000000000, marketCap: 463000000000, marketCapRank: 2,
    high24h: 3920, low24h: 3780, ath: 4878, athChangePercent: -21.1,
    circulatingSupply: 120000000, totalSupply: 120000000, sparkline7d: [],
    moonScore: 70, momentumScore: 65, volumeScore: 70, volatilityScore: 48, technicalScore: 68,
    riskLevel: 'low', riskFactors: ['Established asset'], momentum: 'bullish', trend: 'uptrend',
    rsi: 55, macdSignal: 'neutral', narratives: ['ETH ETF momentum', 'Layer 2 growth', 'Staking yield'],
    recommendation: 'buy', confidenceScore: 72,
  },
  {
    id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    currentPrice: 215, priceChange24h: 4.2, priceChange7d: 9.8, priceChange30d: 22.5,
    volume24h: 5500000000, marketCap: 102000000000, marketCapRank: 5,
    high24h: 220, low24h: 205, ath: 260, athChangePercent: -17.3,
    circulatingSupply: 475000000, totalSupply: 580000000, sparkline7d: [],
    moonScore: 76, momentumScore: 72, volumeScore: 68, volatilityScore: 58, technicalScore: 71,
    riskLevel: 'medium', riskFactors: ['Network reliability history'], momentum: 'bullish', trend: 'uptrend',
    rsi: 64, macdSignal: 'buy', narratives: ['High throughput', 'Firedancer upgrade', 'DeFi/NFT ecosystem'],
    recommendation: 'buy', confidenceScore: 70,
  },
  {
    id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', image: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
    currentPrice: 0.38, priceChange24h: 7.5, priceChange7d: 18.2, priceChange30d: 45.0,
    volume24h: 1200000000, marketCap: 14500000000, marketCapRank: 18,
    high24h: 0.40, low24h: 0.35, ath: 0.57, athChangePercent: -33.3,
    circulatingSupply: 38000000000, totalSupply: 50000000000, sparkline7d: [],
    moonScore: 79, momentumScore: 82, volumeScore: 70, volatilityScore: 62, technicalScore: 74,
    riskLevel: 'medium', riskFactors: ['Mid-cap volatility'], momentum: 'bullish', trend: 'uptrend',
    rsi: 68, macdSignal: 'buy', narratives: ['Enterprise adoption', 'Tokenization narrative', 'Council backing'],
    recommendation: 'buy', confidenceScore: 73,
  },
  {
    id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
    currentPrice: 28.50, priceChange24h: 2.1, priceChange7d: 7.5, priceChange30d: 18.3,
    volume24h: 850000000, marketCap: 17800000000, marketCapRank: 12,
    high24h: 29.20, low24h: 27.80, ath: 52.70, athChangePercent: -45.9,
    circulatingSupply: 626000000, totalSupply: 1000000000, sparkline7d: [],
    moonScore: 74, momentumScore: 66, volumeScore: 62, volatilityScore: 52, technicalScore: 68,
    riskLevel: 'low', riskFactors: ['Established DeFi infrastructure'], momentum: 'bullish', trend: 'uptrend',
    rsi: 56, macdSignal: 'buy', narratives: ['CCIP adoption', 'Oracle dominance', 'Staking rewards'],
    recommendation: 'buy', confidenceScore: 71,
  },
  {
    id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    currentPrice: 1.15, priceChange24h: 3.2, priceChange7d: 8.8, priceChange30d: 25.0,
    volume24h: 1100000000, marketCap: 41000000000, marketCapRank: 8,
    high24h: 1.18, low24h: 1.10, ath: 3.09, athChangePercent: -62.8,
    circulatingSupply: 35600000000, totalSupply: 45000000000, sparkline7d: [],
    moonScore: 71, momentumScore: 68, volumeScore: 58, volatilityScore: 55, technicalScore: 65,
    riskLevel: 'medium', riskFactors: ['Development pace concerns'], momentum: 'bullish', trend: 'uptrend',
    rsi: 60, macdSignal: 'buy', narratives: ['Hydra scaling', 'Governance improvements', 'Far from ATH - recovery potential'],
    recommendation: 'buy', confidenceScore: 65,
  },
  {
    id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    currentPrice: 45.50, priceChange24h: 1.5, priceChange7d: 5.2, priceChange30d: 15.8,
    volume24h: 650000000, marketCap: 18500000000, marketCapRank: 11,
    high24h: 46.80, low24h: 44.50, ath: 144.96, athChangePercent: -68.6,
    circulatingSupply: 407000000, totalSupply: 720000000, sparkline7d: [],
    moonScore: 69, momentumScore: 62, volumeScore: 55, volatilityScore: 58, technicalScore: 63,
    riskLevel: 'medium', riskFactors: ['L1 competition'], momentum: 'neutral', trend: 'sideways',
    rsi: 52, macdSignal: 'neutral', narratives: ['Subnet growth', 'Gaming ecosystem', 'Far from ATH - recovery potential'],
    recommendation: 'hold', confidenceScore: 62,
  },
  {
    id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    currentPrice: 0.42, priceChange24h: 3.5, priceChange7d: 12.1, priceChange30d: 35.2,
    volume24h: 3200000000, marketCap: 62000000000, marketCapRank: 7,
    high24h: 0.44, low24h: 0.40, ath: 0.73, athChangePercent: -42.5,
    circulatingSupply: 147000000000, totalSupply: 147000000000, sparkline7d: [],
    moonScore: 68, momentumScore: 72, volumeScore: 78, volatilityScore: 70, technicalScore: 60,
    riskLevel: 'high', riskFactors: ['High volatility', 'Meme coin dynamics', 'Elon dependency'], momentum: 'bullish', trend: 'uptrend',
    rsi: 65, macdSignal: 'buy', narratives: ['DOGE-1 mission', 'X payments speculation', 'Meme coin momentum'],
    recommendation: 'hold', confidenceScore: 55,
  },
  {
    id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
    currentPrice: 9.25, priceChange24h: 2.8, priceChange7d: 6.5, priceChange30d: 18.2,
    volume24h: 480000000, marketCap: 14200000000, marketCapRank: 14,
    high24h: 9.50, low24h: 8.95, ath: 55.00, athChangePercent: -83.2,
    circulatingSupply: 1540000000, totalSupply: 1540000000, sparkline7d: [],
    moonScore: 66, momentumScore: 60, volumeScore: 52, volatilityScore: 55, technicalScore: 62,
    riskLevel: 'medium', riskFactors: ['Far from ATH', 'L0 competition'], momentum: 'neutral', trend: 'sideways',
    rsi: 48, macdSignal: 'neutral', narratives: ['Parachain ecosystem', 'JAM upgrade', 'Cross-chain interoperability'],
    recommendation: 'hold', confidenceScore: 58,
  },
  {
    id: 'matic-network', symbol: 'MATIC', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
    currentPrice: 0.58, priceChange24h: 1.9, priceChange7d: 4.2, priceChange30d: 12.5,
    volume24h: 420000000, marketCap: 5800000000, marketCapRank: 22,
    high24h: 0.60, low24h: 0.56, ath: 2.92, athChangePercent: -80.1,
    circulatingSupply: 10000000000, totalSupply: 10000000000, sparkline7d: [],
    moonScore: 64, momentumScore: 55, volumeScore: 50, volatilityScore: 52, technicalScore: 58,
    riskLevel: 'medium', riskFactors: ['L2 competition', 'Far from ATH'], momentum: 'neutral', trend: 'sideways',
    rsi: 45, macdSignal: 'neutral', narratives: ['POL migration', 'ZK rollup focus', 'Enterprise adoption'],
    recommendation: 'hold', confidenceScore: 55,
  },
];

/**
 * Fetch and screen top cryptocurrencies
 */
export async function screenCryptos(config: ScreenerConfig = {}): Promise<CryptoScreenerResult[]> {
  const {
    minMarketCap = 0,
    maxMarketCap = Infinity,
    minVolume = 0,
    excludeStablecoins = true,
    limit = 100,
  } = config;
  
  // Check cache first
  const cacheKey = `screen_${limit}_${excludeStablecoins}`;
  const cached = getCached<CryptoScreenerResult[]>(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }
  
  try {
    // Fetch market data from CoinGecko with rate limiting
    const response = await rateLimitedFetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${Math.min(limit * 2, 250)}&page=1&sparkline=true&price_change_percentage=24h,7d,30d`
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[CryptoScreener] Rate limited, using fallback data');
        return FALLBACK_DATA.slice(0, limit);
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const coins = await response.json();
    
    // Process and filter coins
    const results: CryptoScreenerResult[] = [];
    
    for (const coin of coins) {
      // Apply filters
      if (excludeStablecoins && STABLECOINS.includes(coin.id)) continue;
      if (coin.market_cap < minMarketCap || coin.market_cap > maxMarketCap) continue;
      if (coin.total_volume < minVolume) continue;
      
      const sparkline = coin.sparkline_in_7d?.price || [];
      
      // Calculate indicators
      const rsi = calculateRSI(sparkline);
      const momentumScore = calculateMomentumScore(sparkline);
      const volatility = calculateVolatility(sparkline);
      const volumeScore = calculateVolumeScore(coin.total_volume, coin.market_cap);
      
      // Calculate moon score
      const moonScore = calculateMoonScore(
        coin.price_change_percentage_24h || 0,
        coin.price_change_percentage_7d_in_currency || 0,
        volumeScore,
        momentumScore,
        rsi,
        coin.ath_change_percentage || 0,
        coin.market_cap_rank || 999
      );
      
      // Assess risk
      const risk = assessRisk(
        coin.market_cap_rank || 999,
        volatility,
        coin.total_volume,
        coin.market_cap,
        coin.price_change_percentage_24h || 0
      );
      
      // Get momentum signal
      const momentum = getMomentumSignal(
        coin.price_change_percentage_24h || 0,
        coin.price_change_percentage_7d_in_currency || 0,
        rsi,
        momentumScore
      );
      
      // Get recommendation
      const { recommendation, confidence } = getRecommendation(moonScore, rsi, momentum, risk.level);
      
      // Get narratives
      const narratives = getNarratives(
        coin.id,
        coin.price_change_percentage_7d_in_currency || 0,
        volumeScore
      );
      
      // Determine trend
      let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
      if (sparkline.length >= 7) {
        const start = sparkline[0];
        const end = sparkline[sparkline.length - 1];
        const change = ((end - start) / start) * 100;
        if (change > 5) trend = 'uptrend';
        else if (change < -5) trend = 'downtrend';
      }
      
      results.push({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h || 0,
        priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
        priceChange30d: coin.price_change_percentage_30d_in_currency || 0,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChangePercent: coin.ath_change_percentage,
        circulatingSupply: coin.circulating_supply,
        totalSupply: coin.total_supply,
        sparkline7d: sparkline,
        
        moonScore,
        momentumScore,
        volumeScore,
        volatilityScore: Math.min(100, volatility * 10),
        technicalScore: Math.round((rsi < 50 ? 100 - rsi : rsi) * 0.5 + momentumScore * 0.5),
        
        riskLevel: risk.level,
        riskFactors: risk.factors,
        
        momentum,
        trend,
        
        rsi: Math.round(rsi),
        macdSignal: momentum === 'bullish' ? 'buy' : momentum === 'bearish' ? 'sell' : 'neutral',
        
        narratives,
        
        recommendation,
        confidenceScore: confidence,
      });
      
      if (results.length >= limit) break;
    }
    
    // Sort by moon score descending
    results.sort((a, b) => b.moonScore - a.moonScore);
    
    // Cache the results
    setCache(cacheKey, results);
    
    return results;
  } catch (error) {
    console.error('[CryptoScreener] Error:', error);
    
    // Return fallback data on error
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      console.warn('[CryptoScreener] Using fallback data due to rate limit');
      return FALLBACK_DATA.slice(0, limit);
    }
    
    // For other errors, still return fallback
    console.warn('[CryptoScreener] Using fallback data due to error');
    return FALLBACK_DATA.slice(0, limit);
  }
}

/**
 * Get top movers (highest potential scores)
 */
export async function getTopMovers(limit: number = 10): Promise<CryptoScreenerResult[]> {
  try {
    const results = await screenCryptos({ limit: 100, excludeStablecoins: true });
    
    // If we got results, filter for bullish or neutral momentum with decent scores
    if (results && results.length > 0) {
      const filtered = results.filter(r => r.momentum !== 'bearish' && r.moonScore >= 50);
      // If filtering removed everything, return top results by moon score
      if (filtered.length === 0) {
        return results.slice(0, limit);
      }
      return filtered.slice(0, limit);
    }
    
    // Return fallback if no results
    return FALLBACK_DATA.slice(0, limit);
  } catch (error) {
    console.error('[CryptoScreener] getTopMovers error:', error);
    return FALLBACK_DATA.slice(0, limit);
  }
}

/**
 * Analyze a specific cryptocurrency
 */
export async function analyzeCrypto(idOrSymbol: string): Promise<CryptoScreenerResult | null> {
  // Check cache first
  const cacheKey = `analyze_${idOrSymbol.toLowerCase()}`;
  const cached = getCached<CryptoScreenerResult>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // First try to find by ID
  let coinId = idOrSymbol.toLowerCase();
  
  // Common symbol to ID mappings
  const symbolMap: Record<string, string> = {
    'xrp': 'ripple',
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'sol': 'solana',
    'ada': 'cardano',
    'doge': 'dogecoin',
    'dot': 'polkadot',
    'avax': 'avalanche-2',
    'link': 'chainlink',
    'matic': 'matic-network',
    'polygon': 'matic-network',
    'hbar': 'hedera-hashgraph',
    'hedera': 'hedera-hashgraph',
  };
  
  if (symbolMap[coinId]) {
    coinId = symbolMap[coinId];
  }
  
  // Check if we have this in fallback data FIRST
  const fallbackMatch = FALLBACK_DATA.find(
    f => f.id === coinId || 
         f.id === idOrSymbol.toLowerCase() ||
         f.symbol.toLowerCase() === idOrSymbol.toLowerCase() ||
         f.name.toLowerCase() === idOrSymbol.toLowerCase()
  );
  
  try {
    // Fetch detailed coin data with rate limiting
    const response = await rateLimitedFetch(
      `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    );
    
    if (!response.ok) {
      console.log(`[CryptoScreener] API failed for ${coinId}, checking fallback...`);
      // If API fails, return fallback data if available
      if (fallbackMatch) {
        console.log(`[CryptoScreener] Using fallback data for ${coinId}`);
        setCache(cacheKey, fallbackMatch);
        return fallbackMatch;
      }
      
      // Try search if direct fetch fails and no fallback
      try {
        const searchResponse = await fetch(`${COINGECKO_API}/search?query=${idOrSymbol}`);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.coins && searchData.coins.length > 0) {
            coinId = searchData.coins[0].id;
            const retryResponse = await fetch(
              `${COINGECKO_API}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
            );
            if (retryResponse.ok) {
              const coin = await retryResponse.json();
              return processCoinData(coin);
            }
          }
        }
      } catch {
        // Search also failed, return fallback
        if (fallbackMatch) return fallbackMatch;
      }
      return fallbackMatch || null;
    }
    
    const coin = await response.json();
    const result = processCoinData(coin);
    
    // Cache the result
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('[CryptoScreener] Error analyzing crypto:', error);
    
    // Return fallback data if available
    const fallbackMatch = FALLBACK_DATA.find(
      f => f.id === idOrSymbol.toLowerCase() || 
           f.symbol.toLowerCase() === idOrSymbol.toLowerCase()
    );
    
    if (fallbackMatch) {
      console.warn(`[CryptoScreener] Using fallback data for ${idOrSymbol}`);
      return fallbackMatch;
    }
    
    return null;
  }
}

/**
 * Process raw CoinGecko coin data into screener result
 */
function processCoinData(coin: any): CryptoScreenerResult {
  const market = coin.market_data;
  const sparkline = market?.sparkline_7d?.price || [];
  
  const rsi = calculateRSI(sparkline);
  const momentumScore = calculateMomentumScore(sparkline);
  const volatility = calculateVolatility(sparkline);
  const volumeScore = calculateVolumeScore(
    market?.total_volume?.usd || 0,
    market?.market_cap?.usd || 1
  );
  
  const moonScore = calculateMoonScore(
    market?.price_change_percentage_24h || 0,
    market?.price_change_percentage_7d || 0,
    volumeScore,
    momentumScore,
    rsi,
    market?.ath_change_percentage?.usd || 0,
    coin.market_cap_rank || 999
  );
  
  const risk = assessRisk(
    coin.market_cap_rank || 999,
    volatility,
    market?.total_volume?.usd || 0,
    market?.market_cap?.usd || 1,
    market?.price_change_percentage_24h || 0
  );
  
  const momentum = getMomentumSignal(
    market?.price_change_percentage_24h || 0,
    market?.price_change_percentage_7d || 0,
    rsi,
    momentumScore
  );
  
  const { recommendation, confidence } = getRecommendation(moonScore, rsi, momentum, risk.level);
  const narratives = getNarratives(coin.id, market?.price_change_percentage_7d || 0, volumeScore);
  
  let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways';
  if (sparkline.length >= 7) {
    const change = ((sparkline[sparkline.length - 1] - sparkline[0]) / sparkline[0]) * 100;
    if (change > 5) trend = 'uptrend';
    else if (change < -5) trend = 'downtrend';
  }
  
  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image?.large || coin.image?.small || '',
    currentPrice: market?.current_price?.usd || 0,
    priceChange24h: market?.price_change_percentage_24h || 0,
    priceChange7d: market?.price_change_percentage_7d || 0,
    priceChange30d: market?.price_change_percentage_30d || 0,
    volume24h: market?.total_volume?.usd || 0,
    marketCap: market?.market_cap?.usd || 0,
    marketCapRank: coin.market_cap_rank || 999,
    high24h: market?.high_24h?.usd || 0,
    low24h: market?.low_24h?.usd || 0,
    ath: market?.ath?.usd || 0,
    athChangePercent: market?.ath_change_percentage?.usd || 0,
    circulatingSupply: market?.circulating_supply || 0,
    totalSupply: market?.total_supply || 0,
    sparkline7d: sparkline,
    
    moonScore,
    momentumScore,
    volumeScore,
    volatilityScore: Math.min(100, volatility * 10),
    technicalScore: Math.round((rsi < 50 ? 100 - rsi : rsi) * 0.5 + momentumScore * 0.5),
    
    riskLevel: risk.level,
    riskFactors: risk.factors,
    
    momentum,
    trend,
    
    rsi: Math.round(rsi),
    macdSignal: momentum === 'bullish' ? 'buy' : momentum === 'bearish' ? 'sell' : 'neutral',
    
    narratives,
    
    recommendation,
    confidenceScore: confidence,
  };
}
