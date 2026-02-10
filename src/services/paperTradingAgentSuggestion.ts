// Rule-based "agent" suggestion for paper trading (Phase 1 sim)
// Uses price + sentiment; optional Kelly-based size from win rate

export interface AgentSuggestionInput {
  asset: string;
  price: number;
  priceChange24hPercent?: number;
  sentimentScore: number;   // 0–100
  sentimentTrend: 'bullish' | 'bearish' | 'neutral';
  winRate?: number;         // 0–1, from paper trading stats (for Kelly)
  avgWinLossRatio?: number; // avg win / avg loss (for Kelly)
}

export interface AgentSuggestionResult {
  action: 'buy' | 'sell' | 'hold';
  sizePercent: number;      // 0–100, % of portfolio to use
  confidence: number;       // 0–100 for processSignal
  reason: string;
  usedKelly: boolean;
}

/**
 * Simple rule-based suggestion: sentiment + price trend.
 * If winRate and avgWinLossRatio provided, size can use Kelly fraction (capped).
 */
export function getAgentSuggestion(input: AgentSuggestionInput): AgentSuggestionResult {
  const {
    asset,
    price,
    priceChange24hPercent = 0,
    sentimentScore,
    sentimentTrend,
    winRate,
    avgWinLossRatio,
  } = input;

  const hasKelly = typeof winRate === 'number' && typeof avgWinLossRatio === 'number' && avgWinLossRatio > 0;
  const kellyFraction = hasKelly
    ? Math.max(0, Math.min(0.25, winRate - (1 - winRate) / avgWinLossRatio))
    : 0.1;

  // Simple rules
  const bullish = sentimentTrend === 'bullish' || sentimentScore >= 55;
  const bearish = sentimentTrend === 'bearish' || sentimentScore <= 45;
  const priceUp = (priceChange24hPercent ?? 0) > 0.5;
  const priceDown = (priceChange24hPercent ?? 0) < -0.5;

  if (bullish && priceUp) {
    const size = hasKelly ? kellyFraction * 100 : 8;
    return {
      action: 'buy',
      sizePercent: Math.min(15, Math.max(3, size)),
      confidence: Math.min(85, 60 + sentimentScore / 3),
      reason: `Sentiment ${sentimentTrend} (${sentimentScore}), price +${(priceChange24hPercent ?? 0).toFixed(1)}% → buy`,
      usedKelly: hasKelly,
    };
  }
  if (bearish && priceDown) {
    return {
      action: 'sell',
      sizePercent: 10,
      confidence: Math.min(80, 55 + (100 - sentimentScore) / 3),
      reason: `Sentiment ${sentimentTrend} (${sentimentScore}), price ${(priceChange24hPercent ?? 0).toFixed(1)}% → reduce`,
      usedKelly: false,
    };
  }
  if (bearish && !priceUp) {
    return {
      action: 'hold',
      sizePercent: 0,
      confidence: 50,
      reason: `Sentiment ${sentimentTrend}; no clear entry. Hold.`,
      usedKelly: false,
    };
  }
  if (bullish && !priceDown) {
    const size = hasKelly ? kellyFraction * 100 : 5;
    return {
      action: 'buy',
      sizePercent: Math.min(10, Math.max(2, size)),
      confidence: Math.min(75, 50 + sentimentScore / 4),
      reason: `Sentiment ${sentimentTrend} (${sentimentScore}) → small buy`,
      usedKelly: hasKelly,
    };
  }

  return {
    action: 'hold',
    sizePercent: 0,
    confidence: 45,
    reason: `Neutral (sentiment ${sentimentScore}); hold.`,
    usedKelly: false,
  };
}
