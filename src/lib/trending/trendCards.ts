import type { IntelViewTab, TrendCard } from './types';

/** Curated seed deck: replace or merge with API/RAG in production. */
export const TREND_CARD_SEED: TrendCard[] = [
  {
    id: 'infra-nqni',
    topic: 'NSF NQNI Quantum Infrastructure',
    category: 'infra',
    trendScore: 78,
    momentum: 'high',
    cognitiveLoad: 44,
    decisionRisk: 'medium',
    attackTypes: ['perception_shaping'],
    signalQuality: 'coherent',
    narrativeRisk: 32,
    coordinationScore: 58,
    dominantFrames: ['National competitiveness', 'Long-horizon R&D', 'Supply-chain resilience'],
    capitalFlow: 'high',
    strategicImpact: 'critical',
    timeline: 'long',
    xrplRelevance: {
      liquidity: 'Future compute and data markets may anchor settlement layers.',
      payments: 'Machine-to-machine settlement paths align with high-frequency infra spend.',
      agents: 'AI orchestration and billing could route through programmable liquidity.',
    },
    whyItMatters:
      'Large, slow-moving capital into quantum and networking infra reshapes who can run secure, low-latency economic rails — relevant to how public ledgers compete on trust and throughput.',
    proofPanel: {
      evidence: [
        'Federal program announcements cluster in official channels (stable framing).',
        'Vendor and university press releases show repeated milestone language (coordination).',
        'Low contradiction density vs one-off crypto hype cycles (signal quality).',
      ],
      sources: ['NSF public notices', 'University lab releases', 'Semiconductor trade press'],
      confidence: 0.82,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'infra-ai-compute',
    topic: 'AI Compute & Energy Expansion',
    category: 'infra',
    trendScore: 71,
    momentum: 'high',
    cognitiveLoad: 62,
    decisionRisk: 'high',
    attackTypes: ['emotional_activation', 'confusion_flooding'],
    signalQuality: 'fragmented',
    narrativeRisk: 55,
    coordinationScore: 48,
    dominantFrames: ['Fear of missing the AI wave', 'Power grid constraints', 'Hyperscaler capex'],
    capitalFlow: 'high',
    strategicImpact: 'high',
    timeline: 'medium',
    xrplRelevance: {
      liquidity: 'GPU/energy markets stress treasury and hedging flows.',
      payments: 'Micropayments for inference and APIs scale with compute economics.',
      agents: 'Agent swarms increase demand for signed, low-fee settlement.',
    },
    whyItMatters:
      'Compute cost and availability drive machine-economy adoption curves; settlement design (fees, finality) becomes a bottleneck or advantage.',
    proofPanel: {
      evidence: [
        'Velocity spike in “AI power” and “data center” co-mentions vs 30d baseline.',
        'Mixed expert forecasts → fragmented signal quality.',
        'Urgency language elevated in social layer (decision-risk trigger).',
      ],
      sources: ['Earnings calls (public)', 'Grid operator reports', 'Social velocity sample'],
      confidence: 0.74,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'narrative-etf-flows',
    topic: 'Digital Asset ETF Flows & Framing',
    category: 'narrative',
    trendScore: 85,
    momentum: 'high',
    cognitiveLoad: 71,
    decisionRisk: 'high',
    attackTypes: ['perception_shaping', 'polarization'],
    signalQuality: 'fragmented',
    narrativeRisk: 68,
    coordinationScore: 72,
    dominantFrames: ['Institutional legitimacy', 'Retail vs institutional', 'Regulatory gatekeeping'],
    xrplRelevance: {
      liquidity: 'ETF-related flows interact with broader alt liquidity and basis trades.',
      payments: 'On-rail preferences influence corridor and bridge narratives.',
      agents: 'Narrative bots often cluster around listing and flow headlines.',
    },
    whyItMatters:
      'How flows are described (inflow “strength”, “rotation”) shapes retail urgency and policy subtext — not just the numbers.',
    proofPanel: {
      evidence: [
        'Repeated headline templates across outlets within short windows.',
        'Polarized comment clusters (bull/bear moral framing).',
        'Contradictory flow interpretations same-day (fragmented).',
      ],
      sources: ['Market data terminals', 'Major financial headlines', 'Social thread samples'],
      confidence: 0.79,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'market-liquidity-rotation',
    topic: 'Cross-Asset Liquidity Rotation',
    category: 'market',
    trendScore: 66,
    momentum: 'medium',
    cognitiveLoad: 48,
    decisionRisk: 'medium',
    attackTypes: ['confusion_flooding'],
    signalQuality: 'chaotic',
    narrativeRisk: 52,
    coordinationScore: 35,
    dominantFrames: ['Risk-on / risk-off', 'Carry trades', 'Dollar liquidity'],
    xrplRelevance: {
      liquidity: 'DEX and bridge volumes correlate with macro liquidity pulses.',
      payments: 'Remittance and treasury corridors sensitive to FX and rate volatility.',
      agents: 'Arb and market-making bots amplify short-term flow noise.',
    },
    whyItMatters:
      'When macro signals conflict, participants face higher cognitive load; on-chain venues inherit that uncertainty as spread and slippage.',
    proofPanel: {
      evidence: [
        'High contradiction density between rates narrative and equities narrative.',
        'Narrative switching frequency above threshold.',
        'Source diversity high but no dominant coherent frame (chaotic).',
      ],
      sources: ['Macro research notes', 'Volatility indices', 'On-chain volume aggregates'],
      confidence: 0.68,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'narrative-hijack-sample',
    topic: 'Coordinated “Urgent Action” Campaign Pattern',
    category: 'narrative',
    trendScore: 58,
    momentum: 'medium',
    cognitiveLoad: 81,
    decisionRisk: 'high',
    attackTypes: ['narrative_hijack', 'emotional_activation', 'polarization'],
    signalQuality: 'coherent',
    narrativeRisk: 76,
    coordinationScore: 88,
    dominantFrames: ['Identity threat', 'Binary ally/enemy', 'Immediate compliance'],
    xrplRelevance: {
      liquidity: 'Panic-shaped trading can spike DEX and CEX flow asymmetry.',
      payments: 'Scam and phishing waves often follow urgency memes.',
      agents: 'Automated repost chains mimic organic consensus.',
    },
    whyItMatters:
      'Coordinated urgency plus low author diversity is a classic decision-risk pattern — useful for purple-team drills, not for assigning blame without OSINT.',
    proofPanel: {
      evidence: [
        'Synchronized posting timestamps in sample window.',
        'Low author diversity vs baseline.',
        'Repeated phrase n-grams across accounts.',
      ],
      sources: ['Platform metadata samples', 'Open OSINT datasets', 'Internal drill logs'],
      confidence: 0.71,
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    id: 'market-stable-rails',
    topic: 'Stablecoin & Payment Rail Policy',
    category: 'market',
    trendScore: 73,
    momentum: 'medium',
    cognitiveLoad: 55,
    decisionRisk: 'medium',
    attackTypes: ['perception_shaping'],
    signalQuality: 'coherent',
    narrativeRisk: 41,
    coordinationScore: 62,
    dominantFrames: ['Consumer protection', 'Innovation balance', 'Interoperability'],
    xrplRelevance: {
      liquidity: 'RLUSD and bridge assets tie directly to policy and compliance narratives.',
      payments: 'ILP and streaming payment stories track regulatory clarity.',
      agents: 'Compliance-aware agents need attestable settlement paths.',
    },
    whyItMatters:
      'Policy framing steers institutional adoption timelines more than day-to-day price — maps to XRPL’s payment and compliance positioning.',
    proofPanel: {
      evidence: [
        'Stable terminology across agencies (coherent).',
        'Moderate velocity; fewer emotional spikes than pure price memes.',
        'Cross-border interoperability repeated in testimony (dominant frame).',
      ],
      sources: ['Regulatory filings', 'Hearing transcripts', 'Industry responses'],
      confidence: 0.77,
      lastUpdated: new Date().toISOString(),
    },
  },
];

const decisionOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

export function filterAndSortTrendCards(tab: IntelViewTab, cards: TrendCard[] = TREND_CARD_SEED): TrendCard[] {
  const list = [...cards];
  switch (tab) {
    case 'whats_trending':
      return list.sort((a, b) => b.trendScore - a.trendScore);
    case 'narrative_pressure':
      return list.sort((a, b) => b.narrativeRisk - a.narrativeRisk);
    case 'coordination_signals':
      return list.sort((a, b) => b.coordinationScore - a.coordinationScore);
    case 'decision_impact':
      return list.sort((a, b) => {
        const dr = decisionOrder[b.decisionRisk] - decisionOrder[a.decisionRisk];
        if (dr !== 0) return dr;
        return b.cognitiveLoad - a.cognitiveLoad;
      });
    case 'infra_signals':
      return list.filter((c) => c.category === 'infra').sort((a, b) => b.trendScore - a.trendScore);
    default:
      return list;
  }
}

export interface TrendFeatureVector {
  sentiment: number;
  repetition: number;
  contradiction: number;
  velocity: number;
  sourceDiversity: number;
}

/** Deterministic scoring helpers for future RAG pipeline (0–100 scales). */
export function scoreCognitiveLoad(f: TrendFeatureVector): number {
  const v = Math.min(100, f.velocity * 0.35 + f.contradiction * 0.35 + (1 - f.sentiment) * 15 + f.repetition * 0.15);
  return Math.round(Math.min(100, Math.max(0, v)));
}

export function scoreCoordination(f: TrendFeatureVector): number {
  const c = f.repetition * 0.45 + (1 - f.sourceDiversity) * 55 + f.velocity * 0.2;
  return Math.round(Math.min(100, Math.max(0, c)));
}

export function classifySignalQuality(f: TrendFeatureVector): TrendCard['signalQuality'] {
  if (f.contradiction > 0.65 && f.velocity > 0.55) return 'chaotic';
  if (f.contradiction > 0.4 || f.sourceDiversity < 0.35) return 'fragmented';
  return 'coherent';
}

export function scoreDecisionRiskFromFeatures(f: TrendFeatureVector): TrendCard['decisionRisk'] {
  const urgencyProxy = f.velocity * 0.5 + f.repetition * 0.003 + (1 - f.sentiment) * 0.4;
  if (urgencyProxy > 0.72) return 'high';
  if (urgencyProxy > 0.45) return 'medium';
  return 'low';
}

/**
 * Future: wire to retrieval.search(topic, { top_k }) on the server; keep secrets off the client.
 * This stub demonstrates the merge shape using deterministic features from the topic string.
 */
export async function buildTrendCard(topic: string): Promise<TrendCard> {
  const hash = [...topic].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const norm = (n: number) => (n % 100) / 100;
  const features: TrendFeatureVector = {
    sentiment: norm(hash),
    repetition: norm(hash * 7),
    contradiction: norm(hash * 13),
    velocity: norm(hash * 3),
    sourceDiversity: norm(hash * 11),
  };
  const signalQuality = classifySignalQuality(features);
  const now = new Date().toISOString();
  return {
    id: `synthetic-${hash}`,
    topic,
    category: 'narrative',
    trendScore: Math.round(40 + norm(hash * 17) * 50),
    momentum: features.velocity > 0.65 ? 'high' : features.velocity > 0.35 ? 'medium' : 'low',
    cognitiveLoad: scoreCognitiveLoad(features),
    decisionRisk: scoreDecisionRiskFromFeatures(features),
    attackTypes:
      features.contradiction > 0.55
        ? ['confusion_flooding', 'perception_shaping']
        : features.repetition > 0.5
          ? ['perception_shaping', 'polarization']
          : ['emotional_activation'],
    signalQuality,
    narrativeRisk: Math.round(30 + features.contradiction * 50 + features.velocity * 20),
    coordinationScore: scoreCoordination(features),
    dominantFrames: ['Synthetic probe — connect RAG corpus for real frames'],
    xrplRelevance: {
      liquidity: 'Map corpus mentions to DEX/AMM and bridge flows.',
      payments: 'Map to remittance, streaming, and machine-settlement stories.',
      agents: 'Map to bot/agent and orchestration narratives.',
    },
    whyItMatters:
      'Placeholder card from local feature extraction. Replace with evidence-backed synthesis once retrieval is connected.',
    proofPanel: {
      evidence: [
        `Feature-derived: velocity=${features.velocity.toFixed(2)}, contradiction=${features.contradiction.toFixed(2)}`,
        'No document retrieval in stub mode.',
      ],
      sources: ['local heuristic'],
      confidence: 0.35,
      lastUpdated: now,
    },
  };
}
